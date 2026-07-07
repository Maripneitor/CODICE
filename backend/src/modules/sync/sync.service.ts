import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Artifact } from '../artifacts/domain/artifact.entity';
import { SyncConflict } from './sync-conflict.entity';
import { ArtifactMovement } from '../artifacts/domain/artifact-movement.entity';

export class SyncArtifactItem {
  id: string;
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
  version?: number;
}

export class SyncPushPayload {
  artifacts?: {
    created?: SyncArtifactItem[];
    updated?: Partial<SyncArtifactItem>[];
    deleted?: string[];
  };
}

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Artifact)
    private readonly artifactRepository: Repository<Artifact>,
    @InjectRepository(SyncConflict)
    private readonly conflictRepository: Repository<SyncConflict>,
    @InjectRepository(ArtifactMovement)
    private readonly movementRepository: Repository<ArtifactMovement>,
  ) {}

  async push(
    changes: SyncPushPayload,
    responsibleUser: string,
  ): Promise<{ status: string; conflicts: number }> {
    let conflictCount = 0;
    const artChanges = changes.artifacts || {};
    
    // Process Created artifacts
    if (artChanges.created) {
      for (const item of artChanges.created) {
        // Idempotency check: if item exists by id or code, perform an upsert update
        const existing = await this.artifactRepository.findOne({ 
          where: [{ id: item.id }, { code: item.code }] 
        });
        if (existing) {
          existing.name = item.name;
          existing.description = item.description;
          existing.location = item.location;
          existing.status = item.status || existing.status;
          existing.material = item.material;
          existing.epoch = item.epoch;
          existing.dimensions = item.dimensions;
          existing.weight = item.weight;
          if (item.imageUrl) existing.imageUrl = item.imageUrl;
          await this.artifactRepository.save(existing);
          continue;
        }

        const artifact = this.artifactRepository.create({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description,
          location: item.location,
          status: item.status || 'Catálogo Activo',
          material: item.material,
          epoch: item.epoch,
          dimensions: item.dimensions,
          weight: item.weight,
          imageUrl: item.imageUrl || null,
        });
        const saved = await this.artifactRepository.save(artifact);

        // Add a movement entry
        const movement = this.movementRepository.create({
          artifactId: saved.id,
          action: 'Catalogación',
          details: 'Sincronizado desde terminal móvil (Creación Offline).',
          responsible: responsibleUser,
          origin: 'App Campo Offline',
        });
        await this.movementRepository.save(movement);
      }
    }

    // Process Updated artifacts
    if (artChanges.updated) {
      for (const item of artChanges.updated) {
        if (!item.id) continue;
        const existing = await this.artifactRepository.findOne({ where: { id: item.id } });
        if (!existing) {
          continue;
        }

        // Compare client version with server version
        const clientVersion = item.version || 1;
        if (clientVersion < existing.version) {
          // Collision / Version mismatch conflict!
          conflictCount++;
          const conflict = this.conflictRepository.create({
            artifactId: existing.id,
            clientVersion,
            serverVersion: existing.version,
            clientData: item,
            serverData: existing,
          });
          await this.conflictRepository.save(conflict);
          continue;
        }

        // Apply update
        if (item.name) existing.name = item.name;
        if (item.description) existing.description = item.description;
        if (item.location) existing.location = item.location;
        if (item.status) existing.status = item.status;
        
        await this.artifactRepository.save(existing);

        // Register movement for update
        const movement = this.movementRepository.create({
          artifactId: existing.id,
          action: 'Traslado',
          details: `Traslado/Actualización sincronizada offline. Nueva ubicación: ${existing.location}.`,
          responsible: responsibleUser,
          origin: 'App Campo Offline',
        });
        await this.movementRepository.save(movement);
      }
    }

    return { status: conflictCount > 0 ? 'conflicts' : 'ok', conflicts: conflictCount };
  }

  async pull(lastPulledAt?: number): Promise<{
    changes: {
      artifacts: {
        created: Artifact[];
        updated: Artifact[];
        deleted: string[];
      };
    };
    timestamp: number;
  }> {
    const serverTimestamp = Date.now();
    
    let created: Artifact[] = [];
    let updated: Artifact[] = [];

    if (!lastPulledAt) {
      // Pull everything (initial sync)
      created = await this.artifactRepository.find();
    } else {
      const pullDate = new Date(lastPulledAt);
      
      // Items created since last sync
      created = await this.artifactRepository.find({
        where: {
          createdAt: MoreThan(pullDate),
        },
      });

      // Items updated since last sync but NOT created since then
      updated = await this.artifactRepository.find({
        where: {
          updatedAt: MoreThan(pullDate),
        },
      });
      // Filter out duplicates (already in created)
      const createdIds = new Set(created.map(a => a.id));
      updated = updated.filter(a => !createdIds.has(a.id));
    }

    return {
      changes: {
        artifacts: {
          created,
          updated,
          deleted: [], // We don't support hard deletions from PostgreSQL for history preservation
        },
      },
      timestamp: serverTimestamp,
    };
  }
}
