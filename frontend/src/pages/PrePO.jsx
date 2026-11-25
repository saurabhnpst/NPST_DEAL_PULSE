import { useState } from 'react';
import { Link } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, fmtDate } from '../store/Store.jsx';
import { useBusinessData } from '../store/BusinessData.jsx';
import { updateEvaluation } from '../services/workflowService.js';
import { Badge, Kpi, Pills, ReadOnlyNote } from '../components/ui.jsx';

// API errors are logged to the console (the list simply keeps its last loaded values)
const alertLine = (e) => console.error('Pre-PO update failed:', e?.message || e);

const STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Under Bank Evaluation', 'Changes Requested', 'Accepted', 'Rejected'];

export default function PrePO() {
  const { user, can, readOnly } = useAuth();
  const { state } = useStore();
  const { reloadWorkflow } = useBusinessData();
  const update = (id, changes) => updateEvaluation(id, changes).then(reloadWorkflow).catch((e) => alertLine(e));
  const [tab, setTab] = useState('Active');
  const [type, setType] = useState('All');
  const [mine, setMine] = useState(false);
  const isClosed = (e) => e.status === 'Accepted' || e.status === 'Rejected';
  const all = state.evaluations;
  const rows = all.filter((e) => (tab === 'Closed') === isClosed(e) && (type === 'All' || e.type === type) && (!mine || e.tech === user.name || e.sales === user.name));
  const opp = (id) => state.opportunities.find((o) => o.id === id);
  const active = all.filter((e) => !isClosed(e));
  const editable = can.createEval;

  return (
    <>
      <div>
        <h1 className="h1">Pre-PO evaluations</h1>
        <p className="sub">All demos, PoCs, pilots and customizations across opportunities. Each one belongs to an opportunity; create it from that opportunity’s “Pre-PO evaluation” tab.</p>
      </div>
      {readOnly && <ReadOnlyNote />}
      <section className="kpis">
        <Kpi label="Active evaluations" value={active.length} />
        <Kpi label="Awaiting approval" value={all.filter((e) => e.approval === 'Pending').length} />
        <Kpi label="Effort before PO (this FY)" value={all.reduce((a, e) => a + (Number(e.effort) || 0), 0) + ' days'} />
        <Kpi label="Cost before PO (this FY)" value={'₹' + (all.reduce((a, e) => a + (Number(e.cost) || 0), 0) / 1e5).toFixed(1) + ' L'} />
      </section>
      <div className="row wrap gap8">
        <Pills label="Show" value={tab} onChange={setTab} options={['Active', 'Closed'].map((k) => ({ value: k, label: `${k} · ${all.filter((e) => (k === 'Closed') === isClosed(e)).length}` }))} />
        <select className="in sm" aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}><option value="All">Type: All</option><option>Demo</option><option>PoC</option><option>Pilot</option><option>Customization</option></select>
        <select className="in sm" aria-label="Owner" value={mine ? 'me' : 'all'} onChange={(e) => setMine(e.target.value === 'me')}><option value="all">Owner: Anyone</option><option value="me">Me</option></select>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Evaluation</th><th>Opportunity</th><th>Type</th><th>Sales · Tech owner</th><th>Approval</th><th>Start → target</th><th>Status</th><th>Next action</th><th>Effort</th><th>Expected PO</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const o = opp(r.oppId);
              return (
                <tr key={r.id}>
                  <td><Link to={'/opportunities/' + r.oppId} className="w600">{r.name}</Link><div className="mono s12 muted">{r.id}</div></td>
                  <td><div className="w500">{o?.account}</div><div className="s12 muted">{o?.name}</div></td>
                  <td>{r.type}</td>
                  <td className="s13">{r.sales} · {r.tech}</td>
                  <td>
                    {editable && r.approval === 'Pending'
                      ? <button className="btn" style={{ minHeight: 32 }} onClick={() => update(r.id, { approval: 'Approved', next: 'Kick-off with bank' })}>Approve</button>
                      : <Badge>{r.approval}</Badge>}
                  </td>
                  <td className="mono s13">{fmtDate(r.start)} → {fmtDate(r.target)}</td>
                  <td>
                    {editable
                      ? <select className="in sm" aria-label="Status" value={r.status} onChange={(e) => update(r.id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                      : <Badge>{r.status}</Badge>}
                  </td>
                  <td className="s13">{r.next}</td>
                  <td className="mono s13">{r.effort} d</td>
                  <td className="mono s13">{r.expectedPo}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={10} className="muted" style={{ textAlign: 'center', padding: 32 }}>Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
