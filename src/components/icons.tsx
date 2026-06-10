/** Inline SVG icons for tiles and UI. */

export function GemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="gemG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dffb3" />
          <stop offset="1" stopColor="#00c2ff" />
        </linearGradient>
      </defs>
      <path
        d="M16 6h16l8 12-16 24L8 18z"
        fill="url(#gemG)"
        stroke="#0a3a2a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 18h32M24 6 16 18l8 24 8-24z" fill="none" stroke="#0a3a2a" strokeWidth="1.5" opacity=".4" />
    </svg>
  );
}

export function MineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="26" r="13" fill="#1b1020" />
      <circle cx="24" cy="26" r="13" fill="none" stroke="#ed4163" strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect
          key={a}
          x="23"
          y="6"
          width="2"
          height="8"
          rx="1"
          fill="#ed4163"
          transform={`rotate(${a} 24 26)`}
        />
      ))}
      <circle cx="19" cy="21" r="3" fill="#ff8aa3" />
    </svg>
  );
}

export function DiceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
      <circle cx="16" cy="8" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="8" cy="16" r="1.6" fill="currentColor" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}
