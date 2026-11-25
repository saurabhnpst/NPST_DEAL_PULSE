#!/usr/bin/env node
/**
 * Start MinIO + auth-service + API Gateway + 7 microservices with labeled logs (concurrently).
 * No Docker or Redis needed for local development.
 */
import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const pidFile = resolve(backendRoot, '.dealpulse-dev.pid');

function readGatewayPort() {
  const envPath = resolve(backendRoot, 'apps/api-gateway/.env');
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, 'utf8').match(/^PORT=(\d+)/m);
    if (m) return m[1];
  }
  return process.env.GATEWAY_PORT || '3010';
}

const gatewayPort = readGatewayPort();
const names = 'minio,auth,gateway,leads,opps,rfp,docs,approval,assign,compliance';
const colors = 'brightBlue,magenta,blue,green,yellow,cyan,red,white,gray,brightBlack';
// Gateway reads PORT from apps/api-gateway/.env (no shell-specific `PORT=` prefix, so this works on Windows too).
const quoted = [
  'node scripts/start-minio.mjs',
  'npm run start:auth',
  'npm run start:gateway',
  'npm run start:leads',
  'npm run start:opportunities',
  'npm run start:rfp',
  'npm run start:documents',
  'npm run start:approvals',
  'npm run start:assignments',
  'npm run start:compliance',
].map((c) => `"${c.replace(/"/g, '\\"')}"`);

console.log(`Starting DealPulse backend (gateway :${gatewayPort})…`);
console.log('Stop with: npm run stop:all\n');

const cmd = `npx concurrently --kill-others-on-fail -n ${names} -c ${colors} ${quoted.join(' ')}`;
const pro = spawn(cmd, {
  cwd: backendRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

writeFileSync(pidFile, String(pro.pid));
pro.on('exit', (code) => {
  try {
    if (existsSync(pidFile)) unlinkSync(pidFile);
  } catch {
    /* ignore */
  }
  process.exit(code ?? 0);
});