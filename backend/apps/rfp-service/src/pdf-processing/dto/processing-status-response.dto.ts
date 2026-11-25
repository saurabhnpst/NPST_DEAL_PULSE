import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessingStatusResponseDto {
  @ApiProperty({ format: 'uuid' })
  processingJobId!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ minimum: 1 })
  attempt?: number | null;

  @ApiPropertyOptional()
  pageCount?: number | null;

  @ApiProperty()
  processedPageCount!: number;

  @ApiProperty()
  failedPageCount!: number;

  @ApiProperty({ type: [String] })
  extractionMethodsUsed!: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt?: string | null;

  @ApiPropertyOptional()
  errorCode?: string | null;

  @ApiPropertyOptional()
  errorMessage?: string | null;
}