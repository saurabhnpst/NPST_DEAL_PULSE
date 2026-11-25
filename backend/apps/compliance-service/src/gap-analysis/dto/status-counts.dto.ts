import { ApiProperty } from '@nestjs/swagger';
import { MatrixComplianceStatus } from '../../common/enums/matrix-compliance-status.enum';

export class StatusCountsDto {
  @ApiProperty({ example: 2 })
  PENDING: number;

  @ApiProperty({ example: 8 })
  COMPLIANT: number;

  @ApiProperty({ example: 1 })
  PARTIALLY_COMPLIANT: number;

  @ApiProperty({ example: 1 })
  NON_COMPLIANT: number;

  @ApiProperty({ example: 0 })
  NOT_APPLICABLE: number;
}

export function emptyStatusCounts(): StatusCountsDto {
  return {
    PENDING: 0,
    COMPLIANT: 0,
    PARTIALLY_COMPLIANT: 0,
    NON_COMPLIANT: 0,
    NOT_APPLICABLE: 0,
  };
}

export function incrementStatusCount(
  counts: StatusCountsDto,
  status: MatrixComplianceStatus,
): void {
  counts[status] = (counts[status] ?? 0) + 1;
}