import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';
import { ConfigurationStatus } from '../../common/enums/configuration-status.enum';

export class ListConfigurationsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(36) // opportunity public id (OPP-YYYY-NNNNN)
  opportunityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: ConfigurationStatus })
  @IsOptional()
  @IsEnum(ConfigurationStatus)
  status?: ConfigurationStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Configurations that include this framework',
  })
  @IsOptional()
  @IsUUID()
  frameworkId?: string;
}