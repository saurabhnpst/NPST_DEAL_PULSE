import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AssessmentStatus } from '../common/enums/assessment-status.enum';
import { MatrixComplianceStatus } from '../common/enums/matrix-compliance-status.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { AssessmentsService } from '../assessments/assessments.service';
import { ConfigurationsService } from '../configurations/configurations.service';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { ComplianceAssessment } from '../entities/compliance-assessment.entity';
import { UpdateMatrixEntryDto } from './dto/update-matrix-entry.dto';
import { AssessmentSignoffGuard } from '../common/services/assessment-signoff.guard';

@Injectable()
export class MatricesService {
  constructor(
    @InjectRepository(ComplianceAssessmentLine)
    private readonly lineRepo: Repository<ComplianceAssessmentLine>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly assessmentsService: AssessmentsService,
    private readonly configurationsService: ConfigurationsService,
    private readonly signoffGuard: AssessmentSignoffGuard,
  ) {}

  async initialize(assessmentId: string): Promise<ComplianceAssessmentLine[]> {
    return this.dataSource.transaction(async (manager) => {
      const assessment = await this.getAssessmentForMatrix(assessmentId);
      await this.assertMatrixMutable(assessment);

      const configuration = await this.configurationsService.findOne(
        assessment.configuration.id,
      );
      const requirementLinks = configuration.requirementLinks ?? [];
      if (requirementLinks.length === 0) {
        throw new BadRequestException(
          'Configuration has no requirements to populate the matrix',
        );
      }

      const lineRepo = manager.getRepository(ComplianceAssessmentLine);
      const assessmentRef = { id: assessmentId } as ComplianceAssessment;

      const existing = await lineRepo.find({
        where: { assessment: { id: assessmentId } },
        relations: { requirement: true },
      });
      const existingReqIds = new Set(existing.map((l) => l.requirement.id));

      const toCreate: ComplianceAssessmentLine[] = [];
      for (const link of requirementLinks) {
        const requirement = link.requirement;
        if (!requirement || existingReqIds.has(requirement.id)) {
          continue;
        }
        toCreate.push(
          lineRepo.create({
            assessment: assessmentRef,
            requirement,
            requirementCode: requirement.code,
            requirementTitle: requirement.title,
            complianceStatus: MatrixComplianceStatus.PENDING,
            sortOrder: link.sortOrder ?? requirement.sortOrder ?? 0,
          }),
        );
      }

      if (toCreate.length > 0) {
        try {
          await lineRepo.save(toCreate);
        } catch (err) {
          rethrowPersistenceError(err, {
            duplicate:
              'Duplicate matrix entry for the same assessment and requirement',
          });
        }
      }

      return this.listForAssessment(assessmentId, manager);
    });
  }

  async listForAssessment(
    assessmentId: string,
    manager?: EntityManager,
  ): Promise<ComplianceAssessmentLine[]> {
    await this.assessmentsService.findOne(assessmentId);
    const repo = manager
      ? manager.getRepository(ComplianceAssessmentLine)
      : this.lineRepo;

    return repo.find({
      where: { assessment: { id: assessmentId } },
      relations: { requirement: true },
      order: { sortOrder: 'ASC', requirementTitle: 'ASC' },
    });
  }

  async findOne(
    assessmentId: string,
    entryId: string,
  ): Promise<ComplianceAssessmentLine> {
    const line = await this.lineRepo.findOne({
      where: { id: entryId, assessment: { id: assessmentId } },
      relations: { requirement: true, assessment: true },
    });
    if (!line) {
      throw new NotFoundException(
        `Matrix entry ${entryId} not found for assessment ${assessmentId}`,
      );
    }
    return line;
  }

  async update(
    assessmentId: string,
    entryId: string,
    dto: UpdateMatrixEntryDto,
  ): Promise<ComplianceAssessmentLine> {
    const assessment = await this.getAssessmentForMatrix(assessmentId);
    await this.assertMatrixMutable(assessment);

    const line = await this.findOne(assessmentId, entryId);

    if (dto.complianceStatus !== undefined) {
      line.complianceStatus = dto.complianceStatus;
    }
    if (dto.notes !== undefined) {
      line.notes = dto.notes ?? null;
    }
    if (dto.reviewerObservations !== undefined) {
      line.reviewerObservations = dto.reviewerObservations ?? null;
    }

    try {
      return await this.lineRepo.save(line);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Matrix entry update conflicts with an existing record',
      });
    }
  }

  async countIncompleteForAssessment(assessmentId: string): Promise<number> {
    return this.lineRepo.count({
      where: {
        assessment: { id: assessmentId },
        complianceStatus: In([
          MatrixComplianceStatus.PENDING,
          MatrixComplianceStatus.PARTIALLY_COMPLIANT,
          MatrixComplianceStatus.NON_COMPLIANT,
        ]),
      },
    });
  }

  async assertMatrixReadyForSignOff(assessmentId: string): Promise<void> {
    const total = await this.lineRepo.count({
      where: { assessment: { id: assessmentId } },
    });
    if (total === 0) {
      throw new BadRequestException(
        'Initialize the compliance matrix before sign-off',
      );
    }
    const incomplete = await this.countIncompleteForAssessment(assessmentId);
    if (incomplete > 0) {
      throw new BadRequestException(
        `Matrix must have no pending, partial, or non-compliant rows before sign-off (${incomplete} outstanding)`,
      );
    }
  }

  private async getAssessmentForMatrix(
    assessmentId: string,
  ): Promise<ComplianceAssessment> {
    return this.assessmentsService.findOne(assessmentId);
  }

  private async assertMatrixMutable(
    assessment: ComplianceAssessment,
  ): Promise<void> {
    if (assessment.status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Matrix cannot be changed after the assessment is completed',
      );
    }
    await this.signoffGuard.assertNotLockedBySignedOff(assessment.id);
  }
}