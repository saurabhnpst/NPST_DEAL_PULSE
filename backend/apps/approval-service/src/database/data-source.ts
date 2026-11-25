import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

export const approvalDataSource = new DataSource(buildDataSourceOptions(__dirname));
