import { Model } from '@nozbe/watermelondb';
import { field, children, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Artifact extends Model {
  static table = 'artifacts';

  static associations = {
    artifact_movements: { type: 'has_many', foreignKey: 'artifact_id' },
  } as const;

  @field('code') code!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('location') location!: string;
  @field('status') status!: string;
  @field('material') material!: string;
  @field('epoch') epoch!: string;
  @field('dimensions') dimensions!: string;
  @field('weight') weight!: string;
  @field('image_url') imageUrl?: string;

  @children('artifact_movements') movements!: any;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
