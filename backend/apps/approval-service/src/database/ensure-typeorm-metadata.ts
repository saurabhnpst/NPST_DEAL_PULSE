import { config as loadEnv } from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { resolve } from 'path';
import { loadDatabaseConfig } from './database-config';

loadEnv({ path: resolve(__dirname, '../../.env') });

async function ensureTypeormMetadata(): Promise<void> {
  const config = loadDatabaseConfig();
  const connection = await createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
  });
  try {
    await connection.query(
      'CREATE TABLE IF NOT EXISTS `typeorm_metadata` (' +
        '`id` bigint unsigned NOT NULL AUTO_INCREMENT, ' +
        '`type` varchar(255) NOT NULL, ' +
        '`database` varchar(255) NULL, ' +
        '`schema` varchar(255) NULL, ' +
        '`table` varchar(255) NULL, ' +
        '`name` varchar(255) NULL, ' +
        '`value` text NULL, ' +
        'PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
  } finally {
    await connection.end();
  }
}

ensureTypeormMetadata().catch((error: unknown): void => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
