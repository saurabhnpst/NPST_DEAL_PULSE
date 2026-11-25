import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'compliance-service' })
  service!: string;

  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2026-11-23T10:00:00.000Z' })
  timestamp!: string;
}