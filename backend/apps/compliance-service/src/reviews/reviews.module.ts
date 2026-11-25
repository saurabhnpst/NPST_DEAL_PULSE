import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceWorkflowModule } from '../common/compliance-workflow.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ComplianceAssessmentReview } from '../entities/compliance-assessment-review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceAssessmentReview]),
    AssessmentsModule,
    ComplianceWorkflowModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}