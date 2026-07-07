import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/auth/user.entity';
import { ROLES_KEY } from './roles.decorator';
import { RedisService } from '../services/redis.service';

const ROLE_HIERARCHY: Record<string, number> = {
  'ADMIN': 5,
  'WAREHOUSE_MANAGER': 4,
  'SUPERVISOR': 3,
  'TECHNICIAN': 2,
  'AUDITOR': 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = request.signedCookies?.['auth_token'] || request.cookies?.['auth_token'] || request.headers['authorization']?.split(' ')[1];

    if (!token) {
      if (!requiredRoles) {
        return true;
      }
      throw new UnauthorizedException('Acceso denegado. Token no proporcionado.');
    }

    try {
      // Decode and verify the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-12345678',
      });
      
      const tokenParts = token.split('.');
      const tokenSignature = tokenParts[2] || token;
      
      const isBlacklisted = await this.redisService.isBlacklisted(tokenSignature);
      if (isBlacklisted) {
        throw new UnauthorizedException('Sesión invalidada. Inicie sesión de nuevo.');
      }
      
      // Fetch user, role and status directly from the DB dynamically
      const user = await this.userRepository.findOne({ 
        where: { id: payload.sub },
        relations: { role: true }
      });
      
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado.');
      }

      if (user.status !== 'ACTIVE') {
        throw new ForbiddenException('Su cuenta no se encuentra activa.');
      }
      
      request.user = {
        ...payload,
        role: user.role?.name || 'AUDITOR',
      };
      
      if (!requiredRoles) {
        return true;
      }

      const userRoleNameRaw = (user.role?.name || '').toUpperCase();
      // Apply backward compatibility mappings for old role names
      let userRoleName = userRoleNameRaw;
      if (userRoleName === 'ADMINISTRATOR') userRoleName = 'ADMIN';
      
      const userRoleLevel = ROLE_HIERARCHY[userRoleName] || 0;

      // Check hierarchy: matches or exceeds required role level
      const hasPermission = requiredRoles.some(reqRole => {
        let reqRoleUpper = reqRole.toUpperCase();
        // Support legacy mappings: restorer -> TECHNICIAN, viewer -> AUDITOR
        if (reqRoleUpper === 'RESTORER') reqRoleUpper = 'TECHNICIAN';
        if (reqRoleUpper === 'VIEWER') reqRoleUpper = 'AUDITOR';
        if (reqRoleUpper === 'ADMINISTRATOR') reqRoleUpper = 'ADMIN';
        
        const reqRoleLevel = ROLE_HIERARCHY[reqRoleUpper] || 0;
        return userRoleLevel >= reqRoleLevel;
      });

      if (!hasPermission) {
        throw new ForbiddenException('No tiene permisos para realizar esta operación.');
      }
      
      return true;
    } catch (error) {
      console.error('RolesGuard Verification Error:', error);
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token de acceso inválido o expirado.');
    }
  }
}
