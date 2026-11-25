import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  RFP_EXTRACTION_JOB_STATUS,
  RFP_EXTRACTION_QUEUE,
  RFP_FIELD_REVIEW_STATUS,
} from '../common/constants/rfp-extraction.constants';
import { RfpExtractionInProgressError } from '../common/exceptions/information-extraction.errors';
import { InformationExtractionConfig } from '../config/information-extraction.config';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { RfpInformationExtractionJob } from '../entities/rfp-information-extraction-job.entity';
import { FieldMappingService } from '../field-mapping/field-mapping.service';
import { InformationExtractionQueuePayload } from './rfp-extraction-execution.service';
import { RfpVersionService } from './rfp-version.service';

@Injectable()
export class RfpExtractionOrchestrationService {
  private readonly config: InformationExtractionConfig;

  constructor(
    @InjectRepository(RfpInformationExtractionJob)
    private readonly jobRepo: Repository<RfpInformationExtractionJob>,
    @InjectRepository(RfpExtractedField)
    private readonly fieldRepo: Repository<RfpExtractedField>,
    @InjectQueue(RFP_EXTRACTION_QUEUE)
    private readonly queue: Queue<InformationExtractionQueuePayload>,
    private readonly versionService: RfpVersionService,
    private readonly fieldMappingService: FieldMappingService,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<InformationExtractionConfig>(
      'informationExtraction',
    );
  }

  async requestExtraction(rfpId: string, versionId: string) {
    const version = await this.versionService.getVersionOrThrow(rfpId, versionId);

    const inProgress = await this.jobRepo.findOne({
      where: [
        { versionId, status: RFP_EXTRACTION_JOB_STATUS.PROCESSING },
        { versionId, status: RFP_EXTRACTION_JOB_STATUS.PENDING },
      ],
    });
    if (inProgress) {
      throw new RfpExtractionInProgressError(inProgress.id);
    }

    const job = await this.jobRepo.save(
      this.jobRepo.create({
        rfpId,
        versionId,
        documentId: version.documentId,
        status: RFP_EXTRACTION_JOB_STATUS.PENDING,
      }),
    );

    const payload: InformationExtractionQueuePayload = {
      extractionJobId: job.id,
      rfpId,
      versionId,
      documentId: version.documentId,
    };

    await this.queue.add('extract-information', payload, {
      jobId: job.id,
      attempts: this.config.queueRetryAttempts,
      backoff: {
        type: 'exponential',
        delay: this.config.queueRetryBackoffMs,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    });

    return {
      extractionJobId: job.id,
      status: job.status,
      message: 'RFP information extraction queued',
    };
  }

  async getLatestJobStatus(rfpId: string, versionId: string) {
    await this.versionService.getVersionOrThrow(rfpId, versionId);
    const job = await this.jobRepo.findOne({
      where: { versionId },
      order: { createdAt: 'DESC' },
    });
    if (!job) {
      return { status: RFP_EXTRACTION_JOB_STATUS.PENDING, extractionJobId: '' };
    }
    return {
      extractionJobId: job.id,
      status: job.status,
      pdfProcessingJobId: job.pdfProcessingJobId ?? null,
      errorCode: job.errorCode ?? null,
      errorMessage: job.errorMessage ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
    };
  }

  async listExtractedFields(rfpId: string, versionId: string) {
    await this.versionService.getVersionOrThrow(rfpId, versionId);
    const job = await this.jobRepo.findOne({
      where: { versionId },
      order: { createdAt: 'DESC' },
    });
    if (!job) {
      return [];
    }
  const fields = await this.fieldRepo.find({
      where: { versionId, extractionJobId: job.id },
      order: { fieldKey: 'ASC' },
    });
    return fields.map((f) => this.mapField(f));
  }

  async listFieldMappings() {
    const rows = await this.fieldMappingService.listActiveMappings();
    return rows.map((m) => ({
      fieldKey: m.fieldKey,
      displayName: m.displayName,
      category: m.category,
      dataType: m.dataType,
      portalTarget: m.portalTarget ?? null,
    }));
  }

  async listConfirmedFields(rfpId: string) {
    const fields = await this.fieldRepo.find({
      where: { rfpId, reviewStatus: RFP_FIELD_REVIEW_STATUS.CONFIRMED },
      order: { versionId: 'ASC', fieldKey: 'ASC' },
    });
    return fields.map((f) => ({
      fieldKey: f.fieldKey,
      displayName: f.displayName,
      confirmedValue: f.confirmedValue,
      versionId: f.versionId,
      portalTarget: f.portalTarget ?? null,
      confirmedAt: f.confirmedAt?.toISOString() ?? null,
      confirmedById: f.confirmedById ?? null,
    }));
  }

  private mapField(field: RfpExtractedField) {
    return {
      id: field.id,
      fieldKey: field.fieldKey,
      displayName: field.displayName,
      category: field.category,
      dataType: field.dataType,
      extractedValue: field.extractedValue,
      correctedValue: field.correctedValue,
      confirmedValue: field.confirmedValue,
      reviewStatus: field.reviewStatus,
      portalTarget: field.portalTarget,
      mappingAmbiguous: field.mappingAmbiguous,
      pageNumber: field.pageNumber,
      sourceExcerpt: field.sourceExcerpt,
      confidence: field.confidence,
      metadata: field.metadataJson ?? null,
    };
  }
}