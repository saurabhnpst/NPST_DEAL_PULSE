import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RequirementStatus } from '../common/statuses';

/** An RFP requirement for an opportunity, mapped (or not yet) to a product. */
@Entity('rfp_requirements')
export class RfpRequirement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'opportunity_id', type: 'varchar', length: 32 })
  opportunityId: string;

  /** RFP clause / requirement number, e.g. "4.2.1". */
  @Column({ name: 'requirement_ref', type: 'varchar', length: 64, nullable: true })
  requirementRef: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  /** null = not mapped to a product yet (goes to the review queue). */
  @Column({ name: 'product_tsp', type: 'varchar', length: 128, nullable: true })
  productTsp: string | null;

  @Column({ type: 'varchar', length: 16 })
  status: RequirementStatus;

  @Column({ name: 'review_reason', type: 'varchar', length: 255, nullable: true })
  reviewReason: string | null;

  @Column({ name: 'technical_assignment_id', type: 'bigint', unsigned: true, nullable: true })
  technicalAssignmentId: string | null;

  /** API = sent to this service, RFP = pulled from the RFP Service. */
  @Column({ type: 'varchar', length: 16, default: 'API' })
  source: string;

  @Column({ name: 'created_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  createdByUserId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
