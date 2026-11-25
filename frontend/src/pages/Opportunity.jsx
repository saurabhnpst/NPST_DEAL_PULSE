import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, dealValue, inr, category, fmtDate, stamp } from '../store/Store.jsx';
import { opportunityService } from '../services/opportunityService.js';
import { apiOpportunityToUi } from '../mappers/opportunityMapper.js';
import { LoadingPanel, ErrorPanel } from '../components/AsyncState.jsx';
import {
  stageMeta, OPEN_STAGES, PRODUCTS, PRODUCTS_2_4, MODULES, OPP_TYPES, TERRITORIES, LOST_REASONS, LEAD_SOURCES, OVERRIDE_REASONS, HOLD_REASONS, plusDays,
  REGIONS, BUSINESS_TYPES, TENDER_TYPES, COMPETITORS, INDUSTRIES, SUB_INDUSTRIES, ACCOUNT_SIZES, HOSTING, SOLUTION_TYPES, SERVICE_MODELS, PRODUCT_OWNERS,
  BILLING_FREQUENCIES, CONTRACT_YEARS, YES_NO, FY27_MONTHS
} from '../data/defaults.js';
import { MERCHANT_CATEGORIES } from '../data/merchantCategories.js';
import { useTeams, TeamsBadge } from '../components/Teams.jsx';
import { ownerOptions, PRESALES_OPTIONS } from '../data/peopleOptions.js';
import { Badge, ReadOnlyNote, Stepper, Tabs, Timeline, Toast, Modal, MultiPick } from '../components/ui.jsx';

const EARLY_STAGES = ['Qualification', 'Needs Analysis', 'Impact Analysis', 'Proposal'];
const LATE_STAGES = ['Negotiation'];
const CLOSEABLE_STAGES = [...OPEN_STAGES, 'On Hold', 'No Bid'];
const stageTasksFor = (opp) => opp.tasks.filter((t) => (t.stage || opp.stage) === opp.stage);

const TABS = ['Details', 'Pre-PO evaluation', 'RFP & compliance', 'Proposal & decision', 'Commercials & PO', 'Documents', 'History'];
const TSP = ['—', ...PRODUCTS_2_4];
const REVIEWER_ROLES = ['Legal', 'Finance', 'Compliance', 'Security'];
const short = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');
const uid = () => Math.random().toString(36).slice(2, 8);

// ---- field spec (labels follow the design) ----
const T = (key, label, o = {}) => ({ key, label, t: 'text', ...o });
const N = (key, label, o = {}) => ({ key, label, t: 'number', ...o });
const D = (key, label, o = {}) => ({ key, label, t: 'date', ...o });
const S = (key, label, opts, o = {}) => ({ key, label, t: 'select', opts, ...o });
const C = (key, label, o = {}) => ({ key, label, t: 'check', ...o });
const A = (key, label, o = {}) => ({ key, label, t: 'area', ...o });
const R = (key, label, o = {}) => ({ key, label, t: 'ro', ...o });
const M = (key, label, of, o = {}) => ({ key, label, t: 'mpick', of, ...o }); // module multi-select for a product field

// ---- calculated values (formula fields) ----
const num = (x) => Number(x) || 0;
export const fy27Q = (v, q) => (q === 'Q1' ? num(v.fy27Q1) : FY27_MONTHS.find((g) => g.q === q).months.reduce((a, [k]) => a + num(v[k]), 0));
const fy27Total = (v) => ['Q1', 'Q2', 'Q3', 'Q4'].reduce((a, q) => a + fy27Q(v, q), 0);
const amountFirstYear = (v) => num(v.arr) + num(v.oneTime);
const tcv = (v) => amountFirstYear(v) + num(v.year2) + num(v.year3) + num(v.year4) + num(v.year5);

// Sections and fields follow "Opportunity Information.docx" / "Opportunity Fields.xlsx".
const GROUPS = [
  { name: 'Opportunity information', always: true, fields: [
    T('name', 'Opportunity Name', { req: 1, note: 'Defaults to Company_Product on conversion' }), S('owner', 'Opportunity Owner', ['—'], { req: 1 }),
    T('account', 'Account Name', { req: 1 }), R('_recordType', 'Opportunity Record Type'),
    R('_forecast', 'Forecast Category', { note: 'Set by stage' }), R('_stage', 'Stage', { note: 'Moved with “Save & proceed”' }),
    S('leadSource', 'Lead Source', LEAD_SOURCES, { note: 'Carried from the lead' }), D('closeDate', 'Close Date', { req: 1 }),
    T('followupDetails', 'Followup Details'), D('updatedCloseDate', 'Updated Close Date (if any)'),
    S('region', 'Region', REGIONS), D('expectedPoDate', 'Expected PO Date'),
    T('currentVolume', 'Current Yearly Volume/Transactions'), D('updatedExpectedPoDate', 'Updated Expected PO Date'),
    N('yearlyVolumeProjection', 'Yearly Volume Projection', { plain: 1 }), D('projectStartExpected', 'Project Start Date (Expected)'),
    T('spocFirstName', 'SPOC First Name'), D('firstBillingExpected', 'First Billing Date(Expected)'),
    T('spocLastName', 'SPOC Last Name'), R('_prob', 'Probability (%)', { note: 'Set by stage' }),
    S('businessType', 'Type', BUSINESS_TYPES), S('presales', 'Pre-Sales owner', PRESALES_OPTIONS),
    S('territory', 'Territory', TERRITORIES), R('convertedFrom', 'Converted from lead')
  ] },
  { name: 'Industry information', always: true, fields: [
    S('industry', 'Industry', ['', ...INDUSTRIES]), S('subIndustry', 'Sub Industry', (v) => ['', ...(SUB_INDUSTRIES[v.industry] || [])], { note: 'Depends on Industry' }),
    S('merchantCategory', 'Merchant Categories', ['', ...MERCHANT_CATEGORIES]), S('accountSize', 'Account Size (L/M/S)', ['', ...ACCOUNT_SIZES]),
    T('industryRemark', 'Industry Remark')
  ] },
  { name: 'Product description', always: true, fields: [
    S('productTsp', 'Product', PRODUCTS, { req: 1 }), R('_vertical', 'Product Vertical'),
    M('module', 'Module', 'productTsp', { span: 1, note: 'Pick one or more · options depend on the product' }),
    S('productTsp2', 'Product TSP 2', TSP), M('module2', 'Module', 'productTsp2', { when: (v) => v.productTsp2 && v.productTsp2 !== '—' }),
    S('productTsp3', 'Product TSP 3', TSP), M('module3', 'Module', 'productTsp3', { when: (v) => v.productTsp3 && v.productTsp3 !== '—' }),
    S('productTsp4', 'Product TSP 4', TSP), M('module4', 'Module', 'productTsp4', { when: (v) => v.productTsp4 && v.productTsp4 !== '—' }),
    T('productRemark', 'Product TSP Other Remark'), S('solutionType', 'Solution Type', ['', ...SOLUTION_TYPES]),
    S('hosting', 'Hosting', HOSTING), S('serviceModel', 'Service Model', ['', ...SERVICE_MODELS]),
    S('productOwner', 'Product Owner', ['', ...PRODUCT_OWNERS])
  ] },
  { name: 'Stage 1 · Qualification', stage: 0, fields: [
    R('_totalArr', 'Total ARR'), N('arr', 'Annual Recurring Revenue (ARR)', { req: 1 }), N('oneTime', 'One Time Fees', { req: 1 }),
    R('_amount', 'Amount(First Year)', { note: 'ARR + One Time Fees' }), R('_tcv', 'Total Contract Value (TCV)', { note: 'First year + later years' }),
    S('contractYears', 'Contract Duration (number of years)', CONTRACT_YEARS), S('billingFrequency', 'Billing Frequency/Cycle (Annual/Monthly)', ['', ...BILLING_FREQUENCIES]),
    S('currency', 'Currency', ['INR', 'USD'], { req: 1 }), T('compellingEvent', 'Compelling Event', { req: 1 }),
    S('tender', 'Tender', TENDER_TYPES), N('year2', 'Total Deal Size(second year)'), N('year3', 'Total Deal Size(Third year)'),
    T('transactions', 'Number of Transactions'), S('oppType', 'Opportunity Type', OPP_TYPES), S('partner', 'Is Partner involved?', YES_NO),
    T('partnerName', 'Partner Name', { when: (v) => v.partner === 'Yes' }),
    { key: 'competitors', label: 'Competition (multi-select)', t: 'multi', opts: COMPETITORS }, T('competitionRemarks', 'Other Competiton Remarks'),
    T('today', 'How do they do today?'), T('implication', 'Business Implication of doing nothing'), T('presentPain', 'Present pain points'), T('painPoint', 'Pain point?'),
    A('notes', 'Notes'), A('nextStep', 'Next Step'),
    { key: '_fy27', label: 'FY 27 revenue phasing', t: 'fy27' }
  ] },
  { name: 'Stage 2 · Needs Analysis', stage: 1, fields: [
    T('economicBuyer', 'Who is the Economic Buyer?'), C('champion', 'Is the Champion identified?'),
    C('nda', 'NDA?'), C('championOk', 'Champion engaged and validated?'),
    T('strategy', 'Competitive strategy?'), S('reqReceived', 'Confirm Requirements/Doc Received?', YES_NO, { req: 1, mustBe: 'Yes' }),
    S('presalesInvolved', 'Pre sales / Product involved', YES_NO), T('presalesName', 'Pre sales Person Name', { note: 'Required when Pre sales / Product involved = Yes', when: (v) => v.presalesInvolved === 'Yes', reqIf: (v) => v.presalesInvolved === 'Yes' })
  ] },
  { name: 'Stage 3 · Impact Analysis', stage: 2, fields: [
    S('ebAligned', 'Economic Buyer Aligned?', YES_NO), T('success', 'What is Success criteria?'),
    D('ebMet', 'Date when we met him?'), C('poc', 'Is there going to POC?'),
    C('demoDone', 'Demo/ POC/Deep Engagement Done?', { req: 1 }), S('sow', 'SOW done?', YES_NO, { req: 1, mustBe: 'Yes' })
  ] },
  { name: 'Stage 4 · Proposal', stage: 3, fields: [
    D('proposalDate', 'Proposal Submission date?', { req: 1 }), C('criteriaKnown', 'Is Decision Criteria known?'),
    D('latestFollowupDate', 'Latest Followup Date'), T('criteria', 'Is Decision Criteria known reason', { when: (v) => v.criteriaKnown }),
    A('followupDetails', 'Followup Details')
  ] },
  { name: 'Stage 5 · Negotiation', stage: 4, fields: [
    S('contractShared', 'Contract shared?', ['', ...YES_NO]), S('contractSigned', 'Contract Signed ?', ['', ...YES_NO]),
    T('discount', 'Discounted asked?'), D('signDate', 'Date of signing the contract?', { when: (v) => v.contractSigned === 'Yes', reqIf: (v) => v.contractSigned === 'Yes' }),
    S('commercials', 'Commercials', ['', ...YES_NO]), S('bankInterview', 'Bank Interview', ['', ...YES_NO]),
    S('documentation', 'Documentation', ['', ...YES_NO]), S('bankApproval', 'Bank Approval', ['', ...YES_NO]),
    S('uatAgreement', 'UAT Agreement', ['', ...YES_NO]), S('poReceived', 'PO Received', ['', ...YES_NO])
  ] },
  { name: 'Stage 6 · Closed Won', won: true, fields: [
    D('projectStartActual', 'Project Start Date (Actual)'), D('firstBillingDate', 'First Billing Date'),
    D('poDate', 'PO Date', { req: 1 }), N('firstBillingValue', 'First Billing Value'),
    N('poValue', 'PO Value', { req: 1 })
  ] },
  { name: 'Stage 7 · Closed Lost', lost: true, fields: [S('lostReason', 'Lost Reason', ['', ...LOST_REASONS], { req: 1 }), T('lostReasonRemark', 'Lost Reason Remark')] },
  { name: 'On Hold', hold: true, fields: [S('holdReason', 'Hold Reason', ['', ...HOLD_REASONS], { req: 1 }), T('holdDetails', 'Hold Reason Remarks'), D('holdUntil', 'Review hold by')] }
];

