import { NavLink, useLocation, useNavigate } from '../router.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore } from '../store/Store.jsx';
import { NAV_ITEMS, VERTICALS } from '../data/verticals.js';
import { TeamsToasts } from './Teams.jsx';
import BrandLockup from './Brand.jsx';

export default function Layout({ children }) {
  const { vertical, user, logout, switchTo } = useAuth();
  const { dispatch } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const items = NAV_ITEMS.filter((n) => vertical.nav.includes(n.path));
  const allowed = loc.pathname === '/' || vertical.nav.some((p) => p !== '/' && loc.pathname.startsWith(p));

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><BrandLockup /></div>
        <div className="vtag">{vertical.label}</div>
        <nav aria-label="Workflow" className="navgroup">
          <div className="navlabel">Workflow</div>
          {items.map((n) => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'} className={({ isActive }) => (isActive ? 'nav-a on' : 'nav-a')}>{n.label}</NavLink>
          ))}
        </nav>
        <nav aria-label="Account" className="navgroup">
          <div className="navlabel">Account</div>
          <button className="nav-a" onClick={() => { if (confirm('Reset all demo data to the original sample?')) dispatch({ type: 'RESET' }); }}>Reset demo data</button>
          <button className="nav-a" onClick={() => { logout(); nav('/'); }}>Sign out</button>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <label className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span className="sr">Search</span>
            <input type="search" placeholder="Search leads, opportunities, banks"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value) nav('/opportunities?q=' + encodeURIComponent(e.currentTarget.value)); }} />
          </label>
          <div className="grow" />
          <label className="row gap8 s12 muted">Demo · view as
            <select className="in sm" value={vertical.key} onChange={(e) => { switchTo(e.target.value); nav('/'); }}>
              {Object.values(VERTICALS).map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
          </label>
          <div className="row gap10">
            <div className="avatar">{user.initials}</div>
            <div className="lh12"><div className="s14 w600">{user.name}</div><div className="s12 muted">{user.title}</div></div>
          </div>
        </header>
        <div className="content">
          {allowed ? children : (
            <div className="panel empty">
              <h1 className="h1">No access</h1>
              <p className="muted">The {vertical.label} vertical can’t open this screen.</p>
              <button className="btn-p" onClick={() => nav('/')}>Go to dashboard</button>
            </div>
          )}
        </div>
      </main>
      <TeamsToasts />
    </div>
  );
}
