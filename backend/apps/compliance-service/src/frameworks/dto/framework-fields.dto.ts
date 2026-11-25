import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { FrameworkStatus } from '../../common/enums/framework-status.enum';

export class FrameworkFieldsDto {
  @ApiProperty({ example: 'NPCI_UPI', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: 'NPCI UPI Guidelines', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2024.1', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  version?: string;

  @ApiPropertyOptional({ example: 'NPCI', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;

  @ApiPropertyOptional({ enum: FrameworkStatus, default: FrameworkStatus.ACTIVE })
  @IsOptional()
  @IsEnum(FrameworkStatus)
  status?: FrameworkStatus;

  @ApiPropertyOptional({
    description: 'Product, vertical, or applicability metadata (JSON object)',
    example: { productTsp: 'UPI', regions: ['IN'] },
  })
  @IsOptional()
  @IsObject()
  applicableMetadata?: Record<string, unknown>;
}