import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PdfEncryptedError, PdfCorruptError } from '../common/exceptions/pdf-processing.errors';

@Injectable()
export class PdfJsTextExtractor implements OnModuleDestroy {
  private readonly logger = new Logger(PdfJsTextExtractor.name);
  private pdfjsPromise?: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')>;

  async getPageCount(buffer: Buffer): Promise<number> {
    const document = await this.loadDocument(buffer);
    try {
      return document.numPages;
    } finally {
      await document.cleanup();
    }
  }

  async extractPageText(buffer: Buffer, pageNumber: number): Promise<string> {
    const document = await this.loadDocument(buffer);
    try {
      if (pageNumber < 1 || pageNumber > document.numPages) {
        throw new PdfCorruptError(`Invalid page number ${pageNumber}`);
      }
      const page = await document.getPage(pageNumber);
      try {
        const textContent = await page.getTextContent();
        const parts = textContent.items
          .map((item) =>
            'str' in item && typeof item.str === 'string' ? item.str : '',
          )
          .filter(Boolean);
        return this.normalizeWhitespace(parts.join(' '));
      } finally {
        page.cleanup();
      }
    } finally {
      await document.cleanup();
    }
  }

  private async loadDocument(buffer: Buffer) {
    const pdfjs = await this.getPdfJs();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });

    try {
      return await loadingTask.promise;
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('password') || message.includes('encrypt')) {
        throw new PdfEncryptedError();
      }
      this.logger.warn('PDF.js failed to load document');
      throw new PdfCorruptError();
    }
  }

  private normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private async getPdfJs() {
    if (!this.pdfjsPromise) {
      this.pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
    }
    return this.pdfjsPromise;
  }

  onModuleDestroy(): void {
    this.pdfjsPromise = undefined;
  }
}