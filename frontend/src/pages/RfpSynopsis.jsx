import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useTeams } from '../components/Teams.jsx';
import { useStore, inr, category, fmtDate } from '../store/Store.jsx';
import { defaultOpportunity, plusDays } from '../data/defaults.js';
import { Badge, ReadOnlyNote, Stepper, Toast, AiTag, aiClass } from '../components/ui.jsx';
import RfpExtract from '../components/RfpExtract.jsx';

const STEPS = ['Lead with RFP', 'Synopsis drafted', 'Submitted to Pre-Sales', 'Accepted', 'Opportunity created'];
const stepOf = (s) => ({ Draft: 1, Returned: 1, Submitted: 2, Accepted: 5 }[s] ?? 1);

export default function RfpSynopsis() {
  const { user, can, readOnly } = useAuth();
  const { state, dispatch } = useStore();
  const teams = useTeams();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  // Opened from a lead (?lead=…): select its synopsis, or start a new one pre-filled with default values.
  const [init] = useState(() => {
    const leadId = params.get('lead');
    const existing = leadId && state.synopses.find((s) => s.leadId === leadId);
    if (existing) return { selId: existing.id, draft: null };
    const l = leadId && state.leads.find((x) => x.id === leadId);
    if (l) return { selId: null, draft: { leadId, name: `${l.productTsp} tender`, account: l.company, owner: l.owner, status: 'Draft', due: plusDays(14), rfpRef: '', scope: '', dealSize: 10000000,
      products: l.productTsp, preBid: plusDays(5), submission: plusDays(14), bidOpening: plusDays(18), emd: 'Yes', emdAmount: '2,00,000', pbg: 'Yes · 3%', eligibility: '', context: '', risks: '',
      ...(l.rfpExtract ? { ...l.rfpExtract.synopsis.values, aiTags: l.rfpExtract.synopsis.tags, rfpFile: l.rfpExtract.fileName } : {}) } };
    return { selId: state.synopses[0]?.id, draft: null };
  });
  const [selId, setSelId] = useState(init.selId);
  const [draft, setDraft] = useState(init.draft);
  const [presales, setPresales] = useState('Vikram N.');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (params.get('lead')) setParams({}); }, []); // eslint-disable-line

  const sel = draft || state.synopses.find((s) => s.id === selId);
  const [edit, setEdit] = useState(() => (sel ? { ...sel } : null));
  useEffect(() => { setEdit(sel ? { ...sel } : null); setNote(''); }, [sel?.id, draft, sel?.status]); // eslint-disable-line

  const canEdit = can.submitSynopsis && edit && ['Draft', 'Returned'].includes(edit.status);
  const f = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });
  // RFP auto-fill tags: label tag, field tint, "not in RFP" note
  const tag = (k) => (edit?.aiTags?.[k] === 'missing' && edit[k] ? null : edit?.aiTags?.[k]);
  const aiView = edit?.aiTags ? Object.fromEntries(Object.keys(edit.aiTags).map((k) => [k, tag(k)]).filter(([, t]) => t)) : null;
  const lab = (k, text) => <span>{text}<AiTag ai={tag(k)} /></span>;
  const cls = (k, base = 'in') => base + aiClass(tag(k));
  const miss = (k) => tag(k) === 'missing' && !edit[k] ? <span className="note rfpx-miss">Not in RFP — fill manually</span> : null;

  const saveDraft = (submit) => {
    const syn = { ...edit, dealSize: Number(String(edit.dealSize).replace(/,/g, '')) || 0, status: submit ? 'Submitted' : edit.status === 'Returned' ? 'Returned' : 'Draft' };
    if (submit && (!syn.scope || !syn.context)) return setToast('Scope summary and client context are required to submit');
    if (submit && edit.aiTags && !syn.dealSize) return setToast('Estimated deal size was not in the RFP — please fill it before submitting');
    dispatch({ type: 'SAVE_SYNOPSIS', syn });
    if (draft) { setDraft(null); setSelId(`SYN-${new Date().getFullYear()}-${String(state.seq.syn + 1).padStart(3, '0')}`); }
    setToast(submit ? 'Submitted to Pre-Sales' : 'Draft saved');
  };
  const accept = () => {
    const newId = `OPP-${new Date().getFullYear()}-${String(state.seq.opp + 1).padStart(5, '0')}`;
    dispatch({ type: 'ACCEPT_SYNOPSIS', id: sel.id, presales, who: user.name, oppDefaults: defaultOpportunity({ name: sel.owner }) });
    teams(presales, `You are the Solutions owner for ${sel.name} (${sel.account}). The synopsis was accepted and the opportunity created.`, { kind: 'Assignment', ctx: sel.id, link: '/rfp' });
    teams(sel.owner, `Your synopsis ${sel.name} (${sel.account}) was accepted by ${user.name}. Solutions owner: ${presales}.`, { kind: 'Synopsis', ctx: sel.id, link: '/rfp' });
    nav('/opportunities/' + newId);
  };

  const queue = [...(draft ? [draft] : []), ...state.synopses];

  return (
    <>
      <div>
        <h1 className="h1">RFP synopsis</h1>
        <p className="sub">Happens at the lead stage, before any opportunity exists. Sales writes the synopsis from the RFP; when Pre-Sales accepts it, the lead is converted and the opportunity is created.</p>
      </div>
      {readOnly && <ReadOnlyNote />}

      <div className="split">
        <section aria-label="Handover queue" className="col gap8">
          <div className="s12 w600 muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Queue · {queue.length}</div>
          {queue.map((q) => {
            const on = q === draft ? !!draft : !draft && q.id === selId;
            return (
              <button key={q.id || 'new'} className={on ? 'qitem on' : 'qitem'} onClick={() => { setDraft(null); setSelId(q.id); }}>
                <div className="w600 s14">{q.name}</div>
                <div className="s12 muted">{q.account} · due {fmtDate(q.due)}</div>
                <div style={{ marginTop: 6 }}><Badge>{q.id ? q.status : 'Draft'}</Badge></div>
              </button>
            );
          })}
        </section>

        {edit ? (
          <section className="panel col gap16">
            <div className="row between wrap gap8">
              <div>
                <div className="mono s12 muted">{edit.id || 'New synopsis'} {edit.rfpRef ? '· ' + edit.rfpRef : ''}</div>
                <h2 className="h2" style={{ fontSize: 20 }}>{edit.name} — {edit.account}</h2>
                <div className="s13 muted">
                  {edit.leadId ? <>From lead <Link to={'/leads/' + edit.leadId}>{edit.leadId}</Link> · </> : null}
                  {edit.oppId ? <>Opportunity <Link to={'/opportunities/' + edit.oppId}>{edit.oppId}</Link> · </> : 'No opportunity yet · '}
                  Sales owner {edit.owner}
                </div>
              </div>
              <Badge>{edit.status}</Badge>
            </div>
            <Stepper label="Handover status" steps={STEPS} current={stepOf(edit.status)} />
            {edit.status === 'Returned' && edit.returnNote && <p className="err">Returned by Pre-Sales: {edit.returnNote}</p>}
            {draft && !draft.aiTags && <p className="defaults">New synopsis pre-filled with default values from the lead: products, owner, due date in 14 days, EMD Yes, PBG 3%.</p>}
            {canEdit && <RfpExtract key={edit.id || 'new'} part="synopsis" done={aiView} fileName={edit.rfpFile} onApply={(values, tags, res) => setEdit({ ...edit, ...values, aiTags: tags, rfpFile: res.fileName })} />}

            <div className="grid3">
              <label className="fl">{lab('name', 'Synopsis title *')}<input className={cls('name')} readOnly={!canEdit} value={edit.name || ''} onChange={f('name')} /></label>
              <label className="fl">{lab('rfpRef', 'RFP reference')}<input className={cls('rfpRef')} readOnly={!canEdit} value={edit.rfpRef || ''} onChange={f('rfpRef')} /></label>
              <label className="fl">{lab('dealSize', 'Estimated deal size (₹) *')}<input className={cls('dealSize')} readOnly={!canEdit} value={edit.dealSize || ''} onChange={f('dealSize')} />{miss('dealSize')}</label>
              <label className="fl">Deal-size category<input className="in ro" readOnly value={category(Number(String(edit.dealSize).replace(/,/g, '')) || 0) + ' (auto) · ' + inr(Number(String(edit.dealSize).replace(/,/g, '')) || 0)} /></label>
              <label className="fl">{lab('products', 'Products involved')}<input className={cls('products')} readOnly={!canEdit} value={edit.products || ''} onChange={f('products')} /></label>
              <label className="fl">{lab('preBid', 'Pre-bid meeting')}<input className={cls('preBid')} type="date" readOnly={!canEdit} value={edit.preBid || ''} onChange={f('preBid')} /></label>
              <label className="fl">{lab('submission', 'Submission *')}<input className={cls('submission')} type="date" readOnly={!canEdit} value={edit.submission || edit.due || ''} onChange={(e) => setEdit({ ...edit, submission: e.target.value, due: e.target.value })} /></label>
              <label className="fl">{lab('bidOpening', 'Bid opening')}<input className={cls('bidOpening')} type="date" readOnly={!canEdit} value={edit.bidOpening || ''} onChange={f('bidOpening')} /></label>
              <label className="fl">{lab('emd', 'EMD required')}<select className={cls('emd')} disabled={!canEdit} value={edit.emd || 'Yes'} onChange={f('emd')}><option>Yes</option><option>No</option><option>Exempt (MSME)</option></select></label>
              <label className="fl">{lab('emdAmount', 'EMD amount (₹)')}<input className={cls('emdAmount')} readOnly={!canEdit} value={edit.emdAmount || ''} onChange={f('emdAmount')} /></label>
              <label className="fl">{lab('pbg', 'PBG on award')}<select className={cls('pbg')} disabled={!canEdit} value={edit.pbg || 'Yes · 3%'} onChange={f('pbg')}><option>Yes · 3%</option><option>No</option></select></label>
            </div>
            <label className="fl">{lab('scope', 'Scope summary *')}<textarea className={cls('scope', 'in ta')} rows={3} readOnly={!canEdit} value={edit.scope || ''} onChange={f('scope')} /></label>
            <label className="fl">{lab('eligibility', 'Eligibility criteria')}<textarea className={cls('eligibility', 'in ta')} rows={2} readOnly={!canEdit} value={edit.eligibility || ''} onChange={f('eligibility')} /></label>
            <label className="fl">{lab('context', 'Client context and relationship *')}<textarea className={cls('context', 'in ta')} rows={2} readOnly={!canEdit} value={edit.context || ''} onChange={f('context')} />{miss('context')}</label>
            <label className="fl">{lab('risks', 'Competitors, risks, commercial expectations')}<textarea className={cls('risks', 'in ta')} rows={2} readOnly={!canEdit} value={edit.risks || ''} onChange={f('risks')} />{miss('risks')}</label>

            {canEdit && (
              <div className="row gap8"><button className="btn" onClick={() => saveDraft(false)}>Save draft</button><button className="btn-p" onClick={() => saveDraft(true)}>Submit to Pre-Sales</button></div>
            )}

            {can.acceptSynopsis && edit.status === 'Submitted' && (
              <div className="col gap10" style={{ background: '#F7FAFE', borderRadius: 8, padding: 16 }}>
                <h3 className="h2">Accept handover</h3>
                <div className="grid2">
                  <label className="fl">Solutions owner *<select className="in" value={presales} onChange={(e) => setPresales(e.target.value)}><option>Vikram N.</option><option>Sneha G.</option></select></label>
                  <label className="fl">Note to Sales (required if returning)<input className="in" value={note} placeholder="What is missing or unclear?" onChange={(e) => setNote(e.target.value)} /></label>
                </div>
                <p className="s13 muted" style={{ margin: 0 }}>Accepting converts the lead and creates the opportunity at Qualification (10%) with default values plus the synopsis deal size.</p>
                <div className="row gap8 wrap">
                  <button className="btn-p" onClick={accept}>Accept and create opportunity</button>
                  <button className="btn" disabled={!note} onClick={() => { dispatch({ type: 'SAVE_SYNOPSIS', syn: { id: sel.id, status: 'Returned', returnNote: note } }); setToast('Returned to Sales'); }}>Return to Sales with questions</button>
                </div>
              </div>
            )}
            {edit.status === 'Submitted' && !can.acceptSynopsis && <p className="warn">Waiting for the Pre-Sales Manager to accept.</p>}
          </section>
        ) : <section className="panel empty"><p className="muted">Pick a synopsis from the queue.</p></section>}
      </div>
      <Toast msg={toast} />
    </>
  );
}
