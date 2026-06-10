import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const PARTICLES = 18;
const COLORS = ['#00e701', '#ffd700', '#7dffb3', '#00c2ff'];

/**
 * Celebratory particle burst shown over the board on cash-out. Particles fly
 * out radially from center and fade. Skipped under reduced-motion.
 */
export function WinBurst() {
  const status = useGameStore((s) => s.status);
  const reduce = useReducedMotion();

  const show = status === 'CASHED_OUT' && !reduce;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="burst"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: PARTICLES }, (_, i) => {
            const angle = (i / PARTICLES) * Math.PI * 2;
            const dist = 120 + (i % 4) * 28;
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
                  rotate: 180,
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