const isFilled = (f, v) => {
  const val = v[f.key];
  if (f.mustBe) return val === f.mustBe;
  if (f.t === 'check') return !!val;
  if (f.t === 'number') return Number(val) > 0;
  return val !== undefined && val !== null && String(val).trim() !== '' && val !== '—';
};
const missingFor = (stageIdx, v) => GROUPS.filter((g) => g.stage === stageIdx || g.always)
  .flatMap((g) => g.fields.filter((f) => (f.req || (f.reqIf && f.reqIf(v))) && (!f.when || f.when(v)) && !isFilled(f, v)).map((f) => f.label));

export default function Opportunity() {
  const { id } = useParams();
  const { user, can, readOnly } = useAuth();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const raw = state.opportunities.find((o) => o.id === id || o._apiId === id);
  const [oppFetch, setOppFetch] = useState({ loading: false, error: null });

  useEffect(() => {
    if (raw || !id) return;
    let cancelled = false;
    (async () => {
      setOppFetch({ loading: true, error: null });
      try {
        const row = await opportunityService.get(id);
        if (cancelled) return;
        const ui = apiOpportunityToUi(row);
        dispatch({ type: 'SET_OPPORTUNITIES', opportunities: [...state.opportunities, ui] });
        setOppFetch({ loading: false, error: null });
      } catch (e) {
        if (!cancelled) setOppFetch({ loading: false, error: e });
      }
    })();
    return () => { cancelled = true; };
  }, [id, raw, dispatch, state.opportunities]);
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState(null); // non-null while editing Details
  const [toast, setToast] = useState('');
  const [closing, setClosing] = useState(null);
  const [focus, setFocus] = useState(null); // stage group opened from the stepper
  const topRef = useRef(null);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3200); return () => clearTimeout(t); }, [toast]);
  if (oppFetch.loading) return <LoadingPanel label="Loading opportunity…" />;
  if (oppFetch.error) {
    return <ErrorPanel title="Opportunity unavailable" message={oppFetch.error.message} onRetry={() => setOppFetch({ loading: false, error: null })} />;
  }
  if (!raw) return <div className="panel empty"><h1 className="h1">Opportunity not found</h1><p className="muted s14">No opportunity with this ID in the API.</p><Link to="/opportunities">Back to opportunities</Link></div>;

  const owners = ownerOptions(user);
  const opp = {
    tasks: [],
    dealTeam: [],
    deliverables: [],
    documents: [],
    commercials: [],
    logs: [],
    people: [],
    evaluations: [],
    fy27Q1: 0,
    ...raw,
  };
  const inBand = opp.skipPresales
    ? !!can.editOppLate // non-RFP deal: Sales owns every stage (Qualification → Negotiation); Pre-Sales / Solution can't edit
    : (can.editOppEarly && EARLY_STAGES.includes(opp.stage)) || (can.editOppLate && LATE_STAGES.includes(opp.stage));
  const presalesCan = can.createEval && !opp.skipPresales; // Pre-Sales extras (evaluations, documents) are off for non-RFP deals
  const canEdit = can.editOpp && OPEN_STAGES.includes(opp.stage) && inBand;
  const canCloseDeal = can.editOppLate && CLOSEABLE_STAGES.includes(opp.stage);
  const editing = !!form && canEdit;
  const v = editing ? form : opp;
  const idx = OPEN_STAGES.indexOf(opp.stage);
  const meta = stageMeta(opp.stage);
  const missing = idx >= 0 ? missingFor(idx, v) : [];
  const openStageTasks = stageTasksFor(opp).filter((t) => !t.done);
  const needsOverride = opp.tasks.some((t) => EARLY_STAGES.includes(t.stage || opp.stage) && !t.done);
  const patch = (p, note) => dispatch({ type: note ? 'UPDATE_OPP' : 'PATCH_OPP', id, patch: p, note, who: user.name });
  const say = setToast;

  const startEdit = () => { setTab('Details'); setForm({ ...opp }); topRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const save = () => { const { history, ...rest } = form; patch(rest, 'Details edited'); setForm(null); say('Saved · change recorded in History'); };
  const advance = () => {
    if (missing.length) { setTab('Details'); return say('Fill these first: ' + missing.join(', ')); }
    if (openStageTasks.length) { setTab('Details'); return say('Complete these tasks first: ' + openStageTasks.map((t) => t.t).join(', ')); }
    if (editing) { const { history, ...rest } = form; patch(rest, 'Details saved'); setForm(null); }
    const next = OPEN_STAGES[idx + 1];
    dispatch({ type: 'MOVE_STAGE', id, stage: next, who: user.name });
    say(`Moved to ${next} · probability ${stageMeta(next).prob}%`);
  };
  const goToStage = (i) => {
    setTab('Details');
    setFocus(i);
    if (canEdit && !editing) setForm({ ...opp });
    // open the matching form section and bring it into view
    setTimeout(() => {
      const el = document.getElementById('stage-grp-' + i);
      if (!el) return;
      el.open = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    }, 30);
  };
  const isHold = (c) => c.to === 'On Hold';
  const overridePart = (c) => (needsOverride && !isHold(c) ? { earlyClose: true, overrideReason: c.overrideReason, overrideJustification: c.overrideJustification.trim() } : {});
  const openClose = (to = 'Closed Won') => setClosing({ to, reason: '', remark: '', holdReason: '', holdDetails: '', holdUntil: plusDays(30), poDate: opp.poDate || '', poValue: opp.poValue || '', projectStartActual: '', firstBillingDate: '', firstBillingValue: '', overrideReason: '', overrideJustification: '' });
  const closeValid = closing && (
    isHold(closing) ? (closing.holdReason && closing.holdDetails.trim())
      : (closing.to !== 'Closed Lost' || closing.reason) && (closing.to !== 'Closed Won' || (closing.poDate && Number(closing.poValue) > 0))
        && (!needsOverride || (closing.overrideReason && closing.overrideJustification.trim()))
  );
  const close = () => {
    const extra = isHold(closing)
      ? { holdReason: closing.holdReason, holdDetails: closing.holdDetails.trim(), holdUntil: closing.holdUntil, holdFrom: opp.stage, holdAt: stamp() }
      : { closeDate: plusDays(0),
        ...(closing.to === 'Closed Lost' ? { lostReason: closing.reason, lostReasonRemark: closing.remark.trim() } : {}),
        ...(closing.to === 'Closed Won' ? { poDate: closing.poDate, poValue: Number(closing.poValue), poReceived: 'Yes', closedValue: Number(closing.poValue), projectStartActual: closing.projectStartActual, firstBillingDate: closing.firstBillingDate, firstBillingValue: closing.firstBillingValue === '' ? '' : Number(closing.firstBillingValue) } : {}) };
    dispatch({ type: 'MOVE_STAGE', id, stage: closing.to, who: user.name, extra: { ...extra, ...overridePart(closing) } });
    setClosing(null); setForm(null);
    say(isHold(closing) ? 'Opportunity put on hold · reason recorded' : 'Deal marked ' + closing.to + (needsOverride ? ' · early-close override logged' : ''));
  };

  return (
    <>
      <div ref={topRef} className="s13 muted"><Link to="/opportunities">Opportunities</Link> / <span className="mono">{opp.id}</span></div>
      <div className="col gap10">
        <h1 className="h1">{opp.name} · {opp.account}</h1>
        <div className="row wrap gap16 s14">
          <span><span className="muted">Owner</span> <b>{opp.owner}</b></span>
          <span><span className="muted">Amount (First Year)</span> <b>{inr(dealValue(opp))}</b></span>
          <span><span className="muted">TCV</span> <b>{inr(tcv(opp))}</b></span>
          <span><span className="muted">Close Date</span> <b>{fmtDate(opp.updatedCloseDate || opp.closeDate)}</b></span>
          <span><span className="muted">Probability</span> <b>{meta.prob}%</b> · {meta.forecast}</span>
        </div>
        {(canEdit || canCloseDeal) && (
          <div className="row wrap gap8">
            {canEdit && (editing ? <button className="btn" onClick={() => setForm(null)}>Cancel edit</button> : <button className="btn" onClick={startEdit}>Edit</button>)}
            {canCloseDeal && opp.stage !== 'On Hold' && <button className="btn" onClick={() => openClose('On Hold')}>Put on hold</button>}
            {canCloseDeal && <button className="btn" onClick={() => openClose()}>Close deal</button>}
            {canEdit && idx < OPEN_STAGES.length - 1 && (
              <button className="btn-p"
                title={openStageTasks.length ? 'Pending tasks: ' + openStageTasks.map((t) => t.t).join(', ') : missing.length ? 'Pending fields: ' + missing.join(', ') : undefined}
                onClick={advance}>{editing ? 'Save & proceed' : 'Proceed'} to {OPEN_STAGES[idx + 1]}</button>
            )}
          </div>
        )}
      </div>
      {readOnly && <ReadOnlyNote />}

      {(OPEN_STAGES.includes(opp.stage) || opp.stage === 'Closed Won') && <Stepper label="Opportunity stage · click a stage to open its form" steps={[...OPEN_STAGES, 'Closed']} current={opp.stage === 'Closed Won' ? 6 : idx} onStep={goToStage} canStep={(i) => i < OPEN_STAGES.length} />}
      {OPEN_STAGES.includes(opp.stage) && <p className="s12 muted" style={{ margin: '-8px 0 0' }}>Click any stage above to jump to its form.{canEdit ? ` Use “Save & proceed” in the ${opp.stage} section to move on.` : ''}</p>}
      <div className="row between wrap gap8 status-row">
        {OPEN_STAGES.includes(opp.stage)
          ? <p className="banner">Current stage <b>{opp.stage}</b></p>
          : opp.stage === 'On Hold'
            ? <p className="warn">This opportunity is <b>On Hold</b>{opp.holdReason ? <> · hold reason: <b>{opp.holdReason}</b></> : ''}{opp.holdDetails ? ` — ${opp.holdDetails}` : ''}{opp.holdFrom ? ` · held at ${opp.holdFrom}` : ''}{opp.holdUntil ? ` · review by ${fmtDate(opp.holdUntil)}` : ''}.</p>
            : <p className={opp.stage === 'Closed Won' ? 'ok' : 'warn'}>This opportunity is <b>{opp.stage}</b>{opp.lostReason ? ` · ${opp.lostReason}` : ''}{opp.lostReasonRemark ? ` — ${opp.lostReasonRemark}` : ''}{opp.poValue && opp.stage === 'Closed Won' ? ` · PO ${inr(opp.poValue)}${opp.poDate ? ' on ' + fmtDate(opp.poDate) : ''}` : opp.closedValue ? ` · closed ${inr(opp.closedValue)}` : ''}.</p>}
      </div>
      {opp.stage === 'On Hold' && <FallbackPanel opp={opp} canAct={!!can.fallback} say={say} />}

      {closing && (
        <Modal title={isHold(closing) ? 'Put on hold' : 'Close deal'} onClose={() => setClosing(null)} footer={<>
          <button className="btn-p" disabled={!closeValid} onClick={close}>
            {isHold(closing) ? 'Put on hold' : needsOverride ? 'Override and close' : 'Confirm'}
          </button>
          <button className="btn" onClick={() => setClosing(null)}>Cancel</button>
        </>}>
          <div className="col gap12">
            <div className="grid2">
              {/* "Put on hold" is its own dialog; "Close deal" only offers closing outcomes */}
              {!isHold(closing) && <label className="fl">Outcome *<select className="in" value={closing.to} onChange={(e) => setClosing({ ...closing, to: e.target.value })}><option>Closed Won</option><option>Closed Lost</option><option>No Bid</option></select></label>}
              {closing.to === 'Closed Lost' && <label className="fl">Lost Reason *<select className="in" value={closing.reason} onChange={(e) => setClosing({ ...closing, reason: e.target.value })}><option value="">Choose…</option>{LOST_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>}
              {isHold(closing) && <label className="fl" style={{ gridColumn: '1 / -1' }}>Hold Reason *<select className="in" value={closing.holdReason} onChange={(e) => setClosing({ ...closing, holdReason: e.target.value })}><option value="">--None--</option>{HOLD_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>}
              {closing.to === 'Closed Lost' && <label className="fl" style={{ gridColumn: '1 / -1' }}>Lost Reason Remark<input className="in" value={closing.remark} placeholder="e.g. Lead transferred to another team" onChange={(e) => setClosing({ ...closing, remark: e.target.value })} /></label>}
            </div>
            {closing.to === 'Closed Won' && (
              <div className="grid2">
                <label className="fl">PO Date *<input className="in" type="date" value={closing.poDate} onChange={(e) => setClosing({ ...closing, poDate: e.target.value })} /></label>
                <label className="fl">PO Value *<input className="in" type="number" value={closing.poValue} onChange={(e) => setClosing({ ...closing, poValue: e.target.value })} /><span className="note">{inr(Number(closing.poValue) || 0)}</span></label>
                <label className="fl">Project Start Date (Actual)<input className="in" type="date" value={closing.projectStartActual} onChange={(e) => setClosing({ ...closing, projectStartActual: e.target.value })} /></label>
                <label className="fl">First Billing Date<input className="in" type="date" value={closing.firstBillingDate} onChange={(e) => setClosing({ ...closing, firstBillingDate: e.target.value })} /></label>
                <label className="fl">First Billing Value<input className="in" type="number" value={closing.firstBillingValue} onChange={(e) => setClosing({ ...closing, firstBillingValue: e.target.value })} /></label>
              </div>
            )}
            {isHold(closing) && (
              <>
                <label className="fl">Hold Reason Remarks *<textarea className="in ta" rows={3} placeholder="Why is it on hold? What is blocking the deal, and what was the bank told?" value={closing.holdDetails} onChange={(e) => setClosing({ ...closing, holdDetails: e.target.value })} /></label>
                <label className="fl">Review hold by<input className="in" type="date" value={closing.holdUntil} onChange={(e) => setClosing({ ...closing, holdUntil: e.target.value })} /><span className="note">Sales and the P&amp;L Head can define a fallback plan and reopen the opportunity at any time.</span></label>
              </>
            )}
            {needsOverride && !isHold(closing) && (
              <div className="override col gap10">
                <div className="s13 w600" style={{ color: '#A3221A' }}>Early-close override · stage tasks still open</div>
                <p className="muted s12" style={{ margin: 0 }}>{opp.tasks.filter((t) => EARLY_STAGES.includes(t.stage || opp.stage) && !t.done).map((t) => t.t).join(' · ')}</p>
                <label className="fl">Reason for Override *<select className="in" value={closing.overrideReason} onChange={(e) => setClosing({ ...closing, overrideReason: e.target.value })}><option value="">Choose…</option>{OVERRIDE_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
                <label className="fl">Mandate Details &amp; Justification *<textarea className="in ta" rows={3} placeholder="Explain why this deal is being closed before all stage tasks are complete" value={closing.overrideJustification} onChange={(e) => setClosing({ ...closing, overrideJustification: e.target.value })} /></label>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Tabs label="Opportunity sections" tabs={TABS} value={tab} onChange={setTab} />

      <div className="opp-grid">
        <div className="col gap16" style={{ minWidth: 0 }}>
          {tab === 'Details' && <DetailsTab v={v} opp={opp} editing={editing} canEdit={canEdit} setForm={setForm} save={save} startEdit={startEdit} missing={missing} openStageTasks={openStageTasks} idx={idx} advance={advance} focus={focus} />}
          {tab === 'Pre-PO evaluation' && <PrePoTab opp={opp} canEdit={canEdit || presalesCan} say={say} />}
          {tab === 'RFP & compliance' && <RfpTab opp={opp} />}
          {tab === 'Proposal & decision' && <DecisionTab opp={opp} canEdit={canEdit} patch={patch} say={say} />}
          {tab === 'Commercials & PO' && <CommercialsTab opp={opp} canEdit={canEdit} patch={patch} say={say} />}
          {tab === 'Documents' && <DocumentsTab opp={opp} canEdit={canEdit || presalesCan} patch={patch} say={say} />}
          {tab === 'History' && <HistoryTab opp={opp} canEdit={canEdit} patch={patch} />}
        </div>
        <SidePanels opp={opp} canEdit={canEdit} patch={patch} nav={nav} />
      </div>
      <Toast msg={toast} />
    </>
  );
}

// ---------------- Details ----------------
function DetailsTab({ v, opp, editing, canEdit, setForm, save, startEdit, missing, openStageTasks, idx, advance, focus }) {
  const meta = stageMeta(opp.stage);
  const roVal = {
    _stage: `${STAGE_NO[opp.stage] ? STAGE_NO[opp.stage] + ' - ' : ''}${opp.stage}`, _prob: meta.prob + '%', _forecast: meta.forecast,
    _recordType: v.recordType || 'TSP', _vertical: v.recordType === 'PPAS' ? 'EVOK' : 'TSP',
    _totalArr: inr(num(v.updatedArr) || num(v.arr)), _amount: `${inr(amountFirstYear(v))} · ${category(amountFirstYear(v))}`, _tcv: inr(tcv(v))
  };
  const set = (k, val) => setForm({ ...v, [k]: val });

  const field = (f) => {
    if (f.when && !f.when(v)) return null;
    const req = f.req || (f.reqIf && f.reqIf(v));
    const lab = <span>{f.label}{req ? <span className="req"> *</span> : ''}</span>;
    const note = f.note ? <span className="note">{f.note}</span> : null;
    const val = v[f.key];
    switch (f.t) {
      case 'ro': return <label key={f.key} className="fl">{lab}<input className="in ro" readOnly value={roVal[f.key] ?? val ?? '—'} />{note}</label>;
      case 'check': return <label key={f.key} className="fl chk"><input type="checkbox" disabled={!editing} checked={!!val} onChange={(e) => set(f.key, e.target.checked)} />{f.label}{req ? ' *' : ''}</label>;
      case 'area': return <label key={f.key} className="fl" style={{ gridColumn: '1 / -1' }}>{lab}<textarea className="in ta" rows={2} readOnly={!editing} value={val || ''} onChange={(e) => set(f.key, e.target.value)} /></label>;
      case 'mpick': {
        const prod = v[f.of];
        return <MultiPick key={f.key} label={`Module ${prod && prod !== '—' ? prod : ''}`} value={val} disabled={!editing} options={MODULES[prod] || []} onChange={(x) => set(f.key, x)} note={f.note} span={f.span} />;
      }
      case 'multi': {
        const list = val || [];
        return (
          <div key={f.key} className="fl" style={{ gridColumn: '1 / -1' }}>{lab}
            <div className="row wrap gap8">
              {f.opts.map((o) => {
                const on = list.includes(o);
                return <button type="button" key={o} disabled={!editing} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => set(f.key, on ? list.filter((x) => x !== o) : [...list, o])}>{o}</button>;
              })}
            </div>
          </div>
        );
      }
      case 'fy27': return <Fy27 key={f.key} v={v} editing={editing} set={set} />;
      case 'select': {
        const base = typeof f.opts === 'function' ? f.opts(v) : f.opts;
        const opts = base.includes(val) || val === undefined || val === null ? base : [val, ...base];
        const onChange = (e) => {
          const x = e.target.value;
          if (MODULE_OF[f.key]) return setForm({ ...v, [f.key]: x, [MODULE_OF[f.key]]: '' });
          if (f.key === 'industry') return setForm({ ...v, industry: x, subIndustry: '' });
          set(f.key, x);
        };
        return <label key={f.key} className="fl">{lab}<select className="in" disabled={!editing} value={val ?? ''} onChange={onChange}>{opts.map((o) => <option key={o || '_none'} value={o}>{o || '--None--'}</option>)}</select>{note}</label>;
      }
      default:
        return <label key={f.key} className="fl">{lab}<input className="in" type={f.t} readOnly={!editing} value={val ?? ''} onChange={(e) => set(f.key, f.t === 'number' ? Number(e.target.value) : e.target.value)} />{f.t === 'number' && val && !f.plain ? <span className="note">{inr(val)}</span> : note}</label>;
    }
  };

  const showGroup = (g) => {
    if (g.lost) return opp.stage === 'Closed Lost';
    if (g.won) return opp.stage === 'Closed Won' || opp.stage === 'Negotiation';
    if (g.hold) return opp.stage === 'On Hold' || !!opp.holdReason;
    return true;
  };

  return (
    <>
      <p className="muted s13" style={{ margin: 0 }}>Fields marked * are required before “Save &amp; proceed” moves the deal to the next stage. Probability and forecast category are set by the stage. Amount (First Year) = ARR + One Time Fees; TCV adds the later years.{canEdit && !editing ? ' Click Edit to change values.' : ''}</p>
      {canEdit && missing.length > 0 && <p className="warn">To complete <b>{opp.stage}</b>: {missing.join(', ')}.</p>}
      {canEdit && openStageTasks.length > 0 && <p className="warn">Open tasks for <b>{opp.stage}</b>: {openStageTasks.map((t) => t.t).join(', ')}.</p>}
      {GROUPS.filter(showGroup).map((g) => {
        let st, tone;
        if (g.always) { st = 'Always shown'; tone = 'gray'; }
        else if (g.lost) { st = 'Closed Lost'; tone = 'red'; }
        else if (g.won) { st = opp.stage === 'Closed Won' ? 'Closed Won' : 'Filled when closing as won'; tone = opp.stage === 'Closed Won' ? 'green' : 'gray'; }
        else if (g.hold) { st = opp.stage === 'On Hold' ? 'On hold' : 'Earlier hold'; tone = 'amber'; }
        else if (opp.stage === 'Closed Won' || g.stage < idx) { st = 'Complete'; tone = 'green'; }
        else if (g.stage === idx) { st = 'Current stage'; tone = 'blue'; }
        else if (g.stage === idx + 1) { st = 'Next stage'; tone = 'gray'; }
        else { st = 'Later'; tone = 'gray'; }
        return (
          <details key={g.name} id={g.stage !== undefined ? 'stage-grp-' + g.stage : undefined} className="grp" open={g.always || g.stage === idx || g.stage === focus || (g.lost && opp.stage === 'Closed Lost') || (g.won && opp.stage === 'Closed Won') || (g.hold && opp.stage === 'On Hold')}>
            <summary><span className="h2">{g.name}</span><Badge tone={tone}>{st}</Badge></summary>
            <div>
              <div className="grid2 opp-fields">{g.fields.map(field)}</div>
              {g.stage !== undefined && canEdit && <StageActions g={g} idx={idx} editing={editing} save={save} startEdit={() => setForm({ ...opp })} advance={advance} missing={missing} />}
              {g.stage !== undefined && !canEdit && g.stage > idx && idx >= 0 && <div className="stage-actions s13 muted">Unlocks after {OPEN_STAGES[g.stage - 1]} is complete.</div>}
            </div>
          </details>
        );
      })}
      <details className="grp">
        <summary><span className="h2">System information</span><Badge tone="gray">Automatic</Badge></summary>
        <div className="grid3">
          <label className="fl">Created By<input className="in ro" readOnly value={opp.createdBy} /></label>
          <label className="fl">Last Modified By<input className="in ro" readOnly value={opp.history?.[0]?.m || '—'} /></label>
        </div>
      </details>
      {canEdit && (editing
        ? <div className="row gap8 sticky-actions"><button className="btn-p" onClick={save}>Save</button><button className="btn" onClick={() => setForm(null)}>Cancel</button></div>
        : <div><button className="btn" onClick={startEdit}>Edit details</button></div>)}
    </>
  );
}

const STAGE_NO = { Qualification: 1, 'Needs Analysis': 2, 'Impact Analysis': 3, Proposal: 4, Negotiation: 5, 'Closed Won': 6, 'Closed Lost': 7, 'No Bid': 8, 'On Hold': 9 };
const MODULE_OF = { productTsp: 'module', productTsp2: 'module2', productTsp3: 'module3', productTsp4: 'module4' };

/** FY27 revenue phasing: Q1 entered directly, Q2–Q4 = sum of their months, FY 27 = Q1..Q4. */
function Fy27({ v, editing, set }) {
  const box = (k, label) => (
    <label key={k} className="fl">{label}
      <input className="in mono" type="number" readOnly={!editing} value={v[k] ?? ''} placeholder="0" onChange={(e) => set(k, e.target.value === '' ? '' : Number(e.target.value))} />
    </label>
  );
  const ro = (label, value) => <label className="fl">{label}<input className="in ro mono" readOnly value={inr(value)} /></label>;
  return (
    <div className="fy27" style={{ gridColumn: '1 / -1' }}>
      <div className="row between wrap gap8"><span className="s14 w600">FY 27 revenue phasing</span><span className="s13">FY 27 <b className="mono">{inr(fy27Total(v))}</b></span></div>
      <div className="fy27-grid">
        <div className="fy27-q"><div className="fy27-h">FY27 Q1 · Apr–Jun</div>{box('fy27Q1', 'FY27 Q1')}{ro('FY27 Q1 total', fy27Q(v, 'Q1'))}</div>
        {FY27_MONTHS.map((g) => (
          <div key={g.q} className="fy27-q">
            <div className="fy27-h">FY27 {g.q}</div>
            {g.months.map(([k, l]) => box(k, l))}
            {ro(`FY27 ${g.q} total`, fy27Q(v, g.q))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StageActions({ g, idx, editing, save, startEdit, advance, missing }) {
  const next = OPEN_STAGES[g.stage + 1];
  if (g.stage < idx) return <div className="stage-actions s13" style={{ color: '#168A70' }}>✓ Stage complete</div>;
  if (g.stage > idx) return <div className="stage-actions s13 muted">Unlocks after {OPEN_STAGES[g.stage - 1]} is complete.{editing ? ' You can fill these fields now; they are saved with “Save”.' : ''}</div>;
  return (
    <div className="stage-actions">
      {editing ? <button className="btn" onClick={save}>Save</button> : <button className="btn" onClick={startEdit}>Edit this stage</button>}
      {next && <button className="btn-p" onClick={advance}>{editing ? 'Save & proceed' : 'Proceed'} to {next} →</button>}
      {next && missing.length > 0 && <span className="s12 muted">Still required: {missing.join(', ')}</span>}
      {!next && <span className="s13 muted">Last open stage · use “Close deal” when the outcome is known.</span>}
    </div>
  );
}

// ---------------- On hold · fallback & reopen ----------------
function FallbackPanel({ opp, canAct, say }) {
  const { user } = useAuth();
  const { dispatch } = useStore();
  const blank = { plan: '', suggestion: '', comment: '', stage: opp.holdFrom && OPEN_STAGES.includes(opp.holdFrom) ? opp.holdFrom : OPEN_STAGES[0] };
  const [f, setF] = useState(null);
  const list = opp.fallbacks || [];
  const entry = (kind) => ({ kind, by: user.name, at: stamp(), plan: f.plan.trim(), suggestion: f.suggestion.trim(), comment: f.comment.trim(), stage: kind === 'Reopened' ? f.stage : undefined });
  const saveOnly = () => {
    dispatch({ type: 'UPDATE_OPP', id: opp.id, patch: { fallbacks: [entry('Fallback'), ...list] }, note: `Fallback defined: ${f.plan.trim()}`, who: user.name });
    setF(null); say('Fallback plan saved');
  };
  const reopen = () => {
    dispatch({ type: 'MOVE_STAGE', id: opp.id, stage: f.stage, who: user.name, extra: { fallbacks: [entry('Reopened'), ...list], reopenedAt: stamp(), holdUntil: '' } });
    setF(null); say(`Opportunity reopened at ${f.stage}`);
  };
  return (
    <section className="panel col gap12 hold-panel" aria-label="Fallback and reopen">
      <div className="row between wrap gap8">
        <div>
          <h2 className="h2">Fallback &amp; reopen</h2>
          <p className="muted s13" style={{ margin: '4px 0 0' }}>Sales and the P&amp;L Head can record a fallback plan and reopen this opportunity, with comments and suggestions.</p>
        </div>
        {canAct && !f && <button className="btn-p" onClick={() => setF(blank)}>+ Define fallback</button>}
      </div>
      {f && (
        <div className="col gap10" style={{ background: '#F7FAFE', borderRadius: 8, padding: 14 }}>
          <label className="fl">Fallback plan *<textarea className="in ta" rows={2} placeholder="e.g. Offer a phased rollout starting with the AA module in Q1" value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} /></label>
          <div className="grid2">
            <label className="fl">Suggestion<textarea className="in ta" rows={2} placeholder="e.g. Revisit pricing with an opex model" value={f.suggestion} onChange={(e) => setF({ ...f, suggestion: e.target.value })} /></label>
            <label className="fl">Comment *<textarea className="in ta" rows={2} placeholder="Context for the team" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></label>
          </div>
          <label className="fl" style={{ maxWidth: 320 }}>Reopen at stage<select className="in" value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>{OPEN_STAGES.map((st) => <option key={st}>{st}</option>)}</select><span className="note">Used only when you click “Save &amp; reopen opportunity”{opp.holdFrom ? ` · was at ${opp.holdFrom} before the hold` : ''}</span></label>
          <div className="row gap8 wrap">
            <button className="btn" disabled={!f.plan.trim() || !f.comment.trim()} onClick={saveOnly}>Save fallback</button>
            <button className="btn-p" disabled={!f.plan.trim() || !f.comment.trim()} onClick={reopen}>Save &amp; reopen opportunity</button>
            <button className="btn" onClick={() => setF(null)}>Cancel</button>
          </div>
        </div>
      )}
      {list.length > 0 ? (
        <ol className="cmt-list">
          {list.map((c, i) => (
            <li key={i} className={'cmt ' + (c.kind === 'Reopened' ? 'g' : 'a')}>
              <div className="row between gap8 wrap"><Badge tone={c.kind === 'Reopened' ? 'green' : 'amber'}>{c.kind === 'Reopened' ? `Reopened at ${c.stage}` : 'Fallback'}</Badge><span className="s12 muted">{c.by} · {c.at}</span></div>
              <div className="s14" style={{ marginTop: 6 }}><b>Plan:</b> {c.plan}</div>
              {c.suggestion && <div className="s14"><b>Suggestion:</b> {c.suggestion}</div>}
              {c.comment && <div className="s13 muted">{c.comment}</div>}
            </li>
          ))}
        </ol>
      ) : <p className="muted s13" style={{ margin: 0 }}>No fallback defined yet.</p>}
    </section>
  );
}

// ---------------- Pre-PO ----------------
const EVAL_STEPS = ['Not Started', 'In Progress', 'Submitted', 'Under Bank Evaluation', 'Accepted / Changes / Rejected'];
const EVAL_STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Under Bank Evaluation', 'Accepted', 'Changes Requested', 'Rejected'];
const evalStep = (s) => (['Accepted', 'Changes Requested', 'Rejected'].includes(s) ? 4 : Math.max(0, EVAL_STEPS.indexOf(s)));

function PrePoTab({ opp, canEdit, say }) {
  const { user } = useAuth();
  const { state, dispatch } = useStore();
  const evals = state.evaluations.filter((e) => e.oppId === opp.id);
  const [selId, setSelId] = useState(evals[0]?.id);
  const sel = evals.find((e) => e.id === selId) || evals[0];
  const [ev, setEv] = useState(sel);
  const [addDl, setAddDl] = useState(null);
  const teams = useTeams();
  useEffect(() => { setEv(sel); }, [sel?.id]); // eslint-disable-line
  const f = (k) => (e) => setEv({ ...ev, [k]: e.target.value });

  const newEval = () => {
    const id = `EVAL-${new Date().getFullYear()}-${String(state.seq.eval + 1).padStart(3, '0')}`;
    dispatch({ type: 'ADD_EVAL', ev: { name: `${opp.productTsp} PoC`, oppId: opp.id, type: 'PoC', sales: opp.owner, solution: opp.presales !== '—' ? opp.presales : user.name, tech: '—', approval: 'Pending',
      start: plusDays(7), target: plusDays(37), submitted: '', status: 'Not Started', next: 'Approval by Pre-Sales Mgr', effort: 0, cost: 0, expectedPo: fmtDate(opp.closeDate), scope: '', deliverables: [] }, who: user.name });
    const sol = opp.presales !== '—' ? opp.presales : user.name;
    teams(sol, `New PoC evaluation ${id} created for ${opp.name} (${opp.account}). You are the Solution owner — please review and approve.`, { kind: 'PoC', ctx: `${opp.name} · ${opp.account}`, link: '/opportunities/' + opp.id });
    teams(user.name, `You are the Tech owner on PoC ${id} for ${opp.name} (${opp.account}).`, { kind: 'PoC', ctx: `${opp.name} · ${opp.account}`, link: '/opportunities/' + opp.id });
    setSelId(id); say('New evaluation created · Solution and Tech owners notified on Teams');
  };
  const saveEval = () => { dispatch({ type: 'UPDATE_EVAL', id: ev.id, patch: { ...ev, effort: Number(ev.effort) || 0, cost: Number(String(ev.cost).replace(/,/g, '')) || 0 } }); say('Saved · change recorded in History'); };
  const dls = sel ? (sel.deliverables || (sel.oppId === opp.id ? opp.deliverables : [])) : [];
  const setDls = (list) => (sel.deliverables ? dispatch({ type: 'UPDATE_EVAL', id: sel.id, patch: { deliverables: list } }) : dispatch({ type: 'PATCH_OPP', id: opp.id, patch: { deliverables: list } }));

  if (!sel) return (
    <section className="panel empty">
      <h2 className="h2">No demo, PoC or pilot yet</h2>
      <p className="muted s14">Evaluations belong to this opportunity — there is no separate opportunity.</p>
      {canEdit && <button className="btn-p" onClick={newEval}>+ New evaluation</button>}
    </section>
  );
  const ro = !canEdit;
  return (
    <>
      <section className="panel col gap16">
        <div className="row between wrap gap8">
          <div><div className="mono s12 muted">{sel.id} · linked to this opportunity (no separate opportunity)</div><h2 className="h2" style={{ fontSize: 18 }}>{ev?.name}</h2></div>
          <div className="row gap8"><Link className="btn" to="/pre-po">All evaluations</Link>{canEdit && <button className="btn" onClick={newEval}>+ New evaluation</button>}</div>
        </div>
        {evals.length > 1 && <div className="row wrap gap8">{evals.map((e) => <button key={e.id} className={e.id === sel.id ? 'pill on' : 'pill'} onClick={() => setSelId(e.id)}>{e.name}</button>)}</div>}
        {ev && <>
          <Stepper label="Evaluation status" steps={EVAL_STEPS} current={evalStep(ev.status)} />
          <div className="grid3">
            <label className="fl">Evaluation name *<input className="in" readOnly={ro} value={ev.name} onChange={f('name')} /></label>
            <label className="fl">Evaluation type *<select className="in" disabled={ro} value={ev.type} onChange={f('type')}><option>PoC</option><option>Demo</option><option>Pilot</option><option>Customization</option></select></label>
            <label className="fl">Status *<select className="in" disabled={ro} value={ev.status} onChange={f('status')}>{EVAL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="fl">Approval status<select className="in" disabled={ro} value={ev.approval} onChange={f('approval')}><option>Approved</option><option>Pending</option></select>{ev.approval === 'Approved' && <span className="note">Pre-Sales Mgr</span>}</label>
            <label className="fl">Sales owner *<select className="in" disabled={ro} value={ev.sales} onChange={f('sales')}>{owners.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="fl">Solution owner<select className="in" disabled={ro} value={ev.solution || '—'} onChange={f('solution')}>{PRESALES_OPTIONS.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="fl">Technical owner *<select className="in" disabled={ro} value={ev.tech} onChange={f('tech')}>{PRESALES_OPTIONS.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="fl">Start date *<input className="in" type="date" readOnly={ro} value={ev.start || ''} onChange={f('start')} /></label>
            <label className="fl">Target completion *<input className="in" type="date" readOnly={ro} value={ev.target || ''} onChange={f('target')} /></label>
            <label className="fl">Submitted to bank<input className="in" type="date" readOnly={ro} value={ev.submitted || ''} onChange={f('submitted')} /></label>
            <label className="fl">Expected PO date<input className="in" readOnly={ro} value={ev.expectedPo || ''} onChange={f('expectedPo')} /></label>
            <label className="fl">Effort before PO (person-days)<input className="in" type="number" readOnly={ro} value={ev.effort} onChange={f('effort')} /></label>
            <label className="fl">Cost before PO (₹)<input className="in" readOnly={ro} value={ev.cost} onChange={f('cost')} /><span className="note">{inr(Number(String(ev.cost).replace(/,/g, '')) || 0)}</span></label>
            <label className="fl" style={{ gridColumn: '1 / -1' }}>Scope *<textarea className="in ta" rows={2} readOnly={ro} value={ev.scope || ''} onChange={f('scope')} /></label>
            <label className="fl" style={{ gridColumn: '1 / -1' }}>Next action<input className="in" readOnly={ro} value={ev.next || ''} onChange={f('next')} /></label>
          </div>
          {canEdit && <div className="row gap8"><button className="btn-p" onClick={saveEval}>Save</button><button className="btn" onClick={() => setEv(sel)}>Cancel</button></div>}
        </>}
      </section>

      <section className="panel col gap10">
        <div className="row between"><h2 className="h2">Deliverables</h2>{canEdit && !addDl && <button className="btn" onClick={() => setAddDl({ t: '', o: sel.tech !== '—' ? sel.tech : user.name, due: plusDays(7), e: 2, s: 'Not started' })}>+ Add deliverable</button>}</div>
        {addDl && (
          <div className="grid3" style={{ background: '#F7FAFE', borderRadius: 8, padding: 14 }}>
            <label className="fl">Deliverable *<input className="in" value={addDl.t} onChange={(e) => setAddDl({ ...addDl, t: e.target.value })} /></label>
            <label className="fl">Owner<select className="in" value={addDl.o} onChange={(e) => setAddDl({ ...addDl, o: e.target.value })}>{PRESALES_OPTIONS.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="fl">Due<input className="in" type="date" value={addDl.due} onChange={(e) => setAddDl({ ...addDl, due: e.target.value })} /></label>
            <label className="fl">Effort (days)<input className="in" type="number" value={addDl.e} onChange={(e) => setAddDl({ ...addDl, e: Number(e.target.value) })} /></label>
            <div className="row gap8" style={{ alignSelf: 'end' }}>
              <button className="btn-p" disabled={!addDl.t} onClick={() => {
                const m = teams(addDl.o, `Deliverable assigned to you on ${sel.name} (${opp.account}): “${addDl.t}” — due ${short(addDl.due)}.`, { kind: 'Deliverable', ctx: `${opp.name} · ${opp.account}`, link: '/opportunities/' + opp.id });
                setDls([...dls, { ...addDl, id: uid(), due: short(addDl.due), teamsAt: m.time }]); setAddDl(null); say(`Deliverable added · ${addDl.o} notified on Teams`);
              }}>Add &amp; notify</button>
              <button className="btn" onClick={() => setAddDl(null)}>Cancel</button>
            </div>
          </div>
        )}
        <div className="tablewrap"><table>
          <thead><tr><th>Deliverable</th><th>Owner</th><th>Due</th><th>Effort (days)</th><th>Status</th></tr></thead>
          <tbody>
            {dls.map((d) => (
              <tr key={d.id}>
                <td className="w500">{d.t}</td><td>{d.o}{d.teamsAt && <><br /><TeamsBadge at={d.teamsAt} /></>}</td><td className="mono s13">{d.due}</td><td className="mono">{d.e}</td>
                <td>{canEdit
                  ? <select className="in sm" aria-label="Deliverable status" value={d.s} onChange={(e) => setDls(dls.map((x) => (x.id === d.id ? { ...x, s: e.target.value } : x)))}>{['Not started', 'In progress', 'Done', 'Blocked'].map((s) => <option key={s}>{s}</option>)}</select>
                  : <Badge tone={d.s === 'Done' ? 'green' : 'amber'}>{d.s}</Badge>}</td>
              </tr>
            ))}
            {dls.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>No deliverables yet.</td></tr>}
          </tbody>
        </table></div>
        {dls.length > 0 && <div className="s13 muted">Total effort {dls.reduce((a, d) => a + (Number(d.e) || 0), 0)} days · {dls.filter((d) => d.s === 'Done').length} of {dls.length} done</div>}
      </section>
    </>
  );
}

// ---------------- RFP & compliance ----------------
function RfpTab({ opp }) {
  const { state } = useStore();
  const syn = state.synopses.find((s) => s.oppId === opp.id);
  const comp = state.compliance.filter((c) => c.oppId === opp.id);
  const ok = comp.filter((c) => c.rev === 'Approved').length;
  const r = opp.rfp || (syn ? { ref: syn.rfpRef || '—', submitted: fmtDate(syn.submission || syn.due), opening: fmtDate(syn.bidOpening), emd: syn.emdAmount ? '₹' + syn.emdAmount : '—', pbg: syn.pbg || '—', owner: syn.presalesOwner || opp.presales, accepted: '' } : null);
  return (
    <div className="two">
      <section className="panel col gap10">
        <h2 className="h2">RFP synopsis</h2>
        {r ? (
          <>
            <p className="ok">Accepted by Pre-Sales{r.accepted ? ` on ${r.accepted}` : ''}. That acceptance converted the lead and created this opportunity.</p>
            <div className="kv">
              <div><div className="k">RFP reference</div><div className="v mono">{r.ref}</div></div>
              <div><div className="k">Bid submitted</div><div className="v">{r.submitted}</div></div>
              <div><div className="k">Bid opening</div><div className="v">{r.opening}</div></div>
              <div><div className="k">EMD</div><div className="v">{r.emd}</div></div>
              <div><div className="k">PBG</div><div className="v">{r.pbg}</div></div>
              <div><div className="k">Pre-Sales owner</div><div className="v">{r.owner}</div></div>
            </div>
            {syn?.scope && <p className="s14" style={{ margin: 0 }}>{syn.scope}</p>}
          </>
        ) : <p className="muted s14" style={{ margin: 0 }}>No RFP on this deal. Tender deals get their synopsis at the lead stage.</p>}
        <div><Link className="btn" to="/rfp">View synopsis</Link></div>
      </section>
      <section className="panel col gap10">
        <h2 className="h2">Compliance matrix</h2>
        {comp.length ? (
          <>
            <p className="muted s14" style={{ margin: 0 }}>{comp.filter((c) => c.kind === 'M').length} asked for in the RFP · {comp.filter((c) => c.kind === 'S').length} added by the system · {ok} of {comp.length} approved by experts.</p>
            <div className="bar" style={{ height: 10 }}><div style={{ height: 10, width: (ok / comp.length * 100) + '%', background: '#168A70' }} /></div>
            <div className="row wrap gap8">
              <Badge tone="green">{ok} approved</Badge><Badge tone="amber">{comp.filter((c) => c.rev === 'Pending').length} pending</Badge><Badge tone="red">{comp.filter((c) => c.rev === 'Rejected').length} rejected</Badge>
            </div>
          </>
        ) : <p className="muted s14" style={{ margin: 0 }}>No compliance matrix has been started for this opportunity.</p>}
        <div><Link className="btn" to="/compliance">Open compliance matrix</Link></div>
      </section>
    </div>
  );
}

// ---------------- Proposal & decision ----------------
function DecisionTab({ opp, canEdit, patch, say }) {
  const { user, can } = useAuth();
  const { state, dispatch } = useStore();
  const dec = state.decisions.find((d) => d.oppId === opp.id);
  const [rec, setRec] = useState(opp.recDraft);
  const [form, setForm] = useState(null); // {mode:'upload'|'assign', ...}
  const teams = useTeams();
  const [decNote, setDecNote] = useState('');
  const sent = dec && !dec.done && dec.recBy?.startsWith(user.name);

  const submitForm = () => {
    if (form.mode === 'upload') {
      const ex = opp.reviews.find((r) => r.t === form.doc);
      const nextV = ex ? 'v' + (parseInt(ex.v.slice(1), 10) + 1) : 'v1';
      const reviews = ex ? opp.reviews.map((r) => (r.id === ex.id ? { ...r, v: nextV, s: 'Assigned', due: short(plusDays(3)) } : r)) : [...opp.reviews, { id: uid(), t: form.doc, v: nextV, r: '—', due: '—', s: 'Not assigned' }];
      const fname = form.doc.replace(/\s+/g, '_') + '_' + nextV + '.pdf';
      patch({ reviews, files: [{ id: uid(), n: fname, t: 'Proposal', v: nextV, u: user.name + ' · ' + short(plusDays(0)) }, ...opp.files] }, `Uploaded ${form.doc} ${nextV}`);
      say(`${form.doc} ${nextV} uploaded` + (ex ? ' · earlier review superseded, re-review requested' : ''));
    } else {
      const ex = opp.reviews.find((r) => r.t === form.doc);
      const row = { id: ex?.id || uid(), t: form.doc, v: ex?.v || 'v1', r: form.reviewer, due: short(form.due), s: 'Assigned', teamsAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) };
      patch({ reviews: ex ? opp.reviews.map((r) => (r.id === ex.id ? row : r)) : [...opp.reviews, row] }, `Assigned ${form.doc} to ${form.reviewer}`);
      dispatch({ type: 'ADD_REVIEW', review: { id: 'R' + uid(), opp: `${opp.name} · ${opp.account}`, type: form.reviewer.split(' · ')[0] === 'Finance' ? 'Finance' : 'Legal / Compliance', doc: form.doc.replace(/\s+/g, '_') + '_' + row.v, ver: row.v, due: short(form.due), status: 'Assigned' } });
      teams(form.reviewer, `Please review “${form.doc}” for ${opp.name} (${opp.account}) — due ${short(form.due)}.`, { kind: 'Review', ctx: `${opp.name} · ${opp.account}`, link: '/opportunities/' + opp.id });
      say(`Review assigned to ${form.reviewer} · Teams message sent`);
    }
    setForm(null);
  };
  const docNames = Array.from(new Set(['Technical proposal', 'Commercial proposal', ...opp.reviews.map((r) => r.t)]));

  return (
    <>
      <section className="panel col gap10">
        <div className="row between wrap gap8">
          <h2 className="h2">Proposal and internal reviews</h2>
          {canEdit && <div className="row gap8">
            <button className="btn" onClick={() => setForm({ mode: 'upload', doc: docNames[0] })}>+ Upload version</button>
            <button className="btn" onClick={() => setForm({ mode: 'assign', doc: docNames[0], reviewer: REVIEWER_ROLES[0], due: plusDays(3) })}>+ Assign reviewer</button>
          </div>}
        </div>
        {form && (
          <div className="grid3" style={{ background: '#F7FAFE', borderRadius: 8, padding: 14 }}>
            <label className="fl">Document *<input className="in" list="docnames" value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} /><datalist id="docnames">{docNames.map((d) => <option key={d} value={d} />)}</datalist></label>
            {form.mode === 'assign' && <>
              <label className="fl">Reviewer *<select className="in" value={form.reviewer} onChange={(e) => setForm({ ...form, reviewer: e.target.value })}>{REVIEWER_ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label className="fl">Due *<input className="in" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></label>
            </>}
            {form.mode === 'upload' && <label className="fl">File<input className="in" type="file" style={{ paddingTop: 8 }} /><span className="note">Uploading a new version supersedes the current review.</span></label>}
            <div className="row gap8" style={{ alignSelf: 'end' }}><button className="btn-p" disabled={!form.doc} onClick={submitForm}>{form.mode === 'upload' ? 'Upload' : 'Assign'}</button><button className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </div>
        )}
        <div className="tablewrap"><table>
          <thead><tr><th>Document</th><th>Version</th><th>Reviewer</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {opp.reviews.map((d) => <tr key={d.id}><td className="w500">{d.t}</td><td>{d.v}</td><td>{d.r}{d.teamsAt && <><br /><TeamsBadge at={d.teamsAt} /></>}</td><td className="mono s13">{d.due}</td><td><Badge tone={d.s === 'Approved' ? 'green' : d.s === 'Changes requested' ? 'red' : 'amber'}>{d.s}</Badge></td></tr>)}
            {opp.reviews.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>No proposal uploaded yet.</td></tr>}
          </tbody>
        </table></div>
      </section>

      <section className="panel col gap10">
        <h2 className="h2">Step 1 · Sales recommendation</h2>
        {can.recommend ? (
          <>
            <div role="radiogroup" aria-label="Recommend proceeding?" className="grid2">
              {['Yes', 'No'].map((r) => <button key={r} role="radio" aria-checked={rec.rec === r} className={rec.rec === r ? 'opt on' : 'opt'} onClick={() => setRec({ ...rec, rec: r })}>{r === 'Yes' ? 'Yes, proceed' : 'No, do not proceed'}</button>)}
            </div>
            <label className="fl">Synopsis for the P&amp;L Head *<textarea className="in ta" rows={3} value={rec.syn} onChange={(e) => setRec({ ...rec, syn: e.target.value })} /></label>
            {rec.rec === 'No' && <label className="fl">Reason for No *<textarea className="in ta" rows={2} placeholder="Required when you recommend No" value={rec.reason || ''} onChange={(e) => setRec({ ...rec, reason: e.target.value })} /></label>}
            <label className="fl">Improvement points / concerns<textarea className="in ta" rows={2} value={rec.concern} onChange={(e) => setRec({ ...rec, concern: e.target.value })} /></label>
            <div className="row gap10 wrap">
              <button className="btn-p" disabled={!rec.syn || (rec.rec === 'No' && !rec.reason)} onClick={() => {
                dispatch({ type: 'RECOMMEND', oppId: opp.id, rec: rec.rec, syn: rec.syn, concern: rec.rec === 'No' ? 'Reason for No: ' + rec.reason + (rec.concern ? ' · ' + rec.concern : '') : rec.concern, who: user.name });
                patch({ recDraft: rec }); say('Sent to P&L Head');
              }}>Send to P&amp;L Head</button>
              {dec && !dec.done && <span role="status" className="s13" style={{ color: '#168A70' }}>Sent {dec.recBy.split(' · ').slice(1).join(' · ')} to Pushkar B. (P&amp;L Head)</span>}
            </div>
          </>
        ) : <p className="s14" style={{ margin: 0 }}>{dec ? <>Sales recommends <b>{dec.rec}</b> · {dec.recBy}<br /><span className="muted">{dec.syn}</span></> : <span className="muted">No recommendation yet.</span>}</p>}
      </section>

      <section className="panel col gap10">
        <div className="row between wrap gap8">
          <div><h2 className="h2">Step 2 · P&amp;L Head decision</h2>
            <p className="muted s13" style={{ margin: '4px 0 0' }}>{!dec ? 'Nothing sent yet.' : dec.done ? `${dec.done.v} by ${dec.done.by} · ${dec.done.at}` : 'Waiting for Pushkar B. to choose Proceed or Reject'}</p>
          </div>
          <Link className="btn" to="/decisions">Open P&amp;L decisions</Link>
        </div>
        {dec?.done && <p className={dec.done.v === 'Proceed' ? 'ok' : 'err'}><b>{dec.done.v}</b> · {dec.done.note}</p>}
        {dec && !dec.done && can.decide && (
          <div className="col gap8" style={{ background: '#F7FAFE', borderRadius: 8, padding: 14 }}>
            <div className="s13 w600">You are the P&amp;L Head</div>
            <textarea className="in ta" rows={2} placeholder="Comments (reason required for Reject)" value={decNote} onChange={(e) => setDecNote(e.target.value)} />
            <div className="row gap8">
              <button className="btn-p" onClick={() => { dispatch({ type: 'DECIDE', id: dec.id, v: 'Proceed', note: decNote, who: user.name }); patch({}, 'P&L Head: Proceed'); say('Decision recorded: Proceed'); }}>Proceed</button>
              <button className="btn-d" disabled={!decNote} onClick={() => { dispatch({ type: 'DECIDE', id: dec.id, v: 'Reject', note: decNote, who: user.name }); patch({}, 'P&L Head: Reject'); say('Decision recorded: Reject'); }}>Reject</button>
            </div>
          </div>
        )}
        {sent && !can.decide && null}
      </section>
    </>
  );
}

// ---------------- Commercials & PO ----------------
function CommercialsTab({ opp, canEdit, patch, say }) {
  const { user } = useAuth();
  const [lines, setLines] = useState(opp.lines);
  const [terms, setTerms] = useState({ licence: opp.licence, milestones: opp.milestones, amcTerm: opp.amcTerm });
  const [po, setPo] = useState({ poNumber: opp.poNumber || '', poDate: opp.poDate || '', poValue: opp.poValue ?? '' });
  const [newLine, setNewLine] = useState(null);
  useEffect(() => { setLines(opp.lines); }, [opp.lines]);
  const last = opp.versions.length - 1;
  const dirty = JSON.stringify(lines) !== JSON.stringify(opp.lines);
  const tot = (vi) => lines.reduce((a, l) => a + (Number(l.p[vi]) || 0) * (Number(l.q) || 1), 0);
  const fileRef = useRef(null);

  const saveVersion = () => {
    const label = `Revised (${short(plusDays(0))})`;
    patch({ versions: [...opp.versions, label], lines: lines.map((l) => ({ ...l, p: [...l.p, l.p[last]] })) }, `Commercial version saved: ${label} · total ${inr(tot(last))}`);
    say('New version column added; earlier values kept');
  };

  return (
    <>
      <section className="panel col gap10">
        <div className="row between wrap gap8">
          <h2 className="h2">Commercial positions</h2>
          {canEdit && <div className="row gap8">
            {dirty && <button className="btn" onClick={() => { patch({ lines }, 'Commercial values updated'); say('Saved'); }}>Save changes</button>}
            <button className="btn" onClick={() => setNewLine({ t: '', q: 1, p: 0 })}>+ Add line</button>
            <button className="btn-p" onClick={saveVersion}>+ Save new version</button>
          </div>}
        </div>
        {newLine && (
          <div className="row wrap gap8" style={{ background: '#F7FAFE', borderRadius: 8, padding: 12, alignItems: 'flex-end' }}>
            <label className="fl" style={{ flex: '2 1 220px' }}>Item *<input className="in" value={newLine.t} onChange={(e) => setNewLine({ ...newLine, t: e.target.value })} /></label>
            <label className="fl" style={{ flex: '0 1 90px' }}>Qty<input className="in" type="number" value={newLine.q} onChange={(e) => setNewLine({ ...newLine, q: Number(e.target.value) })} /></label>
            <label className="fl" style={{ flex: '1 1 160px' }}>Unit price (₹)<input className="in" type="number" value={newLine.p} onChange={(e) => setNewLine({ ...newLine, p: Number(e.target.value) })} /></label>
            <button className="btn-p" disabled={!newLine.t} onClick={() => { const l = [...lines, { id: uid(), t: newLine.t, q: newLine.q, p: opp.versions.map((_, i) => (i === last ? newLine.p : 0)) }]; setLines(l); patch({ lines: l }, 'Commercial line added: ' + newLine.t); setNewLine(null); }}>Add</button>
            <button className="btn" onClick={() => setNewLine(null)}>Cancel</button>
          </div>
        )}
        <div className="tablewrap"><table>
          <thead><tr><th>Item</th><th>Qty</th>{opp.versions.map((v) => <th key={v}>{v} · unit price</th>)}<th>Final before PO</th><th>As per PO</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="w500">{l.t}</td><td className="mono">{l.q}</td>
                {opp.versions.map((_, vi) => (
                  <td key={vi} className="mono">
                    {canEdit && vi === last
                      ? <input className="in sm mono" style={{ width: 150 }} type="number" aria-label={`${l.t} price`} value={l.p[vi] ?? 0} onChange={(e) => setLines(lines.map((x) => (x.id === l.id ? { ...x, p: x.p.map((p, i) => (i === vi ? Number(e.target.value) : p)) } : x)))} />
                      : inr(l.p[vi] ?? 0)}
                  </td>
                ))}
                <td className="mono muted">{opp.stage === 'Negotiation' || opp.stage === 'Closed Won' ? inr(l.p[last]) : '—'}</td>
                <td className="mono muted">{opp.poNumber ? inr(l.p[last]) : '—'}</td>
              </tr>
            ))}
            <tr><td className="w700">Total, first year</td><td />{opp.versions.map((_, vi) => <td key={vi} className="mono w700">{inr(tot(vi))}</td>)}<td className="mono">—</td><td className="mono">{opp.poValue ? inr(opp.poValue) : '—'}</td></tr>
          </tbody>
        </table></div>
        <div className="grid3">
          <label className="fl">Licence model<select className="in" disabled={!canEdit} value={terms.licence} onChange={(e) => setTerms({ ...terms, licence: e.target.value })}><option>Perpetual</option><option>Subscription</option><option>Transaction-based</option></select></label>
          <label className="fl">Payment milestones<select className="in" disabled={!canEdit} value={terms.milestones} onChange={(e) => setTerms({ ...terms, milestones: e.target.value })}><option>40/40/20</option><option>30/50/20</option><option>30/40/30</option><option>100% on go-live</option></select></label>
          <label className="fl">AMC term<select className="in" disabled={!canEdit} value={terms.amcTerm} onChange={(e) => setTerms({ ...terms, amcTerm: e.target.value })}><option>3 years</option><option>5 years</option><option>7 years</option></select></label>
        </div>
        {canEdit && (terms.licence !== opp.licence || terms.milestones !== opp.milestones || terms.amcTerm !== opp.amcTerm) && <div><button className="btn" onClick={() => { patch(terms, `Terms: ${terms.licence} · ${terms.milestones} · AMC ${terms.amcTerm}`); say('Terms saved'); }}>Save terms</button></div>}
        <p className="muted s12" style={{ margin: 0 }}>Each save adds a column; earlier values are never overwritten.</p>
      </section>

      <section className="panel col gap10">
        <h2 className="h2">PO receipt</h2>
        <p className="muted s13" style={{ margin: 0 }}>Recording the PO does not close the deal. Use “Close deal” to mark Closed Won.</p>
        <div className="grid3">
          <label className="fl">PO number *<input className="in" readOnly={!canEdit} placeholder="e.g. MB/IT/PO/2027/031" value={po.poNumber} onChange={(e) => setPo({ ...po, poNumber: e.target.value })} /></label>
          <label className="fl">PO date *<input className="in" type="date" readOnly={!canEdit} value={po.poDate} onChange={(e) => setPo({ ...po, poDate: e.target.value })} /></label>
          <label className="fl">PO value (₹)<input className="in" type="number" readOnly={!canEdit} placeholder={String(tot(last))} value={po.poValue} onChange={(e) => setPo({ ...po, poValue: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
        </div>
        {opp.poFile && <div className="s13">Attached: <b>{opp.poFile}</b></div>}
        {canEdit && <div className="row gap8">
          <input ref={fileRef} type="file" hidden onChange={(e) => { const n = e.target.files?.[0]?.name; if (n) { patch({ poFile: n, files: [{ id: uid(), n, t: 'PO', v: 'v1', u: user.name + ' · ' + short(plusDays(0)) }, ...opp.files] }, 'PO attached: ' + n); say('PO attached'); } }} />
          <button className="btn" onClick={() => fileRef.current?.click()}>Attach PO</button>
          <button className="btn-p" disabled={!po.poNumber || !po.poDate} onClick={() => { patch({ ...po, poValue: po.poValue === '' ? tot(last) : po.poValue }, `PO receipt saved: ${po.poNumber}`); say('PO receipt saved'); }}>Save PO receipt</button>
        </div>}
      </section>
    </>
  );
}

// ---------------- Documents ----------------
function DocumentsTab({ opp, canEdit, patch, say }) {
  const { user } = useAuth();
  const [type, setType] = useState('Proposal');
  const ref = useRef(null);
  return (
    <section className="panel col gap10">
      <div className="row between wrap gap8">
        <h2 className="h2">Documents</h2>
        {canEdit && <div className="row gap8">
          <select className="in sm" aria-label="Document type" value={type} onChange={(e) => setType(e.target.value)}>{['RFP', 'RFP corrigendum', 'Compliance', 'Pre-PO deliverable', 'Proposal', 'Contract', 'PO', 'Other'].map((t) => <option key={t}>{t}</option>)}</select>
          <input ref={ref} type="file" hidden onChange={(e) => {
            const n = e.target.files?.[0]?.name; if (!n) return;
            const ex = opp.files.filter((f) => f.n === n).length;
            patch({ files: [{ id: uid(), n, t: type, v: 'v' + (ex + 1), u: user.name + ' · ' + short(plusDays(0)) }, ...opp.files] }, `Uploaded ${n}`);
            say('Uploaded ' + n); e.target.value = '';
          }} />
          <button className="btn-p" onClick={() => ref.current?.click()}>+ Upload</button>
        </div>}
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>File</th><th>Type</th><th>Version</th><th>Uploaded</th></tr></thead>
        <tbody>
          {opp.files.map((f) => <tr key={f.id}><td><span className="w500" style={{ color: '#214C98' }}>{f.n}</span></td><td>{f.t}</td><td>{f.v}</td><td className="s13 muted">{f.u}</td></tr>)}
          {opp.files.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 24 }}>No documents yet.</td></tr>}
        </tbody>
      </table></div>
    </section>
  );
}

// ---------------- History ----------------
function HistoryTab({ opp, canEdit, patch }) {
  const [log, setLog] = useState(null);
  return (
    <section className="panel col gap16">
      <div className="row between wrap gap8">
        <h2 className="h2">Activity and change history</h2>
        {canEdit && !log && <button className="btn" onClick={() => setLog({ kind: 'Call', with: '', note: '' })}>Log call / meeting</button>}
      </div>
      {log && (
        <div className="grid3" style={{ background: '#F7FAFE', borderRadius: 8, padding: 14 }}>
          <label className="fl">Type<select className="in" value={log.kind} onChange={(e) => setLog({ ...log, kind: e.target.value })}><option>Call</option><option>Meeting</option><option>Email</option><option>Note</option></select></label>
          <label className="fl">With<input className="in" placeholder="e.g. A. Kulkarni (bank)" value={log.with} onChange={(e) => setLog({ ...log, with: e.target.value })} /></label>
          <label className="fl" style={{ gridColumn: '1 / -1' }}>Summary *<textarea className="in ta" rows={2} value={log.note} onChange={(e) => setLog({ ...log, note: e.target.value })} /></label>
          <div className="row gap8"><button className="btn-p" disabled={!log.note} onClick={() => { patch({}, `${log.kind}${log.with ? ' with ' + log.with : ''}: ${log.note}`); setLog(null); }}>Save</button><button className="btn" onClick={() => setLog(null)}>Cancel</button></div>
        </div>
      )}
      <Timeline items={opp.history || []} />
    </section>
  );
}

// ---------------- Right column ----------------
function SidePanels({ opp, canEdit, patch }) {
  const { user } = useAuth();
  const { state } = useStore();
  const [task, setTask] = useState(null);
  const [person, setPerson] = useState(null);
  const teams = useTeams();
  const ctx = `${opp.name} · ${opp.account}`;
  const link = '/opportunities/' + opp.id;
  const open = opp.tasks.filter((t) => !t.done);
  const done = opp.tasks.filter((t) => t.done);
  const openStage = open.filter((t) => (t.stage || opp.stage) === opp.stage);
  const toggle = (t) => patch({ tasks: opp.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) });

  const ev = state.evaluations.find((e) => e.oppId === opp.id);
  const dec = state.decisions.find((d) => d.oppId === opp.id);
  const comp = state.compliance.filter((c) => c.oppId === opp.id);
  const okC = comp.filter((c) => c.rev === 'Approved').length;
  const okR = opp.reviews.filter((r) => r.s === 'Approved').length;
  const idx = OPEN_STAGES.indexOf(opp.stage);
  const miss = idx >= 0 ? missingFor(idx, opp) : [];
  const tracks = [
    ['Stage gate', idx < 0 ? opp.stage : (miss.length || openStage.length) ? [miss.length ? `${miss.length} field${miss.length > 1 ? 's' : ''}` : '', openStage.length ? `${openStage.length} task${openStage.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' + ') + ' to fill' : 'Ready to complete', idx < 0 || (!miss.length && !openStage.length) ? '#168A70' : '#8A4B00'],
    ['Pre-PO', ev ? ev.status : 'None', ev ? '#284FBC' : '#475569'],
    ['Compliance', comp.length ? `${okC} / ${comp.length} approved` : 'Not started', comp.length && okC === comp.length ? '#168A70' : '#8A4B00'],
    ['Reviews', opp.reviews.length ? `${okR} of ${opp.reviews.length} approved` : 'None', okR === opp.reviews.length && okR ? '#168A70' : '#8A4B00'],
    ['P&L decision', dec ? (dec.done ? dec.done.v : 'Pending') : 'Not sent', dec?.done ? (dec.done.v === 'Proceed' ? '#168A70' : '#A3221A') : '#8A4B00'],
    ['PO', opp.poNumber || opp.poReceived === 'Yes' ? 'Received' : 'Not received', opp.poNumber || opp.poReceived === 'Yes' ? '#168A70' : '#475569']
  ];

  return (
    <aside className="col gap16">
      <section className="panel col">
        <h2 className="h2" style={{ marginBottom: 6 }}>Next tasks</h2>
        {open.map((t) => (
          <label key={t.id} className="task">
            <input type="checkbox" checked={false} disabled={!canEdit} onChange={() => toggle(t)} />
            <span><span className="s14" style={{ display: 'block' }}>{t.t}</span><span className="s12 muted">Due {t.due} · {t.o}</span>{t.teamsAt && <><br /><TeamsBadge to={t.o} at={t.teamsAt} /></>}</span>
          </label>
        ))}
        {open.length === 0 && <p className="muted s13">No open tasks.</p>}
        {task && (
          <div className="col gap8" style={{ padding: '10px 0' }}>
            <input className="in" placeholder="Task" aria-label="Task" value={task.t} onChange={(e) => setTask({ ...task, t: e.target.value })} />
            <div className="row gap8">
              <input className="in" type="date" aria-label="Due" value={task.due} onChange={(e) => setTask({ ...task, due: e.target.value })} />
              <select className="in" aria-label="Owner" value={task.o} onChange={(e) => setTask({ ...task, o: e.target.value })}>{[...owners, ...PRESALES_OPTIONS].map((p) => <option key={p}>{p}</option>)}</select>
            </div>
            <div className="row gap8"><button className="btn-p" disabled={!task.t} onClick={() => {
              const m = teams(task.o, `New task assigned to you on ${opp.name} (${opp.account}): “${task.t}” — due ${short(task.due)}.`, { kind: 'Task', ctx, link });
              patch({ tasks: [...opp.tasks, { id: uid(), t: task.t, due: short(task.due), o: task.o, done: false, stage: opp.stage, teamsAt: m.time }] }, `Task added: ${task.t} · assigned to ${task.o} · Teams message sent`);
              setTask(null);
            }}>Add &amp; notify on Teams</button><button className="btn" onClick={() => setTask(null)}>Cancel</button></div>
            <span className="s12" style={{ color: '#3D44A8' }}>{task.o} will get a Microsoft Teams message about this task.</span>
          </div>
        )}
        {canEdit && !task && <button className="btn" style={{ marginTop: 12, alignSelf: 'flex-start' }} onClick={() => setTask({ t: '', due: plusDays(3), o: user.name || opp.owner })}>+ New task</button>}
        {done.length > 0 && (
          <details style={{ marginTop: 10 }}>
            <summary className="s13 muted" style={{ cursor: 'pointer' }}>{done.length} completed</summary>
            {done.map((t) => <label key={t.id} className="task"><input type="checkbox" checked disabled={!canEdit} onChange={() => toggle(t)} /><span className="s13 muted" style={{ textDecoration: 'line-through' }}>{t.t}</span></label>)}
          </details>
        )}
      </section>

      <section className="panel col gap8">
        <h2 className="h2">People</h2>
        {opp.people.map((p, i) => <div key={i} className="col"><div className="row between gap10 s14"><span className="w500">{p.n}</span><span className="muted" style={{ textAlign: 'right' }}>{p.r}</span></div>{p.teamsAt && <TeamsBadge at={p.teamsAt} />}</div>)}
        {person && (
          <div className="col gap8">
            <input className="in" placeholder="Name" aria-label="Name" list="dp-people" value={person.n} onChange={(e) => setPerson({ ...person, n: e.target.value })} />
            <datalist id="dp-people">{owners.map((n) => <option key={n} value={n} />)}</datalist>
            <input className="in" placeholder="Role, e.g. Bank · CIO" aria-label="Role" value={person.r} onChange={(e) => setPerson({ ...person, r: e.target.value })} />
            <div className="row gap8"><button className="btn-p" disabled={!person.n} onClick={() => {
              const internal = owners.includes(person.n.trim());
              const m = internal ? teams(person.n.trim(), `You were added to the deal team for ${opp.name} (${opp.account})${person.r ? ' as ' + person.r : ''}.`, { kind: 'Deal team', ctx, link }) : null;
              patch({ people: [...opp.people, { ...person, teamsAt: m?.time }] }, 'Added ' + person.n + (m ? ' · Teams message sent' : ''));
              setPerson(null);
            }}>Add</button><button className="btn" onClick={() => setPerson(null)}>Cancel</button></div>
          </div>
        )}
        {canEdit && !person && <button className="btn" style={{ alignSelf: 'flex-start', minHeight: 36 }} onClick={() => setPerson({ n: '', r: '' })}>+ Add person</button>}
      </section>

      <section className="panel col gap8">
        <h2 className="h2">Deal tracks</h2>
        {tracks.map(([k, val, c]) => <div key={k} className="row between gap10 s14"><span className="muted">{k}</span><span className="w600" style={{ color: c, textAlign: 'right' }}>{val}</span></div>)}
      </section>
    </aside>
  );
}
