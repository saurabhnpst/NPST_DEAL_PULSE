import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ComplianceAssessmentReview } from '../entities/compliance-assessment-review.entity';
import { ComplianceAssessmentSignoff } from '../entities/compliance-assessment-signoff.entity';
import { MatricesModule } from '../matrices/matrices.module';
import { SignoffsController } from './signoffs.controller';
import { SignoffsService } from './signoffs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComplianceAssessmentSignoff,
      ComplianceAssessmentReview,
    ]),
    AssessmentsModule,
    MatricesModule,
  ],
  controllers: [SignoffsController],
  providers: [SignoffsService],
})
export class SignoffsModule {}