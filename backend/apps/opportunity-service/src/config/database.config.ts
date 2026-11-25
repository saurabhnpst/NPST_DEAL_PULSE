import { loadEnvFiles } from './load-env';

loadEnvFiles();

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import {
  Opportunity,
  OpportunityActivity,
  OpportunityCommercialHistory,
  OpportunityProduct,
  OpportunityPublicIdSequence,
  OpportunityStageHistory,
  OpportunityDomainEvent,
} from '../entities';

export const OPPORTUNITY_ENTITIES = [
  Opportunity,
  OpportunityProduct,
  OpportunityStageHistory,
  OpportunityCommercialHistory,
  OpportunityActivity,
  OpportunityPublicIdSequence,
  OpportunityDomainEvent,
];

const migrationsGlob = (baseDir: string) => `${baseDir}/migrations/*{.ts,.js}`;

type MysqlSsl = { ca?: string; rejectUnauthorized?: boolean };

export type OpportunityDatabaseEnv = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  migrationsRun: boolean;
};

/** Resolves DB settings from OPPORTUNITY_DB_* with fallback to shared DB_* vars. */
export function readOpportunityDatabaseEnv(): OpportunityDatabaseEnv {
  return {
    host: process.env.OPPORTUNITY_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.OPPORTUNITY_DB_PORT || process.env.DB_PORT || 3306),
    username: process.env.OPPORTUNITY_DB_USER || process.env.DB_USER || 'root',
    password: process.env.OPPORTUNITY_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database:
      process.env.OPPORTUNITY_DB_NAME
      || process.env.DB_NAME
      || 'opportunity_db',
    migrationsRun: process.env.OPPORTUNITY_DB_MIGRATE === 'true',
  };
}

function resolveCaPem(): string | undefined {
  const caFile = process.env.OPPORTUNITY_DB_SSL_CA || process.env.DB_SSL_CA;
  if (!caFile) return undefined;

  const rel = caFile.replace(/^\.\//, '');
  const candidates = [
    resolve(process.cwd(), caFile),
    resolve(process.cwd(), '..', rel),
    resolve(process.cwd(), '..', caFile),
    resolve(__dirname, '..', '..', '..', '..', rel),
    resolve(__dirname, '..', '..', '..', '..', caFile),
  ];

  const caPath = candidates.find((p) => {
    try {
      readFileSync(p);
      return true;
    } catch {
      return false;
    }
  });
  return caPath ? readFileSync(caPath, 'utf8') : undefined;
}

function sslRejectUnauthorizedExplicit(): boolean | undefined {
  const raw = (
    process.env.OPPORTUNITY_DB_SSL_REJECT_UNAUTHORIZED
    ?? process.env.DB_SSL_REJECT_UNAUTHORIZED
    ?? ''
  ).toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return undefined;
}

/**
 * Aiven MySQL with ssl-mode=REQUIRED: TLS on the wire without CA verification.
 * With project ca.pem (from Aiven Console): VERIFY_CA — set DB_SSL_REJECT_UNAUTHORIZED=true.
 */
function readSslOptions(): MysqlSsl | undefined {
  const mode = (
    process.env.OPPORTUNITY_DB_SSL_MODE
    || process.env.DB_SSL_MODE
    || ''
  ).toUpperCase();
  if (!mode || mode === 'DISABLED' || mode === 'OFF' || mode === 'FALSE') {
    return undefined;
  }

  const ca = resolveCaPem();
  const explicit = sslRejectUnauthorizedExplicit();

  if (ca) {
    return {
      ca,
      rejectUnauthorized: explicit ?? true,
    };
  }

  if (process.env.DB_SSL_CA || process.env.OPPORTUNITY_DB_SSL_CA) {
    // eslint-disable-next-line no-console
    console.warn(
      '[opportunity-service] DB_SSL_CA is set but the CA file was not found. '
      + 'Using TLS without certificate verification (MySQL ssl-mode=REQUIRED). '
      + 'Download the project CA from Aiven Console to enable VERIFY_CA.',
    );
  }

  return {
    rejectUnauthorized: explicit ?? false,
  };
}

function sharedTypeOrmBase(migrationsDir: string) {
  return {
    type: 'mysql' as const,
    charset: 'utf8mb4',
    entities: OPPORTUNITY_ENTITIES,
    migrations: [migrationsGlob(migrationsDir)],
    migrationsTableName: 'opportunity_migrations',
    synchronize: false as const,
  };
}

/** Nest TypeORM root module options (runtime). */
export function buildTypeOrmModuleOptions(appDir: string): TypeOrmModuleOptions {
  const env = readOpportunityDatabaseEnv();
  const ssl = readSslOptions();
  return {
    ...sharedTypeOrmBase(appDir),
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    migrationsRun: env.migrationsRun,
    ssl,
  };
}

/** Standalone DataSource options (CLI migrations). */
export function buildDataSourceOptions(srcDir: string): DataSourceOptions {
  const env = readOpportunityDatabaseEnv();
  const ssl = readSslOptions();
  return {
    ...sharedTypeOrmBase(srcDir),
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    ssl,
  } as DataSourceOptions;
}