import { useState } from 'react';
import { IntegrationNotice } from './AsyncState.jsx';

/** Tag email to lead — requires Microsoft 365 / mailbox integration (no mock mailbox). */
export default function EmailPicker({ onTag }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  if (!open) {
    return (
      <button type="button" className="btn sm" title="Tag email" aria-label="Tag email" onClick={() => setOpen(true)}>
        <span aria-hidden="true">✉</span>
      </button>
    );
  }

  return (
    <div className="picker">
      <div className="picker-back" onClick={() => setOpen(false)} role="presentation" />
      <div className="picker-panel col gap10" role="dialog" aria-label="Mailbox">
        <div className="row between">
          <div>
            <div className="w600 s14">Tag email</div>
            <div className="s12 muted">Mailbox integration not connected</div>
          </div>
          <button type="button" className="btn" onClick={() => setOpen(false)}>Close</button>
        </div>
        <IntegrationNotice feature="Email tagging" detail="Requires Microsoft Graph mailbox read APIs for Scope 2." />
        <input className="in" type="search" disabled placeholder="Search sender or subject" aria-label="Search emails" value={q} onChange={(e) => setQ(e.target.value)} />
        <p className="muted s14" style={{ padding: '16px 0' }}>No messages loaded. Tagging will use live mailbox data once integrated.</p>
      </div>
    </div>
  );
}

export function TaggedEmails({ emails, onRemove }) {
  if (!emails?.length) return null;
  return (
    <ul className="col gap6 s13" aria-label="Tagged emails">
      {emails.map((m) => (
        <li key={m.id} className="row between gap8">
          <span>{m.subject} · {m.from}</span>
          {onRemove && (
            <button type="button" className="btn sm" onClick={() => onRemove(m.id)}>Remove</button>
          )}
        </li>
      ))}
    </ul>
  );
}