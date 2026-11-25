import { ApiProperty } from '@nestjs/swagger';
import { Rfp } from '../entities/rfp.entity';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class PaginatedRfpsResponseDto {
  @ApiProperty({ type: [Rfp] })
  data!: Rfp[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}