import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialApprovalSchema1795501473085 implements MigrationInterface {
    name = 'InitialApprovalSchema1795501473085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`approval_requests\` (\`id\` varchar(64) NOT NULL, \`lead_id\` varchar(64) NOT NULL, \`creator_id\` varchar(64) NOT NULL, \`product_vertical\` varchar(64) NOT NULL, \`team_id\` varchar(64) NOT NULL, \`territory_id\` varchar(64) NOT NULL, \`task_ids\` json NULL, \`document_ids\` json NULL, \`status\` enum ('PENDING_PNL_HEAD', 'PENDING_SALES_MANAGER', 'APPROVED', 'REJECTED') NOT NULL, \`current_authority_role\` enum ('PNL_HEAD', 'SALES_MANAGER') NOT NULL, \`current_approver_id\` varchar(64) NOT NULL, \`original_approver_id\` varchar(64) NOT NULL, \`submission_idempotency_key\` varchar(191) NOT NULL, \`decision_idempotency_key\` varchar(191) NULL, \`decision_id\` varchar(64) NULL, \`expires_at\` datetime(6) NOT NULL, \`submitted_at\` datetime(6) NOT NULL, \`transferred_at\` datetime(6) NULL, \`updated_at\` datetime(6) NOT NULL, \`version\` int UNSIGNED NOT NULL, \`active_lead_key\` varchar(64) AS (case when status in ('PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end) STORED NULL, INDEX \`idx_approval_expires_at\` (\`expires_at\`), INDEX \`idx_approval_current_approver\` (\`current_approver_id\`, \`status\`), INDEX \`idx_approval_status\` (\`status\`), UNIQUE INDEX \`uq_approval_active_lead\` (\`active_lead_key\`), UNIQUE INDEX \`uq_approval_decision_id\` (\`decision_id\`), UNIQUE INDEX \`uq_approval_decision_key\` (\`decision_idempotency_key\`), UNIQUE INDEX \`uq_approval_submission_key\` (\`submission_idempotency_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, DATABASE(), ?, ?, ?, ?)`, ["approval_requests","GENERATED_COLUMN","active_lead_key","case when status in ('PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end"]);
        await queryRunner.query(`CREATE TABLE \`decisions\` (\`id\` varchar(64) NOT NULL, \`approval_id\` varchar(64) NOT NULL, \`outcome\` enum ('APPROVED', 'REJECTED') NOT NULL, \`actor_id\` varchar(64) NOT NULL, \`actor_role\` enum ('SALES_REPRESENTATIVE', 'SALES_MANAGER', 'PNL_HEAD', 'ADMIN') NOT NULL, \`decided_at\` datetime(6) NOT NULL, \`idempotency_key\` varchar(191) NOT NULL, \`comment\` text NULL, \`reason\` text NULL, UNIQUE INDEX \`uq_decision_approval\` (\`approval_id\`), UNIQUE INDEX \`uq_decision_idempotency\` (\`idempotency_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`approval_history_events\` (\`id\` varchar(64) NOT NULL, \`approval_id\` varchar(64) NOT NULL, \`type\` enum ('SUBMITTED', 'AUTHORITY_TRANSFERRED', 'APPROVED', 'REJECTED', 'DECISION_BLOCKED') NOT NULL, \`actor_id\` varchar(64) NOT NULL, \`actor_role\` enum ('SALES_REPRESENTATIVE', 'SALES_MANAGER', 'PNL_HEAD', 'ADMIN', 'SYSTEM') NOT NULL, \`event_at\` datetime(6) NOT NULL, \`idempotency_key\` varchar(191) NOT NULL, \`previous_approver_id\` varchar(64) NULL, \`new_approver_id\` varchar(64) NULL, \`comment\` text NULL, \`reason\` text NULL, INDEX \`idx_approval_history_approval\` (\`approval_id\`, \`event_at\`), UNIQUE INDEX \`uq_approval_history_key\` (\`approval_id\`, \`idempotency_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`decisions\` ADD CONSTRAINT \`FK_e4bcc5471844b9b3871ffdeaae1\` FOREIGN KEY (\`approval_id\`) REFERENCES \`approval_requests\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`approval_history_events\` ADD CONSTRAINT \`FK_317b68229368f3fa80e3de168c0\` FOREIGN KEY (\`approval_id\`) REFERENCES \`approval_requests\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`approval_history_events\` DROP FOREIGN KEY \`FK_317b68229368f3fa80e3de168c0\``);
        await queryRunner.query(`ALTER TABLE \`decisions\` DROP FOREIGN KEY \`FK_e4bcc5471844b9b3871ffdeaae1\``);
        await queryRunner.query(`DROP INDEX \`uq_approval_history_key\` ON \`approval_history_events\``);
        await queryRunner.query(`DROP INDEX \`idx_approval_history_approval\` ON \`approval_history_events\``);
        await queryRunner.query(`DROP TABLE \`approval_history_events\``);
        await queryRunner.query(`DROP INDEX \`uq_decision_idempotency\` ON \`decisions\``);
        await queryRunner.query(`DROP INDEX \`uq_decision_approval\` ON \`decisions\``);
        await queryRunner.query(`DROP TABLE \`decisions\``);
        await queryRunner.query(`DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = DATABASE() AND \`table\` = ?`, ["GENERATED_COLUMN","active_lead_key","approval_requests"]);
        await queryRunner.query(`DROP INDEX \`uq_approval_submission_key\` ON \`approval_requests\``);
        await queryRunner.query(`DROP INDEX \`uq_approval_decision_key\` ON \`approval_requests\``);
        await queryRunner.query(`DROP INDEX \`uq_approval_decision_id\` ON \`approval_requests\``);
        await queryRunner.query(`DROP INDEX \`uq_approval_active_lead\` ON \`approval_requests\``);
        await queryRunner.query(`DROP INDEX \`idx_approval_status\` ON \`approval_requests\``);
        await queryRunner.query(`DROP INDEX \`idx_approval_current_approver\` ON \`approval_requests\``);
        await queryRunner.query(`DROP INDEX \`idx_approval_expires_at\` ON \`approval_requests\``);
        await queryRunner.query(`DROP TABLE \`approval_requests\``);
    }

}
