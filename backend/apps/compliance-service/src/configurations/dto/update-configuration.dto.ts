import { PartialType } from '@nestjs/swagger';
import { ConfigurationFieldsDto } from './configuration-fields.dto';

export class UpdateConfigurationDto extends PartialType(ConfigurationFieldsDto) {}