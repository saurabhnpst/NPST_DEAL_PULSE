import { createContext, useContext, useReducer } from 'react';
import { stageMeta } from '../data/defaults.js';

const initial = () => ({
  leads: [],
  opportunities: [],
  synopses: [],
  rfps: [],
  apiApprovals: [],
  decisions: [],
  compliance: [],
  complianceMeta: {},
  teams: [],
  evaluations: [],
  reviews: [],
  seq: { lead: 0, opp: 0, syn: 0, eval: 0 },
});

export const stamp = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const year = () => new Date().getFullYear();
const log = (rec, t, who) => ({ ...rec, history: [{ t, m: who + ' · ' + stamp() }, ...(rec.history || [])] });
const upd = (list, id, fn) => list.map((x) => (x.id === id ? fn(x) : x));

function reducer(state, a) {
  switch (a.type) {
    case 'SET_LEADS':
      return { ...state, leads: a.leads || [] };
    case 'SET_OPPORTUNITIES':
      return { ...state, opportunities: a.opportunities || [] };
    case 'SET_RFPS':
      return { ...state, rfps: a.rfps || [] };
    case 'SET_API_APPROVALS':
      return { ...state, apiApprovals: a.apiApprovals || [] };
    case 'RESET':
      return initial();

    case 'ADD_LEAD': {
      const n = state.seq.lead + 1;
      const id = `LEAD-${year()}-${String(n).padStart(5, '0')}`;
      const lead = { ...a.lead, id, created: new Date().toISOString().slice(0, 10), approval: 'none', history: [{ t: 'Lead created · status New', m: a.who + ' · ' + stamp() }] };
      return { ...state, leads: [lead, ...state.leads], seq: { ...state.seq, lead: n }, lastId: id };
    }
    case 'UPDATE_LEAD':
      return { ...state, leads: upd(state.leads, a.id, (l) => log({ ...l, ...a.patch }, a.note || 'Lead details edited', a.who)) };

    case 'ADD_OPP': {
      const n = state.seq.opp + 1;
      const id = `OPP-${year()}-${String(n).padStart(5, '0')}`;
      const opp = { tag: '', tone: 'gray', ...a.opp, id, history: [{ t: `Opportunity created at ${a.opp.stage}`, m: a.who + ' · ' + stamp() }] };
      let leads = state.leads;
      if (a.fromLead) leads = upd(leads, a.fromLead, (l) => log({ ...l, status: 'Qualified', oppId: id }, 'Converted to opportunity ' + id, a.who));
      return { ...state, opportunities: [opp, ...state.opportunities], leads, seq: { ...state.seq, opp: n }, lastId: id };
    }
    case 'UPDATE_OPP':
      return { ...state, opportunities: upd(state.opportunities, a.id, (o) => log({ ...o, ...a.patch }, a.note || 'Details edited', a.who)) };
    case 'PATCH_OPP': // change without a history entry (e.g. ticking a task)
      return { ...state, opportunities: upd(state.opportunities, a.id, (o) => ({ ...o, ...a.patch })) };
    case 'MOVE_STAGE': {
      return { ...state, opportunities: upd(state.opportunities, a.id, (o) => log({ ...o, stage: a.stage, ...(a.extra || {}) },
        `Stage: ${o.stage} → ${a.stage}`
        + (a.extra?.lostReason ? ` (${a.extra.lostReason}${a.extra.lostReasonRemark ? ' — ' + a.extra.lostReasonRemark : ''})` : '')
        + (a.extra?.closedValue ? ` · PO ${inr(a.extra.closedValue)}${a.extra.poDate ? ' dated ' + a.extra.poDate : ''}` : '')
        + (a.extra?.overrideReason ? ` · override: ${a.extra.overrideReason}` : '')
        + (a.stage === 'On Hold' && a.extra?.holdReason ? ` · hold reason: ${a.extra.holdReason}${a.extra.holdDetails ? ' — ' + a.extra.holdDetails : ''}` : '')
        + (o.stage === 'On Hold' && a.extra?.fallbacks?.[0] ? ` · reopened with fallback: ${a.extra.fallbacks[0].plan}` : ''), a.who)) };
    }

    case 'SAVE_SYNOPSIS': {
      if (a.syn.id) return { ...state, synopses: upd(state.synopses, a.syn.id, (s) => ({ ...s, ...a.syn })) };
      const n = state.seq.syn + 1;
      const id = `SYN-${year()}-${String(n).padStart(3, '0')}`;
      return { ...state, synopses: [{ ...a.syn, id }, ...state.synopses], seq: { ...state.seq, syn: n }, lastId: id };
    }
    case 'ACCEPT_SYNOPSIS': {
      const syn = state.synopses.find((s) => s.id === a.id);
      const n = state.seq.opp + 1;
      const oppId = `OPP-${year()}-${String(n).padStart(5, '0')}`;
      const opp = {
        ...a.oppDefaults, id: oppId, name: syn.name, account: syn.account, owner: syn.owner, presales: a.presales,
        arr: Math.round((syn.dealSize || 0) * 0.3), oneTime: Math.round((syn.dealSize || 0) * 0.7), stage: 'Qualification', tender: 'RFP',
        productTsp: syn.products || a.oppDefaults.productTsp, tag: 'RFP · Synopsis accepted', tone: 'green',
        history: [{ t: 'Synopsis accepted; lead converted, opportunity created', m: a.who + ' · ' + stamp() }]
      };
      const leads = syn.leadId ? upd(state.leads, syn.leadId, (l) => log({ ...l, status: 'Qualified', oppId }, 'Synopsis accepted · converted to ' + oppId, a.who)) : state.leads;
      return {
        ...state, leads, opportunities: [opp, ...state.opportunities], seq: { ...state.seq, opp: n }, lastId: oppId,
        synopses: upd(state.synopses, a.id, (s) => ({ ...s, status: 'Accepted', oppId, presalesOwner: a.presales }))
      };
    }

    case 'DECIDE':
      return { ...state, decisions: upd(state.decisions, a.id, (d) => ({ ...d, done: { v: a.v, by: a.who + ' · P&L Head', at: stamp(), note: a.note || '—' } })) };
    case 'RECOMMEND': {
      const opp = state.opportunities.find((o) => o.id === a.oppId);
      const cr = '₹' + (((opp.arr || 0) + (opp.oneTime || 0)) / 1e7).toFixed(2) + ' Cr';
      const existing = state.decisions.find((d) => d.oppId === a.oppId && !d.done);
      const rec = { oppId: a.oppId, val: cr, init: existing?.init || cr, prop: existing?.prop || 'Proposal (latest)', rec: a.rec, recBy: a.who + ' · ' + stamp(), syn: a.syn, concern: a.concern, done: null };
      const decisions = existing ? upd(state.decisions, existing.id, (d) => ({ ...d, ...rec })) : [{ id: 'D' + Date.now(), ...rec }, ...state.decisions];
      return { ...state, decisions, opportunities: upd(state.opportunities, a.oppId, (o) => log(o, `Sent to P&L Head with a ${a.rec} recommendation`, a.who)) };
    }

    case 'COMPLIANCE': {
      const row = state.compliance.find((c) => c.id === a.id);
      const meta = state.complianceMeta || {};
      return { ...state, compliance: upd(state.compliance, a.id, (c) => ({ ...c, rev: a.rev })),
        complianceMeta: { ...meta, [row.oppId]: { ...(meta[row.oppId] || {}), updated: new Date().toISOString().slice(0, 10) } } };
    }
    case 'TEAMS_SEND':
      return { ...state, teams: [a.msg, ...(state.teams || [])].slice(0, 200) };
    case 'COMPLIANCE_ADD': {
      const meta = state.complianceMeta || {};
      return { ...state, compliance: [...state.compliance, { id: 'N' + Date.now(), oppId: a.oppId, ...a.row }],
        complianceMeta: { ...meta, [a.oppId]: { ...(meta[a.oppId] || {}), updated: new Date().toISOString().slice(0, 10) } } };
    }
    case 'COMPLIANCE_DELETE': {
      const row = state.compliance.find((c) => c.id === a.id);
      const meta = state.complianceMeta || {};
      return { ...state, compliance: state.compliance.filter((c) => c.id !== a.id),
        complianceMeta: row ? { ...meta, [row.oppId]: { ...(meta[row.oppId] || {}), updated: new Date().toISOString().slice(0, 10) } } : meta };
    }
    case 'COMPLIANCE_REMOVE': { // delete a whole compliance matrix
      const meta = { ...(state.complianceMeta || {}) };
      delete meta[a.oppId];
      return { ...state, compliance: state.compliance.filter((c) => c.oppId !== a.oppId), complianceMeta: meta, hiddenCompliance: [...(state.hiddenCompliance || []), a.oppId] };
    }
    case 'COMPLIANCE_RESTORE':
      return { ...state, hiddenCompliance: (state.hiddenCompliance || []).filter((x) => x !== a.oppId) };
    case 'START_COMPLIANCE': {
      const meta = state.complianceMeta || {};
      const rows = a.rows.map(([name, kind, team, pos, ev, rev], i) => ({ id: `N${Date.now()}${i}`, oppId: a.oppId, name, kind, team, pos, ev, rev }));
      return { ...state, compliance: [...state.compliance, ...rows], complianceMeta: { ...meta, [a.oppId]: { updated: new Date().toISOString().slice(0, 10) } },
        hiddenCompliance: (state.hiddenCompliance || []).filter((x) => x !== a.oppId) };
    }
    case 'SIGNOFF_COMPLIANCE': {
      const meta = state.complianceMeta || {};
      const cur = meta[a.oppId] || {};
      const next = a.undo ? { ...cur, signedOff: null, signedBy: null } : { ...cur, signedOff: stamp().split(',')[0], signedBy: a.who };
      return { ...state, complianceMeta: { ...meta, [a.oppId]: { ...next, updated: new Date().toISOString().slice(0, 10) } } };
    }
    case 'ADD_REVIEW':
      return { ...state, reviews: [a.review, ...state.reviews] };
    case 'REVIEW':
      return { ...state, reviews: upd(state.reviews, a.id, (r) => ({ ...r, status: a.status })) };
    case 'ADD_EVAL': {
      const n = state.seq.eval + 1;
      const id = `EVAL-${year()}-${String(n).padStart(3, '0')}`;
      return { ...state, evaluations: [{ ...a.ev, id }, ...state.evaluations], seq: { ...state.seq, eval: n }, lastId: id };
    }
    case 'UPDATE_EVAL':
      return { ...state, evaluations: upd(state.evaluations, a.id, (e) => ({ ...e, ...a.patch })) };
    default: return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

// ---------- helpers ----------
export const dealValue = (o) => (Number(o.arr) || 0) + (Number(o.oneTime) || 0);
export const toCr = (v) => (v / 1e7).toFixed(1);
export const inr = (v) => '₹' + Number(v || 0).toLocaleString('en-IN');
export const category = (v) => {
  const cr = v / 1e7;
  if (cr < 1) return 'CAT 1';
  if (cr < 10) return 'CAT 2';
  if (cr < 50) return 'CAT 3';
  if (cr < 100) return 'CAT 4';
  return 'CAT 5';
};
export const weighted = (o) => dealValue(o) * stageMeta(o.stage).prob / 100;
export const fmtDate = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  if (isNaN(x)) return d;
  return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
