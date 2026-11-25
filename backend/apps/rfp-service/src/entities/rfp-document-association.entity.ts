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

@Entity('rfp_document_associations')
@Unique('UQ_rfp_document_assoc_rfp_document', ['rfpId', 'documentId'])
@Index('IDX_rfp_document_assoc_document_id', ['documentId'])
@Index('IDX_rfp_document_assoc_lead_id', ['leadId'])
export class RfpDocumentAssociation {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'document_id', type: 'char', length: 36 })
  documentId!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'rfp_id', type: 'char', length: 36 })
  rfpId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'lead_id', type: 'char', length: 36, nullable: true })
  leadId?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Column({ name: 'document_name', type: 'varchar', length: 255, nullable: true })
  documentName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Column({ name: 'document_type', type: 'varchar', length: 100, nullable: true })
  documentType?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'uploaded_at', type: 'datetime', nullable: true })
  uploadedAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}