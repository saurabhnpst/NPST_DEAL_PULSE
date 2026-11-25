#!/usr/bin/env node
/**
 * Report listeners on DealPulse ports (does not kill processes).
 * Usage: node scripts/port-audit.mjs
 */
import { execSync } from 'child_process';

const PORTS = [
  { port: 3010, name: 'api-gateway (recommended)' },
  { port: 3000, name: 'api-gateway (default .env.example)' },
  { port: 3002, name: 'lead-service' },
  { port: 3003, name: 'opportunity-service' },
  { port: 3004, name: 'rfp-service' },
  { port: 3005, name: 'document-service' },
  { port: 3006, name: 'approval-service' },
  { port: 3007, name: 'assignment-service' },
  { port: 3008, name: 'compliance-service' },
  { port: 5173, name: 'frontend (vite)' },
  { port: 9000, name: 'localstack S3' },
  { port: 3310, name: 'clamav' },
  { port: 6379, name: 'redis' },
];

function owner(port) {
  try {
    const out = execSync(`ss -tlnp 2>/dev/null | grep ':${port} ' || true`, { encoding: 'utf8' });
    return out.trim() || null;
  } catch {
    return null;
  }
}

console.log('DealPulse port audit\n');
let conflicts = 0;
for (const { port, name } of PORTS) {
  const line = owner(port);
  if (line) {
    conflicts += 1;
    console.log(`IN USE  :${port}  ${name}`);
    console.log(`          ${line}\n`);
  } else {
    console.log(`FREE    :${port}  ${name}`);
  }
}
if (conflicts) {
  console.log('\nIf :3010 is free, set PORT=3010 in apps/api-gateway/.env and VITE_API_BASE_URL=http://localhost:3010/api/v1');
  process.exit(1);
}
process.exit(0);