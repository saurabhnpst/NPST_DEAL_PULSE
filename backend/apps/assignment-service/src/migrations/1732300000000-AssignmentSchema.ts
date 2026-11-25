import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Full assignment_db schema. Keep in sync with database/schema.sql
 * (checked by src/database/schema.spec.ts).
 */
export const ASSIGNMENT_SCHEMA_STATEMENTS: string[] = [
  `
    CREATE TABLE IF NOT EXISTS product_tech_leads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_tsp VARCHAR(128) NOT NULL COMMENT 'Product name, same values as the opportunity product picklist',
      vertical VARCHAR(16) NOT NULL DEFAULT 'TSP' COMMENT 'TSP or EVOK',
      tech_lead_user_id BIGINT UNSIGNED NULL COMMENT 'Default Tech Lead (Auth Service user id)',
      tech_lead_name VARCHAR(255) NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      updated_by_user_id BIGINT UNSIGNED NULL,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      UNIQUE KEY uq_product_tech_leads_product (product_tsp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS technical_assignments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      opportunity_id VARCHAR(32) NOT NULL,
      product_tsp VARCHAR(128) NOT NULL COMMENT 'One assignment per opportunity + product workstream',
      vertical VARCHAR(16) NULL,
      status VARCHAR(24) NOT NULL COMMENT 'PENDING_APPROVAL, APPROVED, RETURNED, CANCELLED',
      proposed_tech_lead_user_id BIGINT UNSIGNED NULL,
      proposed_tech_lead_name VARCHAR(255) NULL,
      tech_lead_user_id BIGINT UNSIGNED NULL COMMENT 'Final Tech Lead, set on approval',
      tech_lead_name VARCHAR(255) NULL,
      version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '+1 on every change of the proposal',
      proposed_by_user_id BIGINT UNSIGNED NULL,
      decided_by_user_id BIGINT UNSIGNED NULL COMMENT 'Solution Manager',
      decided_at DATETIME(6) NULL,
      decision_comment TEXT NULL,
      notified_at DATETIME(6) NULL,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      UNIQUE KEY uq_technical_assignments_opp_product (opportunity_id, product_tsp),
      KEY ix_technical_assignments_status (status),
      KEY ix_technical_assignments_tech_lead (tech_lead_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS rfp_requirements (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      opportunity_id VARCHAR(32) NOT NULL,
      requirement_ref VARCHAR(64) NULL COMMENT 'RFP clause / requirement number',
      title VARCHAR(255) NOT NULL,
      details TEXT NULL,
      product_tsp VARCHAR(128) NULL COMMENT 'NULL = not mapped to a product yet',
      status VARCHAR(16) NOT NULL COMMENT 'MAPPED, UNMAPPED, NEEDS_REVIEW',
      review_reason VARCHAR(255) NULL COMMENT 'Why it is in the review queue',
      technical_assignment_id BIGINT UNSIGNED NULL,
      source VARCHAR(16) NOT NULL DEFAULT 'API' COMMENT 'API or RFP',
      created_by_user_id BIGINT UNSIGNED NULL,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      KEY ix_rfp_requirements_opp (opportunity_id),
      KEY ix_rfp_requirements_status (status),
      CONSTRAINT fk_rfp_requirements_assignment
        FOREIGN KEY (technical_assignment_id) REFERENCES technical_assignments (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS presales_handoffs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      opportunity_id VARCHAR(32) NULL COMMENT 'Set once the opportunity exists',
      lead_id VARCHAR(32) NULL,
      synopsis_id VARCHAR(32) NULL,
      title VARCHAR(255) NOT NULL,
      requested_support TEXT NULL,
      status VARCHAR(16) NOT NULL COMMENT 'REQUESTED, ACCEPTED, RETURNED, COMPLETED, CANCELLED',
      requested_by_user_id BIGINT UNSIGNED NULL COMMENT 'Sales owner',
      requested_by_name VARCHAR(255) NULL,
      assignee_user_id BIGINT UNSIGNED NULL COMMENT 'Pre-Sales / Solutions owner',
      assignee_name VARCHAR(255) NULL,
      due_date DATE NULL,
      pending_inputs JSON NULL COMMENT 'List of inputs still missing',
      return_note TEXT NULL,
      accepted_at DATETIME(6) NULL,
      completed_at DATETIME(6) NULL,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      KEY ix_presales_handoffs_opp (opportunity_id),
      KEY ix_presales_handoffs_assignee (assignee_user_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS assignment_history (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      subject_type VARCHAR(32) NOT NULL COMMENT 'TECHNICAL_ASSIGNMENT, HANDOFF, REQUIREMENT, PRODUCT_TECH_LEAD',
      subject_id BIGINT UNSIGNED NOT NULL,
      opportunity_id VARCHAR(32) NULL,
      action VARCHAR(32) NOT NULL COMMENT 'e.g. PROPOSED, CHANGED, APPROVED, RETURNED, ACCEPTED',
      from_status VARCHAR(24) NULL,
      to_status VARCHAR(24) NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      comment TEXT NULL,
      snapshot JSON NULL COMMENT 'The record after the change (keeps proposed and final versions)',
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      KEY ix_assignment_history_subject (subject_type, subject_id),
      KEY ix_assignment_history_opp (opportunity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS assignment_domain_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      event_type VARCHAR(64) NOT NULL,
      subject_type VARCHAR(32) NOT NULL,
      subject_id BIGINT UNSIGNED NOT NULL,
      opportunity_id VARCHAR(32) NULL,
      payload JSON NOT NULL COMMENT 'Full event envelope',
      occurred_at DATETIME(6) NOT NULL,
      published_at DATETIME(6) NULL COMMENT 'NULL = not yet sent to RabbitMQ',
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      KEY ix_assignment_events_unpublished (published_at, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
];

/** Child tables first, so foreign keys never block a drop. */
export const ASSIGNMENT_TABLES_DROP_ORDER = [
  'assignment_domain_events',
  'assignment_history',
  'presales_handoffs',
  'rfp_requirements',
  'technical_assignments',
  'product_tech_leads',
];

export class AssignmentSchema1732300000000 implements MigrationInterface {
  name = 'AssignmentSchema1732300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const statement of ASSIGNMENT_SCHEMA_STATEMENTS) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ASSIGNMENT_TABLES_DROP_ORDER) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table}`);
    }
  }
}
