import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';
import { ConfigurationFieldsDto } from './configuration-fields.dto';

export class CreateConfigurationDto extends ConfigurationFieldsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Framework ids to associate on create',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  frameworkIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Requirement ids to associate on create (each must belong to a listed framework)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  requirementIds?: string[];
}