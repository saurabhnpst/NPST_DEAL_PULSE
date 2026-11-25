import { config as loadDotenv } from 'dotenv';
import { resolve } from 'path';

/** Per-app `.env` under `backend/apps/<service>/.env` (cwd = backend when using nest CLI). */
export function serviceEnvFile(serviceDirName: string): string {
  return resolve(process.cwd(), 'apps', serviceDirName, '.env');
}

/** Load service env before Nest bootstrap (so validators see variables). */
export function loadServiceEnv(serviceDirName: string): void {
  loadDotenv({ path: serviceEnvFile(serviceDirName) });
}

export function assertRequiredEnv(keys: string[]): void {
  const missing = keys.filter((k) => !process.env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}