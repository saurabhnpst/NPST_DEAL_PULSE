import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceEvidenceReference } from '../entities/compliance-evidence-reference.entity';
import { ComplianceWorkflowModule } from '../common/compliance-workflow.module';
import { MatricesModule } from '../matrices/matrices.module';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceEvidenceReference]),
    MatricesModule,
    ComplianceWorkflowModule,
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
})
export class EvidenceModule {}