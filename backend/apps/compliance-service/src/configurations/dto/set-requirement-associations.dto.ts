import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetRequirementAssociationsDto {
  @ApiProperty({
    type: [String],
    description:
      'Replaces all requirement associations; each requirement must belong to a framework linked to this configuration',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  requirementIds: string[];
}