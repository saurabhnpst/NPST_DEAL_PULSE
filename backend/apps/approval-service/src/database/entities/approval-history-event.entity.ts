import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import {
  APPROVAL_HISTORY_TYPES,
  ApprovalHistoryType,
} from '../../approvals/approval.types';
import { ACTOR_ROLES, HistoryActorRole } from '../../shared/roles';
import { ApprovalRequestEntity } from './approval-request.entity';

const HISTORY_ACTOR_ROLES: readonly HistoryActorRole[] = [...ACTOR_ROLES, 'SYSTEM'];

@Entity({ name: 'approval_history_events' })
@Index('uq_approval_history_key', ['approvalId', 'idempotencyKey'], { unique: true })
@Index('idx_approval_history_approval', ['approvalId', 'timestamp'])
export class ApprovalHistoryEventEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'approval_id', type: 'varchar', length: 64 })
  approvalId!: string;

  @ManyToOne(() => ApprovalRequestEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'approval_id' })
  approval!: ApprovalRequestEntity;

  @Column({ name: 'type', type: 'enum', enum: [...APPROVAL_HISTORY_TYPES] })
  type!: ApprovalHistoryType;

  @Column({ name: 'actor_id', type: 'varchar', length: 64 })
  actorId!: string;

  @Column({ name: 'actor_role', type: 'enum', enum: [...HISTORY_ACTOR_ROLES] })
  actorRole!: HistoryActorRole;

  @Column({ name: 'event_at', type: 'datetime', precision: 6 })
  timestamp!: Date;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 191 })
  idempotencyKey!: string;

  @Column({ name: 'previous_approver_id', type: 'varchar', length: 64, nullable: true })
  previousApproverId!: string | null;

  @Column({ name: 'new_approver_id', type: 'varchar', length: 64, nullable: true })
  newApproverId!: string | null;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason!: string | null;
}
