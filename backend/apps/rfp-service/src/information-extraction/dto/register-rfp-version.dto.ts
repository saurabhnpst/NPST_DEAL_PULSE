import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { RfpVersionType } from '../../common/constants/rfp-extraction.constants';

export class RegisterRfpVersionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  documentId!: string;

  @ApiPropertyOptional({ enum: ['initial', 'amendment'] })
  @IsOptional()
  @IsEnum(['initial', 'amendment'] as const)
  versionType?: RfpVersionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  receivedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}