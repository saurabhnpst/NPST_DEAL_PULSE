import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';

@Entity('opportunity_stage_history')
export class OpportunityStageHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ name: 'from_stage', type: 'varchar', length: 32, nullable: true })
  fromStage: string | null;

  @Column({ name: 'to_stage', type: 'varchar', length: 32 })
  toStage: string;

  @Column({ name: 'changed_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  changedByUserId: string | null;

  @Column({ name: 'changed_at', type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  changedAt: Date;

  @Column({ type: 'text', nullable: true })
  narrative: string | null;

  @Column({ name: 'lost_reason', type: 'varchar', length: 64, nullable: true })
  lostReason: string | null;

  @Column({ name: 'lost_reason_remark', type: 'varchar', length: 255, nullable: true })
  lostReasonRemark: string | null;

  @Column({ name: 'hold_reason', type: 'varchar', length: 64, nullable: true })
  holdReason: string | null;

  @Column({ name: 'hold_details', type: 'text', nullable: true })
  holdDetails: string | null;

  @Column({ name: 'hold_until', type: 'date', nullable: true })
  holdUntil: string | null;

  @Column({ name: 'hold_from_stage', type: 'varchar', length: 32, nullable: true })
  holdFromStage: string | null;

  @Column({ name: 'early_close', type: 'bool', default: false })
  earlyClose: boolean;

  @Column({ name: 'override_reason', type: 'varchar', length: 64, nullable: true })
  overrideReason: string | null;

  @Column({ name: 'override_justification', type: 'text', nullable: true })
  overrideJustification: string | null;

  @Column({ name: 'po_date', type: 'date', nullable: true })
  poDate: string | null;

  @Column({ name: 'po_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  poValue: string | null;

  @Column({ name: 'closed_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  closedValue: string | null;

  @Column({ name: 'project_start_actual', type: 'date', nullable: true })
  projectStartActual: string | null;

  @Column({ name: 'first_billing_date', type: 'date', nullable: true })
  firstBillingDate: string | null;

  @Column({ name: 'first_billing_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  firstBillingValue: string | null;

  @ManyToOne(() => Opportunity, (o) => o.stageHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;
}