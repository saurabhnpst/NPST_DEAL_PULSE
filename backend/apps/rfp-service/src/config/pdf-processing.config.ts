import { registerAs } from '@nestjs/config';

export interface PdfProcessingConfig {
  maxFileSizeBytes: number;
  maxPages: number;
  minTextChars: number;
  ocrDpi: number;
  queueName: string;
  workerConcurrency: number;
  jobTimeoutMs: number;
  ocrPageConcurrency: number;
  /** Optional directory or full path prefix for Poppler binaries */
  popplerBinaryPath: string;
  tesseractBinaryPath: string;
  tesseractLang: string;
  popplerTimeoutMs: number;
  tesseractTimeoutMs: number;
  queueRetryAttempts: number;
  queueRetryBackoffMs: number;
}

export default registerAs(
  'pdfProcessing',
  (): PdfProcessingConfig => ({
    maxFileSizeBytes: Number(
      process.env.PDF_PROCESSING_MAX_FILE_SIZE ?? 52_428_800,
    ),
    maxPages: Number(process.env.PDF_PROCESSING_MAX_PAGES ?? 500),
    minTextChars: Number(process.env.PDF_PROCESSING_MIN_TEXT_CHARS ?? 32),
    ocrDpi: Number(process.env.PDF_PROCESSING_OCR_DPI ?? 200),
    queueName: process.env.PDF_PROCESSING_QUEUE_NAME ?? 'rfp-pdf-processing',
    workerConcurrency: Number(
      process.env.PDF_PROCESSING_WORKER_CONCURRENCY ?? 1,
    ),
    jobTimeoutMs: Number(
      process.env.PDF_PROCESSING_JOB_TIMEOUT ?? 1_800_000,
    ),
    ocrPageConcurrency: Number(
      process.env.PDF_PROCESSING_OCR_PAGE_CONCURRENCY ?? 1,
    ),
    popplerBinaryPath: process.env.POPPLER_BINARY_PATH?.trim() || '',
    tesseractBinaryPath:
      process.env.TESSERACT_BINARY_PATH?.trim() || 'tesseract',
    tesseractLang: process.env.TESSERACT_LANG?.trim() || 'eng',
    popplerTimeoutMs: Number(process.env.PDF_POPPLER_TIMEOUT_MS ?? 120_000),
    tesseractTimeoutMs: Number(process.env.PDF_TESSERACT_TIMEOUT_MS ?? 180_000),
    queueRetryAttempts: Number(
      process.env.PDF_PROCESSING_QUEUE_RETRY_ATTEMPTS ?? 3,
    ),
    queueRetryBackoffMs: Number(
      process.env.PDF_PROCESSING_QUEUE_RETRY_BACKOFF_MS ?? 5_000,
    ),
  }),
);