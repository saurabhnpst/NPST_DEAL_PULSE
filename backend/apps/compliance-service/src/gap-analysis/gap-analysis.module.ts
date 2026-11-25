import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { GapAnalysisController } from './gap-analysis.controller';
import { GapAnalysisService } from './gap-analysis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceAssessmentLine]),
    AssessmentsModule,
  ],
  controllers: [GapAnalysisController],
  providers: [GapAnalysisService],
})
export class GapAnalysisModule {}