import { RuleBasedExtractorService } from './rule-based-extractor.service';

describe('RuleBasedExtractorService', () => {
  const extractor = new RuleBasedExtractorService();

  it('extracts tender reference from explicit text', () => {
    const pages = [
      {
        pageNumber: 1,
        text: 'Tender No: GEM/2025/12345 Submission due on 12-Jan-2026',
      },
    ];
    const results = extractor.extract(pages, [
      {
        fieldKey: 'tender_reference_number',
        patterns: ['(?:tender|rfp)\\s*(?:no|number)[:\\s\\-]*([A-Z0-9\\-/]+)'],
      },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].value).toContain('GEM/2025/12345');
    expect(results[0].pageNumber).toBe(1);
  });
});