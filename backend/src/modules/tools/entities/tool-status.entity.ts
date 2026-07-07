import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Tool } from './tool.entity';

@Entity('tool_statuses')
export class ToolStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // DISPONIBLE, PRESTADO, MANTENIMIENTO, REPARACION, BAJA, RESERVADO

  @OneToMany(() => Tool, (tool) => tool.status)
  tools: Tool[];
}
