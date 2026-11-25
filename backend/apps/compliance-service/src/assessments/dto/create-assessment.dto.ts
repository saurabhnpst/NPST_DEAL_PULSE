import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';
import { AssessmentFieldsDto } from './assessment-fields.dto';

export class CreateAssessmentDto extends AssessmentFieldsDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Active configuration that defines frameworks and requirements',
  })
  @IsUUID()
  configurationId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Opportunity reference; defaults to configuration opportunityId when omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36) // opportunity public id (OPP-YYYY-NNNNN)
  opportunityId?: string;
}