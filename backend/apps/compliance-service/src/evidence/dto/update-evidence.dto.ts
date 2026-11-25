import { PartialType, PickType } from '@nestjs/swagger';
import { EvidenceFieldsDto } from './evidence-fields.dto';

export class UpdateEvidenceDto extends PartialType(
  PickType(EvidenceFieldsDto, [
    'title',
    'description',
    'evidenceType',
    'referenceUrl',
    'referenceMetadata',
    'documentId',
  ] as const),
) {}