import { useState } from 'react';
import { Link } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore } from '../store/Store.jsx';
import { useBusinessData } from '../store/BusinessData.jsx';
import { decide } from '../services/workflowService.js';
import { Badge, ReadOnlyNote } from '../components/ui.jsx';

export default function Decisions() {
  const { user, can, readOnly } = useAuth();
  const { state } = useStore();
  const { reloadWorkflow } = useBusinessData();
  const [err, setErr] = useState('');
  // first valid decision wins (backend returns 409 if someone already decided)
  const record = async (v) => {
    setErr('');
    try { await decide(sel.id, v, note); setNote(''); await reloadWorkflow(); } catch (e) { setErr(e?.message || 'Decision failed'); }
  };
  const items = state.decisions;
  const [selId, setSelId] = useState(items[0]?.id);
  const [note, setNote] = useState('');
  const sel = items.find((d) => d.id === selId) || items[0];
  const opp = (id) => state.opportunities.find((o) => o.id === id) || {};
  const o = sel ? opp(sel.oppId) : {};

  return (
    <>
      <div>
        <h1 className="h1">P&amp;L decisions</h1>
        <p className="sub">Sales recommends Yes or No; the P&amp;L Head records Proceed or Reject. Every decision keeps its owner and time.</p>
      </div>
      {readOnly && <ReadOnlyNote />}
      <div className="split">
        <section aria-label="Queue" className="col gap8">
          <div className="s12 w600 muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Awaiting · {items.filter((d) => !d.done).length} · Decided · {items.filter((d) => d.done).length}</div>
          {items.map((d) => {
            const x = opp(d.oppId);
            return (
              <button key={d.id} className={d.id === sel?.id ? 'qitem on' : 'qitem'} onClick={() => { setSelId(d.id); setNote(''); }}>
                <div className="w600 s14">{x.name}</div>
                <div className="s12 muted">{x.account} · {d.val} · Sales: {d.rec}</div>
                <div style={{ marginTop: 6 }}><Badge tone={d.done ? (d.done.v === 'Proceed' ? 'green' : 'red') : 'amber'}>{d.done ? d.done.v : 'Awaiting P&L Head'}</Badge></div>
              </button>
            );
          })}
        </section>
        {sel && (
          <section className="col gap16">
            <div className="panel col gap10">
              <div className="row between wrap gap8">
                <div><div className="mono s12 muted">{sel.oppId}</div><h2 className="h2" style={{ fontSize: 20 }}>{o.name} · {o.account}</h2></div>
                <Link className="btn" to={'/opportunities/' + sel.oppId}>Open opportunity</Link>
              </div>
              <div className="kv">
                <div><div className="k">Stage</div><div className="v">{o.stage}</div></div>
                <div><div className="k">Owner</div><div className="v">{o.owner}</div></div>
                <div><div className="k">Current position</div><div className="v">{sel.val}</div></div>
                <div><div className="k">Initial position</div><div className="v">{sel.init}</div></div>
                <div><div className="k">Proposal</div><div className="v">{sel.prop}</div></div>
              </div>
            </div>
            <div className="panel col gap10">
              <h2 className="h2">Sales recommendation: {sel.rec}</h2>
              <div className="s12 muted">{sel.recBy}</div>
              <div><div className="s12 muted">Synopsis</div><div className="s14">{sel.syn}</div></div>
              <div><div className="s12 muted">Improvement points and concerns</div><div className="s14">{sel.concern || '—'}</div></div>
            </div>
            <div className="panel col gap10">
              <h2 className="h2">Decision</h2>
              {!sel.done && can.decide && (
                <>
                  <label className="fl">Comments (reason required for Reject)<textarea className="in ta" rows={2} value={note} placeholder="What should the deal team know?" onChange={(e) => setNote(e.target.value)} /></label>
                  <div className="row gap8">
                    <button className="btn-p" onClick={() => record('Proceed')}>Proceed</button>
                    <button className="btn-d" disabled={!note} onClick={() => record('Reject')}>Reject</button>
                    {err && <p className="err s13" role="alert">{err}</p>}
                  </div>
                </>
              )}
              {!sel.done && !can.decide && <p className="warn">Pending with P&amp;L Head.</p>}
              {sel.done && (
                <div className="kv">
                  <div><div className="k">Decision</div><div className="v"><Badge>{sel.done.v}</Badge></div></div>
                  <div><div className="k">Decided by</div><div className="v">{sel.done.by}</div></div>
                  <div><div className="k">When</div><div className="v">{sel.done.at}</div></div>
                  <div><div className="k">Comment</div><div className="v">{sel.done.note}</div></div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
