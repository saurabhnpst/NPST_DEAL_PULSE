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
import { RfpAmendmentChangeCategory } from '../common/constants/rfp-extraction.constants';
import { RfpAmendmentComparison } from './rfp-amendment-comparison.entity';

@Entity('rfp_amendment_diffs')
@Index('IDX_rfp_amend_diff_cmp', ['comparisonId'])
export class RfpAmendmentDiff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'comparison_id', type: 'char', length: 36 })
  comparisonId!: string;

  @ManyToOne(() => RfpAmendmentComparison, (c) => c.diffs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comparison_id' })
  comparison!: RfpAmendmentComparison;

  @Column({ name: 'field_key', type: 'varchar', length: 64 })
  fieldKey!: string;

  @Column({ name: 'change_category', type: 'varchar', length: 16 })
  changeCategory!: RfpAmendmentChangeCategory;

  @Column({ name: 'previous_value', type: 'text', nullable: true })
  previousValue?: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string | null;

  @Column({ name: 'previous_source_excerpt', type: 'text', nullable: true })
  previousSourceExcerpt?: string | null;

  @Column({ name: 'new_source_excerpt', type: 'text', nullable: true })
  newSourceExcerpt?: string | null;

  @Column({ name: 'review_status', type: 'varchar', length: 24, default: 'pending' })
  reviewStatus!: string;

  @Column({ name: 'reviewer_id', type: 'varchar', length: 100, nullable: true })
  reviewerId?: string | null;

  @Column({ type: 'text', nullable: true })
  comments?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}