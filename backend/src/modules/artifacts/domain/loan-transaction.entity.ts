import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Artifact } from './artifact.entity';
import { User } from '../../auth/user.entity';

@Entity('loan_transactions')
export class LoanTransaction {
  @PrimaryGeneratedColumn('uuid')
  id_prestamo: string;

  @Column()
  id_tecnico_solicita: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_tecnico_solicita' })
  tecnico: User;

  @Column()
  id_almacenista_entrega: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_almacenista_entrega' })
  almacenista: User;

  @Column()
  id_herramienta: string;

  @ManyToOne(() => Artifact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_herramienta' })
  herramienta: Artifact;

  @CreateDateColumn()
  fecha_hora_salida: Date;

  @Column({ type: 'timestamp' })
  fecha_hora_retorno_esperada: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora_retorno_real: Date | null;

  @Column({ type: 'integer', default: 0 })
  tiempo_total_uso: number; // in minutes

  @Column({ type: 'text', nullable: true })
  firma_tecnico: string | null; // Base64 signature
}
