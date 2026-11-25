import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rfps')
@Index('IDX_rfps_lead_id', ['leadId'])
@Index('IDX_rfps_opportunity_id', ['opportunityId'])
@Index('IDX_rfps_status_created_at', ['status', 'createdAt'])
@Index('IDX_rfps_submission_deadline', ['submissionDeadline'])
export class Rfp {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ maxLength: 255 })
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Column({ name: 'reference_number', type: 'varchar', length: 255, nullable: true })
  referenceNumber?: string;

  @ApiProperty({ maxLength: 50, default: 'Draft' })
  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'lead_id', type: 'char', length: 36, nullable: true })
  leadId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'opportunity_id', type: 'char', length: 36, nullable: true })
  opportunityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'document_id', type: 'char', length: 36, nullable: true })
  documentId?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Column({ name: 'issuer_name', type: 'varchar', length: 255, nullable: true })
  issuerName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Column({ type: 'varchar', length: 100, nullable: true })
  portal?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Column({ type: 'varchar', length: 500, nullable: true })
  products?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'pre_bid_meeting_at', type: 'datetime', nullable: true })
  preBidMeetingAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'submission_deadline', type: 'datetime', nullable: true })
  submissionDeadline?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'bid_opening_at', type: 'datetime', nullable: true })
  bidOpeningAt?: Date;

  @ApiProperty({ default: false })
  @Column({ name: 'emd_required', type: 'boolean', default: false })
  emdRequired!: boolean;

  @ApiPropertyOptional({ maxLength: 500 })
  @Column({ name: 'emd_details', type: 'varchar', length: 500, nullable: true })
  emdDetails?: string;

  @ApiProperty({ default: false })
  @Column({ name: 'pbg_required', type: 'boolean', default: false })
  pbgRequired!: boolean;

  @ApiPropertyOptional({ maxLength: 255 })
  @Column({ name: 'pbg_details', type: 'varchar', length: 255, nullable: true })
  pbgDetails?: string;

  @ApiPropertyOptional()
  @Column({ name: 'eligibility_notes', type: 'text', nullable: true })
  eligibilityNotes?: string;

  @ApiPropertyOptional()
  @Column({ name: 'scope_notes', type: 'text', nullable: true })
  scopeNotes?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Column({ name: 'owner_id', type: 'varchar', length: 100, nullable: true })
  ownerId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Column({ name: 'created_by_id', type: 'varchar', length: 100, nullable: true })
  createdById?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Column({ name: 'last_modified_by_id', type: 'varchar', length: 100, nullable: true })
  lastModifiedById?: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ---- RFP synopsis (Sales writes it, Pre-Sales accepts or returns it) ----
  @ApiPropertyOptional({ enum: ['Draft', 'Submitted', 'Accepted', 'Returned'] })
  @Column({ name: 'synopsis_status', type: 'varchar', length: 16, nullable: true })
  synopsisStatus?: string;

  @ApiPropertyOptional({ description: 'Estimated deal size (INR)' })
  @Column({ name: 'deal_size', type: 'decimal', precision: 18, scale: 2, nullable: true })
  dealSize?: string | number; // DECIMAL comes back as a string

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  context?: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  risks?: string;

  @ApiPropertyOptional()
  @Column({ name: 'return_note', type: 'text', nullable: true })
  returnNote?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Column({ name: 'presales_owner_id', type: 'varchar', length: 100, nullable: true })
  presalesOwnerId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt?: Date;
}