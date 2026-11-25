import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RfpAmendmentDiff } from './rfp-amendment-diff.entity';

@Entity('rfp_amendment_comparisons')
@Index('IDX_rfp_amend_cmp_rfp', ['rfpId'])
export class RfpAmendmentComparison {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rfp_id', type: 'char', length: 36 })
  rfpId!: string;

  @Column({ name: 'from_version_id', type: 'char', length: 36 })
  fromVersionId!: string;

  @Column({ name: 'to_version_id', type: 'char', length: 36 })
  toVersionId!: string;

  @Column({ type: 'varchar', length: 32, default: 'pending_review' })
  status!: string;

  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => RfpAmendmentDiff, (diff) => diff.comparison)
  diffs?: RfpAmendmentDiff[];
}