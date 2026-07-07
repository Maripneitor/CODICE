import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { Artifact } from '../artifacts/domain/artifact.entity';
import { SyncConflict } from './sync-conflict.entity';
import { ArtifactMovement } from '../artifacts/domain/artifact-movement.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Artifact, SyncConflict, ArtifactMovement]),
    AuthModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
