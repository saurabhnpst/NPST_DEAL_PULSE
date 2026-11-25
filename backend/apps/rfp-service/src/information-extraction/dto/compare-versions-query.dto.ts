import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CompareVersionsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fromVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toVersionId!: string;
}