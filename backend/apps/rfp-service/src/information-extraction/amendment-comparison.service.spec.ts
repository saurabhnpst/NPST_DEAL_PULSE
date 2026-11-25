import { AmendmentComparisonService } from './amendment-comparison.service';

describe('AmendmentComparisonService levenshtein logic', () => {
  const service = new AmendmentComparisonService(
    { findOne: jest.fn(), save: jest.fn() } as never,
    { find: jest.fn(), save: jest.fn(), create: jest.fn((v) => v) } as never,
    { find: jest.fn() } as never,
    { getVersionOrThrow: jest.fn() } as never,
  );

  it('classifies obvious text changes', () => {
    const classify = (
      service as unknown as {
        classifyChange: (a: string, b: string) => string;
      }
    ).classifyChange.bind(service);

    expect(classify('EMD 2%', 'EMD 3%')).toBe('changed');
    expect(classify('abc', 'xyz completely different text')).toBe('unclear');
  });
});