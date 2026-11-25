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
import { RfpFieldDataType } from '../common/constants/rfp-extraction.constants';

@Entity('rfp_field_mapping_config')
@Unique('UQ_rfp_field_map_key', ['fieldKey'])
@Index('IDX_rfp_field_map_active', ['active'])
export class RfpFieldMappingConfig {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
  @Column({ name: 'portal_target', type: 'varchar', length: 128, nullable: true })
  portalTarget?: string | null;

  @ApiProperty()
  @Column({ type: 'json' })
  patterns!: string[];

  @ApiProperty({ default: true })
  @Column({ type: 'tinyint', default: 1 })
  active!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}