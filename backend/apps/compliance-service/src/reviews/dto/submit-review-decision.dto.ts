import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReviewDecision } from '../../common/enums/review-decision.enum';

export class SubmitReviewDecisionDto {
  @ApiProperty({
    enum: ReviewDecision,
    example: ReviewDecision.APPROVED,
  })
  @IsEnum(ReviewDecision)
  decision: ReviewDecision;

  @ApiPropertyOptional({
    description: 'Optional final comments applied on submit',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}