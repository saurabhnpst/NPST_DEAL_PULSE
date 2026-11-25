import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatrixComplianceStatus } from '../common/enums/matrix-compliance-status.enum';
import { AssessmentsService } from '../assessments/assessments.service';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import {
  GAP_ANALYSIS_FORMULA,
  GapAnalysisResponseDto,
} from './dto/gap-analysis-response.dto';
import { GapAnalysisQueryDto } from './dto/gap-analysis-query.dto';
import { GapRequirementDetailDto } from './dto/gap-requirement-detail.dto';
import {
  emptyStatusCounts,
  incrementStatusCount,
  StatusCountsDto,
} from './dto/status-counts.dto';

@Injectable()
export class GapAnalysisService {
  constructor(
    @InjectRepository(ComplianceAssessmentLine)
    private readonly lineRepo: Repository<ComplianceAssessmentLine>,
    private readonly assessmentsService: AssessmentsService,
  ) {}

  async getForAssessment(
    assessmentId: string,
    query: GapAnalysisQueryDto,
  ): Promise<GapAnalysisResponseDto> {
    await this.assessmentsService.findOne(assessmentId);

    const lines = await this.lineRepo.find({
      where: { assessment: { id: assessmentId } },
      relations: { requirement: { framework: true } },
      order: { sortOrder: 'ASC', requirementTitle: 'ASC' },
    });

    const filtered = lines.filter((line) => this.matchesFilters(line, query));

    const counts = emptyStatusCounts();
    for (const line of filtered) {
      incrementStatusCount(counts, line.complianceStatus);
    }

    const totalMatrixEntries = filtered.length;
    const notApplicableCount = counts.NOT_APPLICABLE;
    const compliantCount = counts.COMPLIANT;
    const applicableRequirements = totalMatrixEntries - notApplicableCount;
    const compliancePercentage = this.calculateCompliancePercentage(
      compliantCount,
      applicableRequirements,
    );

    const details = filtered.map((line) => this.toDetail(line));

    return {
      assessmentId,
      compliancePercentageFormula: GAP_ANALYSIS_FORMULA,
      countsByStatus: counts,
      totalMatrixEntries,
      applicableRequirements,
      notApplicableCount,
      compliantCount,
      compliancePercentage,
      nonCompliantRequirements: details.filter(
        (d) => d.complianceStatus === MatrixComplianceStatus.NON_COMPLIANT,
      ),
      partiallyCompliantRequirements: details.filter(
        (d) => d.complianceStatus === MatrixComplianceStatus.PARTIALLY_COMPLIANT,
      ),
      pendingRequirements: details.filter(
        (d) => d.complianceStatus === MatrixComplianceStatus.PENDING,
      ),
      notApplicableRequirements: details.filter(
        (d) => d.complianceStatus === MatrixComplianceStatus.NOT_APPLICABLE,
      ),
      filterCategory: query.category,
      filterFrameworkId: query.frameworkId,
      matrixNotInitialized: lines.length === 0,
    };
  }

  /**
   * compliancePercentage = (compliantCount / applicableRequirements) * 100
   * applicableRequirements excludes NOT_APPLICABLE rows.
   */
  calculateCompliancePercentage(
    compliantCount: number,
    applicableRequirements: number,
  ): number {
    if (applicableRequirements === 0) {
      return 0;
    }
    const raw = (compliantCount / applicableRequirements) * 100;
    return Math.round(raw * 100) / 100;
  }

  private matchesFilters(
    line: ComplianceAssessmentLine,
    query: GapAnalysisQueryDto,
  ): boolean {
    if (query.category) {
      const category = line.requirement?.category ?? '';
      if (category.toLowerCase() !== query.category.toLowerCase()) {
        return false;
      }
    }
    if (query.frameworkId) {
      const frameworkId = line.requirement?.framework?.id;
      if (frameworkId !== query.frameworkId) {
        return false;
      }
    }
    return true;
  }

  private toDetail(line: ComplianceAssessmentLine): GapRequirementDetailDto {
    const req = line.requirement;
    const framework = req?.framework;
    return {
      matrixEntryId: line.id,
      requirementId: req?.id ?? line.requirement.id,
      requirementCode: line.requirementCode,
      requirementTitle: line.requirementTitle,
      category: req?.category ?? null,
      frameworkId: framework?.id ?? null,
      frameworkCode: framework?.code ?? null,
      frameworkName: framework?.name ?? null,
      complianceStatus: line.complianceStatus,
      notes: line.notes,
      reviewerObservations: line.reviewerObservations,
    };
  }
}