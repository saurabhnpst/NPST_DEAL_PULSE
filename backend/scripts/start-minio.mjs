#!/usr/bin/env node
/**
 * Start a local MinIO server for document-service (no Docker needed).
 * Downloads the MinIO binary once into backend/.local/bin and stores data in backend/.local/minio-data.
 * Credentials come from apps/document-service/.env (MINIO_ACCESS_KEY / MINIO_SECRET_KEY / MINIO_PORT).
 */
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
// dl.min.io no longer serves binaries; GitHub releases still do (last one with Windows/Linux binaries).
const RELEASE = process.env.MINIO_RELEASE || 'RELEASE.2025-09-07T16-13-09Z';
const isWindows = process.platform === 'win32';
const platformDir = isWindows ? 'windows-amd64' : 'linux-amd64';
const bin = resolve(backendRoot, '.local/bin', isWindows ? 'minio.exe' : 'minio');
const dataDir = resolve(backendRoot, '.local/minio-data');

function readEnv(file) {
  const env = {};
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function fetchOk(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MinIO download failed (${res.status}) from ${url}`);
  return res;
}

async function download() {
  const url = `https://github.com/minio/minio/releases/download/${RELEASE}/minio.${platformDir}.${RELEASE}${isWindows ? '.exe' : ''}`;
  console.log(`Downloading MinIO ${RELEASE} …`);
  const body = Buffer.from(await (await fetchOk(url)).arrayBuffer());
  const expected = (await (await fetchOk(`${url}.sha256sum`)).text()).trim().split(/\s+/)[0];
  const actual = createHash('sha256').update(body).digest('hex');
  if (expected !== actual) throw new Error('MinIO download checksum mismatch — not using it');
  writeFileSync(bin, body);
  if (!isWindows) chmodSync(bin, 0o755);
}

const docEnv = readEnv(resolve(backendRoot, 'apps/document-service/.env'));
mkdirSync(resolve(backendRoot, '.local/bin'), { recursive: true });
mkdirSync(dataDir, { recursive: true });
if (!existsSync(bin)) await download();

const port = docEnv.MINIO_PORT || '9000';
console.log(`MinIO on http://localhost:${port} (console http://localhost:9001)`);
const child = spawn(bin, ['server', dataDir, '--address', `:${port}`, '--console-address', ':9001'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    MINIO_ROOT_USER: docEnv.MINIO_ACCESS_KEY || 'dealplus_admin',
    MINIO_ROOT_PASSWORD: docEnv.MINIO_SECRET_KEY || 'LocalMinio@2026',
  },
});
child.on('exit', (code) => process.exit(code ?? 0));
