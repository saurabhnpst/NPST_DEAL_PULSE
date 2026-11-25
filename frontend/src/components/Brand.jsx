/**
 * DealPulse brand lock-up: the NPST arrow mark (turquoise) + "DealPulse" wordmark.
 * The arrow follows the NPST Brand Book "Brand Element · NPST Mark": used once, as an accent, never rotated or distorted.
 */
export function ArrowMark({ size = 30, color = 'var(--idb-turquoise)', title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title} style={{ flex: 'none' }}>
      {/* corner */}
      <path d="M19 3h18v18l-5 5V8H14z" fill={color} />
      {/* swoosh */}
      <path d="M3 37c12.5 0 22.4-7.4 27.6-21.6l-4.7-2.1C21.6 25.2 14.2 31.4 3 32.6z" fill={color} />
    </svg>
  );
}

export default function BrandLockup({ size = 'md', onDark = true, tagline = true }) {
  const big = size === 'lg';
  return (
    <div className="brand-lockup" style={{ color: onDark ? '#fff' : 'var(--idb-indigo)' }}>
      <ArrowMark size={big ? 38 : 30} />
      <div className="col" style={{ lineHeight: 1.05 }}>
        <span className="brand-word" style={{ fontSize: big ? 24 : 19 }}>Deal<span style={{ color: onDark ? 'var(--idb-turquoise)' : 'var(--idb-bright)' }}>Pulse</span></span>
        {tagline && <span className="brand-by" style={{ color: onDark ? 'rgba(255,255,255,.62)' : 'var(--idb-muted)' }}>by NPST</span>}
      </div>
    </div>
  );
}
