import { promises as fs } from 'node:fs';
import { ConfigService } from '@nestjs/config';
import * as safeProcess from './safe-process.util';
import { TesseractOcrAdapter } from './tesseract-ocr.adapter';

jest.mock('node:fs', () => ({
  promises: {
    readFile: jest.fn(),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('TesseractOcrAdapter', () => {
  const adapter = new TesseractOcrAdapter({
    getOrThrow: () => ({
      tesseractBinaryPath: 'tesseract',
      tesseractLang: 'eng',
      tesseractTimeoutMs: 1_000,
    }),
  } as unknown as ConfigService);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns OCR text and confidence from stderr metadata', async () => {
    jest.spyOn(safeProcess, 'runProcess').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: 'Mean confidence: 92.10\n',
    });
    (fs.readFile as jest.Mock).mockResolvedValue('Recognized tender clause text');

    const result = await adapter.recognizeImage('/tmp/page.png');
    expect(result.text).toContain('Recognized tender');
    expect(result.confidence).toBe(92.1);
  });
});