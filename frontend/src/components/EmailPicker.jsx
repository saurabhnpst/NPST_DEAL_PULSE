import { useEffect, useState } from 'react';
import { MOCK_CONTACTS } from './ContactPicker.jsx';

// MOCK mailbox for the demo.
// In production this would come from the user's mail account (e.g. Outlook / Gmail integration).
export const MOCK_EMAILS = [
  { id: 'm1', from: 'rohit.k@deccanucb.example', name: 'Rohit Kulkarni', subject: 'UPI TPAP – request for proposal discussion', date: '2026-11-12', snippet: 'We are evaluating vendors for our TPAP launch next quarter. Could your team share a deck and indicative pricing?' },
  { id: 'm2', from: 'l.iyer@cauverysfb.example', name: 'Lakshmi Iyer', subject: 'Fraud monitoring – RBI circular compliance', date: '2026-11-11', snippet: 'Following the RBI circular, we need a rules-based fraud engine live by March. Please set up a call this week.' },
  { id: 'm3', from: 'fathima.r@malabarcb.example', name: 'Fathima Rasheed', subject: 'Mobile banking app revamp – intro', date: '2026-11-10', snippet: 'Our board approved a retail app revamp. We would like to understand your mobile banking platform and timelines.' },
  { id: 'm4', from: 'sameer.shah@snbank.example', name: 'Sameer Shah', subject: 'AePS tender – pre-bid queries', date: '2026-11-08', snippet: 'Attaching the pre-bid query sheet for the AePS tender. Responses are due by 18 Nov.' },
  { id: 'm5', from: 'neha.a@yamunapb.example', name: 'Neha Agarwal', subject: 'BBPS biller onboarding – demo request', date: '2026-11-06', snippet: 'Could we see a demo of the biller onboarding workflow? Our ops team is available on Tuesday or Thursday.' },
  { id: 'm6', from: 'venkat.rao@kdccb.example', name: 'Venkat Rao', subject: 'Re: IMPS migration – budget approved', date: '2026-11-04', snippet: 'Good news — budget for the IMPS migration is approved. Please send the revised commercial proposal.' },
  { id: 'm7', from: 'karthik.s@vaigaigb.example', name: 'Karthik Subramanian', subject: 'CBDC pilot – partnership enquiry', date: '2026-11-02', snippet: 'We are part of the next CBDC pilot cohort and are looking for a technology partner for the retail wallet.' }
];

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/** Small mail icon button. Opens the mock mailbox; onTag(email, contact) tags the email to the lead. */
export default function EmailPicker({ tagged = [], onTag }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [fill, setFill] = useState(false);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); setOpen(false); } };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [open]);

  const taggedIds = tagged.map((t) => t.id);
  const list = MOCK_EMAILS.filter((m) => `${m.name} ${m.from} ${m.subject}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <button type="button" className="cp-btn" aria-label="Tag an email" title="Tag an email from your mailbox" onClick={() => { setQ(''); setOpen(true); }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
        </svg>
        <span>Tag email</span>
      </button>

      {open && (
        <div className="cp-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <section className="cp-sheet" role="dialog" aria-modal="true" aria-label="Mailbox">
            <header className="cp-head">
              <div>
                <div className="w600" style={{ fontSize: 16 }}>Tag an email</div>
                <div className="s12 muted">{MOCK_EMAILS.length} recent emails · tap one to tag it to this lead</div>
              </div>
              <button type="button" className="btn" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
            </header>
            <input className="in" type="search" autoFocus placeholder="Search sender or subject" aria-label="Search emails" value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="row gap8 s13"><input type="checkbox" checked={fill} onChange={(e) => setFill(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#214C98' }} /> Also fill contact details from the sender</label>
            <ul className="cp-list">
              {list.map((m) => {
                const on = taggedIds.includes(m.id);
                return (
                  <li key={m.id}>
                    <button type="button" className="cp-item" disabled={on} style={on ? { opacity: 0.55, cursor: 'default' } : undefined}
                      onClick={() => { onTag(m, fill ? MOCK_CONTACTS.find((c) => c.email === m.from) : null); setOpen(false); }}>
                      <span className="cp-av">{m.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="row between gap8"><span className="s14 w600">{m.name}</span><span className="s12 muted">{on ? 'Tagged' : fmt(m.date)}</span></span>
                        <span className="s13 w500" style={{ display: 'block' }}>{m.subject}</span>
                        <span className="s12 muted" style={{ display: 'block', whiteSpace: 'normal' }}>{m.snippet}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && <li className="muted s13" style={{ padding: 16, textAlign: 'center' }}>No emails match.</li>}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

/** List of emails tagged to a lead. */
export function TaggedEmails({ emails = [], onRemove }) {
  if (!emails.length) return <p className="muted s13" style={{ margin: 0 }}>No emails tagged yet.</p>;
  return (
    <ul className="em-list">
      {emails.map((m) => (
        <li key={m.id} className="em-item">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="row between gap8"><span className="s14 w600">{m.subject}</span><span className="s12 muted">{fmt(m.date)}</span></div>
            <div className="s12 muted">{m.name} · {m.from}</div>
            <div className="s13" style={{ marginTop: 4 }}>{m.snippet}</div>
          </div>
          {onRemove && <button type="button" className="btn" style={{ minHeight: 32, padding: '0 10px' }} aria-label={'Remove ' + m.subject} onClick={() => onRemove(m.id)}>Remove</button>}
        </li>
      ))}
    </ul>
  );
}
