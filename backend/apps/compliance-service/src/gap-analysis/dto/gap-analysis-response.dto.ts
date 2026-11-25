import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GapRequirementDetailDto } from './gap-requirement-detail.dto';
import { StatusCountsDto } from './status-counts.dto';

/** Documented compliance % formula returned with every response. */
export const GAP_ANALYSIS_FORMULA =
  'compliancePercentage = applicableRequirements === 0 ? 0 : round((compliantCount / applicableRequirements) * 100, 2); applicableRequirements = totalMatrixEntries - notApplicableCount; only COMPLIANT rows count toward compliantCount; NOT_APPLICABLE rows are excluded from the denominator.';

export class GapAnalysisResponseDto {
  @ApiProperty({ format: 'uuid' })
  assessmentId: string;

  @ApiProperty({
    description: 'How compliancePercentage is derived',
    example: GAP_ANALYSIS_FORMULA,
  })
  compliancePercentageFormula: string;

  @ApiProperty({ type: StatusCountsDto })
  countsByStatus: StatusCountsDto;

  @ApiProperty({
    description: 'All matrix rows for this assessment after optional filters',
  })
  totalMatrixEntries: number;

  @ApiProperty({
    description: 'Rows with compliance status other than NOT_APPLICABLE',
  })
  applicableRequirements: number;

  @ApiProperty()
  notApplicableCount: number;

  @ApiProperty({ description: 'Rows with compliance status COMPLIANT' })
  compliantCount: number;

  @ApiProperty({
    description: 'Percentage of applicable requirements that are COMPLIANT (0–100)',
    example: 75.5,
  })
  compliancePercentage: number;

  @ApiProperty({ type: [GapRequirementDetailDto] })
  nonCompliantRequirements: GapRequirementDetailDto[];

  @ApiProperty({ type: [GapRequirementDetailDto] })
  partiallyCompliantRequirements: GapRequirementDetailDto[];

  @ApiProperty({ type: [GapRequirementDetailDto] })
  pendingRequirements: GapRequirementDetailDto[];

  @ApiProperty({ type: [GapRequirementDetailDto] })
  notApplicableRequirements: GapRequirementDetailDto[];

  @ApiPropertyOptional({ description: 'Category filter applied to this report' })
  filterCategory?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Framework filter applied' })
  filterFrameworkId?: string;

  @ApiProperty({
    description: 'True when no matrix rows exist for the assessment',
  })
  matrixNotInitialized: boolean;
}