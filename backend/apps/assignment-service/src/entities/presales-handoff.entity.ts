import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { HandoffStatus } from '../common/statuses';

/** Sales → Pre-Sales/Solution handoff (who owns the solution work, by when, what is missing). */
@Entity('presales_handoffs')
export class PresalesHandoff {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** Set once the opportunity exists (handoffs can start at lead / synopsis stage). */
  @Column({ name: 'opportunity_id', type: 'varchar', length: 32, nullable: true })
  opportunityId: string | null;

  @Column({ name: 'lead_id', type: 'varchar', length: 32, nullable: true })
  leadId: string | null;

  @Column({ name: 'synopsis_id', type: 'varchar', length: 32, nullable: true })
  synopsisId: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'requested_support', type: 'text', nullable: true })
  requestedSupport: string | null;

  @Column({ type: 'varchar', length: 16 })
  status: HandoffStatus;

  @Column({ name: 'requested_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  requestedByUserId: string | null;

  @Column({ name: 'requested_by_name', type: 'varchar', length: 255, nullable: true })
  requestedByName: string | null;

  /** Pre-Sales / Solutions owner. */
  @Column({ name: 'assignee_user_id', type: 'bigint', unsigned: true, nullable: true })
  assigneeUserId: string | null;

  @Column({ name: 'assignee_name', type: 'varchar', length: 255, nullable: true })
  assigneeName: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  /** Inputs still missing, e.g. ["Signed NDA", "Bank IT contact"]. */
  @Column({ name: 'pending_inputs', type: 'json', nullable: true })
  pendingInputs: string[] | null;

  @Column({ name: 'return_note', type: 'text', nullable: true })
  returnNote: string | null;

  @Column({ name: 'accepted_at', type: 'datetime', precision: 6, nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'completed_at', type: 'datetime', precision: 6, nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
