import { REQUIREMENT_STATUS, RequirementStatus } from '../common/statuses';

/**
 * PRD rules for one RFP requirement (US-15):
 *  - no product            → UNMAPPED     (review queue, never auto-assigned)
 *  - several products      → NEEDS_REVIEW (shared ownership is decided by a person)
 *  - product has no usable default Tech Lead (missing / inactive) → NEEDS_REVIEW
 *  - otherwise             → MAPPED       (joins that product's assignment)
 */

export type RequirementInput = {
  requirementRef?: string | null;
  title: string;
  details?: string | null;
  productTsp?: string | null;
  products?: string[] | null;
};

export type Classification = {
  status: RequirementStatus;
  productTsp: string | null;
  reviewReason: string | null;
};

/** The distinct product names of a requirement (`products` wins over `productTsp`). */
export function productsOf(input: Pick<RequirementInput, 'productTsp' | 'products'>): string[] {
  const names = input.products?.length ? input.products : [input.productTsp];
  return [...new Set(names.map((p) => p?.trim()).filter((p): p is string => !!p))];
}

/**
 * @param leadProblem returns why a product's default Tech Lead can't be used, or null when it's fine.
 */
export function classifyRequirement(
  products: string[],
  leadProblem: (productTsp: string) => string | null,
): Classification {
  if (products.length === 0) {
    return { status: REQUIREMENT_STATUS.UNMAPPED, productTsp: null, reviewReason: 'Not mapped to a product' };
  }
  if (products.length > 1) {
    return {
      status: REQUIREMENT_STATUS.NEEDS_REVIEW,
      productTsp: null,
      reviewReason: `Maps to several products: ${products.join(', ')}`,
    };
  }
  const [productTsp] = products;
  const problem = leadProblem(productTsp);
  if (problem) {
    return { status: REQUIREMENT_STATUS.NEEDS_REVIEW, productTsp, reviewReason: problem };
  }
  return { status: REQUIREMENT_STATUS.MAPPED, productTsp, reviewReason: null };
}
