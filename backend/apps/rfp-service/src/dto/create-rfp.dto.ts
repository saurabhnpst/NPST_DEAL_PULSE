import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { RFP_STATUSES } from '../common/constants/rfp-status.constants';

export class CreateRfpDto {
  @ApiProperty({ example: 'BBPS biller platform RFP', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'GGB/IT/RFP/2026/042', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceNumber?: string;

  @ApiPropertyOptional({ enum: RFP_STATUSES, default: 'Draft' })
  @IsOptional()
  @IsIn([...RFP_STATUSES])
  status?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional({ example: 'Godavari Grameena Bank', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuerName?: string;

  @ApiPropertyOptional({ example: 'GeM', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  portal?: string;

  @ApiPropertyOptional({ example: 'BBPS, UPI', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  products?: string;

  @ApiPropertyOptional({ example: '2026-12-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  preBidMeetingAt?: string;

  @ApiPropertyOptional({ example: '2026-12-15T17:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  submissionDeadline?: string;

  @ApiPropertyOptional({ example: '2026-12-20T11:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  bidOpeningAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  emdRequired?: boolean;

  @ApiPropertyOptional({ example: '₹5,00,000', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  emdDetails?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pbgRequired?: boolean;

  @ApiPropertyOptional({ example: '3%', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pbgDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eligibilityNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeNotes?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}