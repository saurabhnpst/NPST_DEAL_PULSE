import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MatrixComplianceStatus } from '../common/enums/matrix-compliance-status.enum';
import { ComplianceAssessment } from './compliance-assessment.entity';
import { ComplianceRequirement } from './compliance-requirement.entity';

@Entity('compliance_assessment_lines')
@Index('UQ_assessment_requirement', ['assessment', 'requirement'], {
  unique: true,
})
export class ComplianceAssessmentLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceAssessment, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessment_id' })
  assessment: ComplianceAssessment;

  @ManyToOne(() => ComplianceRequirement, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'requirement_id' })
  requirement: ComplianceRequirement;

  @Column({ name: 'requirement_code', type: 'varchar', length: 64 })
  requirementCode: string;

  @Column({ name: 'requirement_title', type: 'varchar', length: 500 })
  requirementTitle: string;

  @Column({
    name: 'compliance_status',
    type: 'varchar',
    length: 32,
    default: MatrixComplianceStatus.PENDING,
  })
  complianceStatus: MatrixComplianceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'reviewer_observations', type: 'text', nullable: true })
  reviewerObservations: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}