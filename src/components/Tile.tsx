import { motion, useReducedMotion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useSound } from '@/hooks/useSound';
import { GemIcon, MineIcon } from '@/components/icons';
import { GRID_SIZE } from '@/types';
import type { Tile as TileModel } from '@/types';

/**
 * Single board tile with Framer Motion.
 *
 *  - hidden  → raised button, hover-lift / tap-press.
 *  - gem      → spring pop in; the player's own picks glow brighter than
 *               tiles auto-revealed when the round ends.
 *  - mine hit → explosion (shake + expanding flash ring).
 *  - end reveal → non-picked tiles cascade open via an index-based delay.
 *
 * Respects `prefers-reduced-motion`: heavy effects collapse to a simple fade.
 */
export function Tile({ tile }: { tile: TileModel }) {
  const status = useGameStore((s) => s.status);
  const revealTile = useGameStore((s) => s.revealTile);
  const { play } = useSound();
  const reduce = useReducedMotion();

  const playable = status === 'PLAYING' && !tile.revealed;
  const ended = status === 'LOST' || status === 'CASHED_OUT';

  const base =
    'relative grid aspect-square w-full place-items-center rounded-lg select-none';

  if (!tile.revealed) {
    return (
      <motion.button
        type="button"
        disabled={!playable}
        onClick={() => revealTile(tile.index)}
        aria-label={`Tile ${tile.index + 1}`}
        whileHover={playable && !reduce ? { y: -3 } : undefined}
        whileTap={playable && !reduce ? { scale: 0.94 } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className={`${base} border-b-4 border-black/30 bg-tile ${
          playable ? 'cursor-pointer hover:bg-tile-hover' : 'cursor-default opacity-90'
        }`}
      />
    );
  }

  // Cascade: auto-revealed (non-picked) tiles open in a positional ripple.
  const cascadeDelay = ended && !tile.picked ? (tile.index % GRID_SIZE + Math.floor(tile.index / GRID_SIZE)) * 0.035 : 0;
  const dim = ended && !tile.picked ? 'opacity-50' : '';

  if (tile.kind === 'mine') {
    const exploded = tile.picked; // the tile that ended the round

    return (
      <div className={`${base} bg-danger/15 ring-1 ring-danger/40 ${dim}`}>
        {/* Expanding flash ring on the detonating tile */}
        {exploded && !reduce && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-danger"
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
        <motion.div
          className="h-2/3 w-2/3"
          // Explosion sound fires exactly as the detonating tile's animation
          // starts. Guarded to the player's hit tile so end-reveal stays silent.
          onAnimationStart={() => {
            if (exploded) play('explosion');
          }}
          initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -45 }}
          animate={
            exploded && !reduce
              ? { scale: [0, 1.35, 1], rotate: [0, -8, 8, -4, 0] }
              : reduce
                ? { opacity: 1 }
                : { scale: 1, rotate: 0 }
          }
          transition={
            exploded
              ? { duration: 0.45, ease: 'easeOut' }
              : { type: 'spring', stiffness: 400, damping: 20, delay: cascadeDelay }
          }
        >
          <MineIcon className="h-full w-full" />
        </motion.div>
      </div>
    );
  }

  // Gem
  const owned = tile.picked;
  return (
    <div className={`${base} bg-panel-light ring-1 ring-accent/20 ${dim}`}>
      <motion.div
        className={
          owned
            ? 'h-2/3 w-2/3 drop-shadow-[0_0_10px_rgba(0,231,1,0.45)]'
            : 'h-2/3 w-2/3'
        }
        // Gem reveal sound synced to the pop animation. Only the player's own
        // picks (owned) sound — the auto-reveal cascade on game end stays quiet.
        onAnimationStart={() => {
          if (owned && useGameStore.getState().status === 'PLAYING') {
            play('gem-reveal');
          }
        }}
        initial={reduce ? { opacity: 0 } : { scale: 0, y: 6 }}
        animate={
          reduce
            ? { opacity: 1 }
            : owned
              ? { scale: [0, 1.2, 1], y: 0 }
              : { scale: 1, y: 0 }
        }
        transition={{
          type: owned ? 'tween' : 'spring',
          duration: owned ? 0.4 : undefined,
          stiffness: 380,
          damping: 18,
          delay: cascadeDelay,
        }}
      >
        <GemIcon className="h-full w-full" />
      </motion.div>
    </div>
  );
}
