import { joinMulti, splitMulti } from '../data/defaults.js';

/** Map API opportunity to the UI pipeline / detail shape (subset for list and board). */
export function apiOpportunityToUi(api) {
  if (!api) return null;
  const arr = Number(api.arr) || 0;
  const oneTime = Number(api.oneTime) || 0;
  return {
    id: api.publicId || String(api.id),
    _apiId: api.id != null ? String(api.id) : undefined,
    name: api.name || '',
    account: api.accountName || '',
    arr,
    oneTime,
    stage: api.stage || 'Qualification',
    closeDate: api.closeDate ? String(api.closeDate).slice(0, 10) : '',
    owner: api.ownerDisplayName || api.ownerUserId || '—',
    presales: api.presalesDisplayName || api.presalesUserId || '—',
    tag: api.tag || '',
    tone: api.tone || 'gray',
    territory: api.territory || '',
    currency: api.currency || 'INR',
    productTsp: api.primaryProduct || api.productTsp || '',
    module: Array.isArray(api.modules) ? joinMulti(api.modules) : api.module || '',
    productTsp2: api.productTsp2 || '—',
    oppType: api.oppType || '',
    leadSource: api.leadSource || '',
    tender: api.tenderType || api.tender || 'Non RFP',
    hosting: api.hosting || '',
    history: [],
  };
}

export function normalizeOpportunityList(body) {
  if (Array.isArray(body)) return body.map(apiOpportunityToUi).filter(Boolean);
  if (body && Array.isArray(body.items)) return body.items.map(apiOpportunityToUi).filter(Boolean);
  return [];
}

/** Minimal CreateOpportunityDto from the new-opportunity form. */
export function uiOpportunityToCreate(form) {
  const mods = splitMulti(form.module);
  return {
    name: String(form.name || '').slice(0, 120),
    accountName: String(form.account || '').slice(0, 255),
    stage: form.stage || 'Qualification',
    closeDate: form.closeDate,
    currency: form.currency || 'INR',
    arr: Number(form.arr) || 0,
    oneTime: Number(form.oneTime) || 0,
    leadSource: form.leadSource || undefined,
    territory: form.territory || undefined,
    region: form.region || undefined,
    industry: form.industry || undefined,
    subIndustry: form.subIndustry || undefined,
    oppType: form.oppType || undefined,
    tender: form.tender || undefined,
    hosting: form.hosting || undefined,
    partner: form.partner || undefined,
    competitors: form.competitors?.length ? form.competitors : undefined,
    compellingEvent: form.compellingEvent || undefined,
    painPoint: form.painPoint || undefined,
    nextStep: form.nextStep || undefined,
    products: [
      {
        productSlot: 1,
        productTsp: form.productTsp || 'TSP',
        modules: mods,
      },
    ],
  };
}