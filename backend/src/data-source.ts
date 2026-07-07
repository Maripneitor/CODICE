import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

export const AppDataSource = dbUrl
  ? new DataSource({
      type: 'postgres',
      url: dbUrl,
      synchronize: false,
      logging: true,
      entities: [path.join(__dirname, '/**/*.entity.{ts,js}')],
      migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'supersecretpassword',
      database: process.env.DB_NAME || 'codice_db',
      synchronize: false,
      logging: true,
      entities: [path.join(__dirname, '/**/*.entity.{ts,js}')],
      migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
    });
