import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rfp_field_review_audit')
@Index('IDX_rfp_review_audit_rfp', ['rfpId'])
@Index('IDX_rfp_review_audit_field', ['extractedFieldId'])
export class RfpFieldReviewAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rfp_id', type: 'char', length: 36 })
  rfpId!: string;

  @Column({ name: 'version_id', type: 'char', length: 36 })
  versionId!: string;

  @Column({ name: 'extracted_field_id', type: 'char', length: 36 })
  extractedFieldId!: string;

  @Column({ name: 'action', type: 'varchar', length: 32 })
  action!: string;

  @Column({ name: 'reviewer_id', type: 'varchar', length: 100, nullable: true })
  reviewerId?: string | null;

  @Column({ name: 'previous_value', type: 'text', nullable: true })
  previousValue?: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  comments?: string | null;

  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson?: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}