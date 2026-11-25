#!/usr/bin/env node
/**
 * Create a MySQL database if missing (managed providers often require manual creation).
 * Usage: set -a && source .env.documents.local && set +a && node scripts/ensure-database.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME;
if (!dbName) {
  console.error('DB_NAME is required');
  process.exit(2);
}

const sslCa = process.env.DB_SSL_CA
  ? readFileSync(resolve(process.cwd(), process.env.DB_SSL_CA))
  : undefined;

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: sslCa ? { ca: sslCa, rejectUnauthorized: true } : undefined,
});

try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`Database ready: ${dbName}`);
} finally {
  await connection.end();
}