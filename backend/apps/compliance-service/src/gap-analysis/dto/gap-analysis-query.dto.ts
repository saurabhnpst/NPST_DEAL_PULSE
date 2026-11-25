import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class GapAnalysisQueryDto {
  @ApiPropertyOptional({
    description: 'Filter matrix rows by library requirement category',
    example: 'Security',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter matrix rows by parent framework id',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  frameworkId?: string;
}