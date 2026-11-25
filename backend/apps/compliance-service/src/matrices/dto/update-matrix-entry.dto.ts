import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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

  @ApiPropertyOptional({ enum: ['Pending', 'Approved', 'Rejected'], description: 'SME review of this row' })
  @IsOptional()
  @IsIn(['Pending', 'Approved', 'Rejected'])
  reviewStatus?: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  criticality?: string;

  @ApiPropertyOptional({ example: 'Security' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;
}

/** Custom matrix row (not from the requirement library). */
export class AddMatrixEntryDto {
  @ApiPropertyOptional({ example: 'SIEM monitoring' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ example: 'S' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  criticality?: string;

  @ApiPropertyOptional({ example: 'Security' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ enum: MatrixComplianceStatus })
  @IsOptional()
  @IsEnum(MatrixComplianceStatus)
  complianceStatus?: MatrixComplianceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
