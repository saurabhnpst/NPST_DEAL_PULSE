import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';

export type MysqlSslOptions = { ca?: string; rejectUnauthorized: boolean };

/** True when TLS to MySQL should be used (REQUIRED/VERIFY_CA); false for DISABLED/OFF. */
export function isMysqlTlsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const mode = (env.DB_SSL_MODE ?? '').trim().toUpperCase();
  if (mode === 'DISABLED' || mode === 'OFF' || mode === 'FALSE' || mode === 'NONE') {
    return false;
  }
  if (mode === 'REQUIRED' || mode === 'VERIFY_CA' || mode === 'VERIFY_IDENTITY') {
    return true;
  }
  if (env.DB_SSL_CA?.trim()) {
    return true;
  }
  return false;
}

function sslRejectUnauthorized(env: NodeJS.ProcessEnv): boolean {
  const raw = (env.DB_SSL_REJECT_UNAUTHORIZED ?? '').toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  const mode = (env.DB_SSL_MODE ?? '').trim().toUpperCase();
  if (mode === 'REQUIRED') return false;
  return true;
}

function resolveCaFile(backendRoot: string, configuredPath: string): string | undefined {
  const trimmed = configuredPath.trim();
  if (!trimmed) return undefined;
  const candidates = isAbsolute(trimmed)
    ? [trimmed]
  : [
      resolve(backendRoot, trimmed),
      resolve(process.cwd(), trimmed),
    ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return readFileSync(p, 'utf8');
    }
  }
  return undefined;
}

/**
 * TypeORM `ssl` option from env. Returns `undefined` when `DB_SSL_MODE=DISABLED` (local dev).
 * When TLS is on and CA is set, uses VERIFY_CA (`rejectUnauthorized` default true).
 */
export function buildMysqlSslFromEnv(
  backendRoot: string,
  env: NodeJS.ProcessEnv = process.env,
): MysqlSslOptions | undefined {
  if (!isMysqlTlsEnabled(env)) {
    return undefined;
  }
  const caPath = env.DB_SSL_CA?.trim();
  if (caPath) {
    const ca = resolveCaFile(backendRoot, caPath);
    if (ca) {
      return { ca, rejectUnauthorized: sslRejectUnauthorized(env) };
    }
  }
  const mode = (env.DB_SSL_MODE ?? '').trim().toUpperCase();
  if (mode === 'REQUIRED') {
    return { rejectUnauthorized: sslRejectUnauthorized(env) };
  }
  throw new Error(
    'DB_SSL_MODE requires TLS but DB_SSL_CA file was not found under backend root',
  );
}