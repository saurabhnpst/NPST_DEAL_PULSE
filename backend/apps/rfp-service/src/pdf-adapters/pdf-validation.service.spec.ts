import { ConfigService } from '@nestjs/config';
import { InvalidPdfError } from '../common/exceptions/document.errors';
import { PdfTooLargeError } from '../common/exceptions/pdf-processing.errors';
import { PdfJsTextExtractor } from './pdfjs-text.extractor';
import { PdfValidationService } from './pdf-validation.service';

const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 1>>endobj\nxref\n0 3\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

describe('PdfValidationService', () => {
  const pdfJs = {
    getPageCount: jest.fn().mockResolvedValue(1),
  } as unknown as PdfJsTextExtractor;

  const service = new PdfValidationService(
    {
      getOrThrow: () => ({
        maxFileSizeBytes: 1024,
        maxPages: 10,
      }),
    } as unknown as ConfigService,
    pdfJs,
  );

  it('rejects non-pdf buffers', async () => {
    await expect(service.validate(Buffer.from('not-a-pdf'))).rejects.toBeInstanceOf(
      InvalidPdfError,
    );
  });

  it('rejects oversized pdf buffers', async () => {
    const large = Buffer.concat([
      MINIMAL_PDF,
      Buffer.alloc(2_000, 0x20),
    ]);
    await expect(service.validate(large)).rejects.toBeInstanceOf(PdfTooLargeError);
  });

  it('accepts valid minimal pdf', async () => {
    const result = await service.validate(MINIMAL_PDF);
    expect(result.pageCount).toBe(1);
    expect(result.sizeBytes).toBe(MINIMAL_PDF.length);
  });
});