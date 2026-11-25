import { apiFetch, apiUpload } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';
import { apiOpportunityToUi, uiOpportunityToPatch, uiProductsChanged, uiProducts } from '../mappers/opportunityMapper.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}
const post = (path, body = {}) => call(path, { method: 'POST', body: JSON.stringify(body) });
const patchReq = (path, body) => call(path, { method: 'PATCH', body: JSON.stringify(body) });
const o = (id) => endpoints.opportunity(id);

export const opportunityService = {
  list: (query = '') => call(`${endpoints.opportunities}${query ? `?${query}` : ''}`),
  get: (id) => call(o(id)),
  create: (payload) => post(endpoints.opportunities, payload),
  patch: (id, payload) => patchReq(o(id), payload),
  pipeline: () => call(endpoints.opportunityPipeline),
  history: (id) => call(`${o(id)}/history`),
  commercials: (id) => call(`${o(id)}/commercials`),
  proceed: (id, stage) => post(`${o(id)}/stages/${encodeURIComponent(stage)}/proceed`),
  hold: (id, body) => post(`${o(id)}/hold`, body),
  closeWon: (id, body) => post(`${o(id)}/close-won`, body),
  closeLost: (id, body) => post(`${o(id)}/close-lost`, body),
  closeNoBid: (id, body) => post(`${o(id)}/close-no-bid`, body),
  reopen: (id, body) => post(`${o(id)}/reopen`, body),
  fallback: (id, body) => patchReq(`${o(id)}/fallback`, body),
  activity: (id, body) => post(`${o(id)}/activities`, body),
  poReceipt: (id, body) => post(`${o(id)}/po-receipt`, body),
};

/** Every opportunity page (all pages of the list endpoint; max 100 per page). */
export async function listAllOpportunities() {
  const all = [];
  for (let page = 1; page < 50; page += 1) {
    const body = await apiFetch(`${endpoints.opportunities}?limit=100&page=${page}`);
    const rows = unwrapApiBody(body) || [];
    all.push(...rows);
    if (!body?.meta || page >= body.meta.totalPages) break;
  }
  return all;
}

/** Opportunity with its commercials (lines/versions) and History timeline, in the UI shape. */
export async function loadOpportunity(id, userName) {
  const [row, com, hist] = await Promise.all([
    opportunityService.get(id),
    opportunityService.commercials(id).catch(() => null),
    opportunityService.history(id).catch(() => []),
  ]);
  const ui = apiOpportunityToUi(row, userName);
  if (com) Object.assign(ui, { lines: com.lines || [], versions: com.versions?.length ? com.versions : ['Initial'], licence: com.licence ?? '', milestones: com.milestones ?? '', amcTerm: com.amcTerm ?? '' });
  ui.history = (hist || []).map((h) => ({ t: h.t, m: `${String(h.m).replace(/^User (\d+)$/, (_, uid) => userName(uid))} · ${new Date(h.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}` }));
  ui.files = await listDocuments('OPPORTUNITY', ui.id).catch(() => []);
  return ui;
}

/**
 * Save a page change (`patch(p, note)` in the v14 pages) to the right endpoints:
 * fields → PATCH, products → PUT products, commercials → commercials, PO → po-receipt, note → activity log.
 */
export async function saveOpportunityPatch(opp, p, note, userIdByName) {
  const id = opp._apiId || opp.id;
  const body = uiOpportunityToPatch(p, userIdByName);
  if (Object.keys(body).length) await opportunityService.patch(id, body);
  if (uiProductsChanged(opp, p)) await call(`${o(id)}/products`, { method: 'PUT', body: JSON.stringify({ products: uiProducts({ ...opp, ...p }) }) });
  if (p.versions && p.versions.length > (opp.versions || []).length) {
    if (p.lines) await patchReq(`${o(id)}/commercials`, { lines: opp.lines });
    await post(`${o(id)}/commercials/versions`, { versionLabel: p.versions[p.versions.length - 1] });
  } else if (p.lines || 'licence' in p || 'milestones' in p || 'amcTerm' in p) {
    const c = {};
    for (const k of ['lines', 'licence', 'milestones', 'amcTerm']) if (k in p) c[k] = p[k];
    await patchReq(`${o(id)}/commercials`, c);
  }
  if (p.poNumber) await post(`${o(id)}/po-receipt`, { poNumber: p.poNumber, poDate: p.poDate, ...(p.poValue !== '' && p.poValue != null ? { poValue: Number(p.poValue) } : {}) });
  if (note) await opportunityService.activity(id, { activityKind: 'System', summary: note.slice(0, 500) });
}

// ---------- documents (document-service) ----------
export async function listDocuments(entityType, entityId) {
  const body = await apiFetch(`/entity-documents?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&limit=100`);
  return (body?.items || []).map((it) => ({
    id: it.document.id,
    n: it.document.originalName,
    t: it.relationshipType,
    v: 'v' + (it.document.currentVersionNumber || 1),
    u: new Date(it.attachedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  }));
}

/** Upload a file and attach it to an entity (same file content is reused, not stored twice). */
export async function uploadDocument(file, entityType, entityId, relationshipType) {
  const fd = new FormData();
  fd.append('file', file);
  let documentId;
  try {
    documentId = (await apiUpload(endpoints.uploads, fd)).documentId;
  } catch (e) {
    documentId = e?.status === 409 ? e.details?.documentId : undefined;
    if (!documentId) throw e;
  }
  await apiFetch(`/documents/${documentId}/attachments`, {
    method: 'POST',
    body: JSON.stringify({ entityType, entityId, relationshipType: String(relationshipType || 'ATTACHMENT').slice(0, 50) }),
  });
  return documentId;
}

export const documentDownloadUrl = (documentId) =>
  `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010/api/v1'}/documents/${documentId}/download`;
