import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PdfProcessingStatus } from '../common/constants/pdf-processing-status.constants';
import { RfpPdfPageText } from './rfp-pdf-page-text.entity';

@Entity('rfp_pdf_processing_jobs')
@Unique('UQ_rfp_pdf_job_rfp_doc_attempt', ['rfpId', 'documentId', 'attempt'])
@Index('IDX_rfp_pdf_jobs_rfp_id', ['rfpId'])
@Index('IDX_rfp_pdf_jobs_document_id', ['documentId'])
@Index('IDX_rfp_pdf_jobs_status', ['status'])
export class RfpPdfProcessingJob {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'rfp_id', type: 'char', length: 36 })
  rfpId!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'document_id', type: 'char', length: 36 })
  documentId!: string;

  @ApiProperty({ minimum: 1 })
  @Column({ type: 'int' })
  attempt!: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 32 })
  status!: PdfProcessingStatus;

  @ApiPropertyOptional()
  @Column({ name: 'page_count', type: 'int', nullable: true })
  pageCount?: number | null;

  @ApiProperty({ default: 0 })
  @Column({ name: 'processed_page_count', type: 'int', default: 0 })
  processedPageCount!: number;

  @ApiProperty({ default: 0 })
  @Column({ name: 'failed_page_count', type: 'int', default: 0 })
  failedPageCount!: number;

  @ApiPropertyOptional()
  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode?: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage?: string | null;

  @ApiPropertyOptional()
  @Column({
    name: 'source_file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  sourceFileName?: string | null;

  @ApiPropertyOptional()
  @Column({
    name: 'source_size_bytes',
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? null : Number(value),
    },
  })
  sourceSizeBytes?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'started_at', type: 'datetime', precision: 6, nullable: true })
  startedAt?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({
    name: 'completed_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  completedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => RfpPdfPageText, (page) => page.job)
  pages?: RfpPdfPageText[];
}