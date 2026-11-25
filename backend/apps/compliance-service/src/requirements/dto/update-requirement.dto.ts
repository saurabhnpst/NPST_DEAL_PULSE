import { PartialType } from '@nestjs/swagger';
import { RequirementFieldsDto } from './requirement-fields.dto';

export class UpdateRequirementDto extends PartialType(RequirementFieldsDto) {}