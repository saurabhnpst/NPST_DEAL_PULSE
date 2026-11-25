import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Pre-PO evaluation (PoC / Pilot / Demo / Customization) with its deliverables. */
@Entity('opportunity_evaluations')
export class OpportunityEvaluation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'bigint', unsigned: true })
  opportunityId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'eval_type', type: 'varchar', length: 32 })
  evalType: string;

  @Column({ type: 'varchar', length: 32, default: 'Pending' })
  approval: string;

  @Column({ type: 'varchar', length: 64, default: 'Not Started' })
  status: string;

  /** Other form fields: sales/solution/tech owners, start, target, submitted, next, effort, cost, expectedPo, scope, deliverables[]. */
  @Column({ type: 'json', nullable: true })
  details: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
