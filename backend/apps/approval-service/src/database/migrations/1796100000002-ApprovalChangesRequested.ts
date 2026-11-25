import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * "More work needed": approver sends the lead back to Sales.
 * Adds CHANGES_REQUESTED to request status, decision outcome and history type (additive enum values).
 * CHANGES_REQUESTED is not an active status, so the lead can be submitted again.
 */
export class ApprovalChangesRequested1796100000002 implements MigrationInterface {
  name = 'ApprovalChangesRequested1796100000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `approval_requests` MODIFY `status` enum ('PENDING', 'PENDING_PNL_HEAD', 'PENDING_SALES_MANAGER', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `decisions` MODIFY `outcome` enum ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `approval_history_events` MODIFY `type` enum ('SUBMITTED', 'APPROVER_SELECTED', 'AUTHORITY_TRANSFERRED', 'REASSIGNED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'DECISION_BLOCKED') NOT NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `approval_history_events` MODIFY `type` enum ('SUBMITTED', 'APPROVER_SELECTED', 'AUTHORITY_TRANSFERRED', 'REASSIGNED', 'APPROVED', 'REJECTED', 'DECISION_BLOCKED') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `decisions` MODIFY `outcome` enum ('APPROVED', 'REJECTED') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `approval_requests` MODIFY `status` enum ('PENDING', 'PENDING_PNL_HEAD', 'PENDING_SALES_MANAGER', 'APPROVED', 'REJECTED') NOT NULL",
    );
  }
}
