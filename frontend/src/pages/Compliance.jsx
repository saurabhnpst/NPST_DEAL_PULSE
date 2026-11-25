import { useMemo, useState } from 'react';
import { Link } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, fmtDate } from '../store/Store.jsx';
import { OPEN_STAGES, isTender } from '../data/defaults.js';
import { STANDARD_COMPLIANCE } from '../data/complianceTemplates.js';
import { Badge, Drawer, Pills, Stepper, Toast } from '../components/ui.jsx';
import { useTeams, TeamsBadge } from '../components/Teams.jsx';

const EXPERT_ROLES = ['Product', 'Security', 'Legal', 'Compliance', 'Architecture'];
/** SME roster per role — populated from assignment APIs when available. */
const EXPERTS = {
  Product: [],
  Security: [],
  Legal: [],
  Compliance: [],
  Architecture: [],
};
const personOf = (x) => (x || '').split(' · ')[0];
const nowTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

const STEPS = ['RFP uploaded', 'System check done', 'Expert review', 'Final matrix'];

/** Summary numbers for one opportunity's compliance matrix. */
function summarise(o, rows, meta) {
  const total = rows.length;
  const approved = rows.filter((r) => r.rev === 'Approved').length;
  const pending = rows.filter((r) => r.rev === 'Pending').length;
  const rejected = rows.filter((r) => r.rev === 'Rejected').length;
  const partial = rows.filter((r) => ['Partial', 'Custom', 'No'].includes(r.pos)).length;
  const teams = Array.from(new Set(rows.map((r) => r.team)));
  const smeDone = teams.filter((t) => rows.filter((r) => r.team === t).every((r) => r.rev === 'Approved')).length;
  const pct = total ? Math.round((approved / total) * 100) : 0;
  const signed = !!meta?.signedOff;
  const phase = signed ? 'Signed off' : !total || approved === 0 ? 'Requirements' : rejected ? 'Gap Analysis' : approved === total ? 'Final matrix' : 'SME Review';
  const risk = rejected || partial >= 3 ? 'High' : partial >= 1 || (total && pending > total / 2) ? 'Medium' : 'Low';
  return { o, rows, total, approved, pending, rejected, teams, smeDone, pct, signed, phase, risk, meta: meta || {} };
}

const RISK_TONE = { Low: 'green', Medium: 'amber', High: 'red' };

export default function Compliance() {
  const { user, can } = useAuth();
  const { state, dispatch } = useStore();
  const meta = state.complianceMeta || {};
  const [domain, setDomain] = useState('All');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState(null); // open workspace
  const [src, setSrc] = useState('All');
  const [lib, setLib] = useState(false);
  const [hide, setHide] = useState({ ongoing: false, done: false });
  const [toast, setToast] = useState('');
  const teams = useTeams();
  const hidden = state.hiddenCompliance || [];

  // A project = an opportunity with a matrix, or an open tender deal that needs one.
  const projects = useMemo(() => state.opportunities
    .filter((o) => !hidden.includes(o.id) && (state.compliance.some((c) => c.oppId === o.id) || !!meta[o.id] || (OPEN_STAGES.includes(o.stage) && isTender(o.tender))))
    .map((o) => summarise(o, state.compliance.filter((c) => c.oppId === o.id), meta[o.id]))
    .sort((a, b) => String(b.meta.updated || '').localeCompare(String(a.meta.updated || ''))),
  [state.opportunities, state.compliance, meta, hidden]);

  const domains = ['All', ...Array.from(new Set(projects.map((p) => p.o.productTsp)))];
  const match = (p) => (domain === 'All' || p.o.productTsp === domain) && (!q || `${p.o.account} ${p.o.name}`.toLowerCase().includes(q.toLowerCase()));
  const ongoing = projects.filter((p) => !p.signed && match(p));
  const done = projects.filter((p) => p.signed && match(p));

  const sel = projects.find((p) => p.o.id === selId);
  const oppById = (id) => state.opportunities.find((o) => o.id === id);
  const evidence = state.compliance.filter((c) => c.ev);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  return (
    <>
      <div className="row wrap between gap16" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="h1">Compliance</h1>
          <p className="sub">Monitor ongoing RFP reviews, SME approvals, and completed matrices.</p>
        </div>
        <div className="row gap8 wrap">
          <button className="btn" onClick={() => setLib(true)}>Evidence Library</button>
        </div>
      </div>


      {!sel ? (
        <>
          <div className="row wrap gap8">
            <input className="in" type="search" placeholder="Search bank or project…" aria-label="Search projects" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 240px', maxWidth: 360 }} />
            <select className="in sm" aria-label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)}>{domains.map((d) => <option key={d} value={d}>{d === 'All' ? 'Domain: All' : d}</option>)}</select>
          </div>

          <ProjectSection title="Ongoing projects" sub={`${ongoing.length} active compliance review${ongoing.length === 1 ? '' : 's'}`}
            hidden={hide.ongoing} onToggle={() => setHide({ ...hide, ongoing: !hide.ongoing })}
            items={ongoing} empty="No ongoing compliance reviews match these filters." onOpen={(id) => { setSelId(id); setSrc('All'); }} />

          <ProjectSection title="Completed projects" sub={`${done.length} signed-off compliance matri${done.length === 1 ? 'x' : 'ces'}`}
            hidden={hide.done} onToggle={() => setHide({ ...hide, done: !hide.done })}
            items={done} empty="No signed-off matrices yet." onOpen={(id) => { setSelId(id); setSrc('All'); }} completed />
        </>
      ) : (
        <Workspace p={sel} src={src} setSrc={setSrc} can={can} user={user} dispatch={dispatch} say={say} teams={teams} onBack={() => setSelId(null)} />
      )}

      {lib && (
        <Drawer title="Evidence Library" onClose={() => setLib(false)}>
          <p className="muted s13" style={{ margin: 0 }}>Proof documents across every project. Read-only.</p>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Document</th><th>Requirement</th><th>Project</th><th>Status</th></tr></thead>
              <tbody>
                {evidence.map((c) => (
                  <tr key={c.id}>
                    <td className="w500" style={{ color: '#214C98' }}>{c.ev}</td>
                    <td>{c.name}</td>
                    <td>{oppById(c.oppId)?.account || c.oppId}</td>
                    <td><Badge>{c.rev}</Badge></td>
                  </tr>
                ))}
                {evidence.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 24 }}>No proof documents yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Drawer>
      )}
      <Toast msg={toast} />
    </>
  );
}

