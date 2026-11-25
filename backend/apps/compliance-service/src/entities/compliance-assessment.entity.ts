import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssessmentStatus } from '../common/enums/assessment-status.enum';
import { ComplianceConfiguration } from './compliance-configuration.entity';

@Entity('compliance_assessments')
export class ComplianceAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceConfiguration, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: ComplianceConfiguration;

  @Column({ name: 'opportunity_id', type: 'varchar', length: 36 })
  opportunityId: string;

  @Column({ name: 'project_id', type: 'varchar', length: 36, nullable: true })
  projectId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: AssessmentStatus.DRAFT,
  })
  status: AssessmentStatus;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'created_by_actor_id', type: 'varchar', length: 100, nullable: true })
  createdByActorId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}