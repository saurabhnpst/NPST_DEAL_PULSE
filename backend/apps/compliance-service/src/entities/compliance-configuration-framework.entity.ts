import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComplianceConfiguration } from './compliance-configuration.entity';
import { ComplianceFramework } from './compliance-framework.entity';

@Entity('compliance_configuration_frameworks')
@Index('UQ_config_framework', ['configuration', 'framework'], { unique: true })
export class ComplianceConfigurationFramework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplianceConfiguration, (c) => c.frameworkLinks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: ComplianceConfiguration;

  @ManyToOne(() => ComplianceFramework, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'framework_id' })
  framework: ComplianceFramework;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}