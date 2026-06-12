import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { GameMeta } from '@/config/games';

/**
 * Reusable lobby card. Renders a live game (icon + description + Play link) or a
 * disabled "Coming soon" placeholder. Each card carries its game's accent glow:
 * a soft gradient wash + a colored ring/shadow that intensifies on hover.
 * Adding a game needs no card changes — just a new registry entry.
 */
export function GameCard({ game }: { game: GameMeta }) {
  const reduce = useReducedMotion();
  const live = game.status === 'live';

  return (
    <motion.div
      whileHover={reduce || !live ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      style={{ '--glow': game.glow } as React.CSSProperties}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-panel/70 p-5 backdrop-blur-sm transition-shadow duration-300 ${
        live
          ? 'hover:border-[var(--glow)]/40 hover:shadow-[0_8px_40px_-12px_var(--glow)]'
          : 'opacity-60'
      }`}
    >
      {/* Accent wash bleeding from the top-left corner. */}
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-70"
        style={{ background: game.glow }}
        aria-hidden
      />

      {!live && (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Coming soon
        </span>
      )}

      <div
        className={`relative mb-4 h-14 w-14 rounded-xl bg-bg-deep p-3 ring-1 ring-white/10 transition-shadow duration-300 ${game.accent} group-hover:shadow-[0_0_24px_-4px_var(--glow)]`}
      >
        {game.icon}
      </div>

      <h3 className="font-display text-lg font-bold tracking-tight">{game.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{game.description}</p>

      {live ? (
        <Link
          to={game.path}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-dim px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_20px_-6px] shadow-accent transition-[filter,box-shadow] hover:shadow-[0_0_28px_-4px] hover:shadow-accent hover:brightness-110"
        >
          Play <span aria-hidden>→</span>
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 cursor-not-allowed rounded-lg bg-white/5 px-4 py-2.5 text-sm font-bold text-muted"
        >
          Coming soon
        </button>
      )}
    </motion.div>
  );
}
