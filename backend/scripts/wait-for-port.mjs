#!/usr/bin/env node
import net from 'node:net';

const host = process.argv[2] ?? '127.0.0.1';
const port = Number(process.argv[3]);
const label = process.argv[4] ?? `${host}:${port}`;
const timeoutMs = Number(process.argv[5] ?? 180000);
const start = Date.now();

if (!port) {
  console.error('Usage: node wait-for-port.mjs <host> <port> [label] [timeoutMs]');
  process.exit(2);
}

function tryConnect() {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', reject);
    socket.setTimeout(3000, () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
  });
}

(async () => {
  while (Date.now() - start < timeoutMs) {
    try {
      await tryConnect();
      console.log(`ready: ${label}`);
      process.exit(0);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error(`timeout waiting for ${label}`);
  process.exit(1);
})();