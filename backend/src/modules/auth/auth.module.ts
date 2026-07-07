import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { MailingService } from './mailing.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-jwt-key-replace-in-production-12345678'),
        signOptions: {
          expiresIn: configService.get<any>('JWT_EXPIRATION', '3600s'),
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, MailingService, RedisService],
  exports: [AuthService, JwtModule, MailingService, TypeOrmModule, RedisService],
})
export class AuthModule {}
