import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sync_conflicts')
export class SyncConflict {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  artifactId: string;

  @Column()
  clientVersion: number;

  @Column()
  serverVersion: number;

  @Column({ type: 'jsonb', nullable: true })
  clientData: any;

  @Column({ type: 'jsonb', nullable: true })
  serverData: any;

  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
