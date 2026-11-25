import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiPropertyOptional({
    description: 'Initial SME feedback (can be updated before submit)',
    example: 'Legal review scheduled for next week.',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}