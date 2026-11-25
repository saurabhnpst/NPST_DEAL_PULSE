import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { RfpAmendmentComparison } from '../entities/rfp-amendment-comparison.entity';
import { RfpAmendmentDiff } from '../entities/rfp-amendment-diff.entity';
import { RfpDocumentAssociation } from '../entities/rfp-document-association.entity';
import { RfpDocumentVersion } from '../entities/rfp-document-version.entity';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { RfpFieldMappingConfig } from '../entities/rfp-field-mapping-config.entity';
import { RfpFieldReviewAudit } from '../entities/rfp-field-review-audit.entity';
import { RfpInformationExtractionJob } from '../entities/rfp-information-extraction-job.entity';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';
import { Rfp } from '../entities/rfp.entity';

config({ path: resolve(process.cwd(), '.env') });

const sslCaPath = resolve(process.cwd(), process.env.DB_SSL_CA ?? './ca.pem');

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 16659),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Rfp,
    RfpDocumentAssociation,
    RfpPdfProcessingJob,
    RfpPdfPageText,
    RfpDocumentVersion,
    RfpInformationExtractionJob,
    RfpFieldMappingConfig,
    RfpExtractedField,
    RfpFieldReviewAudit,
    RfpAmendmentComparison,
    RfpAmendmentDiff,
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
  migrationsTableName: 'rfp_migrations',
});