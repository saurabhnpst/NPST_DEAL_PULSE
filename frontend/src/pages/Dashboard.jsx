import { useNavigate } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, dealValue, toCr, weighted } from '../store/Store.jsx';
import { OPEN_STAGES } from '../data/defaults.js';
import { useBusinessData } from '../store/BusinessData.jsx';
import { LoadingPanel, ErrorPanel } from '../components/AsyncState.jsx';
import { Badge, Kpi } from '../components/ui.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { vertical, user } = useAuth();
  const { state } = useStore();
  const { leadsLoading, leadsError, oppsLoading, oppsError, rfpsLoading, approvalsLoading, reloadAll } = useBusinessData();
  const nav = useNavigate();
  const { leads, opportunities: opps, synopses, rfps, apiApprovals, decisions, compliance, evaluations } = state;
  const teamOwners = Array.from(new Set(opps.map((o) => o.owner).filter((n) => n && n !== '—')));

  const open = opps.filter((o) => OPEN_STAGES.includes(o.stage));
  const pipeline = open.reduce((s, o) => s + dealValue(o), 0);
  const won = opps.filter((o) => o.stage === 'Closed Won');
  const onHold = opps.filter((o) => o.stage === 'On Hold');
  const openLeads = leads.filter((l) => l.status !== 'Unqualified' && !l.oppId);
  const pendingDec = decisions.filter((d) => !d.done);
  const stageRows = OPEN_STAGES.map((s) => {
    const list = open.filter((o) => o.stage === s);
    return { s, n: list.length, v: list.reduce((a, o) => a + dealValue(o), 0) };
  });
  const maxN = Math.max(1, ...stageRows.map((r) => r.n));
  const oppName = (id) => { const o = opps.find((x) => x.id === id); return o ? `${o.name} · ${o.account}` : id; };

  let kpis = [];
  let todo = [];
  const k = vertical.key;
  const dataLoading = leadsLoading || oppsLoading || rfpsLoading || approvalsLoading;
  if (dataLoading && !leads.length && !opps.length) {
    return <LoadingPanel label="Loading dashboard…" />;
  }
  if (k === 'sales') {
    // Sales rep: own pipeline, recommendations waiting on the P&L Head, outcomes to act on
    const mineOpen = open.filter((o) => o.owner === user.name);
    const myOppIds = opps.filter((o) => o.owner === user.name).map((o) => o.id);
    const myDec = decisions.filter((d) => myOppIds.includes(d.oppId));
    kpis = [
      { label: 'My open leads', value: openLeads.filter((l) => l.owner === user.name).length, sub: `${openLeads.length} in the team`, to: '/leads' },
      { label: 'My open opportunities', value: mineOpen.length, sub: `₹${toCr(mineOpen.reduce((a, o) => a + dealValue(o), 0))} Cr pipeline`, to: '/opportunities' },
      { label: 'Awaiting P&L Head', value: myDec.filter((d) => !d.done).length, sub: 'Recommendations sent', to: '/opportunities' },
      { label: 'Closed won', value: won.length, sub: `₹${toCr(won.reduce((a, o) => a + dealValue(o), 0))} Cr`, to: '/post-po' }
    ];
    todo = [
      ...myDec.filter((d) => d.done).map((d) => ({ kind: d.done.v, t: `P&L Head said ${d.done.v}: ${oppName(d.oppId)}`, s: d.done.note && d.done.note !== '—' ? d.done.note : d.done.at, to: `/opportunities/${d.oppId}`, tone: d.done.v === 'Proceed' ? 'green' : 'red' })),
      ...myDec.filter((d) => !d.done).map((d) => ({ kind: 'Waiting', t: `With P&L Head: ${oppName(d.oppId)}`, s: `You recommended ${d.rec}`, to: `/opportunities/${d.oppId}`, tone: 'amber' })),
      ...leads.filter((l) => l.approval === 'pending' && !l.approvals?.sales).map((l) => ({ kind: 'Approval', t: `Approve lead (Sales Manager): ${l.company}`, s: `${l.firstName} ${l.lastName} · by ${l.owner}`, to: `/leads/${l.id}`, tone: 'amber' })),
      ...leads.filter((l) => l.owner === user.name && l.approval === 'pending' && l.approvals?.sales).map((l) => ({ kind: 'Lead', t: `Waiting for P&L Head: ${l.company}`, s: 'Submitted for approval', to: `/leads/${l.id}`, tone: 'blue' })),
      ...leads.filter((l) => l.owner === user.name && l.approval === 'rework').map((l) => ({ kind: 'Lead', t: `More work needed: ${l.company}`, s: l.approvalLog?.find((c) => c.d === 'More work needed')?.comment || 'Update and resubmit', to: `/leads/${l.id}`, tone: 'amber' })),
      ...leads.filter((l) => l.owner === user.name && l.approval === 'rejected').map((l) => ({ kind: 'Lead', t: `Lead rejected: ${l.company}`, s: l.approvalLog?.find((c) => c.d === 'Rejected')?.reason || 'Closed at approval', to: `/leads/${l.id}`, tone: 'red' })),
      ...onHold.filter((o) => o.owner === user.name).map((o) => ({ kind: 'On hold', t: `Define fallback: ${o.name}`, s: o.holdReason ? `On hold · ${o.holdReason}` : 'On hold', to: `/opportunities/${o.id}`, tone: 'amber' })),
      ...leads.filter((l) => l.owner === user.name && l.approval === 'approved' && l.status === 'Qualified' && !l.oppId).map((l) => ({ kind: 'Lead', t: `Approved — ${l.rfp ? 'write synopsis' : 'convert'}: ${l.company}`, s: `${l.firstName} ${l.lastName}`, to: `/leads/${l.id}`, tone: 'green' })),
      ...synopses.filter((s) => s.status === 'Returned').map((s) => ({ kind: 'Synopsis', t: `Fix returned synopsis: ${s.name}`, s: s.account, to: '/rfp', tone: 'red' }))
    ];
  } else if (k === 'pl') {
    // P&L Head: approvals and decisions
    const leadAppr = leads.filter((l) => l.approval === 'pending' && !l.approvals?.pl); // not yet decided by the P&L Head
    const decided = decisions.filter((d) => d.done);
    kpis = [
      { label: 'Awaiting your decision', value: pendingDec.length, sub: 'Proceed or Reject', to: '/decisions' },
      { label: 'Leads to approve', value: leadAppr.length, sub: 'Submitted by Sales', to: '/leads' },
      { label: 'Decided', value: decided.length, sub: `${decided.filter((d) => d.done.v === 'Proceed').length} proceed · ${decided.filter((d) => d.done.v === 'Reject').length} reject`, to: '/decisions' },
      { label: 'Team pipeline', value: `₹${toCr(pipeline)} Cr`, sub: `${open.length} open deals`, to: '/opportunities' }
    ];
    todo = [
      ...pendingDec.map((d) => ({ kind: 'Decision', t: `Proceed or reject: ${oppName(d.oppId)}`, s: `${d.val} · Sales says ${d.rec}`, to: '/decisions', tone: 'amber' })),
      ...leadAppr.map((l) => ({ kind: 'Approval', t: `Approve lead: ${l.company}`, s: `${l.firstName} ${l.lastName} · by ${l.owner}`, to: `/leads/${l.id}`, tone: 'amber' })),
      ...onHold.map((o) => ({ kind: 'On hold', t: `Fallback / reopen: ${o.name}`, s: `${o.account}${o.holdReason ? ' · ' + o.holdReason : ''}`, to: `/opportunities/${o.id}`, tone: 'amber' }))
    ];
  } else if (k === 'solution') {
    const subm = synopses.filter((s) => s.status === 'Submitted');
    const pend = compliance.filter((c) => c.rev === 'Pending');
    const active = evaluations.filter((e) => !['Accepted', 'Rejected'].includes(e.status));
    kpis = [
      { label: 'Synopses awaiting you', value: subm.length, sub: 'Accept to create the opportunity', to: '/rfp' },
      { label: 'Compliance to review', value: pend.length, sub: `of ${compliance.length} lines`, to: '/compliance' },
      { label: 'Active evaluations', value: active.length, sub: 'Demos, PoCs, pilots', to: '/pre-po' },
      { label: 'Open opportunities', value: open.length, sub: `₹${toCr(pipeline)} Cr pipeline`, to: '/opportunities' }
    ];
    todo = [
      ...subm.map((s) => ({ kind: 'Synopsis', t: `Review synopsis: ${s.name}`, s: `${s.account} · bid due ${s.due}`, to: '/rfp', tone: 'blue' })),
      ...active.slice(0, 4).map((e) => ({ kind: e.type, t: `${e.name}: ${e.next}`, s: oppName(e.oppId), to: '/pre-po', tone: 'gray' })),
      ...(pend.length ? [{ kind: 'Compliance', t: `${pend.length} items waiting for expert review`, s: 'Open compliance workspace', to: '/compliance', tone: 'amber' }] : [])
    ];
  }

  const loading = (leadsLoading || oppsLoading) && !leads.length && !opps.length;
  const fatal = (leadsError || oppsError) && !leads.length && !opps.length;
  if (loading) return <LoadingPanel label="Loading dashboard…" />;
  if (fatal) {
    return (
      <ErrorPanel
        title="Dashboard data unavailable"
        message={leadsError?.message || oppsError?.message}
        onRetry={reloadAll}
      />
    );
  }

  return (
    <>
      {(leadsError || oppsError) && (
        <p className="banner s13" role="status">
          Some dashboard figures may be incomplete.
          <button type="button" className="btn sm" style={{ marginLeft: 8 }} onClick={reloadAll}>Retry</button>
        </p>
      )}
      <div className="row wrap between gap16" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="h1">{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="sub">{vertical.label} dashboard · FY26-27</p>
        </div>
        {(k === 'sales') && <div className="row gap8"><button className="btn" onClick={() => nav('/opportunities?new=1')}>+ New opportunity</button><button className="btn-p" onClick={() => nav('/leads?new=1')}>+ New lead</button></div>}
      </div>

      <section className="kpis" aria-label="Key numbers">
        {kpis.map((x) => <Kpi key={x.label} label={x.label} value={x.value} sub={x.sub} color={x.color} onClick={() => nav(x.to)} />)}
      </section>

      <div className="two">
        <section className="panel col gap10">
          <div className="row between"><h2 className="h2">My to-dos</h2><span className="s13 muted">{todo.length} items</span></div>
          {todo.length === 0 && <p className="muted s14">Nothing waiting. Nice.</p>}
          {todo.slice(0, 7).map((t, i) => (
            <button key={i} className="qitem row gap10" onClick={() => nav(t.to)}>
              <Badge tone={t.tone}>{t.kind}</Badge>
              <div style={{ minWidth: 0 }}><div className="s14 w500">{t.t}</div><div className="s12 muted">{t.s}</div></div>
            </button>
          ))}
        </section>

        <section className="panel col gap10">
          <div className="row between"><h2 className="h2">Pipeline by stage</h2><button className="btn" onClick={() => nav('/opportunities')}>Open board</button></div>
          {stageRows.map((r) => (
            <div key={r.s} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 110px', gap: 12, alignItems: 'center' }}>
              <span className="s13">{r.s}</span>
              <div className="bar"><div style={{ width: (r.n / maxN * 100) + '%' }} /></div>
              <span className="mono s13" style={{ textAlign: 'right' }}>{r.n} · ₹{toCr(r.v)} Cr</span>
            </div>
          ))}
        </section>
      </div>

      {k === 'pl' && (
        <section className="panel col gap10">
          <h2 className="h2">Team</h2>
          {teamOwners.length === 0 ? (
            <p className="muted s14">No opportunity owners in the loaded pipeline. Team rollup requires owner data from the opportunity API.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>Owner</th><th>Open leads</th><th>Open deals</th><th>Pipeline</th><th>Weighted</th><th>Won</th></tr></thead>
                <tbody>
                  {teamOwners.map((n) => {
                    const mine = open.filter((o) => o.owner === n);
                    return (
                      <tr key={n}>
                        <td className="w500">{n}</td>
                        <td className="mono">{openLeads.filter((l) => l.owner === n).length}</td>
                        <td className="mono">{mine.length}</td>
                        <td className="mono">₹{toCr(mine.reduce((a, o) => a + dealValue(o), 0))} Cr</td>
                        <td className="mono">₹{toCr(mine.reduce((a, o) => a + weighted(o), 0))} Cr</td>
                        <td className="mono">₹{toCr(won.filter((o) => o.owner === n).reduce((a, o) => a + dealValue(o), 0))} Cr</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
