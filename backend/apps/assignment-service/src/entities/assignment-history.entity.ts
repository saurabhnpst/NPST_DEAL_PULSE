import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Subject } from '../common/statuses';

/** Append-only audit trail: one row per action on an assignment, handoff, requirement or mapping. */
@Entity('assignment_history')
export class AssignmentHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'subject_type', type: 'varchar', length: 32 })
  subjectType: Subject;

  @Column({ name: 'subject_id', type: 'bigint', unsigned: true })
  subjectId: string;

  @Column({ name: 'opportunity_id', type: 'varchar', length: 32, nullable: true })
  opportunityId: string | null;

  /** e.g. PROPOSED, CHANGED, APPROVED, RETURNED, ACCEPTED, MAPPED. */
  @Column({ type: 'varchar', length: 32 })
  action: string;

  @Column({ name: 'from_status', type: 'varchar', length: 24, nullable: true })
  fromStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 24, nullable: true })
  toStatus: string | null;

  @Column({ name: 'actor_user_id', type: 'bigint', unsigned: true, nullable: true })
  actorUserId: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  /** The record after the change, so proposed and final versions are both kept. */
  @Column({ type: 'json', nullable: true })
  snapshot: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
