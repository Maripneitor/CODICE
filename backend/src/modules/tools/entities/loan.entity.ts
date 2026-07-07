import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Tool } from './tool.entity';
import { User } from '../../auth/user.entity';
import { EncryptionTransformer } from '../../../common/transformers/encryption.transformer';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', name: 'loan_date' })
  loanDate: Date;

  @Column({ type: 'timestamp', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'timestamp', name: 'return_date', nullable: true })
  returnDate: Date | null;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  penalty: number;

  @Column({ type: 'varchar', name: 'return_condition', nullable: true })
  returnCondition: 'BUENO' | 'DAÑADO' | 'INCOMPLETO' | null;

  @Column({ type: 'varchar', name: 'return_act_number', nullable: true })
  returnActNumber: string | null;

  @Column({ type: 'text', nullable: true })
  signature: string | null; // QR or digital verification signature

  @Column({ type: 'varchar', name: 'request_ip' })
  requestIp: string;

  @Column({ type: 'varchar', name: 'request_device' })
  requestDevice: string;

  @Column({ type: 'varchar', name: 'applicant_notes', nullable: true, transformer: new EncryptionTransformer() })
  applicantNotes: string | null; // Encrypted notes

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requesting_user_id' })
  requestingUser: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'delivering_user_id' })
  deliveringUser: User;

  @ManyToMany(() => Tool, { eager: true })
  @JoinTable({
    name: 'loan_tools',
    joinColumn: { name: 'loan_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tool_id', referencedColumnName: 'id' }
  })
  tools: Tool[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
