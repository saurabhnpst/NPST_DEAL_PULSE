import { MigrationInterface, QueryRunner } from 'typeorm';

/** PRD-aligned request tracking: explicit pending status, approver selection and reassignment history. */
export class ApprovalRequestTracking1796000000001 implements MigrationInterface {
  name = 'ApprovalRequestTracking1796000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`approval_requests\` MODIFY \`status\` enum ('PENDING', 'PENDING_PNL_HEAD', 'PENDING_SALES_MANAGER', 'APPROVED', 'REJECTED') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`approval_requests\` MODIFY \`current_authority_role\` enum ('ASSIGNED', 'PNL_HEAD', 'SALES_MANAGER') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`approval_history_events\` MODIFY \`type\` enum ('SUBMITTED', 'APPROVER_SELECTED', 'AUTHORITY_TRANSFERRED', 'REASSIGNED', 'APPROVED', 'REJECTED', 'DECISION_BLOCKED') NOT NULL`,
    );
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = DATABASE() AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'active_lead_key', 'approval_requests'],
    );
    await queryRunner.query(`ALTER TABLE \`approval_requests\` DROP COLUMN \`active_lead_key\``);
    await queryRunner.query(
      `ALTER TABLE \`approval_requests\` ADD \`active_lead_key\` varchar(64) AS (case when status in ('PENDING','PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end) STORED NULL`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, DATABASE(), ?, ?, ?, ?)`,
      [
        'approval_requests',
        'GENERATED_COLUMN',
        'active_lead_key',
        "case when status in ('PENDING','PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end",
      ],
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`uq_approval_active_lead\` ON \`approval_requests\` (\`active_lead_key\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`uq_approval_active_lead\` ON \`approval_requests\``);
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = DATABASE() AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'active_lead_key', 'approval_requests'],
    );
    await queryRunner.query(`ALTER TABLE \`approval_requests\` DROP COLUMN \`active_lead_key\``);
    await queryRunner.query(
      `ALTER TABLE \`approval_requests\` ADD \`active_lead_key\` varchar(64) AS (case when status in ('PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end) STORED NULL`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, DATABASE(), ?, ?, ?, ?)`,
      [
        'approval_requests',
        'GENERATED_COLUMN',
        'active_lead_key',
        "case when status in ('PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end",
      ],
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`uq_approval_active_lead\` ON \`approval_requests\` (\`active_lead_key\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`approval_history_events\` MODIFY \`type\` enum ('SUBMITTED', 'AUTHORITY_TRANSFERRED', 'APPROVED', 'REJECTED', 'DECISION_BLOCKED') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`approval_requests\` MODIFY \`current_authority_role\` enum ('PNL_HEAD', 'SALES_MANAGER') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`approval_requests\` MODIFY \`status\` enum ('PENDING_PNL_HEAD', 'PENDING_SALES_MANAGER', 'APPROVED', 'REJECTED') NOT NULL`,
    );
  }
}