#!/usr/bin/env node
/**
 * Stop the process started by start-all.mjs (does not kill unknown port owners).
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const pidFile = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '.dealpulse-dev.pid');

if (!existsSync(pidFile)) {
  console.log('No .dealpulse-dev.pid — if services run in separate terminals, stop each manually (Ctrl+C).');
  process.exit(0);
}

const pid = Number(readFileSync(pidFile, 'utf8').trim());
if (!Number.isFinite(pid) || pid <= 0) {
  console.log('Invalid pid file.');
  unlinkSync(pidFile);
  process.exit(1);
}

try {
  process.kill(-pid, 'SIGTERM');
  console.log(`Sent SIGTERM to process group ${pid}`);
} catch {
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Sent SIGTERM to pid ${pid}`);
  } catch (e) {
    console.log(`Could not stop pid ${pid}: ${e.message}`);
  }
}
try {
  unlinkSync(pidFile);
} catch {
  /* ignore */
}