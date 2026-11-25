import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import {
  findBackendRoot,
  resolveSslCaPath,
  validateDatabaseEnv,
} from '../../../../libs/service-config/src';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { ComplianceEvidenceReference } from '../entities/compliance-evidence-reference.entity';
import { ComplianceAssessmentReview } from '../entities/compliance-assessment-review.entity';
import { ComplianceAssessmentSignoff } from '../entities/compliance-assessment-signoff.entity';
import { ComplianceAssessment } from '../entities/compliance-assessment.entity';
import { ComplianceConfigurationFramework } from '../entities/compliance-configuration-framework.entity';
import { ComplianceConfigurationRequirement } from '../entities/compliance-configuration-requirement.entity';
import { ComplianceConfiguration } from '../entities/compliance-configuration.entity';
import { ComplianceFramework } from '../entities/compliance-framework.entity';
import { ComplianceRequirement } from '../entities/compliance-requirement.entity';
import { resolveComplianceEnvFile } from '../config/env-file';

loadEnv({ path: resolveComplianceEnvFile() });

validateDatabaseEnv(process.env, {
  expectedDbName: 'compliance_db',
  serviceLabel: 'Compliance Service (migrations CLI)',
});

const backendRoot = findBackendRoot(__dirname);
const sslCaPath = resolveSslCaPath(backendRoot, process.env.DB_SSL_CA!);

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 16659),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    ComplianceFramework,
    ComplianceRequirement,
    ComplianceConfiguration,
    ComplianceConfigurationFramework,
    ComplianceConfigurationRequirement,
    ComplianceAssessment,
    ComplianceAssessmentReview,
    ComplianceAssessmentSignoff,
    ComplianceAssessmentLine,
    ComplianceEvidenceReference,
  ],
  migrations: [
    resolve(
      __dirname,
      __filename.endsWith('.js') ? 'migrations/*.js' : 'migrations/*.ts',
    ),
  ],
  synchronize: false,
  ssl: {
    ca: readFileSync(sslCaPath),
    rejectUnauthorized: true,
  },
  migrationsTableName: 'compliance_migrations',
});