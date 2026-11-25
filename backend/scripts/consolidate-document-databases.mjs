#!/usr/bin/env node
/**
 * Consolidate dealplus_documents → document_db, backup, validate, optional drop.
 * Set CONSOLIDATION_ACK_MISSING_BLOBS=1 only when source keys were verified elsewhere
 * or blobs are known absent and metadata merge is still required.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import mysql from 'mysql2/promise';
import { config as loadDotenv } from 'dotenv';
import {
  S3Client,
  HeadObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';

const SOURCE = 'dealplus_documents';
const TARGET = 'document_db';
const ACK_MISSING = process.env.CONSOLIDATION_ACK_MISSING_BLOBS === '1';

loadDotenv({ path: resolve(process.cwd(), '.env.documents.local') });
loadDotenv({ path: resolve(process.cwd(), '.env') });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = resolve(process.cwd(), 'backups', `document-db-consolidation-${stamp}`);
mkdirSync(backupRoot, { recursive: true });

const sslCa = process.env.DB_SSL_CA
  ? readFileSync(resolve(process.cwd(), process.env.DB_SSL_CA))
  : undefined;

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  ssl: sslCa ? { ca: sslCa, rejectUnauthorized: true } : undefined,
});

const report = {
  backupRoot,
  timestamp: new Date().toISOString(),
  host: process.env.DB_HOST,
  steps: [],
  minio: { endpoint: null, bucket: null, ok: [], missing: [] },
  migration: {},
  validation: {},
  dropSource: false,
  ackMissingBlobs: ACK_MISSING,
};

function snapshotMinio() {
  return { ok: [...report.minio.ok], missing: [...report.minio.missing] };
}

async function backupDatabase(dbName) {
  const out = { database: dbName, backedUpAt: new Date().toISOString(), tables: {} };
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [dbName],
  );
  for (const { TABLE_NAME } of tables) {
    const [create] = await conn.query(`SHOW CREATE TABLE \`${dbName}\`.\`${TABLE_NAME}\``);
    const [rows] = await conn.query(`SELECT * FROM \`${dbName}\`.\`${TABLE_NAME}\``);
    out.tables[TABLE_NAME] = {
      createSql: create[0]['Create Table'],
      rowCount: rows.length,
      rows,
    };
  }
  const file = resolve(backupRoot, `${dbName}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2));
  const verify = JSON.parse(readFileSync(file, 'utf8'));
  const ok =
    Object.keys(verify.tables).length === Object.keys(out.tables).length &&
    Object.entries(out.tables).every(
      ([k, v]) => verify.tables[k].rowCount === v.rowCount,
    );
  report.steps.push({
    step: `backup:${dbName}`,
    ok,
    file,
    tables: Object.fromEntries(
      Object.entries(out.tables).map(([k, v]) => [k, v.rowCount]),
    ),
  });
  if (!ok) throw new Error(`Backup verification failed for ${dbName}`);
}

async function verifyMinioKeys(keys) {
  report.minio.endpoint = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`;
  report.minio.bucket = process.env.MINIO_BUCKET || 'dealplus-documents';
  const s3 = new S3Client({
    endpoint: report.minio.endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'test',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'test',
    },
    forcePathStyle: true,
  });
  try {
    const buckets = await s3.send(new ListBucketsCommand({}));
    report.minio.buckets = (buckets.Buckets || []).map((b) => b.Name);
  } catch (e) {
    report.minio.listBucketsError = e.message;
  }
  for (const key of keys) {
    if (report.minio.ok.includes(key) || report.minio.missing.includes(key)) {
      continue;
    }
    try {
      await s3.send(new HeadObjectCommand({ Bucket: report.minio.bucket, Key: key }));
      report.minio.ok.push(key);
    } catch {
      report.minio.missing.push(key);
    }
  }
}

async function fetchSourceStorageKeys() {
  const [rows] = await conn.query(
    `SELECT DISTINCT storageKey FROM \`${SOURCE}\`.documents
     UNION
     SELECT DISTINCT storageKey FROM \`${SOURCE}\`.document_versions`,
  );
  return rows.map((r) => r.storageKey);
}

async function migrateTable(table) {
  const [sourceRows] = await conn.query(`SELECT * FROM \`${SOURCE}\`.\`${table}\``);
  let inserted = 0;
  let skipped = 0;
  for (const row of sourceRows) {
    const [byId] = await conn.query(
      `SELECT id FROM \`${TARGET}\`.\`${table}\` WHERE id = ? LIMIT 1`,
      [row.id],
    );
    if (byId.length) {
      skipped++;
      continue;
    }
    if (row.storageKey) {
      const [byKey] = await conn.query(
        `SELECT id FROM \`${TARGET}\`.\`${table}\` WHERE storageKey = ? LIMIT 1`,
        [row.storageKey],
      );
      if (byKey.length) {
        skipped++;
        continue;
      }
    }
    const cols = Object.keys(row);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((c) => row[c]);
    await conn.query(
      `INSERT INTO \`${TARGET}\`.\`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')})
       VALUES (${placeholders})`,
      values,
    );
    inserted++;
  }
  return { inserted, skipped, sourceCount: sourceRows.length };
}

async function countTable(db, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM \`${db}\`.\`${table}\``,
  );
  return Number(rows[0].c);
}

async function validateFk() {
  const [orphanVersions] = await conn.query(
    `SELECT dv.id FROM \`${TARGET}\`.document_versions dv
     LEFT JOIN \`${TARGET}\`.documents d ON d.id = dv.documentId
     WHERE d.id IS NULL`,
  );
  const [orphanAttachments] = await conn.query(
    `SELECT da.id FROM \`${TARGET}\`.document_attachments da
     LEFT JOIN \`${TARGET}\`.documents d ON d.id = da.documentId
     WHERE d.id IS NULL`,
  );
  return {
    orphanVersions: orphanVersions.length,
    orphanAttachments: orphanAttachments.length,
  };
}

try {
  await backupDatabase(TARGET);
  await backupDatabase(SOURCE);

  const sourceKeys = await fetchSourceStorageKeys();
  report.minio.ok = [];
  report.minio.missing = [];
  await verifyMinioKeys(sourceKeys);
  const minioSourceOk = report.minio.missing.length === 0;
  report.steps.push({
    step: 'minio:source',
    ok: minioSourceOk,
    keys: sourceKeys,
    missing: [...report.minio.missing],
  });
  if (!minioSourceOk && !ACK_MISSING) {
    throw new Error(
      `Source MinIO missing ${report.minio.missing.length} object(s). Set CONSOLIDATION_ACK_MISSING_BLOBS=1 to continue metadata merge.`,
    );
  }

  report.migration.documents = await migrateTable('documents');
  report.migration.document_versions = await migrateTable('document_versions');
  report.migration.document_attachments = await migrateTable('document_attachments');

  const counts = {
    documents: await countTable(TARGET, 'documents'),
    document_versions: await countTable(TARGET, 'document_versions'),
    document_attachments: await countTable(TARGET, 'document_attachments'),
    migrations: await countTable(TARGET, 'migrations'),
  };
  const expected = {
    documents: 9,
    document_versions: 9,
    document_attachments: 3,
    migrations: 2,
  };
  const countOk = Object.entries(expected).every(([k, v]) => counts[k] === v);
  const fk = await validateFk();
  const fkOk = fk.orphanVersions === 0 && fk.orphanAttachments === 0;

  const [allKeys] = await conn.query(
    `SELECT DISTINCT storageKey FROM \`${TARGET}\`.document_versions`,
  );
  const beforeAll = snapshotMinio();
  await verifyMinioKeys(allKeys.map((r) => r.storageKey));
  const allMinioOk = report.minio.missing.length === 0;

  report.validation = {
    counts,
    expected,
    countOk,
    fk,
    fkOk,
    allMinioOk,
    minioEndpoint: report.minio.endpoint,
    minioMissing: [...report.minio.missing],
    minioOkCount: report.minio.ok.length,
    sourceMinioSnapshot: beforeAll,
  };

  if (!countOk || !fkOk) {
    throw new Error(`Count/FK validation failed: ${JSON.stringify({ counts, fk })}`);
  }

  if (!allMinioOk && !ACK_MISSING) {
    throw new Error(
      `All-objects MinIO check failed (${report.minio.missing.length} missing). DB not dropped.`,
    );
  }

  await conn.query(`DROP DATABASE \`${SOURCE}\``);
  report.dropSource = true;

  const [schemas] = await conn.query(
    `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN (?, ?)`,
    [SOURCE, TARGET],
  );
  report.finalSchemas = schemas.map((r) => r.SCHEMA_NAME);
  report.steps.push({ step: 'drop:dealplus_documents', ok: true });
} catch (err) {
  report.error = err.message;
  try {
    const [schemas] = await conn.query(
      `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN (?, ?)`,
      [SOURCE, TARGET],
    );
    report.finalSchemas = schemas.map((r) => r.SCHEMA_NAME);
  } catch {
    /* ignore */
  }
} finally {
  await conn.end();
  const reportPath = resolve(backupRoot, 'consolidation-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
  if (report.error) process.exit(1);
}