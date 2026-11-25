import { useRef, useState } from 'react';
import { IntegrationNotice } from './AsyncState.jsx';
import { rfpService } from '../services/rfpService.js';
import { HttpError } from '../api/apiClient.js';

const STEPS = ['Upload received', 'Parsing document', 'Mapping fields', 'Applying tags'];

function countTags(tags) {
  if (!tags) return { filled: 0, missing: 0 };
  const entries = Object.values(tags);
  return {
    filled: entries.filter((t) => t === 'filled').length,
    missing: entries.filter((t) => t === 'missing').length,
  };
}

/**
 * Upload an RFP and request server-side extraction when available.
 * `part` is 'lead' or 'synopsis'. onApply(values, tags, fullResult) receives extracted fields.
 */
export default function RfpExtract({ part, onApply, done, fileName: initialFile }) {
  const ref = useRef(null);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(-1);
  const [err, setErr] = useState('');
  const busy = step >= 0;
  const name = file?.name || initialFile;

  const run = async () => {
    if (!file) return;
    setErr('');
    setStep(0);
    try {
      setStep(1);
      await rfpService.list();
      setStep(-1);
      setErr('RFP extraction is not available for this document yet. Enter details manually or use a backend extraction endpoint when published.');
    } catch (e) {
      setStep(-1);
      const msg =
        e instanceof HttpError
          ? `RFP service unavailable (${e.status}). Upload the file for records, then fill fields manually.`
          : e?.message || 'RFP extraction failed.';
      setErr(msg);
    }
  };

  const c = countTags(done);
  return (
    <section className="rfpx">
      <IntegrationNotice
        feature="RFP auto-extraction"
        detail="Requires RFP service document upload and extraction APIs wired to this screen."
      />
      <div className="row wrap between gap8">
        <div>
          <div className="w600 s14">Auto-fill from RFP</div>
          <div className="s12 muted">Upload the RFP for reference. Extraction runs against the API when the backend endpoint is available.</div>
        </div>
        <div className="row gap8 wrap">
          <input ref={ref} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
          <button type="button" className="btn" disabled={busy} onClick={() => ref.current?.click()}>{name ? 'Change file' : 'Upload RFP'}</button>
          <button type="button" className="btn-p" disabled={!file || busy} onClick={run}>{busy ? 'Extracting…' : 'Extract from RFP'}</button>
        </div>
      </div>
      {name && <div className="s13">📄 <b>{name}</b></div>}
      {err && <p className="err s13" role="alert">{err}</p>}
      {busy && (
        <ol className="rfpx-steps" aria-live="polite">
          {STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'cur' : ''}>{i < step ? '✓' : i === step ? '◌' : '·'} {s}</li>)}
        </ol>
      )}
      {!busy && done && (
        <p className="rfpx-res" role="status">
          <b>{c.filled} fields filled from RFP</b>
          {c.missing ? <> · <span className="rfpx-miss">{c.missing} need your input</span></> : ''}
        </p>
      )}
    </section>
  );
}

export { countTags };