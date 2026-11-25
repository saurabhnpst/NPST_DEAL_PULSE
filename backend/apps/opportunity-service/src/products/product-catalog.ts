import { BadRequestException } from '@nestjs/common';

const QYNX = ['Soundbox', 'Standee', 'QR Generation', 'Merchant App', 'Admin Portal', 'TMS', 'MQTT', 'SDK', 'Simcard'];
const ERP = ['ERP Jewellery', 'ERP Society'];
const IBMB = ['Issuer', 'Acquirer'];
const SUPER_APP = ['Banking SuperApp - Retail', 'Banking SuperApp - Corporate'];

/**
 * Module options per product. Copy of `MODULES` in frontend/src/data/defaults.js; keep the two in sync.
 * Products that aren't listed have no module picklist, so their modules aren't checked.
 */
export const PRODUCT_MODULE_OPTIONS: Record<string, string[]> = {
  UPI: ['UPI', 'Acquiring Switch', 'Issuer Switch', 'CC on UPI', 'Credit Line on UPI', 'Merchant Switch', 'PP on UPI', 'PPI on UPI', 'TPAP'],
  'UPI 123': ['UPI', 'Acquiring Switch', 'Issuer Switch', 'Merchant Switch'],
  QYNX,
  'QYNX/Soundbox': QYNX,
  IMPS: ['Beneficiary', 'Remittance'],
  ERP,
  'ERP - Infinity': ERP,
  BBPS: ['Operating Unit', 'Angel Institution'],
  'BBPS Retail': ['COU', 'BOU', 'AI - Bill Direct', 'UPMS'],
  'BBPS Corporate (B2B)': ['Buyer', 'Seller'],
  IBMB,
  'Interoperable IBMB': IBMB,
  'Banking Connect (IBMB)': IBMB,
  'Super App': SUPER_APP,
  'Banking SuperApp + Omnichannel': SUPER_APP,
};

/**
 * Checks product slots before saving: slots 1–4 used at most once, and modules
 * valid for the chosen product. The only product check; used by create, PATCH and PUT /products.
 */
export function assertValidProducts(
  products: { productSlot: number; productTsp: string; modules?: string[] }[],
): void {
  const slots = products.map((p) => p.productSlot);
  if (new Set(slots).size !== slots.length) {
    throw new BadRequestException('Each product slot must be unique');
  }

  const problems: string[] = [];
  for (const p of products) {
    const allowed = PRODUCT_MODULE_OPTIONS[p.productTsp];
    if (!allowed) continue;
    const bad = (p.modules ?? []).filter((m) => !allowed.includes(m));
    if (bad.length) problems.push(`Invalid modules for ${p.productTsp}: ${bad.join(', ')}`);
  }
  if (problems.length) {
    throw new BadRequestException({ message: 'Invalid product modules', details: problems });
  }
}
