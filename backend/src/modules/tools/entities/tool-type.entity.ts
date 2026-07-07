import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { Tool } from './tool.entity';

@Entity('tool_types')
export class ToolType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Category, (category) => category.toolTypes)
  @JoinTable({
    name: 'tool_types_categories',
    joinColumn: { name: 'tool_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories: Category[];

  @OneToMany(() => Tool, (tool) => tool.type)
  tools: Tool[];
}
