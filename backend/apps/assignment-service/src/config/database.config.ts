import { loadEnvFiles } from './load-env';

loadEnvFiles();

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSourceOptions } from 'typeorm';
import { ASSIGNMENT_ENTITIES } from '../entities';

/**
 * MySQL settings for assignment_db.
 *
 * Host / port / user / password: ASSIGNMENT_DB_* if set, else the shared DB_* values.
 * Database name: ONLY ASSIGNMENT_DB_NAME (default "assignment_db"). The shared DB_NAME
 * is ignored on purpose, because it points at another service's database.
 */
export function readAssignmentDbEnv() {
  return {
    host: process.env.ASSIGNMENT_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.ASSIGNMENT_DB_PORT || process.env.DB_PORT || 3306),
    username: process.env.ASSIGNMENT_DB_USER || process.env.DB_USER || 'root',
    password: process.env.ASSIGNMENT_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.ASSIGNMENT_DB_NAME || 'assignment_db',
    migrationsRun: process.env.ASSIGNMENT_DB_MIGRATE === 'true',
  };
}

/** TLS for Aiven (DB_SSL_MODE=REQUIRED). Uses the CA file when DB_SSL_CA points to one. */
function readSsl(): { ca?: string; rejectUnauthorized: boolean } | undefined {
  const mode = (process.env.DB_SSL_MODE || '').toUpperCase();
  if (!mode || mode === 'DISABLED') return undefined;

  const caFile = process.env.DB_SSL_CA;
  const caPath = caFile
    ? [resolve(process.cwd(), caFile), resolve(process.cwd(), '..', caFile)].find(existsSync)
    : undefined;
  if (caPath) return { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
  return { rejectUnauthorized: false }; // encrypted, certificate not verified
}

/** Options shared by the running app and the migration CLI. */
export function buildDataSourceOptions(migrationsDir: string): DataSourceOptions {
  const env = readAssignmentDbEnv();
  return {
    type: 'mysql',
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    ssl: readSsl(),
    charset: 'utf8mb4',
    entities: ASSIGNMENT_ENTITIES,
    migrations: [`${migrationsDir}/migrations/*{.ts,.js}`],
    migrationsTableName: 'assignment_migrations',
    migrationsRun: env.migrationsRun,
    synchronize: false,
  };
}
