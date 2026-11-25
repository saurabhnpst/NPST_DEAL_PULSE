import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthLiveResponseDto {
  @ApiProperty({ example: 'rfp-service' })
  service!: string;

  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2026-11-20T10:00:00.000Z' })
  timestamp!: string;
}

export class HealthReadyResponseDto {
  @ApiProperty({ example: 'rfp-service' })
  service!: string;

  @ApiProperty({ example: 'ready' })
  status!: string;

  @ApiProperty({ example: 'up' })
  database!: string;

  @ApiPropertyOptional({ example: 'rfp_db' })
  dbName?: string | null;

  @ApiProperty({ example: '2026-11-20T10:00:00.000Z' })
  timestamp!: string;
}