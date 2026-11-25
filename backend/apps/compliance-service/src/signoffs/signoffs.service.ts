import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { AssessmentStatus } from '../common/enums/assessment-status.enum';
import { ReviewDecision } from '../common/enums/review-decision.enum';
import { SignoffDecision } from '../common/enums/signoff-decision.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { AssessmentsService } from '../assessments/assessments.service';
import { ComplianceAssessmentReview } from '../entities/compliance-assessment-review.entity';
import { ComplianceAssessmentSignoff } from '../entities/compliance-assessment-signoff.entity';
import { MatricesService } from '../matrices/matrices.service';
import { CreateSignoffDto } from './dto/create-signoff.dto';

@Injectable()
export class SignoffsService {
  constructor(
    @InjectRepository(ComplianceAssessmentSignoff)
    private readonly signoffRepo: Repository<ComplianceAssessmentSignoff>,
    @InjectRepository(ComplianceAssessmentReview)
    private readonly reviewRepo: Repository<ComplianceAssessmentReview>,
    private readonly assessmentsService: AssessmentsService,
    private readonly matricesService: MatricesService,
  ) {}

  async create(
    assessmentId: string,
    dto: CreateSignoffDto,
    signerActorId?: string,
  ): Promise<ComplianceAssessmentSignoff> {
    const assessment = await this.assessmentsService.findOne(assessmentId);

    if (assessment.status !== AssessmentStatus.IN_REVIEW) {
      throw new BadRequestException(
        'Sign-off is only allowed while the assessment is In Review',
      );
    }

    const existing = await this.signoffRepo.findOne({
      where: { assessment: { id: assessmentId } },
    });
    if (existing) {
      throw new ConflictException(
        'A sign-off record already exists for this assessment',
      );
    }

    await this.assertReviewConditions(assessmentId, dto.decision);

    if (dto.decision === SignoffDecision.SIGNED_OFF) {
      await this.matricesService.assertMatrixReadyForSignOff(assessmentId);
    }

    const signoff = this.signoffRepo.create({
      assessment,
      decision: dto.decision,
      comments: dto.comments ?? null,
      signerActorId: signerActorId ?? null,
      signedOffAt: dto.signedOffAt ? new Date(dto.signedOffAt) : new Date(),
    });

    try {
      return await this.signoffRepo.save(signoff);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Sign-off already recorded for this assessment',
      });
    }
  }

  async findByAssessment(
    assessmentId: string,
  ): Promise<ComplianceAssessmentSignoff[]> {
    await this.assessmentsService.findOne(assessmentId);
    return this.signoffRepo.find({
      where: { assessment: { id: assessmentId } },
      order: { signedOffAt: 'DESC' },
    });
  }

  async findOne(
    assessmentId: string,
    signoffId: string,
  ): Promise<ComplianceAssessmentSignoff> {
    const signoff = await this.signoffRepo.findOne({
      where: { id: signoffId, assessment: { id: assessmentId } },
      relations: { assessment: true },
    });
    if (!signoff) {
      throw new NotFoundException(
        `Sign-off ${signoffId} not found for assessment ${assessmentId}`,
      );
    }
    return signoff;
  }

  private async assertReviewConditions(
    assessmentId: string,
    decision: SignoffDecision,
  ): Promise<void> {
    const submittedCount = await this.reviewRepo.count({
      where: {
        assessment: { id: assessmentId },
        submittedAt: Not(IsNull()),
      },
    });

    if (submittedCount === 0) {
      throw new BadRequestException(
        'At least one submitted SME review is required before sign-off',
      );
    }

    if (decision === SignoffDecision.SIGNED_OFF) {
      const approvedCount = await this.reviewRepo.count({
        where: {
          assessment: { id: assessmentId },
          decision: ReviewDecision.APPROVED,
          submittedAt: Not(IsNull()),
        },
      });
      if (approvedCount === 0) {
        throw new BadRequestException(
          'At least one submitted review with decision APPROVED is required for SIGNED_OFF',
        );
      }
    }
  }
}