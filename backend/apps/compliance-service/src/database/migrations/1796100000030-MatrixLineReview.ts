import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Compliance matrix rows as used by the portal: per-row SME review status, row criticality (M/S) and owning team,
 * and custom rows that are not from the requirement library (requirement_id NULL). Additive / relaxing only.
 */
export class MatrixLineReview1796100000030 implements MigrationInterface {
  name = 'MatrixLineReview1796100000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `compliance_assessment_lines` ADD `review_status` varchar(16) NOT NULL DEFAULT 'Pending', ADD `criticality` varchar(32) NULL, ADD `category` varchar(64) NULL, MODIFY `requirement_id` varchar(36) NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `compliance_assessment_lines` DROP COLUMN `review_status`, DROP COLUMN `criticality`, DROP COLUMN `category`',
    );
  }
}
