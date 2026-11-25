import { ApiProperty } from '@nestjs/swagger';

export class StartProcessingResponseDto {
  @ApiProperty({ format: 'uuid' })
  processingJobId!: string;

  @ApiProperty({ example: 'pending' })
  status!: string;

  @ApiProperty({ example: 'PDF processing job queued' })
  message!: string;
}