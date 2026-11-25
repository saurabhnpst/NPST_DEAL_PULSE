import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

/**
 * TypeORM CLI data source (migrations).
 * From backend/: npm run asg:migrate
 */
export default new DataSource(buildDataSourceOptions(join(__dirname, '..')));
