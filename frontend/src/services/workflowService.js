// P&L decisions, Pre-PO evaluations, RFP synopses and compliance matrices — API calls + mapping to the v14 UI shapes.
import { apiFetch } from '../api/apiClient.js';
import { unwrapApiBody } from '../api/unwrap.js';

const call = async (path, init) => unwrapApiBody(await apiFetch(path, init));
const post = (path, body = {}) => call(path, { method: 'POST', body: JSON.stringify(body) });
const patch = (path, body) => call(path, { method: 'PATCH', body: JSON.stringify(body) });
const listOf = (b) => (Array.isArray(b) ? b : b?.items ?? b?.data ?? []);
const cr = (v) => '₹' + ((Number(v) || 0) / 1e7).toFixed(2) + ' Cr';
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const day = (v) => (v ? String(v).slice(0, 10) : '');
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && v !== null));

// ---------- P&L decisions (opportunity-service) ----------
export async function loadDecisions(userName) {
  return listOf(await call('/opportunity-decisions')).map((d) => ({
    id: d.id, oppId: d.oppId, val: cr(d.dealValue), init: cr(d.initialValue), prop: d.prop || 'Proposal (latest)',
    rec: d.rec, recBy: `${userName(d.recByUserId)} · ${when(d.recAt)}`, syn: d.syn, concern: d.concern || '',
    done: d.done ? { v: d.done.v, by: `${userName(d.done.byUserId)} · P&L Head`, at: when(d.done.at), note: d.done.note || '—' } : null,
  }));
}
export const recommend = (oppId, rec, syn, concern) => post('/opportunity-decisions', clean({ oppId, rec, syn, concern }));
export const decide = (id, v, note) => post(`/opportunity-decisions/${id}/decide`, clean({ v, note }));

// ---------- Pre-PO evaluations (opportunity-service) — API returns the v14 shape ----------
export const loadEvaluations = async () => listOf(await call('/opportunity-evaluations'));
export const createEvaluation = (ev) => post('/opportunity-evaluations', ev);
export const updateEvaluation = (id, changes) => patch(`/opportunity-evaluations/${id}`, changes);

// ---------- RFP synopses (rfp-service) ----------
export async function loadSynopses(userName) {
  const body = await apiFetch('/rfps?limit=100');
  return listOf(body).filter((r) => r.synopsisStatus).map((r) => ({
    id: r.id, leadId: r.leadId || null, name: r.title, account: r.issuerName || '', status: r.synopsisStatus,
    owner: userName(r.ownerId), ownerId: r.ownerId, rfpRef: r.referenceNumber || '', scope: r.scopeNotes || '',
    dealSize: Number(r.dealSize) || 0, products: r.products || '', due: day(r.submissionDeadline), preBid: day(r.preBidMeetingAt),
    submission: day(r.submissionDeadline), bidOpening: day(r.bidOpeningAt), emd: r.emdRequired ? 'Yes' : 'No', emdAmount: r.emdDetails || '',
    pbg: r.pbgRequired ? (r.pbgDetails || 'Yes') : 'No', eligibility: r.eligibilityNotes || '', context: r.context || '', risks: r.risks || '',
    returnNote: r.returnNote || '', oppId: r.opportunityId ? r.opportunityId.trim() : undefined,
    presalesOwner: r.presalesOwnerId ? userName(r.presalesOwnerId) : undefined,
  }));
}
/** Create or update a synopsis; returns the RFP id. `status` Draft / Submitted (Returned stays Returned until resubmitted). */
export async function saveSynopsis(syn, ownerId) {
  const iso = (d) => (d ? new Date(d).toISOString() : undefined);
  const body = clean({
    title: syn.name, issuerName: syn.account, referenceNumber: syn.rfpRef, leadId: syn.leadId || undefined, ownerId: syn.ownerId || ownerId,
    synopsisStatus: ['Draft', 'Submitted'].includes(syn.status) ? syn.status : undefined, scopeNotes: syn.scope, dealSize: Number(syn.dealSize) || undefined,
    products: syn.products, preBidMeetingAt: iso(syn.preBid), submissionDeadline: iso(syn.submission || syn.due), bidOpeningAt: iso(syn.bidOpening),
    emdRequired: syn.emd === 'Yes', emdDetails: syn.emdAmount, pbgRequired: String(syn.pbg || '').startsWith('Yes'), pbgDetails: syn.pbg,
    eligibilityNotes: syn.eligibility, context: syn.context, risks: syn.risks,
  });
  const saved = syn.id ? await patch(`/rfps/${syn.id}`, body) : await post('/rfps', body);
  return saved.id;
}
export const acceptSynopsis = (id, presalesOwnerId) => post(`/rfps/${id}/accept`, clean({ presalesOwnerId }));
export const returnSynopsis = (id, note) => post(`/rfps/${id}/return`, { note });

