import { AnimatePresence, motion } from 'framer-motion';
import { useCrashStore } from '@/store/crashStore';
import { formatCurrency, formatMultiplier } from '@/utils/format';

/** Outcome banner shown once a round settles (cash-out or crash). */
export function CrashResult() {
  const result = useCrashStore((s) => s.result);
  const terminal = useCrashStore((s) => s.status === 'CASHED_OUT' || s.status === 'CRASHED');

  const show = terminal && result != null;
  const win = result?.won ?? false;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={result!.crashPoint + (win ? 'w' : 'l')}
          initial={{ opacity: 0, scale: 0.9, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
            win ? 'bg-accent/15 text-accent' : 'bg-danger/15 text-danger'
          }`}
        >
          <span className="tabular-nums">
            {win ? `Cashed @ ${formatMultiplier(result!.multiplier)}` : `Crashed @ ${formatMultiplier(result!.crashPoint)}`}
          </span>
          <span className="tabular-nums">
            {result!.profit >= 0
              ? `+${formatCurrency(result!.profit)}`
              : formatCurrency(result!.profit)}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
