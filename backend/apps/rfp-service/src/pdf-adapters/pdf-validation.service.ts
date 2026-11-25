import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PdfProcessingConfig } from '../config/pdf-processing.config';
import {
  PdfCorruptError,
  PdfEncryptedError,
  PdfTooLargeError,
  PdfTooManyPagesError,
} from '../common/exceptions/pdf-processing.errors';
import { InvalidPdfError } from '../common/exceptions/document.errors';
import { PdfJsTextExtractor } from './pdfjs-text.extractor';

const PDF_MAGIC = Buffer.from('%PDF-');

export interface PdfValidationResult {
  pageCount: number;
  sizeBytes: number;
}

@Injectable()
export class PdfValidationService {
  private readonly config: PdfProcessingConfig;

  constructor(
    configService: ConfigService,
    private readonly pdfJsTextExtractor: PdfJsTextExtractor,
  ) {
    this.config = configService.getOrThrow<PdfProcessingConfig>('pdfProcessing');
  }

  async validate(buffer: Buffer): Promise<PdfValidationResult> {
    if (!buffer?.length) {
      throw new InvalidPdfError();
    }
    if (
      buffer.length < PDF_MAGIC.length ||
      !buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)
    ) {
      throw new InvalidPdfError();
    }

    if (buffer.length > this.config.maxFileSizeBytes) {
      throw new PdfTooLargeError(this.config.maxFileSizeBytes);
    }

    if (this.looksEncrypted(buffer)) {
      throw new PdfEncryptedError();
    }

    let pageCount: number;
    try {
      pageCount = await this.pdfJsTextExtractor.getPageCount(buffer);
    } catch (error) {
      if (error instanceof PdfEncryptedError) {
        throw error;
      }
      throw new PdfCorruptError();
    }

    if (pageCount < 1) {
      throw new PdfCorruptError('PDF contains no pages');
    }
    if (pageCount > this.config.maxPages) {
      throw new PdfTooManyPagesError(this.config.maxPages);
    }

    return { pageCount, sizeBytes: buffer.length };
  }

  private looksEncrypted(buffer: Buffer): boolean {
    const header = buffer.subarray(0, Math.min(buffer.length, 8192)).toString(
      'latin1',
    );
    return (
      /\/Encrypt\b/.test(header) ||
      (/\/Filter\s*\/Standard/.test(header) && /\/Encrypt/.test(header))
    );
  }
}