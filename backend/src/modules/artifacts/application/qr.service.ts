import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artifact } from '../domain/artifact.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(Artifact)
    private readonly artifactRepository: Repository<Artifact>,
  ) {}

  async generateQrSvg(artifactId: string): Promise<string> {
    const artifact = await this.artifactRepository.findOne({ where: { id: artifactId } });
    if (!artifact) {
      throw new NotFoundException(`Artefacto con ID ${artifactId} no encontrado.`);
    }

    // Format url as: https://codice.app/catalog/[UUID]
    const qrUrl = `https://codice.app/catalog/${artifact.id}`;
    
    // Generate directly in SVG format string
    return QRCode.toString(qrUrl, { type: 'svg', margin: 2 });
  }
}
