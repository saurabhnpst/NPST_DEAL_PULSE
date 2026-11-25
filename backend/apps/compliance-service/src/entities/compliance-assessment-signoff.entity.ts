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
import { SignoffDecision } from '../common/enums/signoff-decision.enum';
import { ComplianceAssessment } from './compliance-assessment.entity';

@Entity('compliance_assessment_signoffs')
@Index('UQ_assessment_signoff', ['assessment'], { unique: true })
export class ComplianceAssessmentSignoff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceAssessment, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessment_id' })
  assessment: ComplianceAssessment;

  @Column({ type: 'varchar', length: 32 })
  decision: SignoffDecision;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'signer_actor_id', type: 'varchar', length: 100, nullable: true })
  signerActorId: string | null;

  @Column({ name: 'signed_off_at', type: 'datetime' })
  signedOffAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}