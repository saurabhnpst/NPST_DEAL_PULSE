import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ComplianceAssessmentLine } from './compliance-assessment-line.entity';

@Entity('compliance_evidence_references')
export class ComplianceEvidenceReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceAssessmentLine, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessment_line_id' })
  assessmentLine: ComplianceAssessmentLine;

  @Column({ name: 'document_id', type: 'varchar', length: 36, nullable: true })
  documentId: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'evidence_type', type: 'varchar', length: 64, nullable: true })
  evidenceType: string | null;

  @Column({ name: 'reference_url', type: 'varchar', length: 2048, nullable: true })
  referenceUrl: string | null;

  @Column({ name: 'reference_metadata', type: 'json', nullable: true })
  referenceMetadata: Record<string, unknown> | null;

  @Column({ name: 'created_by_actor_id', type: 'varchar', length: 100, nullable: true })
  createdByActorId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}