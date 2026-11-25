import {
  category,
  commercialVersionTotal,
  dealValue,
  tcv,
  weightedAmount,
} from './opportunity-calculations';

describe('opportunity-calculations', () => {
  it('computes deal value and TCV', () => {
    expect(dealValue('100', '50')).toBe(150);
    expect(tcv('100', '50', '10', '10', 0, 0)).toBe(170);
  });

  it('maps deal categories', () => {
    expect(category(5_000_000)).toBe('CAT 1');
    expect(category(1_500_000_000)).toBe('CAT 5');
  });

  it('weights by stage probability', () => {
    expect(weightedAmount('Qualification', '1000000', '0')).toBe(100_000);
  });

  it('totals commercial version columns', () => {
    expect(
      commercialVersionTotal(
        [{ q: 2, p: [100, 150] }],
        1,
      ),
    ).toBe(300);
  });
});