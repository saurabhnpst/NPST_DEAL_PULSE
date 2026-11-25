/**
 * Read-only audit: document_db metadata counts. No writes.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import mysql from 'mysql2/promise';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: resolve(process.cwd(), '.env.documents.local') });
loadDotenv({ path: resolve(process.cwd(), '.env') });

const host = process.env.DB_HOST;
const port = Number(process.env.DB_PORT || 3306);
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const sslCa = process.env.DB_SSL_CA
  ? readFileSync(resolve(process.cwd(), process.env.DB_SSL_CA))
  : undefined;

if (!host || !user || !password) {
  console.error('Missing DB_HOST/DB_USER/DB_PASSWORD');
  process.exit(1);
}

const DB_NAMES = ['document_db'];

async function auditDatabase(conn, dbName) {
  const report = { database: dbName, exists: false, tables: {}, migrations: null, error: null };
  const [dbRows] = await conn.query(
    'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    [dbName],
  );
  if (!dbRows.length) {
    return report;
  }
  report.exists = true;
  await conn.query(`USE \`${dbName}\``);

  const [tables] = await conn.query(
    `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH, CREATE_TIME, UPDATE_TIME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
    [dbName],
  );

  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    let exactCount = null;
    try {
      const [countRows] = await conn.query(
        `SELECT COUNT(*) AS c FROM \`${tableName}\``,
      );
      exactCount = countRows[0]?.c ?? null;
    } catch (e) {
      exactCount = `error: ${e.message}`;
    }

    const [createRows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSql = createRows[0]?.['Create Table'] ?? '';

    const [indexes] = await conn.query(`SHOW INDEX FROM \`${tableName}\``);
    const [fks] = await conn.query(
      `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [dbName, tableName],
    );

    report.tables[tableName] = {
      approximateRows: t.TABLE_ROWS,
      exactCount,
      dataBytes: Number(t.DATA_LENGTH || 0) + Number(t.INDEX_LENGTH || 0),
      createTime: t.CREATE_TIME,
      updateTime: t.UPDATE_TIME,
      indexes: indexes.length,
      foreignKeys: fks,
      createSql,
    };
  }

  if (report.tables.migrations) {
    try {
      const [migs] = await conn.query(
        'SELECT id, timestamp, name FROM migrations ORDER BY id',
      );
      report.migrations = migs;
    } catch (e) {
      report.migrations = { error: e.message };
    }
  }

  return report;
}

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  ssl: sslCa ? { ca: sslCa, rejectUnauthorized: true } : undefined,
});

const results = [];
for (const name of DB_NAMES) {
  try {
    results.push(await auditDatabase(conn, name));
  } catch (e) {
    results.push({ database: name, exists: false, error: e.message, tables: {} });
  }
}

await conn.end();

const summary = {
  host,
  port,
  connectedAs: user,
  auditedAt: new Date().toISOString(),
  databases: results,
};

console.log(JSON.stringify(summary, null, 2));