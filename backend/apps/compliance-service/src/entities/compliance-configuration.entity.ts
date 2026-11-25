import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConfigurationStatus } from '../common/enums/configuration-status.enum';
import { ComplianceConfigurationFramework } from './compliance-configuration-framework.entity';
import { ComplianceConfigurationRequirement } from './compliance-configuration-requirement.entity';

@Entity('compliance_configurations')
export class ComplianceConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'opportunity_id', type: 'varchar', length: 36, nullable: true })
  opportunityId: string | null;

  @Column({ name: 'project_id', type: 'varchar', length: 36, nullable: true })
  projectId: string | null;

  @Column({ name: 'product_tsp', type: 'varchar', length: 255, nullable: true })
  productTsp: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: ConfigurationStatus.ACTIVE,
  })
  status: ConfigurationStatus;

  @OneToMany(
    () => ComplianceConfigurationFramework,
    (link) => link.configuration,
    { cascade: true },
  )
  frameworkLinks?: ComplianceConfigurationFramework[];

  @OneToMany(
    () => ComplianceConfigurationRequirement,
    (link) => link.configuration,
    { cascade: true },
  )
  requirementLinks?: ComplianceConfigurationRequirement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}