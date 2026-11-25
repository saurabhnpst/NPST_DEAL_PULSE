import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Updated comments (only while review is not submitted)',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}