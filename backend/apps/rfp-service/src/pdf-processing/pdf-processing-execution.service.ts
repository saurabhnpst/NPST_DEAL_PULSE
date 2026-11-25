import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'node:fs';
import { Repository } from 'typeorm';
import {
  DocumentRequestAuth,
  DocumentServiceClient,
} from '../clients/document-service.client';
import {
  PDF_PROCESSING_STATUS,
  PdfProcessingStatus,
} from '../common/constants/pdf-processing-status.constants';
import { PdfProcessingConfig } from '../config/pdf-processing.config';
import { RfpPdfPageText } from '../entities/rfp-pdf-page-text.entity';
import { RfpPdfProcessingJob } from '../entities/rfp-pdf-processing-job.entity';
import { PageTextMerger } from '../pdf-adapters/page-text-merger';
import { PdfValidationService } from '../pdf-adapters/pdf-validation.service';
import { PdfJsTextExtractor } from '../pdf-adapters/pdfjs-text.extractor';
import { PopplerRasterizerAdapter } from '../pdf-adapters/poppler-rasterizer.adapter';
import { TesseractOcrAdapter } from '../pdf-adapters/tesseract-ocr.adapter';

export interface PdfQueueJobPayload {
  processingJobId: string;
  rfpId: string;
  documentId: string;
  userAuthorization?: string;
}

@Injectable()
export class PdfProcessingExecutionService {
  private readonly logger = new Logger(PdfProcessingExecutionService.name);
  private readonly config: PdfProcessingConfig;

  constructor(
    configService: ConfigService,
    @InjectRepository(RfpPdfProcessingJob)
    private readonly jobRepo: Repository<RfpPdfProcessingJob>,
    @InjectRepository(RfpPdfPageText)
    private readonly pageRepo: Repository<RfpPdfPageText>,
    private readonly documentClient: DocumentServiceClient,
    private readonly validationService: PdfValidationService,
    private readonly pdfJsTextExtractor: PdfJsTextExtractor,
    private readonly poppler: PopplerRasterizerAdapter,
    private readonly tesseract: TesseractOcrAdapter,
    private readonly pageTextMerger: PageTextMerger,
  ) {
    this.config = configService.getOrThrow<PdfProcessingConfig>('pdfProcessing');
  }

