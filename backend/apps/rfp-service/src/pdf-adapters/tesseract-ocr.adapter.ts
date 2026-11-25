import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import { PdfProcessingConfig } from '../config/pdf-processing.config';
import {
  PdfToolTimeoutError,
  PdfToolUnavailableError,
} from '../common/exceptions/pdf-processing.errors';
import { runProcess } from './safe-process.util';

export interface OcrPageResult {
  text: string;
  confidence: number | null;
}

@Injectable()
export class TesseractOcrAdapter {
  private readonly logger = new Logger(TesseractOcrAdapter.name);
  private readonly config: PdfProcessingConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<PdfProcessingConfig>('pdfProcessing');
  }

  async recognizeImage(imagePath: string): Promise<OcrPageResult> {
    const binary = this.config.tesseractBinaryPath;
    const outputBase = `${imagePath}.ocr`;

    try {
      const result = await runProcess(
        binary,
        [
          imagePath,
          outputBase,
          '-l',
          this.config.tesseractLang,
          'txt',
        ],
        this.config.tesseractTimeoutMs,
      );
      if (result.exitCode !== 0) {
        this.logger.warn(`Tesseract failed exit=${result.exitCode}`);
        throw new Error('TESSERACT_FAILED');
      }

      const textPath = `${outputBase}.txt`;
      const text = (await fs.readFile(textPath, 'utf8')).trim();
      await fs.rm(textPath, { force: true }).catch(() => undefined);

      const confidence = this.parseConfidence(result.stderr);
      return { text, confidence };
    } catch (error) {
      if (error instanceof Error && error.message === 'PROCESS_TIMEOUT') {
        throw new PdfToolTimeoutError('Tesseract');
      }
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        throw new PdfToolUnavailableError('Tesseract');
      }
      if (error instanceof Error && error.message === 'TESSERACT_FAILED') {
        return { text: '', confidence: null };
      }
      throw error;
    }
  }

  private parseConfidence(stderr: string): number | null {
    const meanMatch = /Mean confidence:\s+([\d.]+)/i.exec(stderr);
    if (meanMatch?.[1]) {
      const value = Number.parseFloat(meanMatch[1]);
      return Number.isFinite(value) ? value : null;
    }
    return null;
  }
}