import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DECISION_OUTCOMES, DecisionOutcome } from '../../decisions/decision.types';
import { ACTOR_ROLES, ActorRole } from '../../shared/roles';
import { ApprovalRequestEntity } from './approval-request.entity';

@Entity({ name: 'decisions' })
@Index('uq_decision_idempotency', ['idempotencyKey'], { unique: true })
@Index('uq_decision_approval', ['approvalId'], { unique: true })
export class DecisionEntity {
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

  @Column({ name: 'outcome', type: 'enum', enum: [...DECISION_OUTCOMES] })
  outcome!: DecisionOutcome;

  @Column({ name: 'actor_id', type: 'varchar', length: 64 })
  actorId!: string;

  @Column({ name: 'actor_role', type: 'enum', enum: [...ACTOR_ROLES] })
  actorRole!: ActorRole;

  @Column({ name: 'decided_at', type: 'datetime', precision: 6 })
  decidedAt!: Date;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 191 })
  idempotencyKey!: string;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason!: string | null;
}
