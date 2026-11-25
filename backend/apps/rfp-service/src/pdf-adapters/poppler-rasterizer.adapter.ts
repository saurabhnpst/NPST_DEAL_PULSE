import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PdfProcessingConfig } from '../config/pdf-processing.config';
import {
  PdfCorruptError,
  PdfToolTimeoutError,
  PdfToolUnavailableError,
} from '../common/exceptions/pdf-processing.errors';
import { runProcess } from './safe-process.util';

@Injectable()
export class PopplerRasterizerAdapter {
  private readonly logger = new Logger(PopplerRasterizerAdapter.name);
  private readonly config: PdfProcessingConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<PdfProcessingConfig>('pdfProcessing');
  }

  async getPageCountFromFile(pdfPath: string): Promise<number> {
    const pdfinfo = this.resolveBinary('pdfinfo');
    try {
      const result = await runProcess(
        pdfinfo,
        [pdfPath],
        this.config.popplerTimeoutMs,
      );
      if (result.exitCode !== 0) {
        throw new PdfCorruptError('Unable to read PDF page count');
      }
      const match = /Pages:\s+(\d+)/i.exec(result.stdout);
      if (!match?.[1]) {
        throw new PdfCorruptError('Unable to parse PDF page count');
      }
      return Number.parseInt(match[1], 10);
    } catch (error) {
      if (error instanceof Error && error.message === 'PROCESS_TIMEOUT') {
        throw new PdfToolTimeoutError('Poppler pdfinfo');
      }
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        throw new PdfToolUnavailableError('Poppler pdfinfo');
      }
      throw error;
    }
  }

  async renderPageToPng(
    pdfPath: string,
    pageNumber: number,
    workDir: string,
  ): Promise<string> {
    const pdftoppm = this.resolveBinary('pdftoppm');
    const outputPrefix = join(workDir, `page-${pageNumber}`);

    try {
      const result = await runProcess(
        pdftoppm,
        [
          '-png',
          '-r',
          String(this.config.ocrDpi),
          '-f',
          String(pageNumber),
          '-l',
          String(pageNumber),
          '-singlefile',
          pdfPath,
          outputPrefix,
        ],
        this.config.popplerTimeoutMs,
      );
      if (result.exitCode !== 0) {
        this.logger.warn(
          `pdftoppm failed page=${pageNumber} exit=${result.exitCode}`,
        );
        throw new PdfCorruptError(`Failed to render page ${pageNumber}`);
      }
      const imagePath = `${outputPrefix}.png`;
      await fs.access(imagePath);
      return imagePath;
    } catch (error) {
      if (error instanceof Error && error.message === 'PROCESS_TIMEOUT') {
        throw new PdfToolTimeoutError('Poppler pdftoppm');
      }
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        throw new PdfToolUnavailableError('Poppler pdftoppm');
      }
      throw error;
    }
  }

  async withPdfTempFile<T>(
    buffer: Buffer,
    handler: (pdfPath: string, workDir: string) => Promise<T>,
  ): Promise<T> {
    const workDir = join(tmpdir(), `rfp-pdf-${randomUUID()}`);
    await fs.mkdir(workDir, { recursive: true });
    const pdfPath = join(workDir, 'document.pdf');
    await fs.writeFile(pdfPath, buffer);

    try {
      return await handler(pdfPath, workDir);
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private resolveBinary(name: 'pdfinfo' | 'pdftoppm'): string {
    const base = this.config.popplerBinaryPath;
    if (!base) {
      return name;
    }
    if (base.endsWith(name)) {
      return base;
    }
    if (base.includes('/')) {
      return join(base, name);
    }
    return name;
  }
}