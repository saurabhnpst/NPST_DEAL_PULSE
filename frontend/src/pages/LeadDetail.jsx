import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, fmtDate, stamp } from '../store/Store.jsx';
import { Badge, ReadOnlyNote, Tabs, Timeline, Toast } from '../components/ui.jsx';
import LeadFields from '../components/LeadFields.jsx';
import { validateLead, errorCount } from '../data/validators.js';
import { DISQUALIFICATION_REASONS } from '../data/defaults.js';
import { useTeams, TeamsBadge } from '../components/Teams.jsx';
import NewOpportunity from '../components/NewOpportunity.jsx';
import { LEAD_APPROVERS } from '../data/verticals.js';

// Lead stages per “Lead Information.docx”: 1 New · 2 Working · 3 Unqualified · 4 Nurturing · 5 Qualified
const ORDER = ['New', 'Working', 'Unqualified', 'Nurturing', 'Qualified'];
const REJECT_REASONS = ['No budget', 'No clear need', 'Wrong product fit', 'Duplicate lead', 'Customer chose a competitor', 'Low deal value', 'Other'];
const REWORK_POINTS = ['Confirm budget', 'Identify decision maker', 'Clarify requirements', 'Add deal size estimate', 'Add competition details', 'Other'];
const TITLES = { nurture: 'Move to Nurturing', unq: 'Mark as Unqualified', reopen: 'Reopen lead', submit: 'Submit for approval' };

