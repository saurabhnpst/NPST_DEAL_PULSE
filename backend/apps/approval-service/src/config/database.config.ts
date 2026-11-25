import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSourceOptions } from 'typeorm';
import { loadEnvFiles } from './load-env';
import { APPROVAL_ENTITIES } from '../database/entities';

loadEnvFiles();

export function readApprovalDbEnv() {
  return {
    host: process.env.APPROVAL_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.APPROVAL_DB_PORT || process.env.DB_PORT || 3306),
    username: process.env.APPROVAL_DB_USER || process.env.DB_USER || 'root',
    password: process.env.APPROVAL_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.APPROVAL_DB_NAME || process.env.DB_NAME || 'approval_db',
    migrationsRun: process.env.APPROVAL_DB_MIGRATE === 'true',
  };
}

function readSsl(): { ca?: string; rejectUnauthorized: boolean } | undefined {
  const mode = (process.env.DB_SSL_MODE || '').toUpperCase();
  if (!mode || mode === 'DISABLED') return undefined;
  const caFile = process.env.DB_SSL_CA;
  const caPath = caFile
    ? [resolve(process.cwd(), caFile), resolve(process.cwd(), '..', caFile)].find(existsSync)
    : undefined;
  if (caPath) return { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

export function buildDataSourceOptions(migrationsDir: string): DataSourceOptions {
  const env = readApprovalDbEnv();
  return {
    type: 'mysql',
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    ssl: readSsl(),
    charset: 'utf8mb4',
    entities: APPROVAL_ENTITIES,
    migrations: [`${migrationsDir}/database/migrations/*{.ts,.js}`],
    migrationsTableName: 'approval_migrations',
    migrationsRun: env.migrationsRun,
    synchronize: false,
  };
}