function ProjectSection({ title, sub, hidden, onToggle, items, empty, onOpen, completed }) {
  return (
    <>
      <section className="panel row between gap8" style={{ padding: '18px 22px' }}>
        <div>
          <h2 className="h2">{title}</h2>
          <div className="s13 muted" style={{ marginTop: 4 }}>{sub}</div>
        </div>
        <button className="btn link-btn" aria-expanded={!hidden} onClick={onToggle}>{hidden ? 'Show' : 'Hide'}</button>
      </section>
      {!hidden && (items.length ? (
        <div className="proj-grid">
          {items.map((p) => <ProjectCard key={p.o.id} p={p} onOpen={() => onOpen(p.o.id)} completed={completed} />)}
        </div>
      ) : <p className="muted s13" style={{ margin: '-8px 0 0' }}>{empty}</p>)}
    </>
  );
}

function ProjectCard({ p, onOpen, completed }) {
  return (
    <article className="panel proj-card">
      <div className="s12 muted">{p.o.account}</div>
      <h3 className="proj-title">{p.o.name}</h3>
      <div className="row wrap gap6">
        <Badge tone="teal">{p.o.productTsp}</Badge>
        <Badge tone={completed ? 'green' : 'gray'}>{p.phase}</Badge>
        {!completed && <Badge tone={RISK_TONE[p.risk]}>{p.risk} risk</Badge>}
        <Badge tone={p.teams.length && p.smeDone === p.teams.length ? 'green' : 'amber'}>SME {p.smeDone}/{p.teams.length || 0}</Badge>
      </div>
      <div className="row between s12 muted" style={{ marginTop: 4 }}><span>Completion</span><span>{p.pct}%</span></div>
      <div className="proj-bar"><div style={{ width: p.pct + '%', background: completed ? '#168A70' : '#284FBC' }} /></div>
      <div className="s12 muted">{completed ? `Signed off ${p.meta.signedOff} · ${p.meta.signedBy}` : `Updated ${p.meta.updated ? fmtDate(p.meta.updated) : '—'}`}</div>
      <button className="btn-p proj-open" onClick={onOpen}>{completed ? 'View matrix' : 'Open workspace'}</button>
    </article>
  );
}

