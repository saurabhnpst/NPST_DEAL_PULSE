import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { DocumentRequestAuth } from '../clients/document-service.client';
import {
  PDF_PROCESSING_QUEUE,
  PDF_PROCESSING_STATUS,
} from '../common/constants/pdf-processing-status.constants';
import { PdfProcessingInProgressError } from '../common/exceptions/pdf-processing.errors';
import { RfpDocumentService } from '../documents/rfp-document.service';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';
import { ExtractedTextResponseDto } from './dto/extracted-text-response.dto';
import { ProcessingStatusResponseDto } from './dto/processing-status-response.dto';
import { StartProcessingResponseDto } from './dto/start-processing-response.dto';
import { PdfProcessingConfig } from '../config/pdf-processing.config';
import { PdfQueueJobPayload } from './pdf-processing-execution.service';

@Injectable()
export class PdfProcessingService {
  private readonly logger = new Logger(PdfProcessingService.name);
  private readonly pdfConfig: PdfProcessingConfig;

  constructor(
    @InjectRepository(RfpPdfProcessingJob)
    private readonly jobRepo: Repository<RfpPdfProcessingJob>,
    @InjectRepository(RfpPdfPageText)
    private readonly pageRepo: Repository<RfpPdfPageText>,
    @InjectQueue(PDF_PROCESSING_QUEUE)
    private readonly queue: Queue<PdfQueueJobPayload>,
    private readonly rfpDocumentService: RfpDocumentService,
    configService: ConfigService,
  ) {
    this.pdfConfig = configService.getOrThrow<PdfProcessingConfig>('pdfProcessing');
  }

