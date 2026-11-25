import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceAssessmentSignoff } from '../entities/compliance-assessment-signoff.entity';
import { AssessmentSignoffGuard } from './services/assessment-signoff.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceAssessmentSignoff])],
  providers: [AssessmentSignoffGuard],
  exports: [AssessmentSignoffGuard],
})
export class ComplianceWorkflowModule {}