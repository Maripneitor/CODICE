import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Artifact } from '../artifacts/domain/artifact.entity';
import { EncryptionTransformer } from '../../common/transformers/encryption.transformer';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true, transformer: new EncryptionTransformer() })
  name: string | null;

  @Column({ unique: true, type: 'varchar', transformer: new EncryptionTransformer() })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true, nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

  @Column({ type: 'varchar', nullable: true, select: false })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetPasswordExpires: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  otpCode: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  otpExpires: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @OneToMany(() => Artifact, (artifact) => artifact.creator)
  artifacts: Artifact[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
