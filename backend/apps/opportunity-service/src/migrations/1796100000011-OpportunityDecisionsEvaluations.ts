import { MigrationInterface, QueryRunner } from 'typeorm';

/** New tables: P&L decisions and Pre-PO evaluations. Additive only. */
export class OpportunityDecisionsEvaluations1796100000011 implements MigrationInterface {
  name = 'OpportunityDecisionsEvaluations1796100000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`opportunity_decisions\` (
      \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
      \`opportunity_id\` bigint unsigned NOT NULL,
      \`recommendation\` varchar(8) NOT NULL,
      \`synopsis\` text NOT NULL,
      \`concern\` text NULL,
      \`proposal_ref\` varchar(255) NULL,
      \`deal_value\` decimal(18,2) NOT NULL DEFAULT 0,
      \`initial_value\` decimal(18,2) NOT NULL DEFAULT 0,
      \`recommended_by_user_id\` bigint unsigned NULL,
      \`recommended_at\` datetime(6) NOT NULL,
      \`decision\` varchar(16) NULL,
      \`decision_note\` text NULL,
      \`decided_by_user_id\` bigint unsigned NULL,
      \`decided_at\` datetime(6) NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      INDEX \`idx_decision_opportunity\` (\`opportunity_id\`),
      PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`opportunity_evaluations\` (
      \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
      \`opportunity_id\` bigint unsigned NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`eval_type\` varchar(32) NOT NULL,
      \`approval\` varchar(32) NOT NULL DEFAULT 'Pending',
      \`status\` varchar(64) NOT NULL DEFAULT 'Not Started',
      \`details\` json NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      INDEX \`idx_evaluation_opportunity\` (\`opportunity_id\`),
      PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `opportunity_evaluations`');
    await queryRunner.query('DROP TABLE `opportunity_decisions`');
  }
}
