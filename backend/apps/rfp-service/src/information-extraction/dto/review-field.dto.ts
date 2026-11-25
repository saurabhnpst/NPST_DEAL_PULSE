import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RfpFieldReviewStatus } from '../../common/constants/rfp-extraction.constants';

const actions = [
  'accepted',
  'corrected',
  'rejected',
  'unresolved',
  'confirmed',
] as const;

export class ReviewFieldDto {
  @ApiProperty({ enum: actions })
  @IsEnum(actions)
  action!: RfpFieldReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}