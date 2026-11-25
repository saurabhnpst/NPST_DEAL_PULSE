import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceWorkflowModule } from '../common/compliance-workflow.module';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { ComplianceAssessment } from '../entities/compliance-assessment.entity';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceAssessment, ComplianceAssessmentLine]),
    ConfigurationsModule,
    ComplianceWorkflowModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}