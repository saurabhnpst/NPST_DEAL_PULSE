import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConfigurationStatus } from '../../common/enums/configuration-status.enum';

export class ConfigurationFieldsDto {
  @ApiProperty({ example: 'Meridian UPI — compliance pack', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Opportunity id from Opportunity Service (logical reference only)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional({
    description: 'Project id when distinct from opportunity',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ example: 'UPI', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productTsp?: string;

  @ApiPropertyOptional({ enum: ConfigurationStatus, default: ConfigurationStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ConfigurationStatus)
  status?: ConfigurationStatus;
}