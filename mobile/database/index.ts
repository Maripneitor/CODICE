import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import Artifact from './models/Artifact';
import ArtifactMovement from './models/ArtifactMovement';

const adapter = new SQLiteAdapter({
  schema,
  // (Optional) Database name
  dbName: 'codice_offline',
  // (Optional) jsi: true is faster on iOS/Android, but requires hermes and custom native bindings setup.
  // We keep it false for maximum compatibility out-of-the-box.
  jsi: false,
});

export const database = new Database({
  adapter,
  modelClasses: [
    Artifact,
    ArtifactMovement,
  ],
});
