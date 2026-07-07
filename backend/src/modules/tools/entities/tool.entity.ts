import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, VersionColumn, BeforeInsert, Index } from 'typeorm';
import { ToolStatus } from './tool-status.entity';
import { ToolType } from './tool-type.entity';

@Entity('tools')
export class Tool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  code: string;

  @Column()
  serialNumber: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column()
  location: string; // Pasillo/Estante/Caja

  @ManyToOne(() => ToolStatus, (status) => status.tools, { eager: true })
  @JoinColumn({ name: 'status_id' })
  status: ToolStatus;

  @ManyToOne(() => ToolType, (type) => type.tools, { eager: true })
  @JoinColumn({ name: 'type_id' })
  type: ToolType;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @BeforeInsert()
  async generateCode() {
    if (this.code) return;
    const year = new Date().getFullYear();
    let count = 0;
    try {
      const { AppDataSource } = require('../../../data-source');
      if (AppDataSource) {
        const repo = AppDataSource.getRepository(Tool);
        count = await repo.count();
      }
    } catch (e) {
      // Simple fallback if DB is not ready during initial setup
      count = Math.floor(Math.random() * 90000);
    }
    const sequence = String(count + 1).padStart(5, '0');
    this.code = `HERR-${year}-${sequence}`;
  }
}