function Workspace({ p, src, setSrc, can, user, dispatch, say, teams, onBack }) {
  const [add, setAdd] = useState(null);
  const [delRow, setDelRow] = useState(null);
  const blank = { name: '', kind: 'M', team: 'Product', assignee: EXPERTS.Product[0], ev: '' };
  const saveRow = () => {
    const who = personOf(add.assignee);
    const m = teams(who, `Your approval and response are needed on a compliance requirement for ${p.o.name} (${p.o.account}): “${add.name.trim()}” (${add.team}). Please reply with our answer and proof document.`, { kind: 'Compliance', ctx: p.o.name, link: '/compliance' });
    dispatch({ type: 'COMPLIANCE_ADD', oppId: p.o.id, row: { name: add.name.trim(), kind: add.kind, team: add.team, assignee: who, pos: 'Awaiting response', ev: add.ev.trim(), rev: 'Pending', teamsAt: m.time } });
    setAdd(null); say(`Requirement added · ${who} tagged on Teams`);
  };
  const step = !p.total ? 0 : p.approved === p.total ? 3 : p.rows.some((r) => r.rev !== 'Pending') ? 2 : 1;
  const rows = p.rows.filter((r) => src === 'All' || (src === 'Asked in RFP' ? r.kind === 'M' : r.kind === 'S'));
  const locked = p.signed;
  const setRev = (id, rev) => dispatch({ type: 'COMPLIANCE', id, rev });

  return (
    <>
      <div className="row wrap between gap8">
        <button className="btn" onClick={onBack}>← All projects</button>
        <div className="row gap8 wrap">
          <Link className="btn" to={'/opportunities/' + p.o.id}>Open opportunity</Link>
        </div>
      </div>
      <section className="panel col gap16">
        <div className="row wrap between gap8">
          <div>
            <div className="s12 muted">{p.o.id} · {p.o.stage}</div>
            <h2 className="h2" style={{ fontSize: 20 }}>{p.o.account} · {p.o.name}</h2>
          </div>
          <div className="row wrap gap8">
            {p.total ? <Badge tone={p.approved === p.total ? 'green' : 'blue'}>{p.approved} / {p.total} approved</Badge> : <Badge>Not started</Badge>}
            {p.signed && <Badge tone="green">Signed off {p.meta.signedOff}</Badge>}
          </div>
        </div>
        {p.total ? (
          <>
            <div className="row wrap gap16 s13">
              <span>Domain <b>{p.o.productTsp}</b></span>
              <span>Phase <b>{p.phase}</b></span>
              <span>Risk <b>{p.risk}</b></span>
              <span>SME sign-offs <b>{p.smeDone} of {p.teams.length}</b></span>
              <span>Asked in RFP <b>{p.rows.filter((c) => c.kind === 'M').length}</b></span>
              <span>Added by system <b>{p.rows.filter((c) => c.kind === 'S').length}</b></span>
            </div>
            <div className="bar" style={{ height: 10 }}><div style={{ height: 10, width: p.pct + '%', background: '#168A70' }} /></div>
            <Stepper label="Compliance progress" steps={STEPS} current={step} />
            <p className="s12 muted" style={{ margin: 0 }}>{STEPS[step]} · {p.pending ? `${p.pending} line${p.pending > 1 ? 's' : ''} awaiting expert review` : 'all lines decided'}</p>
            {can.approveCompliance && !locked && p.approved === p.total && (
              <div className="ok row between wrap gap8"><span>Every line is approved. Sign off the matrix to move it to Completed projects.</span>
                <button className="btn-ok" onClick={() => { dispatch({ type: 'SIGNOFF_COMPLIANCE', oppId: p.o.id, who: user.name }); say('Matrix signed off · moved to Completed projects'); }}>Sign off matrix</button></div>
            )}
            {can.approveCompliance && locked && (
              <div className="banner row between wrap gap8"><span>Signed off by {p.meta.signedBy} on {p.meta.signedOff}. The matrix is locked.</span>
                <button className="btn" onClick={() => { dispatch({ type: 'SIGNOFF_COMPLIANCE', oppId: p.o.id, undo: true, who: user.name }); say('Matrix reopened for changes'); }}>Reopen for changes</button></div>
            )}
          </>
        ) : (
          <div className="col gap10">
            <p className="muted s14" style={{ margin: 0 }}>No compliance matrix has been started for this tender yet.</p>
            {can.approveCompliance && <div className="row gap8 wrap"><button className="btn-p" onClick={() => { dispatch({ type: 'START_COMPLIANCE', oppId: p.o.id, rows: STANDARD_COMPLIANCE }); Array.from(new Set(STANDARD_COMPLIANCE.map((r) => r[2]))).forEach((t) => teams(`${t} team`, `New compliance matrix for ${p.o.name} (${p.o.account}) — please review the ${t} lines.`, { kind: 'Compliance', ctx: p.o.name, link: '/compliance' })); say('Matrix started · expert teams notified on Teams'); }}>Start with standard lines</button>{!add && <button className="btn" onClick={() => setAdd(blank)}>+ Add requirement</button>}</div>}
          </div>
        )}
      </section>

      {add && (
        <section className="panel col gap12">
          <h2 className="h2">Add compliance requirement</h2>
          <div className="grid3">
            <label className="fl" style={{ gridColumn: '1 / -1' }}>Requirement *<input className="in" autoFocus value={add.name} placeholder="e.g. Data must be stored in India" onChange={(e) => setAdd({ ...add, name: e.target.value })} /></label>
            <label className="fl">Why it’s here<select className="in" value={add.kind} onChange={(e) => setAdd({ ...add, kind: e.target.value })}><option value="M">Asked in RFP</option><option value="S">Added by system</option></select></label>
            <label className="fl">Expert role<select className="in" value={add.team} onChange={(e) => setAdd({ ...add, team: e.target.value, assignee: EXPERTS[e.target.value][0] })}>{EXPERT_ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
            <label className="fl">Tag assignee (Teams) *<select className="in" value={add.assignee} onChange={(e) => setAdd({ ...add, assignee: e.target.value })}>{EXPERTS[add.team].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <span className="note">Only {add.team} experts are listed.</span></label>
            <label className="fl" style={{ gridColumn: '1 / -1' }}>Proof document<input className="in" value={add.ev} placeholder="e.g. ISO certificate (leave blank if it still needs upload)" onChange={(e) => setAdd({ ...add, ev: e.target.value })} /></label>
          </div>
          <span className="s12" style={{ color: '#3D44A8' }}>{personOf(add.assignee)} will get a Microsoft Teams message asking for their approval and response.</span>
          <div className="row gap8"><button className="btn-p" disabled={!add.name.trim() || !add.assignee} onClick={saveRow}>Add &amp; tag on Teams</button><button className="btn" onClick={() => setAdd(null)}>Cancel</button></div>
        </section>
      )}

      {p.total > 0 && (
        <>
          <div className="row between wrap gap8">
            <h2 className="h2">Compliance matrix</h2>
            <div className="row gap8 wrap">
              <Pills label="Show" value={src} onChange={setSrc} options={['All', 'Asked in RFP', 'Added by system']} />
              {can.approveCompliance && !locked && !add && <button className="btn-p" onClick={() => setAdd(blank)}>+ Add requirement</button>}
            </div>
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Requirement</th><th>Why it’s here</th><th>Expert Role</th><th>Our Answer</th><th>Proof Document</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="w500">{r.name}</td>
                    <td><Badge tone={r.kind === 'M' ? 'blue' : 'amber'}>{r.kind === 'M' ? 'Asked in RFP' : 'Added by system'}</Badge></td>
                    <td>{r.team}{r.assignee && <div className="s12 muted">Assigned to {r.assignee}</div>}{r.teamsAt && <TeamsBadge to={r.assignee || `${r.team} team`} at={r.teamsAt} />}</td>
                    <td>{r.pos === 'Awaiting response' ? <span className="s12 muted">Awaiting response</span> : <Badge>{r.pos}</Badge>}</td>
                    <td style={{ color: r.ev ? undefined : '#A3221A' }}>{r.ev || 'Needs upload'}</td>
                    <td><Badge>{r.rev}</Badge></td>
                    <td>
                      {can.approveCompliance && !locked && r.rev === 'Pending' && (
                        <div className="row gap8">
                          <button className="btn" style={{ minHeight: 32 }} onClick={() => setRev(r.id, 'Approved')}>Approve</button>
                          <button className="btn-d" style={{ minHeight: 32, padding: '0 12px' }} onClick={() => setRev(r.id, 'Rejected')}>Reject</button>
                        </div>
                      )}
                      {can.approveCompliance && !locked && r.rev !== 'Pending' && <button className="btn" style={{ minHeight: 32 }} onClick={() => setRev(r.id, 'Pending')}>Undo</button>}
                      {(!can.approveCompliance || locked) && <span className="s12 muted">{locked ? 'Locked' : 'Read-only'}</span>}
                      {can.approveCompliance && !locked && (delRow === r.id
                        ? <div className="row gap6" style={{ marginTop: 6 }}><span className="s12">Delete?</span><button className="btn-d" style={{ minHeight: 28, padding: '0 10px' }} onClick={() => { dispatch({ type: 'COMPLIANCE_DELETE', id: r.id }); setDelRow(null); say('Requirement deleted'); }}>Yes</button><button className="btn" style={{ minHeight: 28 }} onClick={() => setDelRow(null)}>No</button></div>
                        : <button className="link-del" aria-label={'Delete ' + r.name} onClick={() => setDelRow(r.id)}>Delete</button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
