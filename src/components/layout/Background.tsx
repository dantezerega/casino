/**
 * Ambient app background. Pure-CSS aurora orbs + dotted grid (see `.app-bg`
 * in index.css). Fixed and pointer-events-none, so it sits behind everything
 * and never intercepts clicks. Honors `prefers-reduced-motion` via CSS.
 */
export function Background() {
  return (
    <>
      <div className="app-bg" aria-hidden />
      <div className="app-bg-grid" aria-hidden />
    </>
  );
}
