import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

/**
 * TypeORM CLI data source for opportunity-service migrations.
 * Usage (from backend/): npx typeorm-ts-node-commonjs migration:run -d apps/opportunity-service/src/database/data-source.ts
 */
export default new DataSource(buildDataSourceOptions(join(__dirname, '..')));