import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RFP_EXTRACTION_QUEUE } from '../common/constants/rfp-extraction.constants';
import informationExtractionConfig from '../config/information-extraction.config';
import { DocumentsModule } from '../documents/documents.module';
import { RfpAmendmentComparison } from '../entities/rfp-amendment-comparison.entity';
import { RfpAmendmentDiff } from '../entities/rfp-amendment-diff.entity';
import { RfpDocumentVersion } from '../entities/rfp-document-version.entity';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { RfpFieldMappingConfig } from '../entities/rfp-field-mapping-config.entity';
import { RfpFieldReviewAudit } from '../entities/rfp-field-review-audit.entity';
import { RfpInformationExtractionJob } from '../entities/rfp-information-extraction-job.entity';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';
import { Rfp } from '../entities/rfp.entity';
import { FieldMappingModule } from '../field-mapping/field-mapping.module';
import { InformationExtractionProcessor } from '../workers/information-extraction.processor';
import { AmendmentComparisonService } from './amendment-comparison.service';
import { RfpExtractionExecutionService } from './rfp-extraction-execution.service';
import { RfpExtractionOrchestrationService } from './rfp-extraction-orchestration.service';
import { RfpInformationExtractionController } from './rfp-information-extraction.controller';
import { RfpReviewService } from './rfp-review.service';
import { RfpVersionService } from './rfp-version.service';

@Module({
  imports: [
    ConfigModule.forFeature(informationExtractionConfig),
    DocumentsModule,
    FieldMappingModule,
    TypeOrmModule.forFeature([
      Rfp,
      RfpDocumentVersion,
      RfpInformationExtractionJob,
      RfpExtractedField,
      RfpFieldReviewAudit,
      RfpFieldMappingConfig,
      RfpAmendmentComparison,
      RfpAmendmentDiff,
      RfpPdfProcessingJob,
      RfpPdfPageText,
    ]),
    BullModule.registerQueue({ name: RFP_EXTRACTION_QUEUE }),
  ],
  controllers: [RfpInformationExtractionController],
  providers: [
    RfpVersionService,
    RfpExtractionOrchestrationService,
    RfpExtractionExecutionService,
    RfpReviewService,
    AmendmentComparisonService,
    InformationExtractionProcessor,
  ],
  exports: [RfpExtractionOrchestrationService, RfpVersionService],
})
export class InformationExtractionModule {}