import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { ToolType } from './tool-type.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => ToolType, (toolType) => toolType.categories)
  toolTypes: ToolType[];
}
