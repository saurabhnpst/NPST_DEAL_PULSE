import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class EvidenceFieldsDto {
  @ApiProperty({
    description:
      'Document id from Document Service (logical reference; files are not stored in Compliance Service)',
    format: 'uuid',
    example: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({ example: 'ISO 27001 certificate', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Certificate',
    description: 'Evidence type label (e.g. Certificate, Report, Policy)',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  evidenceType?: string;

  @ApiPropertyOptional({
    description: 'External URL pointer only (no file upload or storage here)',
    example: 'https://portal.example.com/docs/iso-cert-2024.pdf',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'referenceUrl must be a valid URL' })
  @MaxLength(2048)
  referenceUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional reference metadata (portal path, version, checksum ref, etc.)',
    example: { portal: 'dealplus', version: '3' },
  })
  @IsOptional()
  @IsObject()
  referenceMetadata?: Record<string, unknown>;
}