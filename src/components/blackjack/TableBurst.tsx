import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useBlackjackStore } from '@/store/blackjackStore';

const PARTICLES = 16;
const COLORS = ['#00e701', '#ffd700', '#7dffb3', '#00c2ff'];

/** Particle burst over the felt on a player win or blackjack. */
export function TableBurst() {
  const status = useBlackjackStore((s) => s.status);
  const outcome = useBlackjackStore((s) => s.outcome);
  const reduce = useReducedMotion();

  const show =
    status === 'RESOLVED' &&
    (outcome === 'win' || outcome === 'blackjack') &&
    !reduce;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="bj-burst"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: PARTICLES }, (_, i) => {
            const angle = (i / PARTICLES) * Math.PI * 2;
            const dist = 130 + (i % 3) * 34;
            return (
              <motion.span
                key={i}
                className="absolute h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  scale: 0,
                  opacity: 0,
                  rotate: 200,
                }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
