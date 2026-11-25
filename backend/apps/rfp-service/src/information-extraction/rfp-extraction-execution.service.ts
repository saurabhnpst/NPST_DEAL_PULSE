import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PDF_PROCESSING_STATUS,
} from '../common/constants/pdf-processing-status.constants';
import {
  RFP_EXTRACTION_JOB_STATUS,
  RFP_FIELD_REVIEW_STATUS,
} from '../common/constants/rfp-extraction.constants';
import { PdfTextNotReadyError } from '../common/exceptions/information-extraction.errors';
import { InformationExtractionConfig } from '../config/information-extraction.config';
import { FieldMappingService } from '../field-mapping/field-mapping.service';
import { RuleBasedExtractorService } from '../field-mapping/rule-based-extractor.service';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { RfpInformationExtractionJob } from '../entities/rfp-information-extraction-job.entity';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';

export interface InformationExtractionQueuePayload {
  extractionJobId: string;
  rfpId: string;
  versionId: string;
  documentId: string;
}

@Injectable()
export class RfpExtractionExecutionService {
  private readonly logger = new Logger(RfpExtractionExecutionService.name);
  private readonly config: InformationExtractionConfig;

  constructor(
    @InjectRepository(RfpInformationExtractionJob)
    private readonly jobRepo: Repository<RfpInformationExtractionJob>,
    @InjectRepository(RfpExtractedField)
    private readonly fieldRepo: Repository<RfpExtractedField>,
    @InjectRepository(RfpPdfProcessingJob)
    private readonly pdfJobRepo: Repository<RfpPdfProcessingJob>,
    @InjectRepository(RfpPdfPageText)
    private readonly pageRepo: Repository<RfpPdfPageText>,
    private readonly fieldMappingService: FieldMappingService,
    private readonly ruleBasedExtractor: RuleBasedExtractorService,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<InformationExtractionConfig>(
      'informationExtraction',
    );
  }

  async execute(payload: InformationExtractionQueuePayload): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { id: payload.extractionJobId },
    });
    if (!job) {
      return;
    }

    await this.jobRepo.update(job.id, {
      status: RFP_EXTRACTION_JOB_STATUS.PROCESSING,
      startedAt: new Date(),
      errorCode: null,
      errorMessage: null,
    });

    try {
      const pdfJob = await this.pdfJobRepo.findOne({
        where: { rfpId: payload.rfpId, documentId: payload.documentId },
        order: { attempt: 'DESC' },
      });

      if (
        !pdfJob ||
        (pdfJob.status !== PDF_PROCESSING_STATUS.COMPLETED &&
          pdfJob.status !== PDF_PROCESSING_STATUS.PARTIAL)
      ) {
        throw new PdfTextNotReadyError();
      }

      await this.jobRepo.update(job.id, { pdfProcessingJobId: pdfJob.id });

      const pages = await this.pageRepo.find({
        where: { jobId: pdfJob.id, hasUsableText: true },
        order: { pageNumber: 'ASC' },
      });
      if (pages.length === 0) {
        throw new PdfTextNotReadyError();
      }

      const mappings = await this.fieldMappingService.listActiveMappings();
      const candidates = this.ruleBasedExtractor.extract(
        pages.map((p) => ({ pageNumber: p.pageNumber, text: p.textContent })),
        mappings.map((m) => ({ fieldKey: m.fieldKey, patterns: m.patterns })),
      );

      await this.fieldRepo.delete({ extractionJobId: job.id });

      let resolvedCount = 0;
      for (const mapping of mappings) {
        const rawMatch = candidates.find((c) => c.fieldKey === mapping.fieldKey);
        const match =
          rawMatch &&
          (rawMatch.confidence ?? 0) >= this.config.minConfidence
            ? rawMatch
            : undefined;
        const validation = match
          ? this.fieldMappingService.validateValueForType(
              mapping.dataType,
              match.value,
            )
          : { valid: false, reason: 'NOT_FOUND' };

        const extractedValue = validation.valid
          ? validation.normalized ?? match?.value ?? null
          : match?.value ?? null;

        const reviewStatus =
          validation.valid && match
            ? RFP_FIELD_REVIEW_STATUS.DRAFT
            : RFP_FIELD_REVIEW_STATUS.UNRESOLVED;

        if (reviewStatus === RFP_FIELD_REVIEW_STATUS.DRAFT) {
          resolvedCount++;
        }

        await this.fieldRepo.save(
          this.fieldRepo.create({
            rfpId: payload.rfpId,
            versionId: payload.versionId,
            documentId: payload.documentId,
            extractionJobId: job.id,
            fieldKey: mapping.fieldKey,
            displayName: mapping.displayName,
            category: mapping.category,
            dataType: mapping.dataType,
            extractedValue,
            reviewStatus,
            portalTarget: mapping.portalTarget ?? null,
            mappingAmbiguous: false,
            pageNumber: match?.pageNumber ?? null,
            sourceExcerpt: match?.sourceExcerpt ?? null,
            confidence: match?.confidence ?? null,
            metadataJson: {
              provider: this.ruleBasedExtractor.providerId,
              validation: validation.valid ? 'ok' : validation.reason,
            },
          }),
        );
      }

      const total = mappings.length;
      const finalStatus =
        resolvedCount === 0
          ? RFP_EXTRACTION_JOB_STATUS.FAILED
          : resolvedCount < total
            ? RFP_EXTRACTION_JOB_STATUS.PARTIALLY_COMPLETED
            : RFP_EXTRACTION_JOB_STATUS.REVIEW_PENDING;

      await this.jobRepo.update(job.id, {
        status: finalStatus,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.jobRepo.update(job.id, {
        status: RFP_EXTRACTION_JOB_STATUS.FAILED,
        completedAt: new Date(),
        errorCode: error instanceof Error ? error.name : 'EXTRACTION_ERROR',
        errorMessage:
          error instanceof Error ? error.message.slice(0, 480) : 'Extraction failed',
      });
      throw error;
    }
  }
}