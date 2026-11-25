import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, dealValue, toCr, category, weighted, fmtDate } from '../store/Store.jsx';
import { STAGES, OPEN_STAGES, PRODUCTS, TERRITORIES, stageMeta, isTender } from '../data/defaults.js';
import { Badge, Pills, ReadOnlyNote, Toast } from '../components/ui.jsx';
import NewOpportunity from '../components/NewOpportunity.jsx';

const BAR = ['#8FB3E0', '#6E9AD6', '#4C80C9', '#284FBC', '#1D4D93', '#168A70', '#A3221A', '#6B7480', '#B7791F'];
const initials = (n) => (n && n !== '—' ? n.split(' ').map((x) => x[0]).join('').replace('.', '') : '—');

export default function Pipeline() {
  const { user, can, readOnly } = useAuth();
  const { state } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('Board');
  const [q, setQ] = useState(params.get('q') || '');
  const [terr, setTerr] = useState('All');
  const [prod, setProd] = useState('All');
  const [cat, setCat] = useState('All');
  const [mine, setMine] = useState(false);
  const [rfpOnly, setRfpOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { if (params.get('new') && can.createOpp) { setCreating(true); setParams({}); } }, []); // eslint-disable-line
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);

  const opps = state.opportunities.filter((o) => {
    const s = q.toLowerCase();
    if (s && !`${o.id} ${o.name} ${o.account}`.toLowerCase().includes(s)) return false;
    if (terr !== 'All' && o.territory !== terr) return false;
    if (prod !== 'All' && o.productTsp !== prod) return false;
    if (cat !== 'All' && category(dealValue(o)) !== cat) return false;
    if (mine && o.owner !== user.name && o.presales !== user.name) return false;
    if (rfpOnly && !isTender(o.tender)) return false;
    return true;
  });
  const open = opps.filter((o) => OPEN_STAGES.includes(o.stage));
  const pipe = open.reduce((a, o) => a + dealValue(o), 0);
  const w = open.reduce((a, o) => a + weighted(o), 0);

  return (
    <>
      <div className="row wrap between gap16" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="h1">Opportunities</h1>
          <p className="sub">{open.length} active · ₹{toCr(pipe)} Cr pipeline · ₹{toCr(w)} Cr weighted. Probability and forecast category follow the stage.</p>
        </div>
        <div className="row gap8">
          <Pills label="View" value={view} onChange={setView} options={['Board', 'Table']} />
          {can.createOpp && <button className="btn-p" onClick={() => setCreating(true)}>+ New opportunity</button>}
        </div>
      </div>
      {readOnly && <ReadOnlyNote />}

      <div className="row wrap gap8">
        <input className="in" type="search" placeholder="Search name, bank, ID" aria-label="Search opportunities" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 220px', maxWidth: 320 }} />
        <select className="in sm" aria-label="Territory" value={terr} onChange={(e) => setTerr(e.target.value)}><option value="All">Territory: All</option>{TERRITORIES.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="in sm" aria-label="Product" value={prod} onChange={(e) => setProd(e.target.value)}><option value="All">Product: All</option>{PRODUCTS.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="in sm" aria-label="Deal size" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="All">Deal size: All</option><option value="CAT 1">CAT 1 &lt; ₹1 Cr</option><option value="CAT 2">CAT 2 ₹1–10 Cr</option><option value="CAT 3">CAT 3 ₹10–50 Cr</option><option value="CAT 4">CAT 4 ₹50–100 Cr</option><option value="CAT 5">CAT 5 &gt; ₹100 Cr</option>
        </select>
        <select className="in sm" aria-label="Owner" value={mine ? 'me' : 'all'} onChange={(e) => setMine(e.target.value === 'me')}><option value="all">Owner: Anyone</option><option value="me">Me</option></select>
        <label className="row gap8 s14"><input type="checkbox" checked={rfpOnly} onChange={(e) => setRfpOnly(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#214C98' }} /> Only with RFP</label>
      </div>

      {view === 'Board' ? (
        <div className="board">
          {STAGES.map((s, i) => {
            const cards = opps.filter((o) => o.stage === s.name);
            return (
              <section key={s.name} className="colm" aria-label={s.name}>
                <div className="colm-h" style={{ borderBottomColor: BAR[i] }}>
                  <h2 className="h2 s14">{i + 1} {s.name}</h2>
                  <div className="mono s12 muted">{cards.length} · ₹{toCr(cards.reduce((a, o) => a + dealValue(o), 0))} Cr · {s.prob}%</div>
                </div>
                {cards.map((k) => (
                  <Link key={k.id} to={'/opportunities/' + k.id} className="card col gap8">
                    <div className="row between"><span className="mono s12 muted">{k.id}</span><Badge tone="gray">{category(dealValue(k))}</Badge></div>
                    <div className="w600 s14">{k.name}</div>
                    <div className="muted">{k.account}</div>
                    <div className="row between"><span className="mono w500">₹{toCr(dealValue(k))} Cr</span><span className="s12 muted">Close {fmtDate(k.closeDate)}</span></div>
                    {k.tag && <Badge tone={k.tone}>{k.tag}</Badge>}
                    <div className="row between s12 muted"><span title="Sales owner · Pre-Sales owner">{initials(k.owner)} · {initials(k.presales)}</span><span>{k.territory}</span></div>
                  </Link>
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>ID</th><th>Opportunity</th><th>Account</th><th>Stage</th><th>Prob.</th><th>Forecast</th><th>Deal size</th><th>Category</th><th>Close</th><th>Owner</th><th>Pre-Sales</th></tr></thead>
            <tbody>
              {opps.map((o) => (
                <tr key={o.id} className="click" onClick={() => nav('/opportunities/' + o.id)}>
                  <td className="mono s13">{o.id}</td><td className="w600">{o.name}</td><td>{o.account}</td><td><Badge tone="blue">{o.stage}</Badge></td>
                  <td className="mono">{stageMeta(o.stage).prob}%</td><td>{stageMeta(o.stage).forecast}</td><td className="mono">₹{toCr(dealValue(o))} Cr</td>
                  <td>{category(dealValue(o))}</td><td className="mono s13">{fmtDate(o.closeDate)}</td><td>{o.owner}</td><td>{o.presales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <NewOpportunity onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setToast('Opportunity created at Qualification'); }} />}
      <Toast msg={toast} />
    </>
  );
}
