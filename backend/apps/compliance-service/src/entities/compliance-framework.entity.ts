import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FrameworkStatus } from '../common/enums/framework-status.enum';
import { ComplianceRequirement } from './compliance-requirement.entity';

@Entity('compliance_frameworks')
export class ComplianceFramework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  version: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: FrameworkStatus.ACTIVE,
  })
  status: FrameworkStatus;

  @Column({ name: 'applicable_metadata', type: 'json', nullable: true })
  applicableMetadata: Record<string, unknown> | null;

  @OneToMany(() => ComplianceRequirement, (req) => req.framework)
  requirements?: ComplianceRequirement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}