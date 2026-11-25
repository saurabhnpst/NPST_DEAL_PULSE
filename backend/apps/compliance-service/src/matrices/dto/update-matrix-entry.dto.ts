import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MatrixComplianceStatus } from '../../common/enums/matrix-compliance-status.enum';

export class UpdateMatrixEntryDto {
  @ApiPropertyOptional({
    enum: MatrixComplianceStatus,
    example: MatrixComplianceStatus.COMPLIANT,
  })
  @IsOptional()
  @IsEnum(MatrixComplianceStatus)
  complianceStatus?: MatrixComplianceStatus;

  @ApiPropertyOptional({
    description: 'Assessment notes or comments for this requirement',
    example: 'Evidence pack submitted; awaiting SME confirmation.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Reviewer-facing observations',
    example: 'Partial gap on DR drill documentation.',
  })
  @IsOptional()
  @IsString()
  reviewerObservations?: string;
}