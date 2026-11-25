import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Sales recommendation (Yes/No + synopsis) and the P&L Head decision (Proceed/Reject) on an opportunity. */
@Entity('opportunity_decisions')
export class OpportunityDecision {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ type: 'varchar', length: 8 })
  recommendation: string;

  @Column({ type: 'text' })
  synopsis: string;

  @Column({ type: 'text', nullable: true })
  concern: string | null;

  @Column({ name: 'proposal_ref', type: 'varchar', length: 255, nullable: true })
  proposalRef: string | null;

  @Column({ name: 'deal_value', type: 'decimal', precision: 18, scale: 2, default: 0 })
  dealValue: string;

  @Column({ name: 'initial_value', type: 'decimal', precision: 18, scale: 2, default: 0 })
  initialValue: string;

  @Column({ name: 'recommended_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  recommendedByUserId: string | null;

  @Column({ name: 'recommended_at', type: 'datetime', precision: 6 })
  recommendedAt: Date;

  @Column({ type: 'varchar', length: 16, nullable: true })
  decision: string | null;

  @Column({ name: 'decision_note', type: 'text', nullable: true })
  decisionNote: string | null;

  @Column({ name: 'decided_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  decidedByUserId: string | null;

  @Column({ name: 'decided_at', type: 'datetime', precision: 6, nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