// ---------- Compliance matrices (compliance-service) ----------
const POS_FROM = { PENDING: 'Awaiting response', COMPLIANT: 'Full', PARTIALLY_COMPLIANT: 'Partial', NON_COMPLIANT: 'No', NOT_APPLICABLE: 'N/A' };
export const POSITIONS = { Full: 'COMPLIANT', Partial: 'PARTIALLY_COMPLIANT', No: 'NON_COMPLIANT', 'N/A': 'NOT_APPLICABLE' };

/** Latest assessment per opportunity → `{ rows, meta }` in the v14 store shape (`compliance`, `complianceMeta`). */
export async function loadCompliance(userName) {
  const latest = new Map();
  for (const a of listOf(await call('/assessments'))) {
    const cur = latest.get(a.opportunityId);
    if (a.opportunityId && (!cur || String(a.createdAt) > String(cur.createdAt))) latest.set(a.opportunityId, a);
  }
  const rows = [];
  const meta = {};
  await Promise.all([...latest.values()].map(async (a) => {
    const [lines, signoffs] = await Promise.all([call(`/assessments/${a.id}/matrix`), call(`/assessments/${a.id}/sign-offs`).catch(() => [])]);
    const last = listOf(signoffs).sort((x, y) => String(y.signedOffAt).localeCompare(String(x.signedOffAt)))[0];
    const signed = last?.decision === 'SIGNED_OFF';
    meta[a.opportunityId] = { assessmentId: a.id, status: a.status, updated: day(a.updatedAt), signedOff: signed ? day(last.signedOffAt) : null, signedBy: signed ? userName(last.signerActorId) : null };
    for (const l of listOf(lines)) {
      rows.push({ id: l.id, assessmentId: a.id, oppId: a.opportunityId, name: l.requirementTitle, kind: String(l.criticality || 'S')[0] === 'M' ? 'M' : 'S',
        team: l.category || '—', pos: POS_FROM[l.complianceStatus] || l.complianceStatus, ev: l.notes || '', rev: l.reviewStatus || 'Pending' });
    }
  }));
  return { rows, meta };
}

/** Start a matrix from the seeded standard configuration for the opportunity's domain (UPI / BBPS / IMPS). */
export async function startMatrix(opp) {
  const configs = listOf(await call('/configurations')).filter((c) => c.status === 'Active');
  const config = configs.find((c) => c.productTsp === opp.productTsp && c.name.startsWith('DealPulse standard'))
    || configs.find((c) => c.name === 'DealPulse standard — UPI') || configs[0];
  if (!config) throw new Error('No active compliance configuration — run `npm --prefix backend run seed:compliance`');
  const a = await post('/assessments', { configurationId: config.id, opportunityId: opp.id, name: `${opp.account} · ${opp.name}`.slice(0, 255) });
  await post(`/assessments/${a.id}/start`);
  await post(`/assessments/${a.id}/matrix/initialize`);
}
export const updateRow = (r, changes) => patch(`/assessments/${r.assessmentId}/matrix/${r.id}`, changes);
export const addRow = (assessmentId, row) => post(`/assessments/${assessmentId}/matrix`, clean({ title: row.name, criticality: row.kind === 'M' ? 'Mandatory' : 'Supporting', category: row.team, notes: row.ev }));
export const deleteRow = (r) => call(`/assessments/${r.assessmentId}/matrix/${r.id}`, { method: 'DELETE' });

/** Sign off: move to In Review, record the SME review, then sign off (the backend then locks the matrix). */
export async function signOffMatrix(meta, comment) {
  if (meta.status !== 'InReview') await patch(`/assessments/${meta.assessmentId}/status`, { status: 'InReview' });
  const review = await post(`/assessments/${meta.assessmentId}/reviews`, { comments: comment });
  await post(`/assessments/${meta.assessmentId}/reviews/${review.id}/submit`, { decision: 'APPROVED' });
  await post(`/assessments/${meta.assessmentId}/sign-offs`, { decision: 'SIGNED_OFF', comments: comment });
}
