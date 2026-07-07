import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, DataSource } from 'typeorm';
import { Artifact } from '../domain/artifact.entity';
import { ArtifactMovement } from '../domain/artifact-movement.entity';
import { LoanTransaction } from '../domain/loan-transaction.entity';
import { User } from '../../auth/user.entity';
import PDFDocument = require('pdfkit');
import { auditLogger } from '../../../common/audit-logger';

@Injectable()
export class ArtifactsService {
  constructor(
    @InjectRepository(Artifact)
    private readonly artifactRepository: Repository<Artifact>,
    @InjectRepository(ArtifactMovement)
    private readonly movementRepository: Repository<ArtifactMovement>,
    private readonly dataSource: DataSource,
  ) {}

  // Helper to sanitize html inputs and prevent XSS
  private sanitizeHtml(text: string): string {
    if (!text) return '';
    // Strip all HTML tags entirely to prevent XSS/injection attacks
    return text.replace(/<[^>]*>?/gm, '');
  }

  async create(
    data: {
      code: string;
      name: string;
      description: string;
      location: string;
      status?: string;
      material: string;
      epoch: string;
      dimensions: string;
      weight: string;
      imageUrl?: string;
    },
    responsibleUser: string,
    origin: string,
  ): Promise<Artifact> {
    // Sanitization
    const cleanDescription = this.sanitizeHtml(data.description);
    const cleanName = this.sanitizeHtml(data.name);

    // Validate if code already exists
    const existing = await this.artifactRepository.findOne({ where: { code: data.code } });
    if (existing) {
      throw new BadRequestException(`El código de artefacto '${data.code}' ya existe.`);
    }

    return this.dataSource.transaction(async (manager) => {
      const artifact = manager.create(Artifact, {
        ...data,
        name: cleanName,
        description: cleanDescription,
      });

      const savedArtifact = await manager.save(artifact);

      // Register initial cataloging movement
      const movement = manager.create(ArtifactMovement, {
        artifactId: savedArtifact.id,
        action: 'Catalogación',
        details: 'Registro inicial del artefacto en el catálogo general.',
        responsible: responsibleUser,
        origin: origin || 'Panel Web',
      });
      const savedMovement = await manager.save(movement);

      // Log mutations in audit log
      auditLogger.info({
        action: 'CREATE_ARTIFACT',
        responsible: responsibleUser,
        resourceId: savedArtifact.id,
        timestamp: new Date().toISOString(),
      });

      auditLogger.info({
        action: 'CREATE_MOVEMENT',
        responsible: responsibleUser,
        resourceId: savedMovement.id,
        timestamp: new Date().toISOString(),
      });

      return savedArtifact;
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    material?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ data: Artifact[]; total: number; page: number; limit: number }> {
    // Strict numeric/enum whitelist validation
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      // Use SQL parameters instead of concatenation to prevent SQL injection
      where.name = Like(`%${query.search}%`);
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.material) {
      where.material = query.material;
    }

    // Strict whitelist sorting
    const allowedSortFields = ['code', 'name', 'status', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.artifactRepository.findAndCount({
      where,
      order: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limit,
      relations: { movements: true },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Artifact> {
    const artifact = await this.artifactRepository.findOne({
      where: { id },
      relations: { movements: true },
    });

    if (!artifact) {
      throw new NotFoundException(`Artefacto con ID '${id}' no encontrado.`);
    }

    return artifact;
  }

  async update(
    id: string,
    data: {
      location?: string;
      status?: string;
      description?: string;
      name?: string;
    },
    responsibleUser: string,
    origin: string,
  ): Promise<Artifact> {
    return this.dataSource.transaction(async (manager) => {
      const artifact = await manager.findOne(Artifact, {
        where: { id },
        relations: { movements: true },
      });

      if (!artifact) {
        throw new NotFoundException(`Artefacto con ID '${id}' no encontrado.`);
      }

      const oldLocation = artifact.location;
      const oldStatus = artifact.status;

      if (data.name) artifact.name = this.sanitizeHtml(data.name);
      if (data.description) artifact.description = this.sanitizeHtml(data.description);
      if (data.location) artifact.location = data.location;
      if (data.status) artifact.status = data.status;

      const updated = await manager.save(artifact);

      // Log artifact mutation
      auditLogger.info({
        action: 'UPDATE_ARTIFACT',
        responsible: responsibleUser,
        resourceId: id,
        timestamp: new Date().toISOString(),
      });

      // Register movement if location or status changed
      let details = '';
      let action = 'Inventario';

      if (data.location && oldLocation !== data.location) {
        action = 'Traslado';
        details += `Traslado de: '${oldLocation}' a: '${data.location}'. `;
      }

      if (data.status && oldStatus !== data.status) {
        action = data.status === 'En Restauración' ? 'Restauración' : 'Inventario';
        details += `Cambio de estado de: '${oldStatus}' a: '${data.status}'. `;
      }

      if (details) {
        const movement = manager.create(ArtifactMovement, {
          artifactId: id,
          action,
          details: details.trim(),
          responsible: responsibleUser,
          origin: origin || 'Panel Web',
        });
        const savedMovement = await manager.save(movement);

        // Log movement mutation
        auditLogger.info({
          action: 'CREATE_MOVEMENT',
          responsible: responsibleUser,
          resourceId: savedMovement.id,
          timestamp: new Date().toISOString(),
        });
      }

      return updated;
    });
  }

  async delete(id: string, responsibleUser: string): Promise<void> {
    const artifact = await this.findOne(id);
    await this.artifactRepository.remove(artifact);

    auditLogger.info({
      action: 'DELETE_ARTIFACT',
      responsible: responsibleUser,
      resourceId: id,
      timestamp: new Date().toISOString(),
    });
  }

  async loanArtifacts(
    ids: string[],
    tecnicoEmail: string,
    responsibleUser: string,
    signatureBase64: string,
  ): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const tecnico = await manager.findOne(User, { where: { email: tecnicoEmail } });
      const almacenista = await manager.findOne(User, { where: { email: responsibleUser } });

      if (!tecnico || !almacenista) {
        throw new BadRequestException('El correo del técnico o del almacenista no coincide con un usuario registrado.');
      }

      const artifacts = await manager.find(Artifact, {
        where: ids.map((id) => ({ id })),
      });

      if (artifacts.length === 0) {
        throw new BadRequestException('No se encontraron herramientas para realizar el préstamo.');
      }

      const unavailable = artifacts.filter((a) => a.status !== 'Disponible');
      if (unavailable.length > 0) {
        throw new BadRequestException(
          `Las siguientes herramientas no están disponibles para préstamo: ${unavailable.map((u) => u.name).join(', ')}`
        );
      }

      const updatedArtifacts: Artifact[] = [];
      for (const artifact of artifacts) {
        artifact.status = 'Prestado';
        artifact.location = `En poder de: ${tecnicoEmail}`;
        const updated = await manager.save(artifact);
        updatedArtifacts.push(updated);

        // Register Audit Movement
        const movement = manager.create(ArtifactMovement, {
          artifactId: artifact.id,
          action: 'Préstamo',
          details: `Préstamo asignado a ${tecnicoEmail}. Firma: [Firma: ${signatureBase64}]`,
          responsible: responsibleUser,
          origin: 'Panel Web',
        });
        await manager.save(movement);

        // Register Transaction
        const transaction = manager.create(LoanTransaction, {
          id_tecnico_solicita: tecnico.id,
          id_almacenista_entrega: almacenista.id,
          id_herramienta: artifact.id,
          fecha_hora_salida: new Date(),
          fecha_hora_retorno_esperada: new Date(Date.now() + 7 * 24 * 3600 * 1000), // Default: 7 days
          firma_tecnico: signatureBase64,
        });
        await manager.save(transaction);
      }

      return { success: true, message: 'Préstamo registrado exitosamente.', count: updatedArtifacts.length };
    });
  }

  async returnArtifact(
    id: string,
    statusCheck: 'Excelente' | 'Desgastado' | 'Dañado / Requiere Mantenimiento',
    details: string,
    responsibleUser: string,
  ): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const artifact = await manager.findOne(Artifact, { where: { id } });
      if (!artifact) {
        throw new NotFoundException('Herramienta no encontrada.');
      }

      let targetStatus = 'Disponible';
      if (statusCheck === 'Dañado / Requiere Mantenimiento') {
        targetStatus = 'En Mantenimiento';
      }

      artifact.status = targetStatus;
      artifact.location = 'Almacén Central';
      await manager.save(artifact);

      // Register Audit Movement
      const movement = manager.create(ArtifactMovement, {
        artifactId: artifact.id,
        action: 'Devolución',
        details: `Retorno físico. Estado reportado: ${statusCheck}. Detalles: ${details}`,
        responsible: responsibleUser,
        origin: 'Panel Web',
      });
      await manager.save(movement);

      // Complete Transaction
      const transaction = await manager.findOne(LoanTransaction, {
        where: { id_herramienta: artifact.id, fecha_hora_retorno_real: IsNull() },
        order: { fecha_hora_salida: 'DESC' },
      });

      if (transaction) {
        transaction.fecha_hora_retorno_real = new Date();
        const diffMs = transaction.fecha_hora_retorno_real.getTime() - transaction.fecha_hora_salida.getTime();
        transaction.tiempo_total_uso = Math.max(1, Math.round(diffMs / (60 * 1000))); // Usage in minutes
        await manager.save(transaction);
      }

      return { success: true, message: 'Devolución procesada exitosamente.', status: targetStatus };
    });
  }

  async getReportsData(): Promise<any> {
    const totalStock = await this.artifactRepository.count();
    const available = await this.artifactRepository.count({ where: { status: 'Disponible' } });
    const loaned = await this.artifactRepository.count({ where: { status: 'Prestado' } });
    const maintenance = await this.artifactRepository.count({ where: { status: 'En Mantenimiento' } });

    const transactions = await this.dataSource.getRepository(LoanTransaction).find({
      relations: { herramienta: true, tecnico: true, almacenista: true },
    });

    const toolUsageMap: Record<string, { toolName: string; code: string; count: number; totalMinutes: number }> = {};
    const damagedLogs: any[] = [];

    for (const t of transactions) {
      const toolId = t.id_herramienta;
      if (t.herramienta) {
        if (!toolUsageMap[toolId]) {
          toolUsageMap[toolId] = {
            toolName: t.herramienta.name,
            code: t.herramienta.code,
            count: 0,
            totalMinutes: 0,
          };
        }
        toolUsageMap[toolId].count += 1;
        toolUsageMap[toolId].totalMinutes += t.tiempo_total_uso || 0;
      }

      if (t.herramienta && t.herramienta.status === 'En Mantenimiento') {
        damagedLogs.push({
          id: t.id_prestamo,
          code: t.herramienta.code,
          name: t.herramienta.name,
          tecnico: t.tecnico?.email || 'Desconocido',
          fechaSalida: t.fecha_hora_salida,
        });
      }
    }

    const usageReport = Object.values(toolUsageMap).sort((a, b) => b.count - a.count);

    return {
      stockReport: {
        totalStock,
        available,
        loaned,
        maintenance,
      },
      usageReport,
      damagedReport: damagedLogs,
    };
  }

  async generatePdfReport(type: string, responsibleUser: string, res: any): Promise<void> {
    const data = await this.getReportsData();
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${type}-${new Date().getFullYear()}.pdf`);

    doc.pipe(res);

    // Header Design
    doc
      .fillColor('#ca8a04')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('CÓDICE - ERP DE CONTROL Y LOGÍSTICA', 50, 50);

    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(10)
      .text(`Reporte Oficial de Auditoría Interna: ${type.toUpperCase()}`, 50, 75)
      .text(`Generado por: ${responsibleUser}`, 50, 90)
      .text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 50, 105);

    doc.moveTo(50, 125).lineTo(550, 125).strokeColor('#cbd5e1').stroke();

    // Content mapping
    if (type === 'stock') {
      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('ESTADO DE STOCK Y DISPONIBILIDAD EN TIEMPO REAL', 50, 150);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Total de Herramientas Registradas: ${data.stockReport.totalStock}`, 50, 180)
        .text(`Disponibles en Almacén Central: ${data.stockReport.available}`, 50, 200)
        .text(`Fuera en Calidad de Préstamo (Obra): ${data.stockReport.loaned}`, 50, 220)
        .text(`En Talleres de Calibración / Mantenimiento: ${data.stockReport.maintenance}`, 50, 240);

      doc.text('Inventario Físico de Activos:', 50, 280);
      let y = 300;
      
      const tools = await this.artifactRepository.find();
      doc.font('Helvetica-Bold').text('Código', 50, y).text('Nombre', 150, y).text('Estado', 350, y).text('Ubicación', 450, y);
      y += 20;
      doc.font('Helvetica');

      for (const t of tools) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(t.code, 50, y).text(t.name.substring(0, 25), 150, y).text(t.status, 350, y).text(t.location.substring(0, 15), 450, y);
        y += 20;
      }
    } else if (type === 'usage') {
      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('REPORTE DE USO Y ROTACIÓN DE ACTIVOS', 50, 150);

      let y = 180;
      doc.font('Helvetica-Bold').text('Código', 50, y).text('Herramienta', 150, y).text('Solicitudes', 350, y).text('Uso Total (m)', 450, y);
      y += 20;
      doc.font('Helvetica');

      for (const item of data.usageReport) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(item.code, 50, y).text(item.toolName, 150, y).text(String(item.count), 350, y).text(`${item.totalMinutes} min`, 450, y);
        y += 20;
      }
    } else if (type === 'damaged') {
      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('REPORTE DE PÉRDIDAS, DAÑOS Y REPARACIONES', 50, 150);

      let y = 180;
      doc.font('Helvetica-Bold').text('Código', 50, y).text('Herramienta', 150, y).text('Custodio Responsable', 350, y);
      y += 20;
      doc.font('Helvetica');

      for (const item of data.damagedReport) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(item.code, 50, y).text(item.name, 150, y).text(item.tecnico, 350, y);
        y += 20;
      }
    }

    const transactions = await this.dataSource.getRepository(LoanTransaction).find({
      where: { firma_tecnico: Like('data:image/png;base64,%') },
      take: 3,
    });

    if (transactions.length > 0) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(14).text('REGISTRO AUDITABLE DE FIRMAS DIGITALES DE RECEPCIÓN', 50, 50);
      
      let y = 90;
      for (const t of transactions) {
        if (y > 600) {
          doc.addPage();
          y = 50;
        }
        doc.font('Helvetica-Bold').fontSize(10).text(`Préstamo Ref: ${t.id_prestamo.substring(0, 8)}`, 50, y);
        
        try {
          if (t.firma_tecnico) {
            const base64Data = t.firma_tecnico.replace(/^data:image\/png;base64,/, '');
            const imgBuffer = Buffer.from(base64Data, 'base64');
            doc.image(imgBuffer, 50, y + 15, { width: 150, height: 50 });
            y += 85;
          } else {
            y += 20;
          }
        } catch (err) {
          doc.font('Helvetica-Oblique').text('[Error al renderizar firma]', 50, y + 15);
          y += 35;
        }
      }
    }

    doc.end();
  }
}
