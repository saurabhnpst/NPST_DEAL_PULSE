import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  RfpFieldDataType,
  RfpFieldReviewStatus,
} from '../common/constants/rfp-extraction.constants';

@Entity('rfp_extracted_fields')
@Unique('UQ_rfp_ext_field_version_key', ['versionId', 'fieldKey'])
@Index('IDX_rfp_ext_field_rfp', ['rfpId'])
@Index('IDX_rfp_ext_field_job', ['extractionJobId'])
@Index('IDX_rfp_ext_field_review', ['reviewStatus'])
export class RfpExtractedField {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'rfp_id', type: 'char', length: 36 })
  rfpId!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'version_id', type: 'char', length: 36 })
  versionId!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'document_id', type: 'char', length: 36 })
  documentId!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'extraction_job_id', type: 'char', length: 36 })
  extractionJobId!: string;

  @ApiProperty()
  @Column({ name: 'field_key', type: 'varchar', length: 64 })
  fieldKey!: string;

  @ApiProperty()
  @Column({ name: 'display_name', type: 'varchar', length: 128 })
  displayName!: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 32 })
  category!: string;

  @ApiProperty()
  @Column({ name: 'data_type', type: 'varchar', length: 16 })
  dataType!: RfpFieldDataType;

  @ApiPropertyOptional()
  @Column({ name: 'extracted_value', type: 'text', nullable: true })
  extractedValue?: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'corrected_value', type: 'text', nullable: true })
  correctedValue?: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'confirmed_value', type: 'text', nullable: true })
  confirmedValue?: string | null;

  @ApiProperty()
  @Column({ name: 'review_status', type: 'varchar', length: 24, default: 'draft' })
  reviewStatus!: RfpFieldReviewStatus;

  @ApiPropertyOptional()
  @Column({ name: 'portal_target', type: 'varchar', length: 128, nullable: true })
  portalTarget?: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'mapping_ambiguous', type: 'boolean', default: false })
  mappingAmbiguous!: boolean;

  @ApiPropertyOptional()
  @Column({ name: 'page_number', type: 'int', nullable: true })
  pageNumber?: number | null;

  @ApiPropertyOptional()
  @Column({ name: 'source_excerpt', type: 'text', nullable: true })
  sourceExcerpt?: string | null;

  @ApiPropertyOptional()
  @Column({
    name: 'confidence',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    transformer: {
      to: (v?: number | null) => v,
      from: (v: string | null) =>
        v === null || v === undefined ? null : Number(v),
    },
  })
  confidence?: number | null;

  @ApiPropertyOptional()
  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'confirmed_at', type: 'datetime', precision: 6, nullable: true })
  confirmedAt?: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'confirmed_by_id', type: 'varchar', length: 100, nullable: true })
  confirmedById?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}