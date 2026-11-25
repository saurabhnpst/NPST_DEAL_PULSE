import { MigrationInterface, QueryRunner } from 'typeorm';

/** RFP synopsis workflow (Sales writes, Pre-Sales accepts/returns). Additive columns only. */
export class RfpSynopsis1796100000020 implements MigrationInterface {
  name = 'RfpSynopsis1796100000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `rfps` ADD `synopsis_status` varchar(16) NULL, ADD `deal_size` decimal(18,2) NULL, ADD `context` text NULL, ADD `risks` text NULL, ADD `return_note` text NULL, ADD `presales_owner_id` varchar(100) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `rfps` DROP COLUMN `synopsis_status`, DROP COLUMN `deal_size`, DROP COLUMN `context`, DROP COLUMN `risks`, DROP COLUMN `return_note`, DROP COLUMN `presales_owner_id`',
    );
  }
}
