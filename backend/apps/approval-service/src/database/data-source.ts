import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { loadDatabaseConfig } from './database-config';

loadEnv({ path: resolve(__dirname, '../../.env') });

export const approvalDataSource = new DataSource(loadDatabaseConfig());
