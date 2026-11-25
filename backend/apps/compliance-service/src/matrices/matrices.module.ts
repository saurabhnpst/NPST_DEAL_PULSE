import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceWorkflowModule } from '../common/compliance-workflow.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { MatricesController } from './matrices.controller';
import { MatricesService } from './matrices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceAssessmentLine]),
    AssessmentsModule,
    ConfigurationsModule,
    ComplianceWorkflowModule,
  ],
  controllers: [MatricesController],
  providers: [MatricesService],
  exports: [MatricesService],
})
export class MatricesModule {}