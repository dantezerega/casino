import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useBlackjackStore } from '@/store/blackjackStore';
import { formatCurrency } from '@/utils/format';

/**
 * Poker chip showing the active wager. Springs onto the felt from the player's
 * side when a round starts, and pulses on a win. Hidden when idle.
 */
export function BetChip() {
  const status = useBlackjackStore((s) => s.status);
  const bet = useBlackjackStore((s) => s.bet);
  const outcome = useBlackjackStore((s) => s.outcome);
  const reduce = useReducedMotion();

  const visible = status !== 'IDLE' && bet > 0;
  const won =
    status === 'RESOLVED' && (outcome === 'win' || outcome === 'blackjack');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="chip"
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 90, scale: 0.6 }}
          animate={
            reduce
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: won ? [1, 1.25, 1] : 1 }
          }
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-white/40 bg-gold text-[11px] font-bold text-black shadow-lg ring-4 ring-black/20">
            {formatCurrency(bet)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
