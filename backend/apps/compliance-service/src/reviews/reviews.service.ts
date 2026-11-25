import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentStatus } from '../common/enums/assessment-status.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { AssessmentsService } from '../assessments/assessments.service';
import { ComplianceAssessmentReview } from '../entities/compliance-assessment-review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { SubmitReviewDecisionDto } from './dto/submit-review-decision.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AssessmentSignoffGuard } from '../common/services/assessment-signoff.guard';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ComplianceAssessmentReview)
    private readonly reviewRepo: Repository<ComplianceAssessmentReview>,
    private readonly assessmentsService: AssessmentsService,
    private readonly signoffGuard: AssessmentSignoffGuard,
  ) {}

  async create(
    assessmentId: string,
    dto: CreateReviewDto,
    actorId?: string,
  ): Promise<ComplianceAssessmentReview> {
    const assessment = await this.assessmentsService.findOne(assessmentId);
    this.assertReviewPhase(assessment.status);
    await this.signoffGuard.assertNotLockedBySignedOff(assessmentId);

    const review = this.reviewRepo.create({
      assessment,
      comments: dto.comments ?? null,
      reviewerActorId: actorId ?? null,
      decision: null,
      submittedAt: null,
    });

    try {
      return await this.reviewRepo.save(review);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Review conflicts with an existing record',
      });
    }
  }

  async findByAssessment(assessmentId: string): Promise<ComplianceAssessmentReview[]> {
    await this.assessmentsService.findOne(assessmentId);
    return this.reviewRepo.find({
      where: { assessment: { id: assessmentId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    assessmentId: string,
    reviewId: string,
  ): Promise<ComplianceAssessmentReview> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, assessment: { id: assessmentId } },
      relations: { assessment: true },
    });
    if (!review) {
      throw new NotFoundException(
        `Review ${reviewId} not found for assessment ${assessmentId}`,
      );
    }
    return review;
  }

  async updateComments(
    assessmentId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ComplianceAssessmentReview> {
    const review = await this.findOne(assessmentId, reviewId);
    this.assertReviewPhase(review.assessment.status);
    await this.signoffGuard.assertNotLockedBySignedOff(assessmentId);
    this.assertNotSubmitted(review);

    if (dto.comments !== undefined) {
      review.comments = dto.comments ?? null;
    }

    return this.reviewRepo.save(review);
  }

  async submitDecision(
    assessmentId: string,
    reviewId: string,
    dto: SubmitReviewDecisionDto,
  ): Promise<ComplianceAssessmentReview> {
    const review = await this.findOne(assessmentId, reviewId);
    const assessment = review.assessment;

    if (assessment.status !== AssessmentStatus.IN_REVIEW) {
      throw new BadRequestException(
        'Reviews can only be submitted while the assessment is In Review',
      );
    }
    await this.signoffGuard.assertNotLockedBySignedOff(assessmentId);

    if (review.submittedAt) {
      throw new ConflictException('Review decision has already been submitted');
    }

    review.decision = dto.decision;
    if (dto.comments !== undefined) {
      review.comments = dto.comments ?? null;
    }
    review.submittedAt = new Date();

    return this.reviewRepo.save(review);
  }

  private assertReviewPhase(status: AssessmentStatus): void {
    if (status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Reviews cannot be created or changed after the assessment is completed',
      );
    }
    if (status !== AssessmentStatus.IN_REVIEW) {
      throw new BadRequestException(
        'Reviews can only be created or updated while the assessment is In Review',
      );
    }
  }

  private assertNotSubmitted(review: ComplianceAssessmentReview): void {
    if (review.submittedAt) {
      throw new BadRequestException(
        'Submitted reviews cannot be edited; create a new review if needed',
      );
    }
  }
}