export default function LeadDetail() {
  const { id } = useParams();
  const { user, can, readOnly, vertical } = useAuth();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const lead = state.leads.find((l) => l.id === id);
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState(lead);
  const [ask, setAsk] = useState(null);
  const [askNote, setAskNote] = useState('');
  const [askRemark, setAskRemark] = useState('');
  const [bant, setBant] = useState(null);
  const teams = useTeams(); // BANT answers captured in the submit dialog
  const [convert, setConvert] = useState(false);
  const [dec, setDec] = useState({ mode: null, comment: '', reason: '' }); // P&L approver form
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const errors = useMemo(() => (form ? validateLead(form) : {}), [form]);

  useEffect(() => { setForm(lead); }, [lead?.id, lead?.status, lead?.approval]); // eslint-disable-line
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);
  if (!lead) return <div className="panel empty"><h1 className="h1">Lead not found</h1><Link to="/leads">Back to leads</Link></div>;

  const editable = can.createLead && !lead.oppId && lead.approval !== 'rejected';
  const status = lead.status;
  const approval = lead.approval || 'none';
  const approved = approval === 'approved';
  const ready = status === 'Qualified' && approved && !lead.oppId;
  const hasNeed = lead.need === 'Yes';
  const canSubmit = editable && (status === 'New' || status === 'Working') && (approval === 'none' || approval === 'rework');
  // dual approval: P&L Head + Sales Manager; each decision is kept per approver
  const approvals = lead.approvals || {};
  const me = LEAD_APPROVERS.find((a) => a.key === vertical?.key); // approver role of the signed-in vertical, if any
  const waitingOn = LEAD_APPROVERS.filter((a) => !approvals[a.key]);
  const approverText = LEAD_APPROVERS.map((a) => `${a.name} (${a.role})`).join(' & ');
  const decisionOf = (a) => approvals[a.key] || (!lead.approvals && a.key === 'pl' && approval !== 'pending' ? lead.approvalLog?.find((c) => c.d !== 'Submitted') : null); // older leads were approved by the P&L Head only
  const openSubmit = () => {
    setBant({ need: lead.need || '', budgetApproved: !!lead.budgetApproved, authority: lead.authority || '', timelineKnown: lead.timelineKnown || '', timeline: lead.timeline || '' });
    setAsk({ k: 'submit' });
  };
  const up = (patch, note) => dispatch({ type: 'UPDATE_LEAD', id, patch, note, who: user.name });

  const request = (to) => {
    if (!editable || to === status || to === 'Qualified') return;
    if (to === 'Nurturing') return setAsk({ k: 'nurture', to });
    if (to === 'Unqualified') return setAsk({ k: 'unq', to });
    if (status === 'Unqualified') return setAsk({ k: 'reopen', to });
    up({ status: to }, `Status: ${status} → ${to}`);
  };
  const confirmAsk = () => {
    if (ask.k === 'submit') {
      const sent = LEAD_APPROVERS.filter((a) => a.name !== user.name).map((a) => teams(a.name, `Lead approval needed (${a.role}): ${lead.company} (${lead.firstName} ${lead.lastName}) — submitted by ${user.name}.${askNote ? ' “' + askNote + '”' : ''}`, { kind: 'Approval', ctx: lead.id, link: '/leads/' + lead.id }));
      up({ ...bant, status: 'Working', approval: 'pending', approvals: {}, approvalLog: [{ d: 'Submitted', by: user.name, at: stamp(), comment: askNote, teamsTo: sent.map((m) => m.to).join(', '), teamsAt: sent[0]?.time }, ...(lead.approvalLog || [])] },
        (status === 'New' ? 'Status: New → Working · ' : '') + `Submitted for approval to ${approverText}` + (askNote ? ` · “${askNote}”` : ''));
      setTab('Approval'); setToast(`Submitted to ${approverText}` + (sent.length ? ' · Teams message sent' : ''));
    }
    else up({ status: ask.to, followUp: ask.k === 'nurture' ? askNote : lead.followUp, ...(ask.k === 'unq' ? { disqualReason: askNote, disqualRemark: askRemark } : {}) }, `Status: ${status} → ${ask.to}` + (askNote ? ` · ${askNote}` : '') + (askRemark ? ` · ${askRemark}` : ''));
    setAsk(null); setAskNote(''); setAskRemark('');
  };
  const nextOf = { New: 'Working', Nurturing: 'Working' };
  const help = {
    New: 'Make the first contact and move it to Working, or click “Submit for approval” to send it straight to the P&L Head and Sales Manager.',
    Working: approval === 'pending' ? `Waiting for ${waitingOn.map((a) => a.role).join(' or ')} to decide. As soon as the P&L Head or the Sales Manager approves, the lead moves to Qualified.` : approval === 'rework' ? 'Sent back for more work. See the Approval tab, update the lead and resubmit.' : hasNeed ? 'They have a need — click “Submit for approval”. Once the P&L Head or the Sales Manager approves, the lead is Qualified and converts to an opportunity.' : lead.need === 'No' ? 'No need identified — mark the lead Unqualified, or Nurturing to reconnect in 3–6 months.' : 'Click “Submit for approval” to confirm the qualification checks and send the lead to the P&L Head and Sales Manager.',
    Nurturing: 'Parked until the follow-up date. Move it back to Working when the bank re-engages.',
    Unqualified: approval === 'rejected' ? `Rejected at approval${lead.approvalLog?.find((c) => c.d === 'Rejected')?.reason ? ' · ' + lead.approvalLog.find((c) => c.d === 'Rejected').reason : ''}. See the Approval tab.` : 'Closed. Reopen only if something changes.',
    Qualified: lead.oppId ? `Qualified and converted to ${lead.oppId}.` : lead.rfp ? 'Qualified. Write the RFP synopsis; the opportunity is created when Pre-Sales accepts it.' : 'Qualified. Click Convert to create the opportunity (Stage 1 · Qualification) — Sales handles every stage of a non-RFP deal, without Pre-Sales.'
  }[status];

  const decide = () => {
    const label = { approve: 'Approved', rework: 'More work needed', reject: 'Rejected' }[dec.mode];
    const m = lead.owner !== user.name ? teams(lead.owner, `Your lead ${lead.company} was ${label.toLowerCase()} by ${user.name} (${me.role})${dec.reason ? ' · ' + dec.reason : ''}${dec.comment.trim() ? ' — “' + dec.comment.trim() + '”' : ''}.`, { kind: 'Approval', ctx: lead.id, link: '/leads/' + lead.id }) : null;
    const entry = { d: label, by: user.name, role: me.role, at: stamp(), comment: dec.comment.trim(), reason: dec.reason, teamsTo: m ? lead.owner : undefined, teamsAt: m?.time };
    const log = [entry, ...(lead.approvalLog || [])];
    const next = { ...approvals, [me.key]: { d: label, by: user.name, at: entry.at, comment: entry.comment, reason: entry.reason } };
    const tail = (entry.reason ? ` · ${entry.reason}` : '') + (entry.comment ? ` · “${entry.comment}”` : '');
    const pending = LEAD_APPROVERS.filter((a) => !next[a.key]);
    if (dec.mode === 'approve') { // one approval is enough: the lead moves on right away
      up({ approvals: next, approval: 'approved', status: 'Qualified', approvalLog: log }, `Approved by ${me.role} · status → Qualified` + tail); setToast(`Approved by ${me.role} · lead now Qualified`);
    } else if (pending.length) { // no approval yet: wait for the other approver before the lead moves on
      up({ approvals: next, approvalLog: log }, `${label} by ${me.role} · waiting for ${pending.map((a) => a.role).join(', ')}` + tail);
      setToast(`${label} recorded · waiting for ${pending.map((a) => `${a.name} (${a.role})`).join(', ')}`);
    } else { // both decided and neither approved: any Reject closes the lead, else it goes back for more work
      const all = LEAD_APPROVERS.map((a) => next[a.key].d);
      const both = `${label} by ${me.role} · both approvers have decided`;
      if (all.includes('Rejected')) { up({ approvals: next, approval: 'rejected', status: 'Unqualified', approvalLog: log }, `${both} · lead rejected · status → Unqualified` + tail); setToast('Both approvers decided · lead rejected'); }
      else { up({ approvals: next, approval: 'rework', approvalLog: log }, `${both} · sent back for more work · status stays Working` + tail); setToast('Both approvers decided · lead sent back to Sales for more work'); }
    }
    setDec({ mode: null, comment: '', reason: '' });
  };

  const saveDetails = () => {
    const n = errorCount(errors);
    if (n) { setShowErrors(true); setErr(`Fix the highlighted fields before saving (${n} issue${n > 1 ? 's' : ''}).`); return; }
    setErr(''); setShowErrors(false); up(form, 'Lead details edited'); setToast('Saved · change recorded in History');
  };

  return (
    <>
      <div className="s13 muted"><Link to="/leads">Leads</Link> / <span className="mono">{lead.id}</span></div>
      <div className="row wrap between gap16" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="h1">{lead.company}</h1>
          <div className="muted s14" style={{ marginTop: 4 }}>{lead.salutation} {lead.firstName} {lead.lastName} · {lead.designation}</div>
          <div className="row wrap gap16 s13" style={{ marginTop: 10 }}>
            <span><span className="muted">Owner</span> <b>{lead.owner}</b></span>
            <span><span className="muted">Lead source</span> <b>{lead.leadSource}</b></span>
            <span><span className="muted">Rating</span> <b>{lead.rating}</b></span>
            <span><span className="muted">Product</span> <b>{lead.productTsp}{lead.productTsp2 && lead.productTsp2 !== '—' ? ' · ' + lead.productTsp2 : ''}</b></span>
            <span><span className="muted">Need</span> <b>{lead.need || '—'}</b></span>
            <span><span className="muted">Created</span> <b>{fmtDate(lead.created)}</b></span>
            <span><span className="muted">RFP</span> <b>{lead.rfp ? 'Yes' : 'No'}</b></span>
          </div>
        </div>
        <div className="row wrap gap8">
          {canSubmit && <button className="btn-p" onClick={openSubmit}>{approval === 'rework' ? 'Resubmit for approval' : 'Submit for approval'}</button>}
          {editable && !lead.rfp && <button className="btn-p" disabled={!ready} title={ready ? '' : 'Needs P&L Head approval (status Qualified) first'} onClick={() => setConvert(true)}>Convert</button>}
          {editable && lead.rfp && <button className="btn-p" disabled={!ready} title={ready ? '' : 'Needs P&L Head approval (status Qualified) first'} onClick={() => nav('/rfp?lead=' + lead.id)}>Write synopsis</button>}
          {lead.oppId && <Link className="btn-p" to={'/opportunities/' + lead.oppId}>Open opportunity</Link>}
        </div>
      </div>
      {readOnly && <ReadOnlyNote />}

      <div className="row wrap gap16">
        <div className="statusbar" role="group" aria-label="Lead status">
          {ORDER.map((s) => {
            const cur = s === status;
            const done = (s === 'New' && status !== 'New') || (s === 'Working' && status === 'Qualified');
            const locked = s === 'Qualified';
            return <button key={s} className={cur ? 'cur' : done ? 'done' : locked ? 'locked' : ''} aria-current={cur ? 'step' : undefined} onClick={() => request(s)}>{done ? '✓ ' : ''}{ORDER.indexOf(s) + 1} · {s}{locked && !cur ? ' (via approval)' : ''}</button>;
          })}
        </div>
        {editable && nextOf[status] && <button className="btn-p" onClick={() => request(nextOf[status])}>Mark status as complete</button>}
      </div>
      <p className="muted s13" style={{ margin: 0 }}>{help}</p>

      {ask && (
        <section className="panel col gap10" aria-label={TITLES[ask.k]}>
          <h2 className="h2">{TITLES[ask.k]}</h2>
          {ask.k === 'nurture' && <label className="fl">Follow-up date *<input className="in" type="date" value={askNote} onChange={(e) => setAskNote(e.target.value)} /></label>}
          {ask.k === 'unq' && (
            <div className="grid2">
              <label className="fl">DisQualification reason *<select className="in" value={askNote} onChange={(e) => setAskNote(e.target.value)}><option value="">Choose…</option>{DISQUALIFICATION_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label className="fl">Disqualification Remark<input className="in" value={askRemark} placeholder="Details for the record" onChange={(e) => setAskRemark(e.target.value)} /></label>
            </div>
          )}
          {ask.k === 'reopen' && <label className="fl">Reason for reopening *<input className="in" placeholder="What changed?" value={askNote} onChange={(e) => setAskNote(e.target.value)} /></label>}
          {ask.k === 'submit' && bant && (
            <div className="col gap12">
              <p className="muted s13" style={{ margin: 0 }}>Confirm the qualification checks, then send the lead to the P&amp;L Head and Sales Manager. One approval from either of them is enough to move it on.{status === 'New' ? ' The lead moves to Working.' : ''}</p>
              <div className="grid2">
                <label className="fl">Do they have a need? *<select className="in" value={bant.need} onChange={(e) => setBant({ ...bant, need: e.target.value })}><option value="">--None--</option><option>Yes</option><option>No</option></select>
                  {bant.need === 'No' && <span className="note err-txt">No need → mark the lead Unqualified or Nurturing instead of submitting.</span>}</label>
                <label className="fl">Who is the authority?<input className="in" value={bant.authority} placeholder="e.g. CIO, IT Committee" onChange={(e) => setBant({ ...bant, authority: e.target.value })} /></label>
                <label className="fl">Do we know the timeline?<select className="in" value={bant.timelineKnown} onChange={(e) => setBant({ ...bant, timelineKnown: e.target.value })}><option value="">--None--</option><option>Yes</option><option>No</option></select></label>
                {bant.timelineKnown === 'Yes' ? <label className="fl">Timeline<input className="in" value={bant.timeline} placeholder="e.g. Go-live by Mar 2027" onChange={(e) => setBant({ ...bant, timeline: e.target.value })} /></label> : <span />}
                <label className="fl chk"><input type="checkbox" checked={bant.budgetApproved} onChange={(e) => setBant({ ...bant, budgetApproved: e.target.checked })} /> Do they have an approved budget?</label>
              </div>
              <div className="grid2">
                <label className="fl">Approvers *<select className="in"><option>{approverText}</option></select></label>
                <label className="fl">Submitter comments<input className="in" value={askNote} placeholder="Why this lead is worth pursuing" onChange={(e) => setAskNote(e.target.value)} /></label>
              </div>
            </div>
          )}
          <div className="row gap8">
            <button className="btn-p" disabled={ask.k === 'submit' ? bant?.need !== 'Yes' : !askNote} onClick={confirmAsk}>{ask.k === 'submit' ? 'Submit to P&L Head & Sales Manager' : 'Confirm'}</button>
            <button className="btn" onClick={() => { setAsk(null); setAskNote(''); }}>Cancel</button>
          </div>
        </section>
      )}

      <Tabs label="Lead sections" tabs={['Details', 'Approval', 'History']} value={tab} onChange={setTab} />

      {tab === 'Details' && form && (
        <div className="col gap10" style={{ maxWidth: 1180 }}>
          {err && <p className="err" role="alert">{err}</p>}
          <LeadFields v={form} set={setForm} readOnly={!editable} existing errors={errors} showErrors={showErrors} />
          {editable && JSON.stringify(form) !== JSON.stringify(lead) && (
            <div className="lf-actions">
              <span className="s13 w600">Unsaved changes</span>
              <span className="row gap8"><button className="btn" onClick={() => setForm(lead)}>Cancel</button><button className="btn-p" onClick={saveDetails}>Save</button></span>
            </div>
          )}
        </div>
      )}

      {tab === 'Approval' && (
        <section className="panel col gap16" style={{ maxWidth: 900 }}>
          <div className="row between"><h2 className="h2">Lead approval</h2><Badge tone={{ none: 'gray', pending: 'amber', approved: 'green', rework: 'amber', rejected: 'red' }[approval]}>{{ none: 'Not submitted', pending: 'Pending', approved: 'Approved', rework: 'More work needed', rejected: 'Rejected' }[approval]}</Badge></div>
          {approval === 'none' && <div className="row between wrap gap8"><p className="muted" style={{ margin: 0 }}>Not submitted yet.</p>{canSubmit && <button className="btn-p" onClick={openSubmit}>Submit for approval</button>}</div>}
          {approval !== 'none' && (
            <div className="kv">
              <div><div className="k">Submitter</div><div className="v">{lead.owner}</div></div>
              <div><div className="k">Assigned to</div><div className="v">{approverText}</div></div>
              {LEAD_APPROVERS.map((a) => {
                const d = decisionOf(a);
                return [
                  <div key={a.key + 'd'}><div className="k">{a.role} decision</div><div className="v">{d ? <Badge tone={{ Approved: 'green', 'More work needed': 'amber', Rejected: 'red' }[d.d]}>{d.d}</Badge> : approval === 'pending' ? <Badge tone="amber">Pending</Badge> : '—'}</div></div>,
                  <div key={a.key + 'c'}><div className="k">{a.role} comment</div><div className="v">{d?.comment || '—'}</div></div>
                ];
              })}
            </div>
          )}
          {approval === 'pending' && me && !approvals[me.key] && (
            <div className="col gap12" style={{ background: '#F7FAFE', borderRadius: 8, padding: 16 }}>
              <div className="w600 s14">Approver view ({user.name} · {me.role})</div>
              <div role="radiogroup" aria-label="Decision" className="grid3">
                {[['approve', 'Approve lead'], ['rework', 'More work needed'], ['reject', 'Reject lead']].map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={dec.mode === k} className={dec.mode === k ? 'opt on' : 'opt'} onClick={() => setDec({ mode: k, comment: dec.comment, reason: '' })}>{l}</button>
                ))}
              </div>
              {dec.mode === 'rework' && (
                <label className="fl">What needs more work? *<select className="in" value={dec.reason} onChange={(e) => setDec({ ...dec, reason: e.target.value })}><option value="">Choose…</option>{REWORK_POINTS.map((r) => <option key={r}>{r}</option>)}</select>
                  <span className="note">If the other approver doesn't approve either, the lead goes back to {lead.owner} in Working so they can update and resubmit.</span></label>
              )}
              {dec.mode === 'reject' && (
                <label className="fl">Reason for rejection *<select className="in" value={dec.reason} onChange={(e) => setDec({ ...dec, reason: e.target.value })}><option value="">Choose…</option>{REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                  <span className="note">If the other approver doesn't approve either, the lead is closed as Unqualified.</span></label>
              )}
              {dec.mode && (
                <label className="fl">{me.role} comments{dec.mode === 'approve' ? '' : ' *'}
                  <textarea className="in ta" rows={3} value={dec.comment}
                    placeholder={dec.mode === 'approve' ? 'Optional · guidance for Sales, e.g. “Push for a 3-year AMC”' : dec.mode === 'rework' ? 'Tell Sales exactly what to add or fix before resubmitting' : 'Explain why this lead is being rejected'}
                    onChange={(e) => setDec({ ...dec, comment: e.target.value })} /></label>
              )}
              {dec.mode && (
                <div className="row gap8">
                  <button className={dec.mode === 'reject' ? 'btn-d' : 'btn-p'} disabled={dec.mode !== 'approve' && (!dec.reason || !dec.comment.trim())} onClick={decide}>
                    {dec.mode === 'approve' ? 'Confirm approval' : dec.mode === 'rework' ? 'Send back to Sales' : 'Confirm rejection'}
                  </button>
                  <button className="btn" onClick={() => setDec({ mode: null, comment: '', reason: '' })}>Cancel</button>
                </div>
              )}
            </div>
          )}
          {approval === 'pending' && !(me && !approvals[me.key]) && <p className="warn">{me && approvals[me.key] ? `You marked this lead “${approvals[me.key].d}”. ` : ''}Waiting for {waitingOn.map((a) => `${a.name} (${a.role})`).join(' and ')} to decide. One approval from either approver moves the lead on.</p>}
          {approval === 'rework' && <div className="warn row between wrap gap8"><span>Sent back for more work. Update the lead details, then resubmit.</span>{canSubmit && <button className="btn-p" onClick={openSubmit}>Resubmit for approval</button>}</div>}
          {(lead.approvalLog || []).length > 0 && (
            <div className="col gap8">
              <div className="sec">Approval comments</div>
              <ol className="cmt-list">
                {lead.approvalLog.map((c, i) => (
                  <li key={i} className={'cmt ' + ({ Approved: 'g', 'More work needed': 'a', Rejected: 'r' }[c.d] || '')}>
                    <div className="row between gap8 wrap"><span className="row gap8"><Badge tone={{ Approved: 'green', 'More work needed': 'amber', Rejected: 'red', Submitted: 'blue' }[c.d]}>{c.d}</Badge>{c.reason && <span className="s13 w600">{c.reason}</span>}</span><span className="s12 muted">{c.by}{c.role ? ` (${c.role})` : ''} · {c.at}</span></div>
                    {c.comment ? <div className="s14" style={{ marginTop: 6 }}>{c.comment}</div> : <div className="s13 muted" style={{ marginTop: 6 }}>No comment</div>}
                    {c.teamsAt && <TeamsBadge to={c.teamsTo} at={c.teamsAt} />}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {tab === 'History' && <section className="panel" style={{ maxWidth: 900 }}><Timeline items={lead.history || []} /></section>}

      {convert && <NewOpportunity fromLead={lead} onClose={() => setConvert(false)} onCreated={() => { setConvert(false); nav('/opportunities/' + stateLastId()); }} />}
      <Toast msg={toast} />
    </>
  );

  function stateLastId() {
    // the new id is predictable from the sequence used by the store
    return `OPP-${new Date().getFullYear()}-${String(state.seq.opp + 1).padStart(5, '0')}`;
  }
}
