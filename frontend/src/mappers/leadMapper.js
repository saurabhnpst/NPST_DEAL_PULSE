import { joinMulti, splitMulti } from '../data/defaults.js';

const APPROVAL_FROM_API = {
  None: 'none',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
};

function pickModule(api) {
  const mods = api.moduleUpi || api.moduleBbps || api.moduleImps || [];
  if (Array.isArray(mods) && mods.length) return joinMulti(mods);
  return '';
}

/** Map API lead entity to the UI shape used by forms and tables. `userName(id)` turns owner ids into names. */
export function apiLeadToUi(api, userName = (id) => id || '—') {
  if (!api) return null;
  return {
    id: api.id,
    recordType: api.leadRecordType?.includes('PPAS') ? 'PPAS' : 'TSP',
    salutation: api.salutation || '',
    firstName: api.firstName || '',
    middleName: api.middleName || '',
    suffix: api.suffix || '',
    lastName: api.lastName || '',
    company: api.company || '',
    designation: api.title || api.designation || '',
    state: api.state || '',
    phone: api.phone || '',
    mobile: api.mobilePhone || '',
    email: api.email || '',
    website: api.website || '',
    status: api.status || 'New',
    owner: userName(api.ownerId),
    ownerId: api.ownerId || '',
    created: api.createdAt ? String(api.createdAt).slice(0, 10) : '',
    leadSource: api.leadSource || '',
    employeeReferral: api.employeeReferral || '',
    rating: api.rating || '',
    productTsp: api.productTsp || api.product || '',
    module: pickModule(api),
    productTsp2: api.productTsp2 || '—',
    productTsp3: api.productTsp3 || '—',
    productTsp4: api.productTsp4 || '—',
    rfp: !!api.rfpInvolved,
    approval: APPROVAL_FROM_API[api.approvalStage] || 'none',
    disqualReason: api.disqualificationReason || '',
    disqualRemark: api.disqualificationRemark || '',
    industry: api.industry || '',
    subIndustry: api.subIndustry || '',
    country: api.country || '',
    street: api.street || '',
    city: api.city || '',
    zip: api.postalCode || '',
    spocFirstName: api.spocFirstName || '',
    spocLastName: api.spocLastName || '',
    spocDesignation: api.spocDesignation || '',
    spocEmail: api.spocEmailId || '',
    spocPhone: api.spocContactNumber || '',
    currentVolume: api.currentYearlyVolume || '',
    yearlyVolumeProjection: api.yearlyVolumeProjection || '',
    additionalRemarks: api.additionalRemarks || '',
    description: api.description || '',
    history: [],
    oppId: api.convertedOpportunityId || undefined,
  };
}

/** Map new-lead form values to CreateLeadDto fields (subset the UI currently collects). */
export function uiLeadToApi(form, ownerId) {
  const modules = splitMulti(form.module);
  const payload = {
    salutation: form.salutation,
    firstName: form.firstName,
    middleName: form.middleName,
    lastName: form.lastName,
    suffix: form.suffix,
    company: form.company,
    title: form.designation,
    website: form.website,
    email: form.email,
    phone: form.phone,
    mobilePhone: form.mobile,
    leadRecordType: form.recordType,
    leadSource: form.leadSource,
    employeeReferral: form.employeeReferral,
    rating: form.rating,
    status: form.status || 'New',
    productTsp: form.productTsp,
    productTsp2: form.productTsp2 === '—' ? undefined : form.productTsp2,
    productTsp3: form.productTsp3 === '—' ? undefined : form.productTsp3,
    productTsp4: form.productTsp4 === '—' ? undefined : form.productTsp4,
    industry: form.industry,
    subIndustry: form.subIndustry,
    street: form.street,
    city: form.city,
    state: form.state,
    postalCode: form.zip,
    country: form.country,
    spocFirstName: form.spocFirstName,
    spocLastName: form.spocLastName,
    spocDesignation: form.spocDesignation,
    spocEmailId: form.spocEmail,
    spocContactNumber: form.spocPhone,
    currentYearlyVolume: form.currentVolume,
    yearlyVolumeProjection: form.yearlyVolumeProjection,
    additionalRemarks: form.additionalRemarks,
    rfpInvolved: !!form.rfp,
  };
  if (ownerId) payload.ownerId = ownerId;
  // empty form fields are not sent (numeric/date columns reject '')
  for (const k of Object.keys(payload)) if (payload[k] === '' || payload[k] === undefined) delete payload[k];
  if (modules.length) {
    const p = (form.productTsp || '').toUpperCase();
    if (p.includes('BBPS')) payload.moduleBbps = modules;
    else if (p.includes('IMPS')) payload.moduleImps = modules;
    else payload.moduleUpi = modules;
  }
  return payload;
}