  async execute(payload: PdfQueueJobPayload): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { id: payload.processingJobId },
    });
    if (!job) {
      this.logger.warn(`Processing job missing id=${payload.processingJobId}`);
      return;
    }
    if (job.status === PDF_PROCESSING_STATUS.COMPLETED) {
      return;
    }

    await this.jobRepo.update(job.id, {
      status: PDF_PROCESSING_STATUS.PROCESSING,
      startedAt: new Date(),
      errorCode: null,
      errorMessage: null,
    });

    try {
      const auth: DocumentRequestAuth | undefined = payload.userAuthorization
        ? { userAuthorization: payload.userAuthorization }
        : undefined;

      const downloaded = await this.documentClient.downloadDocument(
        payload.documentId,
        auth,
      );
      const validation = await this.validationService.validate(downloaded.data);

      await this.jobRepo.update(job.id, {
        pageCount: validation.pageCount,
        sourceFileName: downloaded.fileName,
        sourceSizeBytes: validation.sizeBytes,
      });

      const existingPages = await this.pageRepo.find({
        where: { jobId: job.id },
        select: ['pageNumber', 'hasUsableText'],
      });
      const completedPageNumbers = new Set(
        existingPages.map((row) => row.pageNumber),
      );
      let failedPages = existingPages.filter((row) => !row.hasUsableText).length;
      let processedPages = existingPages.length;

      await this.poppler.withPdfTempFile(
        downloaded.data,
        async (pdfPath, workDir) => {
          for (
            let pageNumber = 1;
            pageNumber <= validation.pageCount;
            pageNumber++
          ) {
            if (completedPageNumbers.has(pageNumber)) {
              continue;
            }
            try {
              const pageResult = await this.processPage(
                downloaded.data,
                pdfPath,
                workDir,
                pageNumber,
              );
              await this.persistPage(job.id, pageResult);
              processedPages++;
              if (!pageResult.hasUsableText) {
                failedPages++;
              }
            } catch (error) {
              failedPages++;
              processedPages++;
              const embedded = await this.safeEmbeddedText(
                downloaded.data,
                pageNumber,
              );
              const merged = this.pageTextMerger.buildFailedPageResult(
                pageNumber,
                embedded,
                'PAGE_PROCESSING_FAILED',
                this.safeErrorMessage(error),
              );
              await this.persistPage(job.id, merged);
            }
            await this.jobRepo.update(job.id, {
              processedPageCount: processedPages,
              failedPageCount: failedPages,
            });
          }
        },
      );

      const finalStatus = this.resolveJobStatus(
        validation.pageCount,
        failedPages,
        processedPages,
      );

      await this.jobRepo.update(job.id, {
        status: finalStatus,
        completedAt: new Date(),
        processedPageCount: processedPages,
        failedPageCount: failedPages,
      });
    } catch (error) {
      await this.jobRepo.update(job.id, {
        status: PDF_PROCESSING_STATUS.FAILED,
        completedAt: new Date(),
        errorCode: this.mapErrorCode(error),
        errorMessage: this.safeErrorMessage(error),
      });
      throw error;
    }
  }

  private async processPage(
    buffer: Buffer,
    pdfPath: string,
    workDir: string,
    pageNumber: number,
  ) {
    const embedded = await this.pdfJsTextExtractor.extractPageText(
      buffer,
      pageNumber,
    );
    const embeddedStats = this.pageTextMerger.classifyEmbeddedText(embedded);

    if (embeddedStats.hasUsableText) {
      return this.pageTextMerger.buildEmbeddedResult(pageNumber, embedded);
    }

    const imagePath = await this.poppler.renderPageToPng(
      pdfPath,
      pageNumber,
      workDir,
    );
    try {
      const ocr = await this.tesseract.recognizeImage(imagePath);
      const merged = this.pageTextMerger.buildOcrResult(
        pageNumber,
        ocr.text,
        ocr.confidence,
        embedded,
      );
      if (!merged.hasUsableText && !ocr.text) {
        throw new Error('OCR produced no text');
      }
      return merged;
    } finally {
      await fs.rm(imagePath, { force: true }).catch(() => undefined);
    }
  }

  private async persistPage(
    jobId: string,
    page: ReturnType<PageTextMerger['buildEmbeddedResult']>,
  ): Promise<void> {
    const existing = await this.pageRepo.findOne({
      where: { jobId, pageNumber: page.pageNumber },
    });
    const values = {
      jobId,
      pageNumber: page.pageNumber,
      extractionMethod: page.extractionMethod,
      charCount: page.charCount,
      hasUsableText: page.hasUsableText,
      textContent: page.textContent,
      ocrConfidence: page.ocrConfidence,
      metadataJson: page.metadataJson ?? null,
    };
    if (existing) {
      await this.pageRepo.save({ ...existing, ...values });
      return;
    }
    await this.pageRepo.save(this.pageRepo.create(values));
  }

  private resolveJobStatus(
    pageCount: number,
    failedPages: number,
    processedPages: number,
  ): PdfProcessingStatus {
    if (processedPages === 0 || failedPages === pageCount) {
      return PDF_PROCESSING_STATUS.FAILED;
    }
    if (failedPages === 0) {
      return PDF_PROCESSING_STATUS.COMPLETED;
    }
    return PDF_PROCESSING_STATUS.PARTIAL;
  }

  private async safeEmbeddedText(
    buffer: Buffer,
    pageNumber: number,
  ): Promise<string> {
    try {
      return await this.pdfJsTextExtractor.extractPageText(buffer, pageNumber);
    } catch {
      return '';
    }
  }

  private mapErrorCode(error: unknown): string {
    if (error instanceof Error) {
      return error.name || 'PROCESSING_ERROR';
    }
    return 'PROCESSING_ERROR';
  }

  private safeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.slice(0, 480);
    }
    return 'PDF processing failed';
  }
}