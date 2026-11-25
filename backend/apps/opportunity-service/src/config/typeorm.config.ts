import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { buildTypeOrmModuleOptions } from './database.config';

const runtimeDir = join(__dirname, '..');

export const opportunityTypeOrmRoot = TypeOrmModule.forRoot(
  buildTypeOrmModuleOptions(runtimeDir),
);