  async startProcessing(
    rfpId: string,
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<StartProcessingResponseDto> {
    await this.rfpDocumentService.assertDocumentLinkedToRfp(rfpId, documentId);

    const latest = await this.findLatestJob(rfpId, documentId);
    if (
      latest &&
      (latest.status === PDF_PROCESSING_STATUS.PENDING ||
        latest.status === PDF_PROCESSING_STATUS.PROCESSING)
    ) {
      throw new PdfProcessingInProgressError(latest.id);
    }

    const attempt = (latest?.attempt ?? 0) + 1;
    const job = await this.jobRepo.save(
      this.jobRepo.create({
        rfpId,
        documentId,
        attempt,
        status: PDF_PROCESSING_STATUS.PENDING,
      }),
    );

    await this.enqueue(job.id, rfpId, documentId, auth);

    this.logger.log(
      `PDF processing queued jobId=${job.id} rfpId=${rfpId} documentId=${documentId} attempt=${attempt}`,
    );

    return {
      processingJobId: job.id,
      status: job.status,
      message: 'PDF processing job queued',
    };
  }

  async reprocess(
    rfpId: string,
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<StartProcessingResponseDto> {
    await this.rfpDocumentService.assertDocumentLinkedToRfp(rfpId, documentId);

    const latest = await this.findLatestJob(rfpId, documentId);
    if (
      latest &&
      (latest.status === PDF_PROCESSING_STATUS.PENDING ||
        latest.status === PDF_PROCESSING_STATUS.PROCESSING)
    ) {
      throw new PdfProcessingInProgressError(latest.id);
    }

    const attempt = (latest?.attempt ?? 0) + 1;
    const job = await this.jobRepo.save(
      this.jobRepo.create({
        rfpId,
        documentId,
        attempt,
        status: PDF_PROCESSING_STATUS.PENDING,
      }),
    );

    await this.enqueue(job.id, rfpId, documentId, auth);

    return {
      processingJobId: job.id,
      status: job.status,
      message: 'PDF reprocessing job queued',
    };
  }

  async getStatus(
    rfpId: string,
    documentId: string,
  ): Promise<ProcessingStatusResponseDto> {
    await this.rfpDocumentService.assertDocumentLinkedToRfp(rfpId, documentId);

    const job = await this.findLatestJob(rfpId, documentId);
    if (!job) {
      return {
        processingJobId: '',
        status: PDF_PROCESSING_STATUS.PENDING,
        pageCount: null,
        processedPageCount: 0,
        failedPageCount: 0,
        extractionMethodsUsed: [],
        attempt: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        errorCode: null,
        errorMessage: null,
      };
    }

    const pages = await this.pageRepo.find({
      where: { jobId: job.id },
      order: { pageNumber: 'ASC' },
    });

    const failedPageCount =
      job.status === PDF_PROCESSING_STATUS.PROCESSING
        ? job.failedPageCount
        : job.failedPageCount > 0
          ? job.failedPageCount
          : pages.filter((p) => !p.hasUsableText).length;
    const processedPageCount =
      job.status === PDF_PROCESSING_STATUS.PROCESSING
        ? job.processedPageCount
        : job.processedPageCount > 0
          ? job.processedPageCount
          : pages.length;
    const methods = [...new Set(pages.map((p) => p.extractionMethod))];

    return {
      processingJobId: job.id,
      status: job.status,
      attempt: job.attempt,
      pageCount: job.pageCount,
      processedPageCount,
      failedPageCount,
      extractionMethodsUsed: methods,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
    };
  }

  async getExtractedText(
    rfpId: string,
    documentId: string,
    options: {
      page?: number;
      format?: 'pages' | 'concat';
    },
  ): Promise<ExtractedTextResponseDto> {
    await this.rfpDocumentService.assertDocumentLinkedToRfp(rfpId, documentId);

    const job = await this.findLatestJob(rfpId, documentId);
    if (!job) {
      return {
        processingJobId: '',
        format: options.format ?? 'pages',
        pages: [],
        text: '',
      };
    }

    if (options.page) {
      const row = await this.pageRepo.findOne({
        where: { jobId: job.id, pageNumber: options.page },
      });
      return {
        processingJobId: job.id,
        format: 'page',
        pageNumber: options.page,
        pages: row
          ? [
              {
                pageNumber: row.pageNumber,
                extractionMethod: row.extractionMethod,
                charCount: row.charCount,
                hasUsableText: row.hasUsableText,
                ocrConfidence: row.ocrConfidence,
                metadata: row.metadataJson ?? null,
                text: row.textContent,
              },
            ]
          : [],
        text: row?.textContent ?? '',
      };
    }

    const pages = await this.pageRepo.find({
      where: { jobId: job.id },
      order: { pageNumber: 'ASC' },
    });

    const mapped = pages.map((row) => ({
      pageNumber: row.pageNumber,
      extractionMethod: row.extractionMethod,
      charCount: row.charCount,
      hasUsableText: row.hasUsableText,
      ocrConfidence: row.ocrConfidence,
      metadata: row.metadataJson ?? null,
      text: row.textContent,
    }));

    const format = options.format ?? 'pages';
    if (format === 'concat') {
      return {
        processingJobId: job.id,
        format: 'concat',
        text: mapped.map((p) => p.text).join('\n\n'),
      };
    }

    return {
      processingJobId: job.id,
      format: 'pages',
      pages: mapped,
    };
  }

  private async findLatestJob(
    rfpId: string,
    documentId: string,
  ): Promise<RfpPdfProcessingJob | null> {
    return this.jobRepo.findOne({
      where: { rfpId, documentId },
      order: { attempt: 'DESC' },
    });
  }

  private async enqueue(
    processingJobId: string,
    rfpId: string,
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<void> {
    const payload: PdfQueueJobPayload = {
      processingJobId,
      rfpId,
      documentId,
      userAuthorization: auth?.userAuthorization,
    };
    await this.queue.add('process-pdf', payload, {
      jobId: processingJobId,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: this.pdfConfig.queueRetryAttempts,
      backoff: {
        type: 'exponential',
        delay: this.pdfConfig.queueRetryBackoffMs,
      },
    });
  }
}