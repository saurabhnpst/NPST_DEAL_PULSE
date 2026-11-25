import { useEffect, useRef, useState } from 'react';
import { useStore, stamp } from '../store/Store.jsx';
import { useAuth } from '../store/Auth.jsx';

// SIMULATED Microsoft Teams messages.
// In production this would post through the Microsoft Graph API (chat message / activity feed notification).
// Here every assignment records a message and shows a "sent on Teams" confirmation in the UI.

export function TeamsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <rect x="1" y="4" width="15" height="16" rx="3" fill="#5059C9" />
      <path d="M5 8.5h7M8.5 8.5V16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="7" r="2.6" fill="#7B83EB" />
      <rect x="16.5" y="10.5" width="6.5" height="8" rx="2.5" fill="#7B83EB" />
    </svg>
  );
}

const time = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

/**
 * Returns send(to, text, opts) → the message record.
 * `to` is a person ("Vikram N.") or a team channel ("Security team").
 * opts: { link: '/opportunities/OPP-…', ctx: 'Task · Card switch AMC', kind: 'Task' }
 */
export function useTeams() {
  const { dispatch } = useStore();
  const { user } = useAuth();
  return (to, text, opts = {}) => {
    const msg = { id: 'T' + Date.now() + Math.random().toString(36).slice(2, 6), to, text, by: user?.name || 'DealPulse', at: stamp(), time: time(), fresh: true, ...opts };
    dispatch({ type: 'TEAMS_SEND', msg });
    return msg;
  };
}

/** Small inline confirmation shown next to an assignment. */
export function TeamsBadge({ to, at }) {
  if (!at) return null;
  return (
    <span className="teams-badge" title={`Microsoft Teams message sent to ${to} at ${at}`}>
      <TeamsIcon size={13} /> Sent on Teams{to ? ` to ${to}` : ''} · {at}
    </span>
  );
}

/** Pop-up shown for each new Teams message (mounted once in the layout). */
export function TeamsToasts() {
  const { state } = useStore();
  const list = state.teams || [];
  const seen = useRef(new Set(list.map((m) => m.id))); // don't pop messages that existed before this page load
  const [shown, setShown] = useState([]);

  useEffect(() => {
    const fresh = list.filter((m) => !seen.current.has(m.id));
    if (!fresh.length) return;
    fresh.forEach((m) => seen.current.add(m.id));
    setShown((s) => [...fresh.reverse(), ...s].slice(0, 3));
    fresh.forEach((m) => setTimeout(() => setShown((s) => s.filter((x) => x.id !== m.id)), 6000));
  }, [list]);

  if (!shown.length) return null;
  return (
    <div className="teams-toasts" role="status" aria-live="polite">
      {shown.map((m) => (
        <div key={m.id} className="teams-toast">
          <div className="row between gap8">
            <span className="row gap8 s13 w600"><TeamsIcon size={18} /> Message sent on Microsoft Teams</span>
            <button type="button" className="teams-x" aria-label="Dismiss" onClick={() => setShown((s) => s.filter((x) => x.id !== m.id))}>✕</button>
          </div>
          <div className="s13">To <b>{m.to}</b>{m.ctx ? <span className="muted"> · {m.ctx}</span> : ''}</div>
          <div className="teams-bubble">{m.text}</div>
          <div className="s12 muted">✓ Delivered · {m.time}</div>
        </div>
      ))}
    </div>
  );
}
