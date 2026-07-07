import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactsService } from './application/artifacts.service';
import { ArtifactController } from './infra/artifact.controller';
import { Artifact } from './domain/artifact.entity';
import { ArtifactMovement } from './domain/artifact-movement.entity';
import { LoanTransaction } from './domain/loan-transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { QrService } from './application/qr.service';
import { QrController } from './infra/qr.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Artifact, ArtifactMovement, LoanTransaction]),
    AuthModule, // Imports JwtModule exported by AuthModule for RolesGuard
  ],
  controllers: [ArtifactController, QrController],
  providers: [ArtifactsService, QrService],
  exports: [ArtifactsService, QrService],
})
export class ArtifactsModule {}
