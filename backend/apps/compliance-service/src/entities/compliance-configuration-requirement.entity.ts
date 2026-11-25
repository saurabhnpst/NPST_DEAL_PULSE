import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComplianceConfiguration } from './compliance-configuration.entity';
import { ComplianceRequirement } from './compliance-requirement.entity';

@Entity('compliance_configuration_requirements')
@Index('UQ_config_requirement', ['configuration', 'requirement'], { unique: true })
export class ComplianceConfigurationRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceConfiguration, (c) => c.requirementLinks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: ComplianceConfiguration;

  @ManyToOne(() => ComplianceRequirement, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: ComplianceRequirement;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}