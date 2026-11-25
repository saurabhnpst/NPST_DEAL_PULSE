import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  MATRIX_INCOMPLETE_STATUSES,
  MatrixComplianceStatus,
} from '../common/enums/matrix-compliance-status.enum';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { ASSESSMENT_ALLOWED_TRANSITIONS } from '../common/constants/assessment-transitions';
import { AssessmentStatus } from '../common/enums/assessment-status.enum';
import { ConfigurationStatus } from '../common/enums/configuration-status.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { ConfigurationsService } from '../configurations/configurations.service';
import { ComplianceAssessment } from '../entities/compliance-assessment.entity';
import { ComplianceConfiguration } from '../entities/compliance-configuration.entity';
import { ChangeAssessmentStatusDto } from './dto/change-assessment-status.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ListAssessmentsQueryDto } from './dto/list-assessments-query.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentSignoffGuard } from '../common/services/assessment-signoff.guard';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(ComplianceAssessment)
    private readonly assessmentRepo: Repository<ComplianceAssessment>,
    @InjectRepository(ComplianceAssessmentLine)
    private readonly matrixLineRepo: Repository<ComplianceAssessmentLine>,
    private readonly configurationsService: ConfigurationsService,
    private readonly signoffGuard: AssessmentSignoffGuard,
  ) {}

  async create(
    dto: CreateAssessmentDto,
    actorId?: string,
  ): Promise<ComplianceAssessment> {
    const configuration = await this.configurationsService.findOne(
      dto.configurationId,
    );
    if (configuration.status !== ConfigurationStatus.ACTIVE) {
      throw new BadRequestException(
        'Configuration must be Active to create an assessment',
      );
    }

    const opportunityId =
      dto.opportunityId ?? configuration.opportunityId ?? undefined;
    if (!opportunityId) {
      throw new BadRequestException(
        'opportunityId is required when the configuration has no opportunity reference',
      );
    }

    if (
      configuration.opportunityId &&
      dto.opportunityId &&
      configuration.opportunityId !== dto.opportunityId
    ) {
      throw new BadRequestException(
        'opportunityId does not match the linked configuration',
      );
    }

    const assessment = this.assessmentRepo.create({
      configuration,
      opportunityId,
      projectId: dto.projectId ?? configuration.projectId ?? null,
      name: dto.name,
      description: dto.description ?? null,
      status: AssessmentStatus.DRAFT,
      createdByActorId: actorId ?? null,
    });

    try {
      return await this.saveAndLoad(assessment);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'An assessment with the same unique constraints already exists',
      });
    }
  }

  async findAll(query: ListAssessmentsQueryDto): Promise<ComplianceAssessment[]> {
    const qb = this.assessmentRepo
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.configuration', 'configuration')
      .orderBy('assessment.updatedAt', 'DESC');

    if (query.opportunityId) {
      qb.andWhere('assessment.opportunity_id = :opportunityId', {
        opportunityId: query.opportunityId,
      });
    }
    if (query.projectId) {
      qb.andWhere('assessment.project_id = :projectId', {
        projectId: query.projectId,
      });
    }
    if (query.configurationId) {
      qb.andWhere('assessment.configuration_id = :configurationId', {
        configurationId: query.configurationId,
      });
    }
    if (query.status) {
      qb.andWhere('assessment.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<ComplianceAssessment> {
    const assessment = await this.assessmentRepo.findOne({
      where: { id },
      relations: { configuration: true },
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }
    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto): Promise<ComplianceAssessment> {
    const assessment = await this.findOne(id);
    if (assessment.status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException('Completed assessments cannot be updated');
    }
    await this.signoffGuard.assertNotLockedBySignedOff(id);

    if (dto.name !== undefined) assessment.name = dto.name;
    if (dto.description !== undefined) {
      assessment.description = dto.description ?? null;
    }
    if (dto.projectId !== undefined) assessment.projectId = dto.projectId ?? null;

    try {
      return await this.saveAndLoad(assessment);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Assessment update conflicts with an existing record',
      });
    }
  }

  async start(id: string): Promise<ComplianceAssessment> {
    const assessment = await this.findOne(id);
    if (assessment.status !== AssessmentStatus.DRAFT) {
      throw new BadRequestException('Only draft assessments can be started');
    }

    const configuration = await this.configurationsService.findOne(
      assessment.configuration.id,
    );
    this.assertConfigurationReady(configuration, 'start this assessment');

    assessment.status = AssessmentStatus.IN_PROGRESS;
    assessment.startedAt = new Date();
    return this.saveAndLoad(assessment);
  }

  async changeStatus(
    id: string,
    dto: ChangeAssessmentStatusDto,
  ): Promise<ComplianceAssessment> {
    const assessment = await this.findOne(id);

    if (dto.status === AssessmentStatus.COMPLETED) {
      return this.complete(id);
    }

    if (dto.status === AssessmentStatus.IN_PROGRESS && assessment.status === AssessmentStatus.DRAFT) {
      throw new BadRequestException(
        'Use POST /assessments/:id/start to move from Draft to InProgress',
      );
    }

    this.assertTransitionAllowed(assessment.status, dto.status);

    if (
      assessment.status === AssessmentStatus.IN_REVIEW &&
      dto.status === AssessmentStatus.IN_PROGRESS
    ) {
      await this.signoffGuard.assertMayRevertFromInReview(id);
    }

    assessment.status = dto.status;
    if (dto.status === AssessmentStatus.IN_PROGRESS && !assessment.startedAt) {
      assessment.startedAt = new Date();
    }

    return this.saveAndLoad(assessment);
  }

  async complete(id: string): Promise<ComplianceAssessment> {
    const assessment = await this.findOne(id);

    if (assessment.status === AssessmentStatus.COMPLETED) {
      return assessment;
    }

    this.assertTransitionAllowed(assessment.status, AssessmentStatus.COMPLETED);

    const configuration = await this.configurationsService.findOne(
      assessment.configuration.id,
    );
    this.assertConfigurationReady(configuration, 'complete this assessment');

    if (assessment.status !== AssessmentStatus.IN_REVIEW) {
      throw new BadRequestException(
        'Assessment must be In Review before it can be completed',
      );
    }

    await this.signoffGuard.assertSignedOffBeforeComplete(assessment.id);
    await this.assertMatrixLinesSatisfied(assessment.id);

    assessment.status = AssessmentStatus.COMPLETED;
    assessment.completedAt = new Date();
    return this.saveAndLoad(assessment);
  }

  private assertTransitionAllowed(
    current: AssessmentStatus,
    next: AssessmentStatus,
  ): void {
    const allowed = ASSESSMENT_ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private assertConfigurationReady(
    configuration: ComplianceConfiguration,
    action: string,
  ): void {
    if (configuration.status !== ConfigurationStatus.ACTIVE) {
      throw new BadRequestException(
        `Configuration must be Active to ${action}`,
      );
    }
    if (!configuration.frameworkLinks?.length) {
      throw new BadRequestException(
        `Configuration must include at least one framework to ${action}`,
      );
    }
    if (!configuration.requirementLinks?.length) {
      throw new BadRequestException(
        `Configuration must include at least one requirement to ${action}`,
      );
    }
  }

  private async assertMatrixLinesSatisfied(assessmentId: string): Promise<void> {
    const total = await this.matrixLineRepo.count({
      where: { assessment: { id: assessmentId } },
    });
    if (total === 0) {
      throw new BadRequestException(
        'Initialize the compliance matrix before completing the assessment',
      );
    }

    const incomplete = await this.matrixLineRepo.count({
      where: {
        assessment: { id: assessmentId },
        complianceStatus: In(MATRIX_INCOMPLETE_STATUSES),
      },
    });
    if (incomplete > 0) {
      throw new BadRequestException(
        `All matrix entries must be ${MatrixComplianceStatus.COMPLIANT} or ${MatrixComplianceStatus.NOT_APPLICABLE} before completion (${incomplete} outstanding)`,
      );
    }
  }

  private async saveAndLoad(
    assessment: ComplianceAssessment,
  ): Promise<ComplianceAssessment> {
    const saved = await this.assessmentRepo.save(assessment);
    return this.findOne(saved.id);
  }
}