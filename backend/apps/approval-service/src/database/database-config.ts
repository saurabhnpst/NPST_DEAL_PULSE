import { readFileSync } from 'fs';
import { resolve } from 'path';
import { configurationError } from '../shared/errors';

export interface DatabaseSslConfig {
  ca: string;
  rejectUnauthorized: boolean;
}

export interface DatabaseConfig {
  type: 'mysql';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: false;
  migrationsRun: false;
  ssl?: DatabaseSslConfig;
  entities: string[];
  migrations: string[];
}

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const sslMode = readSslMode(env);
  return {
    type: 'mysql',
    host: readRequired(env, 'DB_HOST'),
    port: readPort(env),
    username: readRequired(env, 'DB_USER'),
    password: readRequired(env, 'DB_PASSWORD'),
    database: readRequired(env, 'DB_NAME'),
    synchronize: false,
    migrationsRun: false,
    ...(sslMode === 'DISABLED' ? {} : { ssl: readSslConfig(env) }),
    entities: [resolve(__dirname, 'entities', '*.{ts,js}')],
    migrations: [resolve(__dirname, 'migrations', '*.{ts,js}')],
  };
}

function readRequired(env: NodeJS.ProcessEnv, name: string): string {
  const raw = env[name];
  if (raw === undefined || raw.trim().length === 0) {
    throw configurationError(`${name} is required`);
  }
  return raw.trim();
}

function readPort(env: NodeJS.ProcessEnv): number {
  const raw = readRequired(env, 'DB_PORT');
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw configurationError('DB_PORT must be between 1 and 65535');
  }
  return value;
}

function readSslMode(env: NodeJS.ProcessEnv): string {
  const raw = readRequired(env, 'DB_SSL_MODE').toUpperCase();
  const allowed = ['DISABLED', 'REQUIRED', 'VERIFY_CA', 'VERIFY_IDENTITY'];
  if (!allowed.includes(raw)) {
    throw configurationError(`DB_SSL_MODE must be one of ${allowed.join(', ')}`);
  }
  return raw;
}

function readSslConfig(env: NodeJS.ProcessEnv): DatabaseSslConfig {
  const caPath = readRequired(env, 'DB_SSL_CA');
  return {
    ca: readFileSync(resolve(__dirname, '../..', caPath), 'utf8'),
    rejectUnauthorized: true,
  };
}
