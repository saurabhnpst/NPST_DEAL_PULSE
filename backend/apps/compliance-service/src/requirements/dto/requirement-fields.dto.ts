import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RequirementFieldsDto {
  @ApiProperty({ example: 'UPI-3.1.2', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: 'Data localisation for payment data', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Security', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  category?: string;

  @ApiPropertyOptional({
    example: 'Mandatory',
    description: 'Business criticality (e.g. Mandatory, Supportive)',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  criticality?: string;

  @ApiPropertyOptional({
    description: 'External reference or clause text',
    example: 'NPCI Circular 2024-03, clause 4.2',
  })
  @IsOptional()
  @IsString()
  referenceClause?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}