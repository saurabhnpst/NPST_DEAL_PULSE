import { classifyRequirement, productsOf } from './requirement-rules';

describe('requirement rules (PRD US-15)', () => {
  const noProblem = () => null;

  it('collects distinct product names; `products` wins over `productTsp`', () => {
    expect(productsOf({ productTsp: ' UPI ' })).toEqual(['UPI']);
    expect(productsOf({ productTsp: 'UPI', products: ['BBPS', 'BBPS', ' IMPS'] })).toEqual(['BBPS', 'IMPS']);
    expect(productsOf({ productTsp: null })).toEqual([]);
  });

  it('no product → UNMAPPED (review queue, never auto-assigned)', () => {
    expect(classifyRequirement([], noProblem)).toEqual({
      status: 'UNMAPPED', productTsp: null, reviewReason: 'Not mapped to a product',
    });
  });

  it('several products → NEEDS_REVIEW', () => {
    expect(classifyRequirement(['UPI', 'BBPS'], noProblem)).toMatchObject({
      status: 'NEEDS_REVIEW', productTsp: null, reviewReason: 'Maps to several products: UPI, BBPS',
    });
  });

  it('product without a usable default Tech Lead → NEEDS_REVIEW with the reason', () => {
    expect(classifyRequirement(['IMPS'], () => 'No default Tech Lead is set for IMPS')).toEqual({
      status: 'NEEDS_REVIEW', productTsp: 'IMPS', reviewReason: 'No default Tech Lead is set for IMPS',
    });
  });

  it('one product with a usable Tech Lead → MAPPED', () => {
    expect(classifyRequirement(['UPI'], noProblem)).toEqual({ status: 'MAPPED', productTsp: 'UPI', reviewReason: null });
  });
});
