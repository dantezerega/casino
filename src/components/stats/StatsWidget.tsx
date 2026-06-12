import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  useStatsStore,
  computeScopeStat,
  STATS_GAMES,
  type StatsScope,
} from '@/store/statsStore';
import { StatsChart } from '@/components/stats/StatsChart';
import { formatCurrency } from '@/utils/format';

const SCOPES: { id: StatsScope; label: string }[] = [
  { id: 'all', label: 'All' },
  ...STATS_GAMES.map((g) => ({ id: g, label: g[0].toUpperCase() + g.slice(1) })),
];

const WIDTH = 296;

const initialPos = () => ({
  x: typeof window !== 'undefined' ? Math.max(8, window.innerWidth - WIDTH - 20) : 20,
  y: 84,
});

/** Drag the window by its header; position is clamped to the viewport. */
function useDrag(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const origin = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      origin.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [pos.x, pos.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!origin.current) return;
    const maxX = window.innerWidth - WIDTH - 8;
    const maxY = window.innerHeight - 80;
    setPos({
      x: Math.min(Math.max(8, e.clientX - origin.current.dx), Math.max(8, maxX)),
      y: Math.min(Math.max(8, e.clientY - origin.current.dy), Math.max(8, maxY)),
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    origin.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, []);

  return { pos, handlers: { onPointerDown, onPointerMove, onPointerUp } };
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-display text-sm font-bold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  );
}

function StatsPanel({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const { pos, handlers } = useDrag(initialPos());
  const [scope, setScope] = useState<StatsScope>('all');

  const perGame = useStatsStore((s) => s.perGame);
  const stat = useMemo(() => computeScopeStat(perGame, scope), [perGame, scope]);
  const reset = useStatsStore((s) => s.reset);

  const pnlColor = stat.pnl > 0 ? 'var(--color-accent)' : stat.pnl < 0 ? 'var(--color-danger)' : '#fff';
  const avg = stat.bets > 0 ? stat.pnl / stat.bets : 0;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      style={{ left: pos.x, top: pos.y, width: WIDTH }}
      className="fixed z-30 select-none rounded-xl border border-white/10 bg-panel/90 shadow-2xl backdrop-blur-xl"
      role="dialog"
      aria-label="Session statistics"
    >
      {/* Header / drag handle */}
      <div
        {...handlers}
        className="flex cursor-grab items-center gap-2 rounded-t-xl border-b border-white/5 bg-white/5 px-3 py-2 active:cursor-grabbing touch-none"
      >
        <span className="text-sm">📊</span>
        <span className="flex-1 font-display text-xs font-bold tracking-wide">Session Stats</span>
        <button
          type="button"
          onClick={reset}
          title="Reset stats"
          aria-label="Reset stats"
          className="grid h-6 w-6 place-items-center rounded text-muted transition-colors hover:bg-white/10 hover:text-white"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close stats"
          className="grid h-6 w-6 place-items-center rounded text-muted transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* Scope tabs */}
        <div role="tablist" aria-label="Game" className="flex gap-1 overflow-x-auto">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={scope === s.id}
              onClick={() => setScope(s.id)}
              className={`shrink-0 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                scope === s.id ? 'bg-cyan text-black' : 'bg-white/5 text-muted hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Big PnL */}
        <div>
          <span className="text-[11px] uppercase tracking-widest text-muted">Net PnL</span>
          <div className="font-display text-3xl font-extrabold tabular-nums" style={{ color: pnlColor }}>
            {stat.pnl >= 0 ? '+' : ''}
            {formatCurrency(stat.pnl)}
          </div>
        </div>

        <StatsChart scope={scope} />

        <div className="flex flex-col gap-1.5 rounded-lg bg-black/20 p-2.5">
          <StatRow label="Bets" value={stat.bets.toLocaleString()} />
          <StatRow label="Total wagered" value={formatCurrency(stat.wagered)} />
          <StatRow
            label="Avg / bet"
            value={`${avg >= 0 ? '+' : ''}${formatCurrency(avg)}`}
            accent={avg > 0 ? 'var(--color-accent)' : avg < 0 ? 'var(--color-danger)' : undefined}
          />
        </div>
      </div>
    </motion.div>
  );
}

/** Floating, movable, pop-in/out live session-stats window. */
export function StatsWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open session stats"
          title="Session stats"
          className="fixed bottom-4 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-panel/90 text-lg shadow-xl backdrop-blur-xl transition-transform hover:scale-105"
        >
          📊
        </button>
      )}
      <AnimatePresence>{open && <StatsPanel onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
