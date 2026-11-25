import { useEffect } from 'react';

export const TONES = {
  gray: { fg: '#475569', bg: '#EDF2F9' },
  blue: { fg: '#284FBC', bg: '#E2F4FE' },
  teal: { fg: '#214C98', bg: '#E2F4FE' },
  amber: { fg: '#8A4B00', bg: '#FDF1DC' },
  red: { fg: '#A3221A', bg: '#FDECEA' },
  green: { fg: '#168A70', bg: '#E3F5F0' }
};

const STATUS_TONE = {
  New: 'blue', Working: 'teal', Nurturing: 'amber', Unqualified: 'gray', Converted: 'green', Qualified: 'green',
  Pending: 'amber', Approved: 'green', Rejected: 'red', Proceed: 'green', Reject: 'red',
  'Not Started': 'gray', 'In Progress': 'amber', Submitted: 'teal', 'Under Bank Evaluation': 'blue', 'Changes Requested': 'red', Accepted: 'green',
  Draft: 'amber', Returned: 'red', 'In review': 'blue', Assigned: 'amber', Overdue: 'red', 'Clarification asked': 'amber', 'Changes requested': 'red',
  'In progress': 'blue', 'Awaiting client': 'amber', 'Refund requested': 'amber', Scheduled: 'blue', 'Not applicable': 'gray', Completed: 'green',
  'Pending submission': 'amber', Acknowledged: 'blue', 'Refund pending': 'amber', 'Request pending': 'gray', 'Correction required': 'red',
  'Closed Won': 'green', 'Closed Lost': 'red', 'No Bid': 'gray', 'On Hold': 'amber', Full: 'green', Partial: 'amber'
};

export function Badge({ children, tone }) {
  const t = TONES[tone || STATUS_TONE[children] || 'gray'];
  return <span className="badge" style={{ color: t.fg, background: t.bg }}>{children}</span>;
}

export function Stepper({ steps, current, label, onStep, canStep }) {
  return (
    <ol className={'stepper' + (onStep ? ' nav' : '')} aria-label={label}>
      {steps.map((s, i) => {
        const cls = i < current ? 'done' : i === current ? 'cur' : '';
        const clickable = onStep && (!canStep || canStep(i));
        return clickable
          ? <li key={s} className={cls}><button type="button" className="step-b" title={`Open the ${s} form`} aria-current={i === current ? 'step' : undefined} onClick={() => onStep(i)}>{i < current ? '✓ ' : ''}{s}</button></li>
          : <li key={s} className={cls}>{i < current ? '✓ ' : ''}{s}</li>;
      })}
    </ol>
  );
}

export function Pills({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="row wrap gap8">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return <button key={v} className={v === value ? 'pill on' : 'pill'} aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="tabs">
      {tabs.map((t) => <button key={t} role="tab" aria-selected={t === value} className={t === value ? 'tab on' : 'tab'} onClick={() => onChange(t)}>{t}</button>)}
    </div>
  );
}

export function Field({ label, children, note, span, ai, required, error }) {
  return (
    <label className="fl" style={span ? { gridColumn: '1 / -1' } : undefined}>
      <span>{label}{required && <span className="req" aria-hidden="true"> *</span>}{ai && <AiTag ai={ai} />}</span>
      {children}
      {error ? <span className="note err-txt" role="alert">{error}</span>
        : ai === 'missing' ? <span className="note rfpx-miss">Not in RFP — fill manually</span>
        : note && <span className="note">{note}</span>}
    </label>
  );
}

/** Small tag for fields auto-filled from an RFP: {page} → "AI · p.5", 'missing' → nothing (note shown instead). */
export function AiTag({ ai }) {
  if (!ai || ai === 'missing') return null;
  return <span className="ai-tag" title={`Filled from the RFP, page ${ai.page}`}>AI · p.{ai.page}</span>;
}
export const aiClass = (ai) => (ai === 'missing' ? ' ai-miss' : ai ? ' ai' : '');

