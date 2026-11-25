import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssessmentStatus } from '../../common/enums/assessment-status.enum';

export class ChangeAssessmentStatusDto {
  @ApiProperty({
    enum: AssessmentStatus,
    description:
      'Target status. Allowed: Draft→InProgress; InProgress→InReview; InReview→InProgress|Completed. Use POST .../start or .../complete where provided.',
  })
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;
}