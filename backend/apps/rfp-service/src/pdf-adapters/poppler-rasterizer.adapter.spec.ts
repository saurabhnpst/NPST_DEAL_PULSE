import { ConfigService } from '@nestjs/config';
import * as safeProcess from './safe-process.util';
import { PopplerRasterizerAdapter } from './poppler-rasterizer.adapter';

describe('PopplerRasterizerAdapter', () => {
  const adapter = new PopplerRasterizerAdapter({
    getOrThrow: () => ({
      ocrDpi: 200,
      popplerTimeoutMs: 1_000,
      popplerBinaryPath: '',
    }),
  } as unknown as ConfigService);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses page count from pdfinfo stdout', async () => {
    jest.spyOn(safeProcess, 'runProcess').mockResolvedValue({
      exitCode: 0,
      stdout: 'Title: Test\nPages:           4\n',
      stderr: '',
    });
    await expect(adapter.getPageCountFromFile('/tmp/test.pdf')).resolves.toBe(4);
  });
});