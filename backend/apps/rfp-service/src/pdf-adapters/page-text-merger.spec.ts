import { ConfigService } from '@nestjs/config';
import { PDF_EXTRACTION_METHOD } from '../common/constants/pdf-processing-status.constants';
import { PageTextMerger } from './page-text-merger';

describe('PageTextMerger', () => {
  const merger = new PageTextMerger({
    getOrThrow: () => ({ minTextChars: 10 }),
  } as unknown as ConfigService);

  it('treats short embedded text as not usable', () => {
    const stats = merger.classifyEmbeddedText('Hi');
    expect(stats.hasUsableText).toBe(false);
  });

  it('treats long embedded text as usable', () => {
    const text = 'This is a digitally generated tender specification page.';
    const stats = merger.classifyEmbeddedText(text);
    expect(stats.hasUsableText).toBe(true);
    expect(stats.charCount).toBeGreaterThanOrEqual(10);
  });

  it('builds OCR result with hybrid when fallback embedded exists', () => {
    const result = merger.buildOcrResult(2, 'Recognized OCR paragraph text', 88.5, 'tiny');
    expect(result.extractionMethod).toBe(PDF_EXTRACTION_METHOD.HYBRID);
    expect(result.ocrConfidence).toBe(88.5);
  });
});