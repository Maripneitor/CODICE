import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { ToolStatus } from './entities/tool-status.entity';
import { ToolType } from './entities/tool-type.entity';
import { Category } from './entities/category.entity';
import { Loan } from './entities/loan.entity';
import { User } from '../auth/user.entity';
import { CreateToolDto, UpdateToolDto, ChangeStatusDto, SearchToolsDto } from './dto/tools.dto';
import { CreateLoanDto, ReturnLoanDto, ReportQueryDto } from './dto/loans.dto';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @InjectRepository(ToolStatus)
    private readonly statusRepository: Repository<ToolStatus>,
    @InjectRepository(ToolType)
    private readonly toolTypeRepository: Repository<ToolType>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  private sanitizeText(text: string): string {
    if (!text) return '';
    // Strip script tags and all their interior content
    let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip any remaining HTML tags
    sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, '');
    return sanitized.trim();
  }

  private validatePayloadSize(dto: any) {
    const sizeInBytes = Buffer.byteLength(JSON.stringify(dto));
    if (sizeInBytes > 5 * 1024 * 1024) {
      throw new BadRequestException('El tamaño del payload supera el límite de 5MB.');
    }
  }

  private validateImageUrl(url?: string) {
    if (!url) return;
    try {
      const parsed = new URL(url);
      const whitelist = ['localhost', '127.0.0.1', 'cloudinary.com', 'codice.com', 'google.com', 'render.com'];
      const allowed = whitelist.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
      if (!allowed) {
        throw new BadRequestException(`Dominio de imagen '${parsed.hostname}' no está en la lista blanca.`);
      }
    } catch (e) {
      throw new BadRequestException('imageUrl debe ser una URL válida.');
    }
  }

  async onModuleInit() {
    // Seed pre-defined statuses if they don't exist
    const defaultStatuses = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'REPARACION', 'BAJA', 'RESERVADO'];
    for (const name of defaultStatuses) {
      const exists = await this.statusRepository.findOne({ where: { name } });
      if (!exists) {
        await this.statusRepository.save(this.statusRepository.create({ name }));
      }
    }

    // Schedule status check every 12 hours
    setInterval(() => {
      this.checkOverdueLoans().catch(err => console.error('Cron checkOverdueLoans failed:', err));
    }, 12 * 60 * 60 * 1000);
  }

  async create(createToolDto: CreateToolDto): Promise<Tool> {
    this.validatePayloadSize(createToolDto);
    this.validateImageUrl(createToolDto.imageUrl);

    const name = this.sanitizeText(createToolDto.name);
    const description = this.sanitizeText(createToolDto.description);

    const type = await this.toolTypeRepository.findOne({ where: { id: createToolDto.typeId } });
    if (!type) {
      throw new NotFoundException(`Tipo de herramienta con ID ${createToolDto.typeId} no encontrado.`);
    }

    const defaultStatusId = createToolDto.statusId || 1; // Falls back to first seeded state or DISPONIBLE
    let status = await this.statusRepository.findOne({ where: { id: defaultStatusId } });
    if (!status) {
      status = await this.statusRepository.findOne({ where: { name: 'DISPONIBLE' } });
    }

    const tool = this.toolRepository.create({
      name,
      description,
      serialNumber: createToolDto.serialNumber,
      imageUrl: createToolDto.imageUrl || null,
      location: createToolDto.location,
      type,
      status: status!,
    });

    // Invalidate search cache
    await this.invalidateSearchCache();

    return this.toolRepository.save(tool);
  }

  async update(id: string, updateToolDto: UpdateToolDto): Promise<Tool> {
    this.validatePayloadSize(updateToolDto);
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Herramienta con ID ${id} no encontrada.`);
    }

    if (updateToolDto.imageUrl) {
      this.validateImageUrl(updateToolDto.imageUrl);
      tool.imageUrl = updateToolDto.imageUrl;
    }

    if (updateToolDto.name) {
      tool.name = this.sanitizeText(updateToolDto.name);
    }
    if (updateToolDto.description) {
      tool.description = this.sanitizeText(updateToolDto.description);
    }
    if (updateToolDto.serialNumber) {
      tool.serialNumber = updateToolDto.serialNumber;
    }
    if (updateToolDto.location) {
      tool.location = updateToolDto.location;
    }

    if (updateToolDto.typeId) {
      const type = await this.toolTypeRepository.findOne({ where: { id: updateToolDto.typeId } });
      if (!type) {
        throw new NotFoundException(`Tipo de herramienta con ID ${updateToolDto.typeId} no encontrado.`);
      }
      tool.type = type;
    }

    if (updateToolDto.statusId) {
      const status = await this.statusRepository.findOne({ where: { id: updateToolDto.statusId } });
      if (!status) {
        throw new NotFoundException(`Estado con ID ${updateToolDto.statusId} no encontrado.`);
      }
      tool.status = status;
    }

    if (updateToolDto.version !== undefined && tool.version !== updateToolDto.version) {
      throw new ConflictException('Conflicto de concurrencia: la herramienta fue modificada por otro usuario.');
    }

    await this.invalidateSearchCache();

    try {
      return await this.toolRepository.save(tool);
    } catch (e: any) {
      if (e.name === 'OptimisticLockVersionMismatchError') {
        throw new ConflictException('Conflicto de concurrencia: la herramienta fue modificada por otro usuario.');
      }
      throw e;
    }
  }

  async changeStatus(id: string, changeStatusDto: ChangeStatusDto, userRole: string): Promise<Tool> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Herramienta con ID ${id} no encontrada.`);
    }

    const newStatus = await this.statusRepository.findOne({ where: { id: changeStatusDto.statusId } });
    if (!newStatus) {
      throw new NotFoundException(`Estado con ID ${changeStatusDto.statusId} no encontrado.`);
    }

    const currentStatusName = tool.status.name.toUpperCase();
    const targetStatusName = newStatus.name.toUpperCase();

    // Matrix rule 1: MANTENIMIENTO/REPARACION to PRESTADO/RESERVADO is forbidden
    if ((currentStatusName === 'MANTENIMIENTO' || currentStatusName === 'REPARACION') &&
        (targetStatusName === 'PRESTADO' || targetStatusName === 'RESERVADO')) {
      throw new BadRequestException(`Transición inválida de ${currentStatusName} a ${targetStatusName}.`);
    }

    // Matrix rule 2: ONLY ADMIN can transition to BAJA
    if (targetStatusName === 'BAJA' && userRole.toUpperCase() !== 'ADMIN') {
      throw new UnauthorizedException('Solo el rol ADMIN puede dar de baja una herramienta.');
    }

    // Optimistic lock check
    if (changeStatusDto.version !== undefined && tool.version !== changeStatusDto.version) {
      throw new ConflictException('Conflicto de concurrencia: la herramienta fue modificada por otro usuario.');
    }

    tool.status = newStatus;

    await this.invalidateSearchCache();

    try {
      return await this.toolRepository.save(tool);
    } catch (e: any) {
      if (e.name === 'OptimisticLockVersionMismatchError') {
        throw new ConflictException('Conflicto de concurrencia: la herramienta fue modificada por otro usuario.');
      }
      throw e;
    }
  }

  async findOne(id: string): Promise<Tool> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Herramienta con ID ${id} no encontrada.`);
    }
    return tool;
  }

  async remove(id: string): Promise<void> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Herramienta con ID ${id} no encontrada.`);
    }
    await this.toolRepository.remove(tool);
    await this.invalidateSearchCache();
  }

  async search(searchDto: SearchToolsDto): Promise<any> {
    const cacheKey = `search:tools:${JSON.stringify(searchDto)}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const { search, sortBy, sortOrder, status, type, location, page = 1, limit = 10 } = searchDto;
    const query = this.toolRepository.createQueryBuilder('tool')
      .leftJoinAndSelect('tool.status', 'status')
      .leftJoinAndSelect('tool.type', 'type');

    if (search) {
      // PostgreSQL full-text search
      query.andWhere(
        `to_tsvector('spanish', tool.name || ' ' || tool.description) @@ plainto_tsquery('spanish', :searchQuery)`,
        { searchQuery: search }
      );
    }

    if (status) {
      query.andWhere('status.name = :status', { status });
    }
    if (type) {
      query.andWhere('type.name = :type', { type });
    }
    if (location) {
      query.andWhere('tool.location = :location', { location });
    }

    // Sort whitelist
    const allowedSortFields = ['name', 'code', 'serialNumber', 'createdAt', 'location'];
    const resolvedSortBy = allowedSortFields.includes(sortBy || '') ? `tool.${sortBy}` : 'tool.createdAt';
    const resolvedSortOrder = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query.orderBy(resolvedSortBy, resolvedSortOrder);

    const resolvedLimit = Math.min(limit || 10, 1000);
    query.skip((page - 1) * resolvedLimit).take(resolvedLimit);

    const [items, total] = await query.getManyAndCount();
    const result = { items, total, page, limit: resolvedLimit };

    // Cache results for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  // --- Dictionaries (Category & ToolType) CRUD with Integrity Verification ---

  async createCategory(name: string): Promise<Category> {
    const category = this.categoryRepository.create({ name: this.sanitizeText(name) });
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { toolTypes: { tools: true } }
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // Check if category has any associated tool (through its tool types)
    const hasTools = category.toolTypes.some(type => type.tools && type.tools.length > 0);
    if (hasTools) {
      throw new BadRequestException('No se puede eliminar la categoría porque tiene herramientas asociadas.');
    }

    await this.categoryRepository.remove(category);
  }

  async createToolType(name: string, categoryIds: number[]): Promise<ToolType> {
    const categories = await this.categoryRepository.findBy({ id: In(categoryIds) });
    const toolType = this.toolTypeRepository.create({
      name: this.sanitizeText(name),
      categories
    });
    return this.toolTypeRepository.save(toolType);
  }

  async removeToolType(id: number): Promise<void> {
    const toolType = await this.toolTypeRepository.findOne({
      where: { id },
      relations: { tools: true }
    });
    if (!toolType) {
      throw new NotFoundException('Tipo de herramienta no encontrado.');
    }

    if (toolType.tools && toolType.tools.length > 0) {
      throw new BadRequestException('No se puede eliminar el tipo de herramienta porque tiene herramientas asociadas.');
    }

    await this.toolTypeRepository.remove(toolType);
  }

  private async invalidateSearchCache() {
    // In a real application, we would scan for keys starting with "search:tools:" and delete them.
    // For this simple wrapper, we can rely on Redis TTL, or clear specific keys.
    // Since search configs are dynamic, clearing all or letting them expire is common.
  }

  // --- Loans & Returns Management (Phase 3) ---

  async createLoan(createLoanDto: CreateLoanDto, deliveringUserId: string, requestIp: string, requestDevice: string): Promise<Loan> {
    const { toolIds, requestingUserId, dueDate, applicantNotes, signature } = createLoanDto;

    // Validate requesting user exists and is active
    const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });
    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado.');
    }
    if (requestingUser.status !== 'ACTIVE') {
      throw new BadRequestException('El usuario solicitante no está activo.');
    }

    const deliveringUser = await this.userRepository.findOne({ where: { id: deliveringUserId } });
    if (!deliveringUser) {
      throw new NotFoundException('Usuario entregador no encontrado.');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Fetch tools with pessimistic write lock to prevent double booking
      const tools = await manager.getRepository(Tool).createQueryBuilder('tool')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('tool.status', 'status')
        .where('tool.id IN (:...toolIds)', { toolIds })
        .getMany();

      if (tools.length !== toolIds.length) {
        throw new NotFoundException('Una o más herramientas no fueron encontradas.');
      }

      // 2. Validate availability
      for (const tool of tools) {
        if (tool.status.name.toUpperCase() !== 'DISPONIBLE') {
          throw new BadRequestException(`La herramienta ${tool.name} (${tool.code}) no está disponible.`);
        }
      }

      // 3. Update status to PRESTADO
      const prestadoStatus = await manager.getRepository(ToolStatus).findOne({ where: { name: 'PRESTADO' } });
      if (!prestadoStatus) {
        throw new NotFoundException('Estado PRESTADO no encontrado.');
      }

      for (const tool of tools) {
        tool.status = prestadoStatus;
        await manager.save(tool);
      }

      // 4. Calculate dueDate (default 7 days)
      const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      if (parsedDueDate.getTime() < Date.now()) {
        throw new BadRequestException('La fecha límite de devolución no puede estar en el pasado.');
      }

      const loan = manager.create(Loan, {
        loanDate: new Date(),
        dueDate: parsedDueDate,
        status: 'ACTIVE',
        requestingUser,
        deliveringUser,
        tools,
        requestIp,
        requestDevice,
        applicantNotes: applicantNotes || null,
        signature: signature || null,
      });

      return manager.save(loan);
    });
  }

  async returnLoan(id: string, returnLoanDto: ReturnLoanDto): Promise<Loan> {
    const { returnCondition, signature } = returnLoanDto;

    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: { tools: true, requestingUser: true, deliveringUser: true }
    });
    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado.');
    }
    if (loan.status === 'RETURNED') {
      throw new BadRequestException('Este préstamo ya fue devuelto.');
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      loan.returnDate = now;
      loan.status = 'RETURNED';
      loan.returnCondition = returnCondition;
      loan.signature = signature;

      // Unique return act number
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await manager.getRepository(Loan).count({
        where: { status: 'RETURNED' }
      });
      loan.returnActNumber = `ACT-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      // Calculate penalties ($50 per overdue day)
      let penalty = 0;
      if (now.getTime() > loan.dueDate.getTime()) {
        const diffTime = Math.abs(now.getTime() - loan.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        penalty = diffDays * 50;
      }
      loan.penalty = penalty;

      // Determine tool status target
      let targetStatusName = 'DISPONIBLE';
      if (returnCondition === 'DAÑADO') {
        targetStatusName = 'MANTENIMIENTO';
      } else if (returnCondition === 'INCOMPLETO') {
        targetStatusName = 'REPARACION';
      }

      const toolStatus = await manager.getRepository(ToolStatus).findOne({ where: { name: targetStatusName } });
      if (!toolStatus) {
        throw new NotFoundException(`Estado ${targetStatusName} no encontrado.`);
      }

      for (const tool of loan.tools) {
        tool.status = toolStatus;
        await manager.save(tool);
      }

      const saved = await manager.save(loan);

      // Structured logging
      console.log(`[AUDIT] Devolución procesada. Acta: ${loan.returnActNumber}, Préstamo: ${loan.id}, Multa: $${penalty}`);

      return saved;
    });
  }

  async checkOverdueLoans() {
    const activeLoans = await this.loanRepository.find({
      where: { status: 'ACTIVE' },
      relations: { requestingUser: true }
    });

    const now = new Date();
    for (const loan of activeLoans) {
      if (now.getTime() > loan.dueDate.getTime()) {
        loan.status = 'OVERDUE';
        await this.loanRepository.save(loan);
        console.log(`[OVERDUE ALERT] Préstamo ${loan.id} para ${loan.requestingUser.email} ha vencido.`);
      }
    }
  }

  async generateReport(queryDto: ReportQueryDto): Promise<any[]> {
    const { startDate, endDate, limit = 100 } = queryDto;
    const query = this.loanRepository.createQueryBuilder('loan')
      .leftJoinAndSelect('loan.tools', 'tools')
      .leftJoinAndSelect('loan.requestingUser', 'requestingUser')
      .leftJoinAndSelect('loan.deliveringUser', 'deliveringUser');

    if (startDate) {
      query.andWhere('loan.loanDate >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      query.andWhere('loan.loanDate <= :endDate', { endDate: new Date(endDate) });
    }

    query.orderBy('loan.loanDate', 'DESC');
    query.take(Math.min(limit || 100, 10000));

    const items = await query.getMany();

    // Obfuscate personal data in reports
    return items.map(loan => {
      const copy = { ...loan };
      if (copy.requestingUser) {
        copy.requestingUser = {
          ...copy.requestingUser,
          email: this.obfuscateEmail(copy.requestingUser.email),
          name: copy.requestingUser.name ? this.obfuscateName(copy.requestingUser.name) : null,
        } as any;
      }
      if (copy.deliveringUser) {
        copy.deliveringUser = {
          ...copy.deliveringUser,
          email: this.obfuscateEmail(copy.deliveringUser.email),
          name: copy.deliveringUser.name ? this.obfuscateName(copy.deliveringUser.name) : null,
        } as any;
      }
      return copy;
    });
  }

  private obfuscateEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    return `${parts[0].charAt(0)}***@${parts[1]}`;
  }

  private obfuscateName(name: string): string {
    return name.split(' ').map(n => n.charAt(0) + '***').join(' ');
  }

  async exportCsv(queryDto: ReportQueryDto): Promise<string> {
    const data = await this.generateReport(queryDto);
    let csv = 'ID Préstamo,Fecha Préstamo,Fecha Límite,Estado,Multa,Condición,Acta,IP,Dispositivo,Solicitante,Entregador,Herramientas\n';
    
    for (const loan of data) {
      const toolsStr = loan.tools.map((t: any) => `${t.name} (${t.code})`).join(' | ');
      const reqUserStr = loan.requestingUser ? loan.requestingUser.email : 'N/A';
      const delUserStr = loan.deliveringUser ? loan.deliveringUser.email : 'N/A';
      
      csv += `"${loan.id}","${loan.loanDate.toISOString()}","${loan.dueDate.toISOString()}","${loan.status}","${loan.penalty}","${loan.returnCondition || 'N/A'}","${loan.returnActNumber || 'N/A'}","${loan.requestIp}","${loan.requestDevice}","${reqUserStr}","${delUserStr}","${toolsStr}"\n`;
    }
    return csv;
  }
}
