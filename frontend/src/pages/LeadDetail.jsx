import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, fmtDate } from '../store/Store.jsx';
import { leadService } from '../services/leadService.js';
import { apiLeadToUi, uiLeadToApi } from '../mappers/leadMapper.js';
import { useBusinessData } from '../store/BusinessData.jsx';
import { LoadingPanel, ErrorPanel } from '../components/AsyncState.jsx';
import { Badge, ReadOnlyNote, Tabs, Timeline, Toast } from '../components/ui.jsx';
import LeadFields from '../components/LeadFields.jsx';
import { validateLead, errorCount } from '../data/validators.js';
import { DISQUALIFICATION_REASONS } from '../data/defaults.js';
import { useTeams, TeamsBadge } from '../components/Teams.jsx';
import { approvalService } from '../services/approvalService.js';

// Lead stages per “Lead Information.docx”: 1 New · 2 Working · 3 Unqualified · 4 Nurturing · 5 Qualified
const ORDER = ['New', 'Working', 'Unqualified', 'Nurturing', 'Qualified'];
const REJECT_REASONS = ['No budget', 'No clear need', 'Wrong product fit', 'Duplicate lead', 'Customer chose a competitor', 'Low deal value', 'Other'];
const REWORK_POINTS = ['Confirm budget', 'Identify decision maker', 'Clarify requirements', 'Add deal size estimate', 'Add competition details', 'Other'];
// approval-service status → UI approval state
const APPROVAL_UI = { PENDING: 'pending', PENDING_PNL_HEAD: 'pending', PENDING_SALES_MANAGER: 'pending', APPROVED: 'approved', REJECTED: 'rejected', CHANGES_REQUESTED: 'rework' };
const EVENT_LABEL = { SUBMITTED: 'Submitted', APPROVER_SELECTED: 'Approver selected', REASSIGNED: 'Reassigned', APPROVED: 'Approved', CHANGES_REQUESTED: 'More work needed', REJECTED: 'Rejected' };
const ROLE_LABEL = { sales: 'Sales Manager', pl_head: 'P&L Head', presales: 'Pre-Sales', admin: 'Admin' };
const at = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const TITLES = { nurture: 'Move to Nurturing', unq: 'Mark as Unqualified', reopen: 'Reopen lead', submit: 'Submit for approval' };

