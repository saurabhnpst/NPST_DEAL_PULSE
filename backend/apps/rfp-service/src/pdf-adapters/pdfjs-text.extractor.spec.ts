import { PdfJsTextExtractor } from './pdfjs-text.extractor';

describe('PdfJsTextExtractor', () => {
  const extractor = new PdfJsTextExtractor();

  it('normalizes internal whitespace', () => {
    const normalized = (
      extractor as unknown as { normalizeWhitespace: (text: string) => string }
    ).normalizeWhitespace('Line   one\n\nLine two');
    expect(normalized).toBe('Line one Line two');
  });
});