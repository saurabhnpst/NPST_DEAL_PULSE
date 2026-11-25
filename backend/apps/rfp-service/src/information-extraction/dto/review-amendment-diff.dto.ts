import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const actions = ['accepted', 'rejected', 'pending'] as const;

export class ReviewAmendmentDiffDto {
  @ApiProperty({ enum: actions })
  @IsEnum(actions)
  action!: (typeof actions)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}