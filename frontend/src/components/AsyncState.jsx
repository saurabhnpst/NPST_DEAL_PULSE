export function LoadingPanel({ label = 'Loading…' }) {
  return (
    <div className="panel empty" role="status" aria-live="polite">
      <p className="muted">{label}</p>
    </div>
  );
}

export function ErrorPanel({ title = 'Could not load data', message, onRetry }) {
  return (
    <div className="panel empty" role="alert">
      <h2 className="h2">{title}</h2>
      <p className="muted s14">{message || 'The request failed. Try again or check that the API gateway is running.'}</p>
      {onRetry && (
        <button type="button" className="btn-p" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyPanel({ title = 'No records', message }) {
  return (
    <div className="panel empty">
      <h2 className="h2">{title}</h2>
      {message && <p className="muted s14">{message}</p>}
    </div>
  );
}

export function IntegrationNotice({ feature, detail }) {
  return (
    <p className="banner s14" role="status">
      <b>{feature}</b> requires a backend API that is not wired in this build yet.{detail ? ` ${detail}` : ''}
    </p>
  );
}