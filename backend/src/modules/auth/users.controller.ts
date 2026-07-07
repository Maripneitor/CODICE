import { Controller, Get, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { auditLogger } from '../../common/audit-logger';

class ChangeRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ADMIN', 'WAREHOUSE_MANAGER', 'SUPERVISOR', 'TECHNICIAN', 'AUDITOR', 'admin', 'restorer', 'viewer'])
  role: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

class ChangeStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'SUSPENDED', 'INACTIVE'])
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

  @IsString()
  @IsOptional()
  reason?: string;
}

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('withDeleted') withDeleted?: string,
  ) {
    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (withDeleted === 'true') {
      query.withDeleted();
    }

    // Simple search (email is encrypted via transformer)
    if (search) {
      // TypeORM value transformer will encrypt search parameter
      query.where('user.email = :search', { search });
    }

    query.skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();

    const users = items.map(user => {
      const { passwordHash, refreshTokenHash, otpCode, resetPasswordToken, ...rest } = user;
      return rest;
    });

    return {
      users,
      total,
      page,
      limit,
    };
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async changeRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @Req() request: any,
  ) {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: { role: true }
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const adminId = request.user?.sub || 'SYSTEM';
    const oldRoleName = user.role?.name || 'NONE';
    const newRoleNameNormalized = changeRoleDto.role.toUpperCase();

    let newRole = await this.roleRepository.findOne({ where: { name: newRoleNameNormalized } });
    if (!newRole) {
      newRole = this.roleRepository.create({ name: newRoleNameNormalized });
      await this.roleRepository.save(newRole);
    }

    user.role = newRole;
    await this.userRepository.save(user);

    const reason = changeRoleDto.reason || 'Sin motivo especificado';

    // Structured logging of privilege mutation
    const fecha = new Date().toISOString();
    auditLogger.info(`[${fecha}] Usuario ${adminId} cambió el rol de ${id} de ${oldRoleName} a ${newRoleNameNormalized}. Motivo: ${reason}`);

    const { passwordHash, refreshTokenHash, otpCode, resetPasswordToken, ...rest } = user;
    return {
      message: 'Rol actualizado exitosamente.',
      user: rest,
    };
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @Req() request: any,
  ) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    
    const adminId = request.user?.sub || 'SYSTEM';
    const oldStatus = user.status;
    user.status = changeStatusDto.status;
    
    if (changeStatusDto.status === 'SUSPENDED') {
      user.refreshTokenHash = null;
    }

    await this.userRepository.save(user);

    const reason = changeStatusDto.reason || 'Sin motivo especificado';

    // Structured logging of status mutation
    const fecha = new Date().toISOString();
    auditLogger.info(`[${fecha}] Usuario ${adminId} cambió el estado de ${id} de ${oldStatus} a ${changeStatusDto.status}. Motivo: ${reason}`);

    const { passwordHash, refreshTokenHash, otpCode, resetPasswordToken, ...rest } = user;
    return {
      message: 'Estado de usuario actualizado exitosamente.',
      user: rest,
    };
  }
}