export default function LeadDetail() {
  const { id } = useParams();
  const { user, users, userName, can, readOnly } = useAuth();
  const { state, dispatch } = useStore();
  const { reloadLeads, reloadOpportunities, reloadApprovals } = useBusinessData() || {};
  const nav = useNavigate();
  const [fetchState, setFetchState] = useState({ loading: false, error: null });
  const lead = state.leads.find((l) => l.id === id);

  useEffect(() => {
    if (lead || !id) return;
    let cancelled = false;
    (async () => {
      setFetchState({ loading: true, error: null });
      try {
        const row = await leadService.get(id);
        if (cancelled) return;
        dispatch({ type: 'SET_LEADS', leads: [...state.leads, apiLeadToUi(row, userName)] });
        setFetchState({ loading: false, error: null });
      } catch (e) {
        if (!cancelled) setFetchState({ loading: false, error: e });
      }
    })();
    return () => { cancelled = true; };
  }, [id, lead, dispatch, state.leads, userName]);

  // Approval requests (approval-service) and lead history (lead-service) for this lead
  const [appr, setAppr] = useState({ latest: null, events: [] });
  const [history, setHistory] = useState([]);
  const loadApproval = useCallback(async () => {
    if (!id || !user?.approvalActorId) return;
    try {
      const list = (await approvalService.forLead(id)) || [];
      const latest = [...list].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))[0] || null;
      const events = (await Promise.all(list.map((r) => approvalService.history(r.id).catch(() => [])))).flat();
      setAppr({ latest, events: events.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))) });
    } catch {
      setAppr({ latest: null, events: [] });
    }
  }, [id, user?.approvalActorId]);
  const loadHistory = useCallback(async () => {
    try {
      const rows = (await leadService.history(id)) || [];
      setHistory(rows.map((h) => ({ t: h.action.replace(/^LEAD_/, '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()), m: `${userName(h.changedBy)} · ${at(h.createdAt)}` })));
    } catch {
      setHistory([]);
    }
  }, [id, userName]);
  useEffect(() => { loadApproval(); loadHistory(); }, [loadApproval, loadHistory]);
  // BANT answers live in the lead's qualification record
  useEffect(() => {
    if (!id || !lead) return;
    leadService.qualification(id).then((q) => {
      if (!q) return;
      dispatch({ type: 'PATCH_LEAD', id, patch: { need: q.hasNeed || q.need || '', budgetApproved: !!q.hasApprovedBudget, authority: q.whoIsTheAuthority || q.authority || '', timelineKnown: q.doWeKnowTheTimeline || '', timeline: q.timeline || '' } });
    }).catch(() => { /* no qualification yet */ });
  }, [id, !!lead, lead?.approval]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState(lead);
  const [ask, setAsk] = useState(null);
  const [askNote, setAskNote] = useState('');
  const [askRemark, setAskRemark] = useState('');
  const [bant, setBant] = useState(null);
  const teams = useTeams(); // BANT answers captured in the submit dialog
  const [dec, setDec] = useState({ mode: null, comment: '', reason: '' }); // P&L approver form
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const errors = useMemo(() => (form ? validateLead(form) : {}), [form]);

  useEffect(() => { setForm(lead); }, [lead?.id, lead?.status, lead?.approval]); // eslint-disable-line
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);
  if (fetchState.loading) return <LoadingPanel label="Loading lead…" />;
  if (fetchState.error) {
    return (
      <ErrorPanel
        title="Lead unavailable"
        message={fetchState.error.message}
        onRetry={() => { setFetchState({ loading: false, error: null }); }}
      />
    );
  }
  if (!lead) return <div className="panel empty"><h1 className="h1">Lead not found</h1><p className="muted s14">No lead with this ID in the API.</p><Link to="/leads">Back to leads</Link></div>;

  const editable = can.createLead && !lead.oppId && lead.approval !== 'rejected';
  const status = lead.status;
  const latest = appr.latest;
  const approval = (latest && APPROVAL_UI[latest.status]) || lead.approval || 'none';
  const approved = approval === 'approved';
  const ready = status === 'Qualified' && approved && !lead.oppId;
  const hasNeed = lead.need === 'Yes';
  const canSubmit = editable && (status === 'New' || status === 'Working') && (approval === 'none' || approval === 'rework');
  // approvers = users who can act in approval-service (never yourself)
  const approvers = users.filter((u) => u.approvalActorId && String(u.id) !== String(user.id) && !u.roles.includes('admin'));
  const actorName = (actorId) => users.find((u) => u.approvalActorId === actorId)?.name || actorId || '—';
  const actorRole = (actorId) => ROLE_LABEL[users.find((u) => u.approvalActorId === actorId)?.roles?.[0]] || '';
  const iAmApprover = approval === 'pending' && latest?.currentApproverId === user.approvalActorId;
  const waitingOn = latest ? `${actorName(latest.currentApproverId)} (${actorRole(latest.currentApproverId)})` : '';
  const openSubmit = () => {
    setBant({ need: lead.need || '', budgetApproved: !!lead.budgetApproved, authority: lead.authority || '', timelineKnown: lead.timelineKnown || '', timeline: lead.timeline || '', approverId: approvers.find((u) => u.roles.includes('pl_head'))?.approvalActorId || approvers[0]?.approvalActorId || '' });
    setAsk({ k: 'submit' });
  };
  const up = (patch, note) => dispatch({ type: 'UPDATE_LEAD', id, patch, note, who: user.name });
  const refresh = async () => { await reloadLeads?.(); await Promise.all([loadApproval(), loadHistory(), reloadApprovals?.()]); };

  const request = (to) => {
    if (!editable || to === status || to === 'Qualified') return;
    if (to === 'Nurturing') return setAsk({ k: 'nurture', to });
    if (to === 'Unqualified') return setAsk({ k: 'unq', to });
    if (status === 'Unqualified') return setAsk({ k: 'reopen', to });
    changeStatus({ status: to });
  };
  const changeStatus = async (patch) => {
    try {
      await leadService.update(id, patch);
      await refresh();
      setToast(`Status → ${patch.status}`);
    } catch (e) {
      setToast(e?.message || 'Status change failed');
    }
  };
  const submitForApproval = async () => {
    const approver = approvers.find((u) => u.approvalActorId === bant.approverId);
    if (status === 'New') await leadService.moveToWorking(id);
    await leadService.saveQualification(id, { hasNeed: bant.need, need: bant.need, whoIsTheAuthority: bant.authority, authority: bant.authority, doWeKnowTheTimeline: bant.timelineKnown, timeline: bant.timeline, hasApprovedBudget: !!bant.budgetApproved });
    await leadService.assessNeed(id, { hasNeed: true });
    await approvalService.submit({
      leadId: id, creatorId: user.approvalActorId, creatorRole: 'SALES_MANAGER',
      productVertical: lead.recordType === 'PPAS' ? 'EVOK' : 'TSP', teamId: 'default', territoryId: 'default',
      idempotencyKey: `submit-${id}-${Date.now()}`, nextApproverId: bant.approverId,
    });
    if (approver) teams(approver.name, `Lead approval needed: ${lead.company} (${lead.firstName} ${lead.lastName}) — submitted by ${user.name}.${askNote ? ' “' + askNote + '”' : ''}`, { kind: 'Approval', ctx: lead.id, link: '/leads/' + lead.id });
    await refresh();
    setTab('Approval'); setToast(`Submitted to ${approver?.name || 'approver'}`);
  };
  const confirmAsk = async () => {
    try {
      if (ask.k === 'submit') await submitForApproval();
      else if (ask.k === 'unq') await changeStatus({ status: 'Unqualified', disqualificationReason: askNote, disqualificationRemark: askRemark });
      else if (ask.k === 'nurture') await changeStatus({ status: 'Nurturing', additionalRemarks: [lead.additionalRemarks, `Follow-up: ${askNote}`].filter(Boolean).join('\n') });
      else await changeStatus({ status: ask.to });
    } catch (e) {
      setToast(e?.message || 'Action failed');
      return;
    }
    setAsk(null); setAskNote(''); setAskRemark('');
  };
  const nextOf = { New: 'Working', Nurturing: 'Working' };
  const help = {
    New: 'Make the first contact and move it to Working, or click “Submit for approval” to send it straight to the P&L Head and Sales Manager.',
    Working: approval === 'pending' ? `Waiting for ${waitingOn} to decide. Once approved, the lead moves to Qualified.` : approval === 'rework' ? 'Sent back for more work. See the Approval tab, update the lead and resubmit.' : hasNeed ? 'They have a need — click “Submit for approval”. Once approved, the lead is Qualified and converts to an opportunity.' : lead.need === 'No' ? 'No need identified — mark the lead Unqualified, or Nurturing to reconnect in 3–6 months.' : 'Click “Submit for approval” to confirm the qualification checks and send the lead to an approver.',
    Nurturing: 'Parked until the follow-up date. Move it back to Working when the bank re-engages.',
    Unqualified: approval === 'rejected' ? `Rejected at approval${lead.disqualRemark ? ' · ' + lead.disqualRemark : ''}. See the Approval tab.` : 'Closed. Reopen only if something changes.',
    Qualified: lead.oppId ? `Qualified and converted to ${lead.oppId}.` : lead.rfp ? 'Qualified. Write the RFP synopsis; the opportunity is created when Pre-Sales accepts it.' : 'Qualified. The opportunity is created automatically on approval.'
  }[status];

  const decide = async () => {
    const label = { approve: 'Approved', rework: 'More work needed', reject: 'Rejected' }[dec.mode];
    const text = [dec.reason, dec.comment.trim()].filter(Boolean).join(' — ');
    try {
      if (dec.mode === 'approve') await approvalService.approve(latest.id, dec.comment.trim() ? { comment: dec.comment.trim() } : {});
      else if (dec.mode === 'rework') await approvalService.requestChanges(latest.id, { comment: text });
      else await approvalService.reject(latest.id, { reason: text });
    } catch (e) {
      setToast(e?.message || 'Decision failed on the server');
      return;
    }
    if (lead.ownerId !== user.id) teams(lead.owner, `Your lead ${lead.company} was ${label.toLowerCase()} by ${user.name}${text ? ' — “' + text + '”' : ''}.`, { kind: 'Approval', ctx: lead.id, link: '/leads/' + lead.id });
    await refresh();
    if (dec.mode === 'approve') await reloadOpportunities?.();
    setToast(`${label} · lead updated`);
    setDec({ mode: null, comment: '', reason: '' });
  };

  const saveDetails = async () => {
    const n = errorCount(errors);
    if (n) { setShowErrors(true); setErr(`Fix the highlighted fields before saving (${n} issue${n > 1 ? 's' : ''}).`); return; }
    setErr(''); setShowErrors(false);
    try {
      await leadService.update(id, uiLeadToApi(form));
      await refresh();
      setToast('Saved · change recorded in History');
    } catch (e) {
      setErr(e?.message || 'Save failed');
    }
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
              <p className="muted s13" style={{ margin: 0 }}>Confirm the qualification checks, then choose who approves the lead.{status === 'New' ? ' The lead moves to Working.' : ''}</p>
              <div className="grid2">
                <label className="fl">Do they have a need? *<select className="in" value={bant.need} onChange={(e) => setBant({ ...bant, need: e.target.value })}><option value="">--None--</option><option>Yes</option><option>No</option></select>
                  {bant.need === 'No' && <span className="note err-txt">No need → mark the lead Unqualified or Nurturing instead of submitting.</span>}</label>
                <label className="fl">Who is the authority?<input className="in" value={bant.authority} placeholder="e.g. CIO, IT Committee" onChange={(e) => setBant({ ...bant, authority: e.target.value })} /></label>
                <label className="fl">Do we know the timeline?<select className="in" value={bant.timelineKnown} onChange={(e) => setBant({ ...bant, timelineKnown: e.target.value })}><option value="">--None--</option><option>Yes</option><option>No</option></select></label>
                {bant.timelineKnown === 'Yes' ? <label className="fl">Timeline<input className="in" value={bant.timeline} placeholder="e.g. Go-live by Mar 2027" onChange={(e) => setBant({ ...bant, timeline: e.target.value })} /></label> : <span />}
                <label className="fl chk"><input type="checkbox" checked={bant.budgetApproved} onChange={(e) => setBant({ ...bant, budgetApproved: e.target.checked })} /> Do they have an approved budget?</label>
              </div>
              <div className="grid2">
                <label className="fl">Approver *<select className="in" value={bant.approverId} onChange={(e) => setBant({ ...bant, approverId: e.target.value })}>{approvers.map((u) => <option key={u.id} value={u.approvalActorId}>{u.name} ({ROLE_LABEL[u.roles[0]] || u.roles[0]})</option>)}</select></label>
                <label className="fl">Message to approver (Teams)<input className="in" value={askNote} placeholder="Why this lead is worth pursuing" onChange={(e) => setAskNote(e.target.value)} /></label>
              </div>
            </div>
          )}
          <div className="row gap8">
            <button className="btn-p" disabled={ask.k === 'submit' ? bant?.need !== 'Yes' || !bant?.approverId : !askNote} onClick={confirmAsk}>{ask.k === 'submit' ? 'Submit for approval' : 'Confirm'}</button>
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
          {approval !== 'none' && latest && (
            <div className="kv">
              <div><div className="k">Submitter</div><div className="v">{actorName(latest.creatorId)}</div></div>
              <div><div className="k">Assigned to</div><div className="v">{actorName(latest.currentApproverId)} {actorRole(latest.currentApproverId) && `(${actorRole(latest.currentApproverId)})`}</div></div>
              <div><div className="k">Submitted</div><div className="v">{at(latest.submittedAt)}</div></div>
              <div><div className="k">Status</div><div className="v">{latest.status.replace(/_/g, ' ').toLowerCase()}</div></div>
            </div>
          )}
          {iAmApprover && (
            <div className="col gap12" style={{ background: '#F7FAFE', borderRadius: 8, padding: 16 }}>
              <div className="w600 s14">Approver view ({user.name})</div>
              <div role="radiogroup" aria-label="Decision" className="grid3">
                {[['approve', 'Approve lead'], ['rework', 'More work needed'], ['reject', 'Reject lead']].map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={dec.mode === k} className={dec.mode === k ? 'opt on' : 'opt'} onClick={() => setDec({ mode: k, comment: dec.comment, reason: '' })}>{l}</button>
                ))}
              </div>
              {dec.mode === 'rework' && (
                <label className="fl">What needs more work? *<select className="in" value={dec.reason} onChange={(e) => setDec({ ...dec, reason: e.target.value })}><option value="">Choose…</option>{REWORK_POINTS.map((r) => <option key={r}>{r}</option>)}</select>
                  <span className="note">The lead goes back to {lead.owner} in Working so they can update and resubmit.</span></label>
              )}
              {dec.mode === 'reject' && (
                <label className="fl">Reason for rejection *<select className="in" value={dec.reason} onChange={(e) => setDec({ ...dec, reason: e.target.value })}><option value="">Choose…</option>{REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                  <span className="note">The lead is closed as Unqualified.</span></label>
              )}
              {dec.mode && (
                <label className="fl">Comments{dec.mode === 'approve' ? '' : ' *'}
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
          {approval === 'pending' && !iAmApprover && <p className="warn">Waiting for {waitingOn} to decide.</p>}
          {approval === 'rework' && <div className="warn row between wrap gap8"><span>Sent back for more work. Update the lead details, then resubmit.</span>{canSubmit && <button className="btn-p" onClick={openSubmit}>Resubmit for approval</button>}</div>}
          {appr.events.length > 0 && (
            <div className="col gap8">
              <div className="sec">Approval history</div>
              <ol className="cmt-list">
                {appr.events.filter((e) => EVENT_LABEL[e.type]).map((e) => {
                  const d = EVENT_LABEL[e.type];
                  return (
                    <li key={e.id} className={'cmt ' + ({ Approved: 'g', 'More work needed': 'a', Rejected: 'r' }[d] || '')}>
                      <div className="row between gap8 wrap"><Badge tone={{ Approved: 'green', 'More work needed': 'amber', Rejected: 'red', Submitted: 'blue' }[d]}>{d}</Badge><span className="s12 muted">{actorName(e.actorId)}{actorRole(e.actorId) ? ` (${actorRole(e.actorId)})` : ''} · {at(e.timestamp)}</span></div>
                      {e.type === 'APPROVER_SELECTED' && <div className="s13" style={{ marginTop: 6 }}>Approver: {actorName(e.newApproverId)}</div>}
                      {(e.comment || e.reason) && <div className="s14" style={{ marginTop: 6 }}>{e.reason || e.comment}</div>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>
      )}

      {tab === 'History' && <section className="panel" style={{ maxWidth: 900 }}><Timeline items={history} /></section>}

      <Toast msg={toast} />
    </>
  );

}
