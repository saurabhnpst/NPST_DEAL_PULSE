import { PartialType } from '@nestjs/swagger';
import { AssessmentFieldsDto } from './assessment-fields.dto';

export class UpdateAssessmentDto extends PartialType(AssessmentFieldsDto) {}