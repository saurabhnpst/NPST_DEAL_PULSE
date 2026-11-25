import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractedTextPageDto {
  @ApiProperty()
  pageNumber!: number;

  @ApiProperty()
  extractionMethod!: string;

  @ApiProperty()
  charCount!: number;

  @ApiProperty()
  hasUsableText!: boolean;

  @ApiPropertyOptional()
  ocrConfidence?: number | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  text!: string;
}

export class ExtractedTextResponseDto {
  @ApiProperty({ format: 'uuid' })
  processingJobId!: string;

  @ApiProperty()
  format!: 'pages' | 'concat' | 'page';

  @ApiPropertyOptional()
  pageNumber?: number;

  @ApiPropertyOptional({ type: [ExtractedTextPageDto] })
  pages?: ExtractedTextPageDto[];

  @ApiPropertyOptional()
  text?: string;
}