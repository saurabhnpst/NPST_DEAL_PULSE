import { useState } from 'react';
import { useAuth } from '../store/Auth.jsx';
import { VERTICALS } from '../data/verticals.js';
import BrandLockup, { ArrowMark } from '../components/Brand.jsx';

export default function Login() {
  const { login } = useAuth();
  const [v, setV] = useState('sales');
  const [email, setEmail] = useState(VERTICALS.sales.user.email);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);

  const pick = (k) => { setV(k); setEmail(VERTICALS[k].user.email); setErr(''); };
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const message = await login(v, email, pw);
    setErr(message || '');
  };

  return (
    <div className="login">
      <section className="login-l" aria-hidden="true">
        <ArrowMark size={520} color="rgba(73, 114, 255, .16)" />
        <BrandLockup size="lg" />
        <div style={{ maxWidth: 480, position: 'relative' }}>
          <div className="login-h">From first enquiry<br /><span style={{ color: 'var(--idb-gold)' }}>to every closed deal.</span></div>
          <p style={{ margin: '18px 0 0', fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.78)' }}>One record per deal, shared by Sales, the P&amp;L Head and Solution, with reviews, PO and post-PO work tracked to closure.</p>
        </div>
        <div className="col gap16" style={{ position: 'relative' }}>
          <div className="row wrap gap8">
            {['Lead', 'Opportunity', 'RFP handover', 'Compliance', 'PO', 'Post-PO'].map((x) => <span key={x} className="login-chip">{x}</span>)}
          </div>
          <div className="s12" style={{ color: 'rgba(255,255,255,.55)', letterSpacing: '.12em' }}>INNOVATE · TRANSFORM · GROW</div>
        </div>
      </section>

      <main className="login-r">
        {!forgot ? (
          <form onSubmit={submit} className="col gap16" style={{ width: '100%', maxWidth: 440 }}>
            <div>
              <h1 className="h1">Sign in</h1>
              <p className="sub">Choose your vertical, then use your company account.</p>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="col gap8">
              <legend className="s13 w500" style={{ marginBottom: 8 }}>Vertical *</legend>
              <div className="vgrid" role="radiogroup">
                {Object.values(VERTICALS).map((x) => (
                  <button type="button" key={x.key} role="radio" aria-checked={v === x.key} className={v === x.key ? 'vopt on' : 'vopt'} onClick={() => pick(x.key)}>
                    <span className="w600 s14">{x.label}</span>
                    <span className="s12 muted">{x.blurb}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="fl">Work email<input className="in" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="fl">Password<input className="in" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            {err && <p className="err" role="alert">{err}</p>}
            <div className="row between s14">
              <label className="row gap8"><input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: '#214C98' }} /> Keep me signed in</label>
              <button type="button" className="btn" style={{ border: 0, color: '#214C98' }} onClick={() => setForgot(true)}>Forgot password?</button>
            </div>
            <button type="submit" className="btn-p" style={{ minHeight: 44 }}>Sign in as {VERTICALS[v].label}</button>
            <p className="defaults">Choosing a vertical fills in its account email. Your account's role decides which screens you see.</p>
          </form>
        ) : (
          <div className="col gap16" style={{ width: '100%', maxWidth: 400 }}>
            <div><h1 className="h1">Reset password</h1><p className="sub">We'll email a link that works for 30 minutes.</p></div>
            <label className="fl">Work email<input className="in" type="email" placeholder="name@company.com" /></label>
            <button className="btn-p" onClick={() => setSent(true)}>Send reset link</button>
            {sent && <p className="ok" role="status">If that email has an account, a reset link is on its way.</p>}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setForgot(false); setSent(false); }}>← Back to sign in</button>
          </div>
        )}
      </main>
    </div>
  );
}
