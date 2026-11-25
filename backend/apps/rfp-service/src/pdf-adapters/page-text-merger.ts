import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PDF_EXTRACTION_METHOD,
  PdfExtractionMethod,
} from '../common/constants/pdf-processing-status.constants';
import { PdfProcessingConfig } from '../config/pdf-processing.config';

export interface MergedPageText {
  pageNumber: number;
  extractionMethod: PdfExtractionMethod;
  textContent: string;
  charCount: number;
  hasUsableText: boolean;
  ocrConfidence: number | null;
  metadataJson?: Record<string, unknown> | null;
}

@Injectable()
export class PageTextMerger {
  private readonly minTextChars: number;

  constructor(configService: ConfigService) {
    const config = configService.getOrThrow<PdfProcessingConfig>('pdfProcessing');
    this.minTextChars = config.minTextChars;
  }

  classifyEmbeddedText(embeddedText: string): {
    hasUsableText: boolean;
    charCount: number;
  } {
    const normalized = embeddedText.replace(/\s+/g, ' ').trim();
    const meaningful = normalized.replace(/[^\w\s]/g, '').trim();
    const charCount = meaningful.length;
    return {
      charCount,
      hasUsableText: charCount >= this.minTextChars,
    };
  }

  buildEmbeddedResult(
    pageNumber: number,
    embeddedText: string,
  ): MergedPageText {
    const { hasUsableText, charCount } = this.classifyEmbeddedText(embeddedText);
    return {
      pageNumber,
      extractionMethod: PDF_EXTRACTION_METHOD.EMBEDDED,
      textContent: embeddedText,
      charCount,
      hasUsableText,
      ocrConfidence: null,
      metadataJson: { source: 'pdfjs' },
    };
  }

  buildOcrResult(
    pageNumber: number,
    ocrText: string,
    confidence: number | null,
    fallbackEmbedded?: string,
  ): MergedPageText {
    const trimmed = ocrText.replace(/\s+/g, ' ').trim();
    const hasUsableText = trimmed.length >= this.minTextChars;
    const method =
      fallbackEmbedded && fallbackEmbedded.trim().length > 0
        ? PDF_EXTRACTION_METHOD.HYBRID
        : PDF_EXTRACTION_METHOD.OCR;

    return {
      pageNumber,
      extractionMethod: method,
      textContent: trimmed,
      charCount: trimmed.length,
      hasUsableText,
      ocrConfidence: confidence,
      metadataJson: { source: 'tesseract' },
    };
  }

  buildFailedPageResult(
    pageNumber: number,
    embeddedFallback: string,
    errorCode: string,
    errorMessage: string,
  ): MergedPageText {
    const { charCount, hasUsableText } =
      this.classifyEmbeddedText(embeddedFallback);
    return {
      pageNumber,
      extractionMethod: PDF_EXTRACTION_METHOD.HYBRID,
      textContent: embeddedFallback,
      charCount,
      hasUsableText,
      ocrConfidence: null,
      metadataJson: {
        pageError: true,
        errorCode,
        errorMessage,
      },
    };
  }
}