import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RfpExtractionJobStatus } from '../common/constants/rfp-extraction.constants';

@Entity('rfp_information_extraction_jobs')
@Index('IDX_rfp_info_ext_rfp', ['rfpId'])
@Index('IDX_rfp_info_ext_version', ['versionId'])
@Index('IDX_rfp_info_ext_status', ['status'])
export class RfpInformationExtractionJob {
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

  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'pdf_processing_job_id', type: 'char', length: 36, nullable: true })
  pdfProcessingJobId?: string | null;

  @ApiProperty()
  @Column({ type: 'varchar', length: 32 })
  status!: RfpExtractionJobStatus;

  @ApiPropertyOptional()
  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode?: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'started_at', type: 'datetime', precision: 6, nullable: true })
  startedAt?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'completed_at', type: 'datetime', precision: 6, nullable: true })
  completedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}