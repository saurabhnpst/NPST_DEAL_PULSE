import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDF_PROCESSING_QUEUE } from '../common/constants/pdf-processing-status.constants';
import pdfProcessingConfig from '../config/pdf-processing.config';
import redisConfig from '../config/redis.config';
import { DocumentsModule } from '../documents/documents.module';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';
import { PdfAdaptersModule } from '../pdf-adapters/pdf-adapters.module';
import { PdfProcessingExecutionService } from './pdf-processing-execution.service';
import { PdfProcessingService } from './pdf-processing.service';
import { RfpPdfProcessingController } from './rfp-pdf-processing.controller';
import { PdfProcessingProcessor } from '../workers/pdf-processing.processor';

@Module({
  imports: [
    ConfigModule.forFeature(pdfProcessingConfig),
    ConfigModule.forFeature(redisConfig),
    TypeOrmModule.forFeature([RfpPdfProcessingJob, RfpPdfPageText]),
    DocumentsModule,
    PdfAdaptersModule,
    BullModule.registerQueue({
      name: PDF_PROCESSING_QUEUE,
    }),
  ],
  controllers: [RfpPdfProcessingController],
  providers: [
    PdfProcessingService,
    PdfProcessingExecutionService,
    PdfProcessingProcessor,
  ],
  exports: [PdfProcessingService],
})
export class PdfProcessingModule {}