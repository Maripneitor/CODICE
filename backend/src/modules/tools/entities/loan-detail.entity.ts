import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Loan } from './loan.entity';
import { Tool } from './tool.entity';

@Entity('loan_details')
export class LoanDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan, (loan) => loan.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ManyToOne(() => Tool, { eager: true })
  @JoinColumn({ name: 'tool_id' })
  tool: Tool;

  @Column({ type: 'timestamp', name: 'return_date', nullable: true })
  returnDate: Date | null;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';

  @Column({ type: 'varchar', name: 'return_condition', nullable: true })
  returnCondition: 'BUENO' | 'DAÑADO' | 'INCOMPLETO' | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  penalty: number;
}
