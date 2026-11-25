import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TechStatus } from '../common/statuses';

/** One Tech Lead assignment per opportunity + product workstream (e.g. OPP-2026-00001 + UPI). */
@Entity('technical_assignments')
export class TechnicalAssignment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** Opportunity Service public id, e.g. OPP-2026-00001. */
  @Column({ name: 'opportunity_id', type: 'varchar', length: 32 })
  opportunityId: string;

  @Column({ name: 'product_tsp', type: 'varchar', length: 128 })
  productTsp: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  vertical: string | null;

  @Column({ type: 'varchar', length: 24 })
  status: TechStatus;

  @Column({ name: 'proposed_tech_lead_user_id', type: 'bigint', unsigned: true, nullable: true })
  proposedTechLeadUserId: string | null;

  @Column({ name: 'proposed_tech_lead_name', type: 'varchar', length: 255, nullable: true })
  proposedTechLeadName: string | null;

  /** Final Tech Lead, set when the Solution Manager approves. */
  @Column({ name: 'tech_lead_user_id', type: 'bigint', unsigned: true, nullable: true })
  techLeadUserId: string | null;

  @Column({ name: 'tech_lead_name', type: 'varchar', length: 255, nullable: true })
  techLeadName: string | null;

  /** +1 every time the proposal changes. */
  @Column({ type: 'int', unsigned: true, default: 1 })
  version: number;

  @Column({ name: 'proposed_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  proposedByUserId: string | null;

  /** Solution Manager who approved / returned it. */
  @Column({ name: 'decided_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  decidedByUserId: string | null;

  @Column({ name: 'decided_at', type: 'datetime', precision: 6, nullable: true })
  decidedAt: Date | null;

  @Column({ name: 'decision_comment', type: 'text', nullable: true })
  decisionComment: string | null;

  @Column({ name: 'notified_at', type: 'datetime', precision: 6, nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
