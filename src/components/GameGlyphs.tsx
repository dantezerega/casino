/** Inline SVG glyphs for each game tile. Inherit color via `currentColor`. */

const wrap = 'h-full w-full';

export function MinesGlyph() {
  return (
    <svg viewBox="0 0 48 48" className={wrap} aria-hidden>
      <circle cx="24" cy="26" r="12" fill="currentColor" opacity=".18" />
      <circle cx="24" cy="26" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="23" y="8" width="2" height="7" rx="1" fill="currentColor" transform={`rotate(${a} 24 26)`} />
      ))}
      <circle cx="19" cy="21" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function BlackjackGlyph() {
  return (
    <svg viewBox="0 0 48 48" className={wrap} aria-hidden>
      <rect x="9" y="12" width="20" height="27" rx="3" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="2" transform="rotate(-10 19 25)" />
      <rect x="19" y="10" width="20" height="27" rx="3" fill="currentColor" opacity=".28" stroke="currentColor" strokeWidth="2" transform="rotate(8 29 23)" />
      <path d="M29 16c-3 2.5-5 5-5 7.5a5 5 0 0 0 10 0C34 21 32 18.5 29 16Z" fill="currentColor" transform="rotate(8 29 23)" />
    </svg>
  );
}

export function CrashGlyph() {
  return (
    <svg viewBox="0 0 48 48" className={wrap} aria-hidden>
      <path d="M10 38 L26 18 L33 25 L40 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 12 l-7 1 m7-1 l-1 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PlinkoGlyph() {
  return (
    <svg viewBox="0 0 48 48" className={wrap} aria-hidden>
      {[[16, 16], [24, 16], [32, 16], [20, 24], [28, 24], [24, 32]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" />
      ))}
      <circle cx="24" cy="9" r="3.2" fill="currentColor" opacity=".55" />
    </svg>
  );
}

export function DiceGlyph() {
  return (
    <svg viewBox="0 0 48 48" className={wrap} aria-hidden>
      <rect x="11" y="11" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="19" cy="19" r="2.4" fill="currentColor" />
      <circle cx="29" cy="19" r="2.4" fill="currentColor" />
      <circle cx="24" cy="24" r="2.4" fill="currentColor" />
      <circle cx="19" cy="29" r="2.4" fill="currentColor" />
      <circle cx="29" cy="29" r="2.4" fill="currentColor" />
    </svg>
  );
}
