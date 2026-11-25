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
import { RfpVersionType } from '../common/constants/rfp-extraction.constants';

@Entity('rfp_document_versions')
@Unique('UQ_rfp_doc_version_num', ['rfpId', 'versionNumber'])
@Index('IDX_rfp_doc_versions_rfp', ['rfpId'])
@Index('IDX_rfp_doc_versions_document', ['documentId'])
export class RfpDocumentVersion {
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
  @Column({ name: 'version_number', type: 'int' })
  versionNumber!: number;

  @ApiProperty({ enum: ['initial', 'amendment'] })
  @Column({ name: 'version_type', type: 'varchar', length: 16 })
  versionType!: RfpVersionType;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ name: 'received_at', type: 'datetime', precision: 6, nullable: true })
  receivedAt?: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson?: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}