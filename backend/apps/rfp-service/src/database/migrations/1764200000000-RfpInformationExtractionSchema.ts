import { MigrationInterface, QueryRunner } from 'typeorm';

export class RfpInformationExtractionSchema1764200000000
  implements MigrationInterface
{
  name = 'RfpInformationExtractionSchema1764200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`rfp_document_versions\` (
        \`id\` varchar(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`document_id\` char(36) NOT NULL,
        \`version_number\` int NOT NULL,
        \`version_type\` varchar(16) NOT NULL,
        \`label\` varchar(255) NULL,
        \`received_at\` datetime(6) NULL,
        \`metadata_json\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_rfp_doc_version_num\` (\`rfp_id\`, \`version_number\`),
        INDEX \`IDX_rfp_doc_versions_rfp\` (\`rfp_id\`),
        INDEX \`IDX_rfp_doc_versions_document\` (\`document_id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_information_extraction_jobs\` (
        \`id\` varchar(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`version_id\` char(36) NOT NULL,
        \`document_id\` char(36) NOT NULL,
        \`pdf_processing_job_id\` char(36) NULL,
        \`status\` varchar(32) NOT NULL,
        \`error_code\` varchar(64) NULL,
        \`error_message\` varchar(500) NULL,
        \`started_at\` datetime(6) NULL,
        \`completed_at\` datetime(6) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_rfp_info_ext_rfp\` (\`rfp_id\`),
        INDEX \`IDX_rfp_info_ext_version\` (\`version_id\`),
        INDEX \`IDX_rfp_info_ext_status\` (\`status\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_field_mapping_config\` (
        \`id\` varchar(36) NOT NULL,
        \`field_key\` varchar(64) NOT NULL,
        \`display_name\` varchar(128) NOT NULL,
        \`category\` varchar(32) NOT NULL,
        \`data_type\` varchar(16) NOT NULL,
        \`portal_target\` varchar(128) NULL,
        \`patterns\` json NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_rfp_field_map_key\` (\`field_key\`),
        INDEX \`IDX_rfp_field_map_active\` (\`active\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_extracted_fields\` (
        \`id\` varchar(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`version_id\` char(36) NOT NULL,
        \`document_id\` char(36) NOT NULL,
        \`extraction_job_id\` char(36) NOT NULL,
        \`field_key\` varchar(64) NOT NULL,
        \`display_name\` varchar(128) NOT NULL,
        \`category\` varchar(32) NOT NULL,
        \`data_type\` varchar(16) NOT NULL,
        \`extracted_value\` text NULL,
        \`corrected_value\` text NULL,
        \`confirmed_value\` text NULL,
        \`review_status\` varchar(24) NOT NULL DEFAULT 'draft',
        \`portal_target\` varchar(128) NULL,
        \`mapping_ambiguous\` tinyint NOT NULL DEFAULT 0,
        \`page_number\` int NULL,
        \`source_excerpt\` text NULL,
        \`confidence\` decimal(5,4) NULL,
        \`metadata_json\` json NULL,
        \`confirmed_at\` datetime(6) NULL,
        \`confirmed_by_id\` varchar(100) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_rfp_ext_field_version_key\` (\`version_id\`, \`field_key\`),
        INDEX \`IDX_rfp_ext_field_rfp\` (\`rfp_id\`),
        INDEX \`IDX_rfp_ext_field_job\` (\`extraction_job_id\`),
        INDEX \`IDX_rfp_ext_field_review\` (\`review_status\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_field_review_audit\` (
        \`id\` varchar(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`version_id\` char(36) NOT NULL,
        \`extracted_field_id\` char(36) NOT NULL,
        \`action\` varchar(32) NOT NULL,
        \`reviewer_id\` varchar(100) NULL,
        \`previous_value\` text NULL,
        \`new_value\` text NULL,
        \`comments\` text NULL,
        \`metadata_json\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_rfp_review_audit_rfp\` (\`rfp_id\`),
        INDEX \`IDX_rfp_review_audit_field\` (\`extracted_field_id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_amendment_comparisons\` (
        \`id\` varchar(36) NOT NULL,
        \`rfp_id\` char(36) NOT NULL,
        \`from_version_id\` char(36) NOT NULL,
        \`to_version_id\` char(36) NOT NULL,
        \`status\` varchar(32) NOT NULL DEFAULT 'pending_review',
        \`metadata_json\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_rfp_amend_cmp_rfp\` (\`rfp_id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`rfp_amendment_diffs\` (
        \`id\` varchar(36) NOT NULL,
        \`comparison_id\` char(36) NOT NULL,
        \`field_key\` varchar(64) NOT NULL,
        \`change_category\` varchar(16) NOT NULL,
        \`previous_value\` text NULL,
        \`new_value\` text NULL,
        \`previous_source_excerpt\` text NULL,
        \`new_source_excerpt\` text NULL,
        \`review_status\` varchar(24) NOT NULL DEFAULT 'pending',
        \`reviewer_id\` varchar(100) NULL,
        \`comments\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_rfp_amend_diff_cmp\` (\`comparison_id\`),
        CONSTRAINT \`FK_rfp_amend_diff_comparison\`
          FOREIGN KEY (\`comparison_id\`) REFERENCES \`rfp_amendment_comparisons\`(\`id\`)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`rfp_field_mapping_config\`
        (\`id\`, \`field_key\`, \`display_name\`, \`category\`, \`data_type\`, \`portal_target\`, \`patterns\`, \`active\`)
      VALUES
        ('11111111-1111-4111-8111-111111111101', 'tender_reference_number', 'Tender / RFP Reference Number', 'client_tender', 'string', 'rfp.referenceNumber',
          JSON_ARRAY('(?:tender|rfp|bid)\\\\s*(?:no|number|id)[:\\\\s\\\\-]*([A-Z0-9\\\\-/]{4,80})'), 1),
        ('11111111-1111-4111-8111-111111111102', 'issuer_name', 'Issuer / Organisation Name', 'client_tender', 'string', 'rfp.issuerName',
          JSON_ARRAY('(?:issued by|organisation|organization|department|inviting authority)[:\\\\s\\\\-]*(.{3,120})'), 1),
        ('11111111-1111-4111-8111-111111111103', 'submission_deadline', 'Submission Deadline', 'submission', 'date', 'rfp.submissionDeadline',
          JSON_ARRAY('(?:last date|submission deadline|bid submission|due date)[:\\\\s\\\\-]*(.{6,80})'), 1),
        ('11111111-1111-4111-8111-111111111104', 'pre_bid_meeting', 'Pre-bid Meeting', 'submission', 'date', 'rfp.preBidMeetingAt',
          JSON_ARRAY('(?:pre[- ]bid meeting|pre bid conference)[:\\\\s\\\\-]*(.{6,80})'), 1),
        ('11111111-1111-4111-8111-111111111105', 'emd_details', 'EMD Details', 'commercial', 'text', 'rfp.emdDetails',
          JSON_ARRAY('(?:emd|earnest money deposit)[:\\\\s\\\\-]*(.{3,200})'), 1),
        ('11111111-1111-4111-8111-111111111106', 'pbg_details', 'PBG Details', 'commercial', 'text', 'rfp.pbgDetails',
          JSON_ARRAY('(?:pbg|performance bank guarantee)[:\\\\s\\\\-]*(.{3,200})'), 1),
        ('11111111-1111-4111-8111-111111111107', 'scope_notes', 'Scope of Work', 'scope', 'text', 'rfp.scopeNotes',
          JSON_ARRAY('(?:scope of work|scope of services)[:\\\\s\\\\-]*(.{20,500})'), 1),
        ('11111111-1111-4111-8111-111111111108', 'eligibility_notes', 'Eligibility Criteria', 'eligibility', 'text', 'rfp.eligibilityNotes',
          JSON_ARRAY('(?:eligibility criteria|qualification criteria)[:\\\\s\\\\-]*(.{20,500})'), 1),
        ('11111111-1111-4111-8111-111111111109', 'portal', 'Procurement Portal', 'client_tender', 'string', 'rfp.portal',
          JSON_ARRAY('(GeM|GEM|eProcurement|CPPP|NIC)', 'portal[:\\\\s\\\\-]*(.{3,60})'), 1)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_amendment_diffs\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_amendment_comparisons\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_field_review_audit\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_extracted_fields\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_field_mapping_config\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_information_extraction_jobs\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`rfp_document_versions\``);
  }
}