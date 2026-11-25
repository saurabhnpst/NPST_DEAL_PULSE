import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangedBy } from '../common/decorators/changed-by.decorator';
import { ComplianceAssessmentReview } from '../entities/compliance-assessment-review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { SubmitReviewDecisionDto } from './dto/submit-review-decision.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('assessments/:assessmentId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an SME review record',
    description: 'Draft review with optional comments. Decision is set on submit.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 201, type: ComplianceAssessmentReview })
  @ApiResponse({ status: 400, description: 'Assessment completed' })
  create(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Body() dto: CreateReviewDto,
    @ChangedBy() actorId?: string,
  ): Promise<ComplianceAssessmentReview> {
    return this.reviewsService.create(assessmentId, dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List reviews for an assessment' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ComplianceAssessmentReview] })
  findAll(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
  ): Promise<ComplianceAssessmentReview[]> {
    return this.reviewsService.findByAssessment(assessmentId);
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get review by id' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessmentReview })
  @ApiResponse({ status: 404, description: 'Review not found' })
  findOne(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<ComplianceAssessmentReview> {
    return this.reviewsService.findOne(assessmentId, reviewId);
  }

  @Patch(':reviewId')
  @ApiOperation({ summary: 'Update review comments (draft only)' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessmentReview })
  @ApiResponse({ status: 400, description: 'Review already submitted' })
  updateComments(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ComplianceAssessmentReview> {
    return this.reviewsService.updateComments(assessmentId, reviewId, dto);
  }

  @Post(':reviewId/submit')
  @ApiOperation({
    summary: 'Submit review decision',
    description:
      'Sets APPROVED, REJECTED, or NEEDS_CHANGES. Assessment must be In Review; review must not be submitted yet.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessmentReview })
  @ApiResponse({ status: 409, description: 'Already submitted' })
  submit(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: SubmitReviewDecisionDto,
  ): Promise<ComplianceAssessmentReview> {
    return this.reviewsService.submitDecision(assessmentId, reviewId, dto);
  }
}