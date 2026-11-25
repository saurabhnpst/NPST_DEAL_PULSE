import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function applyEnvFile(filePath: string, override: boolean): boolean {
  if (!existsSync(filePath)) return false;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return true;
}

/**
 * Loads env for opportunity-service: shared `backend/.env` first, then
 * `apps/opportunity-service/.env` overrides (so `DB_NAME=opportunity_db` wins over repo `.env`).
 */
export function loadEnvFiles(): void {
  const cwd = process.cwd();
  if (process.env.ENV_FILE) {
    applyEnvFile(process.env.ENV_FILE, true);
    return;
  }
  applyEnvFile(resolve(cwd, '.env'), false);
  applyEnvFile(resolve(cwd, 'apps/opportunity-service/.env'), true);
  applyEnvFile(resolve(cwd, '../.env'), false);
}