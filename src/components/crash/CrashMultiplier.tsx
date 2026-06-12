import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { useCrashStore } from '@/store/crashStore';
import { formatMultiplier } from '@/utils/format';

/** Big centred multiplier read-out, coloured by round status. */
export function CrashMultiplier() {
  const reduce = useReducedMotion();
  const status = useCrashStore((s) => s.status);
  const currentMultiplier = useCrashStore((s) => s.currentMultiplier);
  const crashPoint = useCrashStore((s) => s.result?.crashPoint ?? null);

  const crashed = status === 'CRASHED';
  const cashed = status === 'CASHED_OUT';
  // Show the crash point once busted; otherwise the live multiplier.
  const value = crashed && crashPoint != null ? crashPoint : currentMultiplier;

  const color = crashed
    ? 'var(--color-danger)'
    : cashed
      ? 'var(--color-accent)'
      : 'var(--color-cyan)';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <motion.span
        key={status}
        initial={reduce ? false : { scale: crashed ? 1.15 : 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className="font-display text-6xl font-extrabold tabular-nums sm:text-7xl"
        style={{ color, textShadow: `0 0 32px ${color}` }}
      >
        {formatMultiplier(value)}
      </motion.span>
      {crashed && (
        <span className="mt-1 text-sm font-bold uppercase tracking-widest text-danger">
          Crashed
        </span>
      )}
      {cashed && (
        <span className="mt-1 text-sm font-bold uppercase tracking-widest text-accent">
          Cashed Out
        </span>
      )}
    </div>
  );
}
