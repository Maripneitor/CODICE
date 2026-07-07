import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/auth/user.entity';
import { Role } from './modules/auth/role.entity';
import { Permission } from './modules/auth/permission.entity';
import { ThrottlerRedisStorage } from './common/throttler-redis-storage';
import { Artifact } from './modules/artifacts/domain/artifact.entity';
import { ArtifactMovement } from './modules/artifacts/domain/artifact-movement.entity';
import { LoanTransaction } from './modules/artifacts/domain/loan-transaction.entity';
import { ArtifactsModule } from './modules/artifacts/artifacts.module';
import { SyncConflict } from './modules/sync/sync-conflict.entity';
import { SyncModule } from './modules/sync/sync.module';
import { ToolsModule } from './modules/tools/tools.module';
import { Tool } from './modules/tools/entities/tool.entity';
import { ToolStatus } from './modules/tools/entities/tool-status.entity';
import { ToolType } from './modules/tools/entities/tool-type.entity';
import { Category } from './modules/tools/entities/category.entity';
import { Loan } from './modules/tools/entities/loan.entity';
import { LoanDetail } from './modules/tools/entities/loan-detail.entity';

@Module({
  imports: [
    // Global Config Module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // PostgreSQL TypeORM Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [User, Role, Permission, Artifact, ArtifactMovement, LoanTransaction, SyncConflict, Tool, ToolStatus, ToolType, Category, Loan, LoanDetail],
            synchronize: false, // Mantener estrictamente en false para proteger el esquema remoto
            ssl: {
              rejectUnauthorized: false, // Requerido por Render para el certificado SSL del tier gratuito
            },
          };
        }
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'admin'),
          password: configService.get<string>('DB_PASSWORD', 'supersecretpassword'),
          database: configService.get<string>('DB_NAME', 'codice_db'),
          entities: [User, Role, Permission, Artifact, ArtifactMovement, LoanTransaction, SyncConflict, Tool, ToolStatus, ToolType, Category, Loan, LoanDetail],
          synchronize: true, // true only for development
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 15 * 60 * 1000, // 15 minutes window
            limit: process.env.NODE_ENV === 'test' ? 100000 : 100, // Max 100 requests per 15 minutes
          },
          {
            name: 'auth',
            ttl: 15 * 60 * 1000, // 15 minutes window
            limit: process.env.NODE_ENV === 'test' ? 100000 : 5, // Max 5 requests per 15 minutes
          },
        ],
        storage: new ThrottlerRedisStorage(),
      }),
    }),

    // Business Modules
    AuthModule,
    ArtifactsModule,
    SyncModule,
    ToolsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enable Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
