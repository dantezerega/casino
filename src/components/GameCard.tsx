import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { GameMeta } from '@/config/games';

/**
 * Reusable lobby card. Renders a live game (icon + description + Play link) or a
 * disabled "Coming soon" placeholder. Adding a game needs no card changes —
 * just a new entry in the game registry.
 */
export function GameCard({ game }: { game: GameMeta }) {
  const reduce = useReducedMotion();
  const live = game.status === 'live';

  return (
    <motion.div
      whileHover={reduce || !live ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={`group relative flex flex-col rounded-2xl bg-panel p-5 ring-1 ring-white/5 ${
        live ? '' : 'opacity-70'
      }`}
    >
      {!live && (
        <span className="absolute right-4 top-4 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Coming soon
        </span>
      )}

      <div className={`mb-4 h-14 w-14 rounded-xl bg-bg p-3 ring-1 ring-white/10 ${game.accent}`}>
        {game.icon}
      </div>

      <h3 className="text-lg font-bold tracking-tight">{game.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{game.description}</p>

      {live ? (
        <Link
          to={game.path}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-bold text-black transition-[filter] hover:brightness-110"
        >
          Play
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 cursor-not-allowed rounded-md bg-white/5 px-4 py-2.5 text-sm font-bold text-muted"
        >
          Coming soon
        </button>
      )}
    </motion.div>
  );
}
