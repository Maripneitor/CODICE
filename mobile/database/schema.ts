import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'artifacts',
      columns: [
        { name: 'code', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'material', type: 'string' },
        { name: 'epoch', type: 'string' },
        { name: 'dimensions', type: 'string' },
        { name: 'weight', type: 'string' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'artifact_movements',
      columns: [
        { name: 'artifact_id', type: 'string', isIndexed: true },
        { name: 'action', type: 'string' },
        { name: 'details', type: 'string', isOptional: true },
        { name: 'responsible', type: 'string' },
        { name: 'origin', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
