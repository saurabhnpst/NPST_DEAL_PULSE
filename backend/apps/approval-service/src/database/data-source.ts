import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

// buildDataSourceOptions expects the `src` folder (it appends /database/migrations); forward slashes keep the glob working on Windows.
export const approvalDataSource = new DataSource(
  buildDataSourceOptions(resolve(__dirname, '..').split('\\').join('/')),
);