export function Input({ label, value, onChange, note, type = 'text', readOnly, span, placeholder, required, ai, error, onBlur }) {
  return (
    <Field label={label} required={required} note={note} span={span} ai={ai} error={error}>
      <input className={(readOnly ? 'in ro' : 'in') + aiClass(ai) + (error ? ' err' : '')} type={type} value={value ?? ''} readOnly={readOnly} placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined} onBlur={onBlur}
        onChange={(e) => onChange && onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />
    </Field>
  );
}

export function Select({ label, value, onChange, options, note, required, disabled, span, ai, error, none }) {
  // keep an unknown stored value visible; `none` adds a "--None--" choice
  const opts = [...(none ? [''] : []), ...(value && !options.includes(value) ? [value] : []), ...options];
  return (
    <Field label={label} required={required} note={note} span={span} ai={ai} error={error}>
      <select className={'in' + aiClass(ai) + (error ? ' err' : '')} value={value ?? ''} disabled={disabled} aria-invalid={error ? 'true' : undefined} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => <option key={o || '_none'} value={o}>{o || '--None--'}</option>)}
      </select>
    </Field>
  );
}

export function TextArea({ label, value, onChange, required, placeholder, rows = 3, error }) {
  return (
    <Field label={label} required={required} span error={error}>
      <textarea className={'in ta' + (error ? ' err' : '')} rows={rows} value={value ?? ''} placeholder={placeholder} aria-invalid={error ? 'true' : undefined} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Kpi({ label, value, sub, onClick, color }) {
  const C = onClick ? 'button' : 'div';
  return (
    <C className="panel kpi" onClick={onClick}>
      <span className="muted s13">{label}</span>
      <span className="mono kpi-v" style={color ? { color } : undefined}>{value}</span>
      {sub && <span className="muted s12">{sub}</span>}
    </C>
  );
}

/** Side drawer. `full` turns it into a centred, near-full-screen sheet (used for the New lead / opportunity forms). */
export function Drawer({ title, onClose, children, footer, wide, full }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className={'overlay' + (full ? ' center' : '')} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className={'drawer' + (wide ? ' wide' : '') + (full ? ' full' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-h">
          <h2>{title}</h2>
          <button className="btn" aria-label="Close" onClick={onClose}>✕</button>
        </header>
        <div className="drawer-b">{children}</div>
        {footer && <footer className="drawer-f">{footer}</footer>}
      </section>
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-h">
          <h2>{title}</h2>
          <button className="btn" aria-label="Close" onClick={onClose}>✕</button>
        </header>
        <div className="modal-b">{children}</div>
        {footer && <footer className="drawer-f">{footer}</footer>}
      </section>
    </div>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}

export function ReadOnlyNote() {
  return <p className="banner">Leadership view is read-only. You can see everything but cannot create or change records.</p>;
}

export function Timeline({ items }) {
  return (
    <ol className="timeline">
      {items.map((e, i) => (
        <li key={i}><span className="dot" /><div><div className="s14 w500">{e.t}</div><div className="muted s12">{e.m}</div></div></li>
      ))}
    </ol>
  );
}

/** Multi-select picklist shown as toggle chips. Value is stored as "A; B". */
export function MultiPick({ label, value, onChange, options, disabled, note, span, required, error }) {
  const list = String(value || '').split(';').map((x) => x.trim()).filter((x) => x && x !== '—');
  const all = [...options, ...list.filter((x) => !options.includes(x))];
  return (
    <div className="fl" style={span ? { gridColumn: '1 / -1' } : undefined}>
      <span>{label}{required && <span className="req" aria-hidden="true"> *</span>}</span>
      {all.length ? (
        <div className="row wrap gap6" role="group" aria-label={label}>
          {all.map((o) => {
            const on = list.includes(o);
            return <button type="button" key={o} disabled={disabled} className={on ? 'chip on' : 'chip'} aria-pressed={on}
              onClick={() => onChange((on ? list.filter((x) => x !== o) : [...list, o]).join('; '))}>{o}</button>;
          })}
        </div>
      ) : <input className="in ro" readOnly value="No modules for this product" />}
      {error ? <span className="note err-txt" role="alert">{error}</span> : note && <span className="note">{note}</span>}
    </div>
  );
}
