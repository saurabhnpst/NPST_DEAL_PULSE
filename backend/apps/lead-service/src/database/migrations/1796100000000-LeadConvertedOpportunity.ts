import { MigrationInterface, QueryRunner } from 'typeorm';

/** Link a converted lead to the opportunity it created (OPP-YYYY-NNNNN). Additive only. */
export class LeadConvertedOpportunity1796100000000 implements MigrationInterface {
  name = 'LeadConvertedOpportunity1796100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `leads` ADD `converted_opportunity_id` varchar(32) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `leads` DROP COLUMN `converted_opportunity_id`');
  }
}
