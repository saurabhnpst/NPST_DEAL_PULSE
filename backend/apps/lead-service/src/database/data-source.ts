import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import {
  buildMysqlSslFromEnv,
  findBackendRoot,
} from '../../../../libs/service-config/src';
import { Lead } from '../entities/lead.entity';
import { LeadHistory } from '../entities/lead-history.entity';
import { LeadQualification } from '../entities/lead-qualification.entity';

const backendRoot = findBackendRoot(__dirname);
loadEnv({ path: resolve(backendRoot, 'apps', 'lead-service', '.env') });

const ssl = buildMysqlSslFromEnv(backendRoot, process.env);

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Lead, LeadQualification, LeadHistory],
  migrations: [
    resolve(
      __dirname,
      __filename.endsWith('.js') ? 'migrations/*.js' : 'migrations/*.ts',
    ),
  ],
  synchronize: false,
  ...(ssl ? { ssl } : {}),
  migrationsTableName: 'lead_migrations',
});