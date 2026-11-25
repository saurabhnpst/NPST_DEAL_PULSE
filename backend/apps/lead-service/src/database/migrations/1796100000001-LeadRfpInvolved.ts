import { MigrationInterface, QueryRunner } from 'typeorm';

/** "RFP / Tender involved" flag on leads (RFP leads convert when Pre-Sales accepts the synopsis). Additive only. */
export class LeadRfpInvolved1796100000001 implements MigrationInterface {
  name = 'LeadRfpInvolved1796100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `leads` ADD `rfp_involved` tinyint NOT NULL DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `leads` DROP COLUMN `rfp_involved`');
  }
}
