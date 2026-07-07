import { Model } from '@nozbe/watermelondb';
import { field, relation, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ArtifactMovement extends Model {
  static table = 'artifact_movements';

  static associations = {
    artifacts: { type: 'belongs_to', key: 'artifact_id' },
  } as const;

  @field('artifact_id') artifactId!: string;
  @field('action') action!: string;
  @field('details') details?: string;
  @field('responsible') responsible!: string;
  @field('origin') origin!: string;

  @relation('artifacts', 'artifact_id') artifact!: any;

  @readonly @date('created_at') createdAt!: Date;
}
