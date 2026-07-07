import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, VersionColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ArtifactMovement } from './artifact-movement.entity';
import { User } from '../../auth/user.entity';

@Entity('artifacts')
export class Artifact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  location: string;

  @Column({ default: 'Catálogo Activo' })
  status: string;

  @Column()
  material: string;

  @Column()
  epoch: string;

  @Column()
  dimensions: string;

  @Column()
  weight: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  creatorId: string | null;

  @ManyToOne(() => User, (user) => user.artifacts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User | null;

  @OneToMany(() => ArtifactMovement, (movement) => movement.artifact)
  movements: ArtifactMovement[];

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
