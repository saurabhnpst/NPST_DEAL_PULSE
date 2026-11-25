#!/usr/bin/env node
/**
 * Start API Gateway + 7 microservices with labeled logs (concurrently).
 * Does not start Docker infra — run `npm run infra:up` first if needed.
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
const names = 'auth,gateway,leads,opps,rfp,docs,approval,assign,compliance';
const colors = 'magenta,blue,green,yellow,cyan,red,white,gray,brightBlack';
const quoted = [
  'npm run start:auth',
  `PORT=${gatewayPort} npm run start:gateway`,
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