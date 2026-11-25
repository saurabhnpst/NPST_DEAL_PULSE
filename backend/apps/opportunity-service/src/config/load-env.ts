import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Loads key=value pairs from a .env file when variables are not already set.
 * Searched paths (from backend/ cwd): ENV_FILE, ./.env, ../.env
 */
export function loadEnvFiles(): void {
  const candidates = [
    process.env.ENV_FILE,
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../.env'),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
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
      if (process.env[key] === undefined) process.env[key] = value;
    }
    return;
  }
}