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
import { ComplianceFramework } from './compliance-framework.entity';

@Entity('compliance_requirements')
@Index('UQ_compliance_requirements_framework_code', ['framework', 'code'], {
  unique: true,
})
export class ComplianceRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceFramework, (framework) => framework.requirements, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'framework_id' })
  framework: ComplianceFramework;

  @Column({ type: 'varchar', length: 64 })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  criticality: string | null;

  @Column({ name: 'reference_clause', type: 'text', nullable: true })
  referenceClause: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}