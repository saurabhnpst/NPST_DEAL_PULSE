import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatrixComplianceStatus } from '../../common/enums/matrix-compliance-status.enum';

export class GapRequirementDetailDto {
  @ApiProperty({ format: 'uuid' })
  matrixEntryId: string;

  @ApiProperty({ format: 'uuid' })
  requirementId: string | null; // null for a custom matrix row

  @ApiProperty()
  requirementCode: string;

  @ApiProperty()
  requirementTitle: string;

  @ApiPropertyOptional()
  category: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  frameworkId: string | null;

  @ApiPropertyOptional()
  frameworkCode: string | null;

  @ApiPropertyOptional()
  frameworkName: string | null;

  @ApiProperty({ enum: MatrixComplianceStatus })
  complianceStatus: MatrixComplianceStatus;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiPropertyOptional()
  reviewerObservations: string | null;
}