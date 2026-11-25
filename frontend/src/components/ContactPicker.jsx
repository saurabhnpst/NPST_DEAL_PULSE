import { useState } from 'react';
import { IntegrationNotice } from './AsyncState.jsx';

/** Contact import — requires CRM / directory integration (no local mock contacts). */
export default function ContactPicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  if (!open) {
    return (
      <button type="button" className="btn sm" title="Import contact" aria-label="Import contact" onClick={() => setOpen(true)}>
        <span aria-hidden="true">👤</span>
      </button>
    );
  }

  return (
    <div className="picker">
      <div className="picker-back" onClick={() => setOpen(false)} role="presentation" />
      <div className="picker-panel col gap10" role="dialog" aria-label="Contacts">
        <div className="row between">
          <div>
            <div className="w600 s14">Contacts</div>
            <div className="s12 muted">No contact directory connected</div>
          </div>
          <button type="button" className="btn" onClick={() => setOpen(false)}>Close</button>
        </div>
        <IntegrationNotice feature="Contact lookup" detail="Connect employee / CRM contact APIs to populate leads from phone or directory." />
        <input className="in" type="search" disabled placeholder="Search name, bank or number" aria-label="Search contacts" value={q} onChange={(e) => setQ(e.target.value)} />
        <EmptyHint />
      </div>
    </div>
  );
}

function EmptyHint() {
  return <p className="muted s14" style={{ padding: '16px 0' }}>Contacts will appear here once the integration is configured.</p>;
}