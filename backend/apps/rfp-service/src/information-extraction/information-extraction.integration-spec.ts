import dataSource from '../database/data-source';
import {
  RFP_EXTRACTION_JOB_STATUS,
  RFP_FIELD_REVIEW_STATUS,
} from '../common/constants/rfp-extraction.constants';
import { Rfp } from '../entities/rfp.entity';
import { RfpDocumentVersion } from '../entities/rfp-document-version.entity';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { RfpFieldReviewAudit } from '../entities/rfp-field-review-audit.entity';
import { RfpInformationExtractionJob } from '../entities/rfp-information-extraction-job.entity';

describe('Information extraction persistence (database integration)', () => {
  const createdIds: {
    rfpIds: string[];
    versionIds: string[];
    jobIds: string[];
    fieldIds: string[];
    auditIds: string[];
  } = {
    rfpIds: [],
    versionIds: [],
    jobIds: [],
    fieldIds: [],
    auditIds: [],
  };

  const documentId = '99999999-9999-4999-8999-999999999999';

  beforeAll(async () => {
    await dataSource.initialize();
    const db = await dataSource.query('SELECT DATABASE() AS db_name');
    if (db[0]?.db_name !== 'rfp_db') {
      throw new Error(
        `Integration tests require DB_NAME=rfp_db (got ${db[0]?.db_name})`,
      );
    }
    const table = await dataSource.query(
      "SHOW TABLES LIKE 'rfp_field_mapping_config'",
    );
    if (table.length === 0) {
      throw new Error(
        'Missing Phase 4 tables. Run npm run migration:run:rfp first.',
      );
    }
  });

  afterAll(async () => {
    const auditRepo = dataSource.getRepository(RfpFieldReviewAudit);
    const fieldRepo = dataSource.getRepository(RfpExtractedField);
    const jobRepo = dataSource.getRepository(RfpInformationExtractionJob);
    const versionRepo = dataSource.getRepository(RfpDocumentVersion);
    const rfpRepo = dataSource.getRepository(Rfp);

    if (createdIds.auditIds.length > 0) {
      await auditRepo.delete(createdIds.auditIds);
    }
    if (createdIds.fieldIds.length > 0) {
      await fieldRepo.delete(createdIds.fieldIds);
    }
    if (createdIds.jobIds.length > 0) {
      await jobRepo.delete(createdIds.jobIds);
    }
    if (createdIds.versionIds.length > 0) {
      await versionRepo.delete(createdIds.versionIds);
    }
    if (createdIds.rfpIds.length > 0) {
      await rfpRepo.delete(createdIds.rfpIds);
    }
    await dataSource.destroy();
  });

  it('stores versions, extraction jobs, fields, and audit rows', async () => {
    const rfpRepo = dataSource.getRepository(Rfp);
    const versionRepo = dataSource.getRepository(RfpDocumentVersion);
    const jobRepo = dataSource.getRepository(RfpInformationExtractionJob);
    const fieldRepo = dataSource.getRepository(RfpExtractedField);
    const auditRepo = dataSource.getRepository(RfpFieldReviewAudit);

    const rfp = await rfpRepo.save(
      rfpRepo.create({
        title: 'Extraction integration RFP',
        documentId,
        leadId: '66666666-6666-4666-8666-666666666666',
      }),
    );
    createdIds.rfpIds.push(rfp.id);

    const version = await versionRepo.save(
      versionRepo.create({
        rfpId: rfp.id,
        documentId,
        versionNumber: 1,
        versionType: 'initial',
        label: 'Initial RFP',
      }),
    );
    createdIds.versionIds.push(version.id);

    const job = await jobRepo.save(
      jobRepo.create({
        rfpId: rfp.id,
        versionId: version.id,
        documentId,
        status: RFP_EXTRACTION_JOB_STATUS.REVIEW_PENDING,
      }),
    );
    createdIds.jobIds.push(job.id);

    const field = await fieldRepo.save(
      fieldRepo.create({
        rfpId: rfp.id,
        versionId: version.id,
        documentId,
        extractionJobId: job.id,
        fieldKey: 'tender_reference_number',
        displayName: 'Tender / RFP Reference Number',
        category: 'client_tender',
        dataType: 'string',
        extractedValue: 'GEM/INT/001',
        reviewStatus: RFP_FIELD_REVIEW_STATUS.CONFIRMED,
        confirmedValue: 'GEM/INT/001',
        confirmedById: 'reviewer-int',
        portalTarget: 'rfp.referenceNumber',
      }),
    );
    createdIds.fieldIds.push(field.id);

    const audit = await auditRepo.save(
      auditRepo.create({
        rfpId: rfp.id,
        versionId: version.id,
        extractedFieldId: field.id,
        action: 'confirmed',
        reviewerId: 'reviewer-int',
        newValue: 'GEM/INT/001',
      }),
    );
    createdIds.auditIds.push(audit.id);

    const mappingCount = await dataSource.query(
      'SELECT COUNT(*) AS c FROM rfp_field_mapping_config WHERE active = 1',
    );
    expect(Number(mappingCount[0].c)).toBeGreaterThanOrEqual(1);

    const loaded = await fieldRepo.findOne({ where: { id: field.id } });
    expect(loaded?.confirmedValue).toBe('GEM/INT/001');
  });
});