import { Column, Entity, Index, PrimaryColumn, VersionColumn } from 'typeorm';
import {
  APPROVAL_STATUSES,
  ApprovalAuthorityRole,
  ApprovalStatus,
} from '../../approvals/approval.types';

const APPROVAL_AUTHORITY_ROLES: readonly ApprovalAuthorityRole[] = ['PNL_HEAD', 'SALES_MANAGER'];

@Entity({ name: 'approval_requests' })
@Index('uq_approval_submission_key', ['submissionIdempotencyKey'], { unique: true })
@Index('uq_approval_decision_key', ['decisionIdempotencyKey'], { unique: true })
@Index('uq_approval_decision_id', ['decisionId'], { unique: true })
@Index('uq_approval_active_lead', ['activeLeadKey'], { unique: true })
@Index('idx_approval_status', ['status'])
@Index('idx_approval_current_approver', ['currentApproverId', 'status'])
@Index('idx_approval_expires_at', ['expiresAt'])
export class ApprovalRequestEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'lead_id', type: 'varchar', length: 64 })
  leadId!: string;

  @Column({ name: 'creator_id', type: 'varchar', length: 64 })
  creatorId!: string;

  @Column({ name: 'product_vertical', type: 'varchar', length: 64 })
  productVertical!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64 })
  teamId!: string;

  @Column({ name: 'territory_id', type: 'varchar', length: 64 })
  territoryId!: string;

  @Column({ name: 'task_ids', type: 'json', nullable: true })
  taskIds!: string[] | null;

  @Column({ name: 'document_ids', type: 'json', nullable: true })
  documentIds!: string[] | null;

  @Column({ name: 'status', type: 'enum', enum: [...APPROVAL_STATUSES] })
  status!: ApprovalStatus;

  @Column({
    name: 'current_authority_role',
    type: 'enum',
    enum: [...APPROVAL_AUTHORITY_ROLES],
  })
  currentAuthorityRole!: ApprovalAuthorityRole;

  @Column({ name: 'current_approver_id', type: 'varchar', length: 64 })
  currentApproverId!: string;

  @Column({ name: 'original_approver_id', type: 'varchar', length: 64 })
  originalApproverId!: string;

  @Column({ name: 'submission_idempotency_key', type: 'varchar', length: 191 })
  submissionIdempotencyKey!: string;

  @Column({ name: 'decision_idempotency_key', type: 'varchar', length: 191, nullable: true })
  decisionIdempotencyKey!: string | null;

  @Column({ name: 'decision_id', type: 'varchar', length: 64, nullable: true })
  decisionId!: string | null;

  @Column({ name: 'expires_at', type: 'datetime', precision: 6 })
  expiresAt!: Date;

  @Column({ name: 'submitted_at', type: 'datetime', precision: 6 })
  submittedAt!: Date;

  @Column({ name: 'transferred_at', type: 'datetime', precision: 6, nullable: true })
  transferredAt!: Date | null;

  @Column({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @VersionColumn({ name: 'version', type: 'int', unsigned: true })
  version!: number;

  @Column({
    name: 'active_lead_key',
    type: 'varchar',
    length: 64,
    generatedType: 'STORED',
    asExpression:
      "case when status in ('PENDING_PNL_HEAD','PENDING_SALES_MANAGER') then lead_id else null end",
    insert: false,
    update: false,
    nullable: true,
  })
  activeLeadKey!: string | null;
}
