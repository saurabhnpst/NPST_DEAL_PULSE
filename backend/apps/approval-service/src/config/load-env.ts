import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';

/** Load approval-service `.env` when present (local dev). */
export function loadEnvFiles(): void {
  const local = resolve(__dirname, '../../.env');
  if (existsSync(local)) {
    loadEnv({ path: local });
  }
}