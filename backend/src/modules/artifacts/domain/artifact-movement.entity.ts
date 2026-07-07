import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Artifact } from './artifact.entity';

@Entity('artifact_movements')
export class ArtifactMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  artifactId: string;

  @ManyToOne(() => Artifact, (artifact) => artifact.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artifactId' })
  artifact: Artifact;

  @Column()
  action: string; // e.g., Traslado, Catalogación, Restauración, Inventario

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column()
  responsible: string; // Name or email of the user who performed it

  @Column()
  origin: string; // e.g., Terminal Móvil, Panel Web, App Campo Offline

  @CreateDateColumn()
  createdAt: Date;
}
