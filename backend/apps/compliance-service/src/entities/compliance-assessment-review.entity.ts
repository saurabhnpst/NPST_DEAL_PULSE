import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewDecision } from '../common/enums/review-decision.enum';
import { ComplianceAssessment } from './compliance-assessment.entity';

@Entity('compliance_assessment_reviews')
export class ComplianceAssessmentReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceAssessment, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessment_id' })
  assessment: ComplianceAssessment;

  @Column({ name: 'reviewer_actor_id', type: 'varchar', length: 100, nullable: true })
  reviewerActorId: string | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  decision: ReviewDecision | null;

  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}