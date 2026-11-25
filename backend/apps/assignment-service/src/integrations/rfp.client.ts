import { callService } from './http-call';

/**
 * Confirmed RFP requirements from the RFP Service.
 * Real:  RFP_SERVICE_URL set → GET {RFP_SERVICE_URL}/api/v1/rfp/opportunities/:opportunityId/requirements
 *        (path to be confirmed with the RFP team; change it here only)
 * Mock:  otherwise → the sample requirements below, for any opportunity.
 *
 * The RFP Service can also push requirements to this service instead
 * (POST /assignments/opportunity/:id/requirements), so it isn't blocked by this client.
 */

export type RfpRequirementInput = {
  requirementRef?: string | null;
  title: string;
  details?: string | null;
  /** The mapped NPST product, if the RFP Service could map it. */
  productTsp?: string | null;
  /** Set when one requirement maps to several products (goes to review). */
  products?: string[] | null;
};

export abstract class RfpClient {
  abstract readonly mode: 'mock' | 'real';
  abstract getConfirmedRequirements(opportunityId: string): Promise<RfpRequirementInput[]>;
}

/** Covers every path: mapped (2 products), unmapped, and multi-product. */
export const MOCK_RFP_REQUIREMENTS: RfpRequirementInput[] = [
  { requirementRef: '4.1', title: 'UPI switch with 2,000 TPS peak', productTsp: 'UPI' },
  { requirementRef: '4.2', title: 'UPI Lite and UPI 123Pay support', productTsp: 'UPI' },
  { requirementRef: '4.3', title: 'TPAP onboarding for 3 partner apps', productTsp: 'UPI' },
  { requirementRef: '5.1', title: 'BBPS biller onboarding as Operating Unit', productTsp: 'BBPS' },
  { requirementRef: '7.4', title: 'On-site DR drill every quarter', productTsp: null },
  { requirementRef: '8.2', title: 'Unified dispute management for UPI and BBPS', products: ['UPI', 'BBPS'] },
];

export class MockRfpClient extends RfpClient {
  readonly mode = 'mock' as const;

  async getConfirmedRequirements(_opportunityId: string): Promise<RfpRequirementInput[]> {
    return MOCK_RFP_REQUIREMENTS.map((r) => ({ ...r }));
  }
}

export class HttpRfpClient extends RfpClient {
  readonly mode = 'real' as const;

  constructor(private readonly baseUrl: string) {
    super();
  }

  async getConfirmedRequirements(opportunityId: string): Promise<RfpRequirementInput[]> {
    const list = await callService<RfpRequirementInput[]>(
      'RFP Service',
      this.baseUrl,
      `/api/v1/rfp/opportunities/${encodeURIComponent(opportunityId)}/requirements`,
    );
    return list ?? [];
  }
}
