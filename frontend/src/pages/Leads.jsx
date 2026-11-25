import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, fmtDate } from '../store/Store.jsx';
import { defaultLead, LEAD_SOURCES, PRODUCTS, LEAD_STATUSES } from '../data/defaults.js';
import { Badge, Drawer, Pills, ReadOnlyNote, Toast } from '../components/ui.jsx';
import LeadFields from '../components/LeadFields.jsx';
import { validateLead, errorCount } from '../data/validators.js';
import RfpExtract from '../components/RfpExtract.jsx';

const APPROVAL = {
  none: <span className="muted s13">—</span>,
  pending: <Badge tone="amber">Pending</Badge>,
  approved: <Badge tone="green">Approved</Badge>,
  rework: <Badge tone="amber">More work needed</Badge>,
  rejected: <Badge tone="red">Rejected</Badge>
};

export default function Leads() {
  const { user, can, readOnly } = useAuth();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(can.approveLead ? 'Pending approval' : 'All open');
  const [q, setQ] = useState('');
  const [src, setSrc] = useState('All');
  const [prod, setProd] = useState('All');
  const [mine, setMine] = useState(false);
  const [form, setForm] = useState(null);
  const [ai, setAi] = useState(null); // fields auto-filled from an RFP
  const [rfpRes, setRfpRes] = useState(null);
  const [picked, setPicked] = useState(''); // name of the phone contact used to fill the form
  const [err, setErr] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [toast, setToast] = useState('');
  const errors = useMemo(() => (form ? validateLead(form) : {}), [form]);

  useEffect(() => { if (params.get('new') && can.createLead) { openForm(); setParams({}); } }, []); // eslint-disable-line
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);

  // hide the 'not in RFP' warning once the salesperson has filled the field
  const aiView = ai && form ? Object.fromEntries(Object.entries(ai).filter(([k, t]) => t !== 'missing' || !form[k])) : null;
  const openForm = () => { setErr(''); setShowErrors(false); setAi(null); setRfpRes(null); setPicked(''); setForm(defaultLead(user)); };
  const loadSample = () => { setErr(''); setShowErrors(false); setAi(null); setRfpRes(null); setPicked(''); setForm(defaultLead(user)); };
  const save = (andNew) => {
    const n = errorCount(errors);
    if (n) {
      setShowErrors(true);
      setErr(`Fix the highlighted fields before saving (${n} issue${n > 1 ? 's' : ''}).`);
      setToast(`Please fix ${n} field${n > 1 ? 's' : ''} before saving`);
      return;
    }
    // keep the RFP extraction with the lead so the synopsis can be pre-filled later
    const lead = rfpRes && form.rfp ? { ...form, rfpExtract: { fileName: rfpRes.fileName, synopsis: rfpRes.synopsis } } : form;
    dispatch({ type: 'ADD_LEAD', lead, who: user.name });
    setToast(`Lead saved: ${form.firstName} ${form.lastName} · ${form.company}`);
    setErr(''); setAi(null); setRfpRes(null); setPicked(''); setShowErrors(false);
    if (andNew) setForm(defaultLead(user)); else setForm(null);
  };

  const tabs = ['All open', 'Pending approval', ...LEAD_STATUSES];
  const counts = useMemo(() => {
    const c = { 'All open': 0, 'Pending approval': 0 };
    LEAD_STATUSES.forEach((s) => (c[s] = 0));
    state.leads.forEach((l) => { c[l.status] = (c[l.status] || 0) + 1; if (l.status !== 'Unqualified' && !l.oppId) c['All open']++; if (l.approval === 'pending') c['Pending approval']++; });
    return c;
  }, [state.leads]);

  const rows = state.leads.filter((l) => {
    if (status === 'All open' ? (l.status === 'Unqualified' || !!l.oppId) : status === 'Pending approval' ? l.approval !== 'pending' : l.status !== status) return false;
    if (src !== 'All' && l.leadSource !== src) return false;
    if (prod !== 'All' && l.productTsp !== prod) return false;
    if (mine && l.owner !== user.name) return false;
    const s = q.toLowerCase();
    return !s || `${l.firstName} ${l.lastName} ${l.company} ${l.email}`.toLowerCase().includes(s);
  });

  return (
    <>
      <div className="row wrap between gap16" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="h1">Leads</h1>
          <p className="sub">All leads. Open a lead to change its status, submit it for approval and convert it or write its RFP synopsis.</p>
        </div>
        {can.createLead && <button className="btn-p" onClick={openForm}>+ New lead</button>}
      </div>
      {readOnly && <ReadOnlyNote />}

      <Pills label="Lead status" value={status} onChange={setStatus} options={tabs.map((t) => ({ value: t, label: `${t} · ${counts[t]}` }))} />

      <div className="row wrap gap8">
        <input className="in" type="search" aria-label="Search leads" placeholder="Search name, company, email" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 240px', maxWidth: 360 }} />
        <select className="in sm" aria-label="Lead source" value={src} onChange={(e) => setSrc(e.target.value)}><option value="All">Lead source: All</option>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="in sm" aria-label="Product" value={prod} onChange={(e) => setProd(e.target.value)}><option value="All">Product TSP: All</option>{PRODUCTS.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="in sm" aria-label="Owner" value={mine ? 'me' : 'all'} onChange={(e) => setMine(e.target.value === 'me')}><option value="all">Owner: Anyone in team</option><option value="me">Me</option></select>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>Name</th><th>Company</th><th>Title</th><th>State</th><th>Phone</th><th>Email</th><th>Product</th><th>Rating</th><th>Lead Status</th><th>Approval</th><th>Owner</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="click" onClick={() => nav('/leads/' + r.id)}>
                <td><a href={'#/leads/' + r.id} className="w600" onClick={(e) => e.stopPropagation()}>{r.salutation} {r.firstName} {r.lastName}</a></td>
                <td>{r.company}</td><td>{r.designation}</td><td>{r.state}</td>
                <td className="mono s13">{r.phone}</td><td className="s13">{r.email}</td><td>{r.productTsp}</td>
                <td><Badge tone={r.rating === 'Hot' ? 'red' : r.rating === 'Warm' ? 'amber' : 'gray'}>{r.rating}</Badge></td>
                <td><Badge>{r.status}</Badge></td><td>{APPROVAL[r.approval || 'none']}</td><td>{r.owner}</td><td className="mono s13">{fmtDate(r.created)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={12} className="muted" style={{ textAlign: 'center', padding: 32 }}>No leads match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="s13 muted">Showing {rows.length} of {counts[status]}</div>

      {form && (
        <Drawer full title="New lead" onClose={() => setForm(null)} footer={<>
          <button className="btn-p" onClick={() => save(false)}>Save</button>
          <button className="btn" onClick={() => save(true)}>Save &amp; New</button>
          <button className="btn" onClick={loadSample}>Load another sample</button>
          <button className="btn" onClick={() => setForm(null)}>Cancel</button>
        </>}>
          <p className="defaults">Pre-filled with default values: record type TSP (Product Vertical TSP), source Sales Outbound, rating Warm, owner {user.name}, status New, industry Banking, country India, plus a sample contact. Change anything before saving.</p>
          {err && <p className="err" role="alert">{err}</p>}
          <RfpExtract part="lead" done={aiView} fileName={rfpRes?.fileName} onApply={(values, tags, res) => { setForm({ ...form, ...values, rfp: true }); setAi(tags); setRfpRes(res); setErr(''); }} />
          {picked && <p className="ok s13" role="status">Contact details filled for <b>{picked}</b> — name, designation, company, phone, mobile, email, website and state.</p>}
          <LeadFields v={form} set={setForm} ai={aiView || {}} errors={errors} showErrors={showErrors} onPickContact={(c) => {
            setForm({ ...form, ...c });
            // these fields now come from the contact, not the RFP
            if (ai) setAi(Object.fromEntries(Object.entries(ai).filter(([k]) => !(k in c))));
            setPicked(`${c.firstName} ${c.lastName}`); setErr('');
          }} />
        </Drawer>
      )}
      <Toast msg={toast} />
    </>
  );
}
