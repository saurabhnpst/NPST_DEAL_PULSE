import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialRfpSchema1763634600000 implements MigrationInterface {
  name = 'InitialRfpSchema1763634600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`rfps\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`reference_number\` varchar(255) NULL,
        \`status\` varchar(50) NOT NULL DEFAULT 'Draft',
        \`lead_id\` char(36) NULL,
        \`opportunity_id\` char(36) NULL,
        \`document_id\` char(36) NULL,
        \`issuer_name\` varchar(255) NULL,
        \`portal\` varchar(100) NULL,
        \`products\` varchar(500) NULL,
        \`pre_bid_meeting_at\` datetime NULL,
        \`submission_deadline\` datetime NULL,
        \`bid_opening_at\` datetime NULL,
        \`emd_required\` tinyint NOT NULL DEFAULT 0,
        \`emd_details\` varchar(500) NULL,
        \`pbg_required\` tinyint NOT NULL DEFAULT 0,
        \`pbg_details\` varchar(255) NULL,
        \`eligibility_notes\` text NULL,
        \`scope_notes\` text NULL,
        \`owner_id\` varchar(100) NULL,
        \`created_by_id\` varchar(100) NULL,
        \`last_modified_by_id\` varchar(100) NULL,
        \`notes\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_rfps_lead_id\` (\`lead_id\`),
        INDEX \`IDX_rfps_opportunity_id\` (\`opportunity_id\`),
        INDEX \`IDX_rfps_status_created_at\` (\`status\`, \`created_at\`),
        INDEX \`IDX_rfps_submission_deadline\` (\`submission_deadline\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`rfps\``);
  }
}