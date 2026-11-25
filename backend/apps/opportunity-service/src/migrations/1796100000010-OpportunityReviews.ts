import { MigrationInterface, QueryRunner } from 'typeorm';

/** Proposal document reviews (Legal / Finance / …) on the opportunity — same JSON style as stage_tasks. Additive only. */
export class OpportunityReviews1796100000010 implements MigrationInterface {
  name = 'OpportunityReviews1796100000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `opportunities` ADD `reviews` json NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `opportunities` DROP COLUMN `reviews`');
  }
}
