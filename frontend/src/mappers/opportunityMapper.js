import { joinMulti, splitMulti } from '../data/defaults.js';

// DECIMAL columns come back as strings ("1500000.00") — the UI works with numbers.
const AMOUNTS = ['arr', 'oneTime', 'updatedArr', 'year2', 'year3', 'year4', 'year5', 'yearlyVolumeProjection', 'firstBillingValue', 'poValue', 'closedValue',
  'fy27Q1', 'fy27Jul', 'fy27Aug', 'fy27Sep', 'fy27Oct', 'fy27Nov', 'fy27Dec', 'fy27Jan', 'fy27Feb', 'fy27Mar'];
const SLOT = ['', '2', '3', '4']; // product slot 1..4 → productTsp / productTsp2.. and module / module2..

/**
 * API opportunity → UI shape (v14 field names). API field names already match v14 except the ones mapped here.
 * `userName(id)` turns user ids into display names.
 */
export function apiOpportunityToUi(api, userName = (id) => id || '—') {
  if (!api) return null;
  // v14 form fields expect '' (not null) for empty values
  const ui = Object.fromEntries(Object.entries(api).map(([k, v]) => [k, v === null ? '' : v]));
  for (const k of AMOUNTS) ui[k] = api[k] == null || api[k] === '' ? (k === 'arr' || k === 'oneTime' ? 0 : '') : Number(api[k]);
  const products = [...(api.products || [])].sort((a, b) => a.productSlot - b.productSlot);
  SLOT.forEach((s, i) => {
    ui['productTsp' + s] = products[i]?.productTsp || (i ? '—' : '');
    ui['module' + s] = joinMulti(products[i]?.modules || []) || (i ? '—' : '');
  });
  return Object.assign(ui, {
    id: api.publicId || String(api.id),
    _apiId: String(api.id),
    account: api.accountName || '',
    owner: api.ownerUserId ? userName(api.ownerUserId) : '—',
    presales: api.presalesUserId ? userName(api.presalesUserId) : '—',
    // non-RFP deal without a Pre-Sales owner: Sales handles every stage (v14 rule)
    skipPresales: !api.presalesUserId && (api.tender || 'Non RFP') === 'Non RFP',
    tasks: api.stageTasks || [],
    people: api.dealTeam || [],
    fallbacks: api.holdFallbacks || [],
    reviews: api.reviews || [],
    lines: api.currentCommercialLines || [],
    versions: ['Initial'],
    competitors: api.competitors || [],
    tag: api.tag || '',
    tone: api.tone || 'gray',
    files: [],
    history: [],
  });
}

export function normalizeOpportunityList(body, userName) {
  const rows = Array.isArray(body) ? body : body?.items || [];
  return rows.map((r) => apiOpportunityToUi(r, userName)).filter(Boolean);
}

// UI-only or workflow-owned keys that never go to PATCH (they have their own endpoints).
// leadId: opportunity.lead_id is numeric while lead ids are UUIDs — the link is kept on the lead (convertedOpportunityId).
const NOT_PATCHED = ['id', '_apiId', 'publicId', 'leadId', 'accountId', 'stage', 'products', 'history', 'files', 'versions', 'lines', 'fallbacks', 'holdFallbacks',
  'licence', 'milestones', 'amcTerm', 'poNumber', 'evaluations', 'deliverables', 'recDraft', 'skipPresales', 'createdAt', 'updatedAt', 'deletedAt',
  ...SLOT.flatMap((s) => ['productTsp' + s, 'module' + s])];

/** UI change → PATCH body (renamed fields; empty values become null). */
export function uiOpportunityToPatch(p, userIdByName = () => null) {
  const out = {};
  for (const [k, v] of Object.entries(p)) {
    if (NOT_PATCHED.includes(k) || k.startsWith('_')) continue;
    if (k === 'account') out.accountName = v;
    else if (k === 'owner') out.ownerUserId = userIdByName(v);
    else if (k === 'presales') out.presalesUserId = userIdByName(v);
    else if (k === 'tasks') out.stageTasks = v;
    else if (k === 'people') out.dealTeam = v;
    else out[k] = v === '' ? null : v;
  }
  return out;
}

/** Product slots from UI fields (`productTsp`, `module`, `productTsp2`, `module2`, …). */
export function uiProducts(v) {
  return SLOT.map((s, i) => ({ productSlot: i + 1, productTsp: v['productTsp' + s], modules: splitMulti(v['module' + s] === '—' ? '' : v['module' + s]) }))
    .filter((p) => p.productTsp && p.productTsp !== '—');
}

export function uiProductsChanged(opp, p) {
  if (!SLOT.some((s) => ('productTsp' + s) in p || ('module' + s) in p)) return false;
  return JSON.stringify(uiProducts(opp)) !== JSON.stringify(uiProducts({ ...opp, ...p }));
}

/** CreateOpportunityDto from the new-opportunity form. */
export function uiOpportunityToCreate(form, userIdByName = () => null) {
  const body = uiOpportunityToPatch(form, userIdByName);
  return {
    ...body,
    name: String(form.name || '').slice(0, 120),
    accountName: String(form.account || '').slice(0, 255),
    stage: 'Qualification',
    currency: form.currency || 'INR',
    arr: Number(form.arr) || 0,
    oneTime: Number(form.oneTime) || 0,
    products: uiProducts(form).length ? uiProducts(form) : [{ productSlot: 1, productTsp: form.productTsp || 'TSP', modules: [] }],
  };
}
