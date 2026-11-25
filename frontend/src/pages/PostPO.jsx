import { useState } from 'react';
import { useAuth } from '../store/Auth.jsx';
import { seedPostPo } from '../data/seed.js';
import { Badge, Kpi, ReadOnlyNote, Tabs } from '../components/ui.jsx';

export default function PostPO() {
  const { readOnly } = useAuth();
  const [tab, setTab] = useState('All activities');
  const { acts, emd, letters, pos } = seedPostPo;
  const late = { color: '#A3221A', fontWeight: 600 };

  return (
    <>
      <div>
        <h1 className="h1">Post-PO workspace</h1>
        <p className="sub">PO receipt is a milestone, not the finish. A deal's lifecycle closes when every mandatory item below is done or marked not applicable.</p>
      </div>
      {readOnly && <ReadOnlyNote />}
      <section className="kpis">
        <Kpi label="Open POs" value="6" sub="₹12.4 Cr" />
        <Kpi label="EMD pending submission" value="2" sub="Next due 06 Nov" />
        <Kpi label="EMD refund pending" value="4" sub="₹21.6 lakh" color="#8A4B00" />
        <Kpi label="EMD expiring ≤ 30 days" value="1" sub="BG valid till 25 Nov" color="#A3221A" />
        <Kpi label="Experience letters awaited" value="3" sub="Oldest 41 days" color="#8A4B00" />
        <Kpi label="Overdue items" value="2" sub="Escalated to manager" color="#A3221A" />
      </section>

      <div className="two" style={{ gridTemplateColumns: 'minmax(0, 2.2fr) minmax(280px, 1fr)' }}>
        <div className="col gap10" style={{ minWidth: 0 }}>
          <Tabs label="Post-PO views" tabs={['All activities', 'EMD register', 'Experience letters']} value={tab} onChange={setTab} />
          {tab === 'All activities' && (
            <div className="tablewrap"><table>
              <thead><tr><th>Activity</th><th>Type</th><th>PO / deal</th><th>Owner</th><th>Due</th><th>Mandatory</th><th>Status</th></tr></thead>
              <tbody>{acts.map((a) => <tr key={a.t}><td className="w500">{a.t}</td><td>{a.type}</td><td>{a.po}</td><td>{a.o}</td><td className="mono s13" style={a.late ? late : undefined}>{a.due}</td><td>{a.m}</td><td><Badge>{a.s}</Badge></td></tr>)}</tbody>
            </table></div>
          )}
          {tab === 'EMD register' && (
            <>
              <div className="tablewrap"><table>
                <thead><tr><th>Bid / deal</th><th>Amount</th><th>Instrument</th><th>Submitted</th><th>Valid until</th><th>Bid outcome</th><th>Status</th><th>Days out</th></tr></thead>
                <tbody>{emd.map((e) => <tr key={e.bid}><td className="w500">{e.bid}</td><td className="mono">₹{e.amt}</td><td>{e.ins}</td><td className="mono s13">{e.sub}</td><td className="mono s13" style={e.late ? late : undefined}>{e.valid}</td><td>{e.out}</td><td><Badge>{e.s}</Badge></td><td className="mono">{e.days}</td></tr>)}</tbody>
              </table></div>
              <p className="s12 muted" style={{ margin: 0 }}>EMD amounts default to 2% of deal size. A lost or no-bid tender's EMD stays here until refunded, forfeited or marked not applicable.</p>
            </>
          )}
          {tab === 'Experience letters' && (
            <div className="tablewrap"><table>
              <thead><tr><th>Client</th><th>Purpose</th><th>Requested</th><th>Expected</th><th>Owner</th><th>Status</th><th>Used in tenders</th></tr></thead>
              <tbody>{letters.map((l) => <tr key={l.c}><td className="w500">{l.c}</td><td>{l.p}</td><td className="mono s13">{l.r}</td><td className="mono s13">{l.e}</td><td>{l.o}</td><td><Badge>{l.s}</Badge></td><td className="mono">{l.u}</td></tr>)}</tbody>
            </table></div>
          )}
        </div>
        <section className="panel col gap16">
          <div><h2 className="h2">Completion by PO</h2><div className="s12 muted">Mandatory items done or N/A</div></div>
          {pos.map(([name, po, d, t]) => (
            <div key={po} className="col gap8">
              <div className="row between gap8"><div><div className="s14 w500">{name}</div><div className="mono s12 muted">{po}</div></div><span className="mono s13">{d} / {t}</span></div>
              <div className="bar" style={{ height: 8 }}><div style={{ height: 8, width: (d / t * 100) + '%', background: d === t ? '#168A70' : '#214C98' }} /></div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
