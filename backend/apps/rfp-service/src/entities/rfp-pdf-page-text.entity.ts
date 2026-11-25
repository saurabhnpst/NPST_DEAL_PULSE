import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PdfExtractionMethod } from '../common/constants/pdf-processing-status.constants';
import { RfpPdfProcessingJob } from './rfp-pdf-processing-job.entity';

@Entity('rfp_pdf_page_texts')
@Unique('UQ_rfp_pdf_page_job_page', ['jobId', 'pageNumber'])
@Index('IDX_rfp_pdf_page_job_id', ['jobId'])
export class RfpPdfPageText {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'job_id', type: 'char', length: 36 })
  jobId!: string;

  @ManyToOne(() => RfpPdfProcessingJob, (job) => job.pages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job!: RfpPdfProcessingJob;

  @ApiProperty({ minimum: 1 })
  @Column({ name: 'page_number', type: 'int' })
  pageNumber!: number;

  @ApiProperty()
  @Column({ name: 'extraction_method', type: 'varchar', length: 16 })
  extractionMethod!: PdfExtractionMethod;

  @ApiProperty()
  @Column({ name: 'char_count', type: 'int', default: 0 })
  charCount!: number;

  @ApiProperty()
  @Column({ name: 'has_usable_text', type: 'boolean', default: false })
  hasUsableText!: boolean;

  @ApiProperty()
  @Column({ name: 'text_content', type: 'longtext' })
  textContent!: string;

  @ApiPropertyOptional()
  @Column({
    name: 'ocr_confidence',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? null : Number(value),
    },
  })
  ocrConfidence?: number | null;

  @ApiPropertyOptional()
  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson?: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}