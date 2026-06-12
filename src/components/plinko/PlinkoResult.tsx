import { AnimatePresence, motion } from 'framer-motion';
import { usePlinkoStore } from '@/store/plinkoStore';
import { formatCurrency, formatMultiplier } from '@/utils/format';

export function PlinkoResult() {
  const lastResult = usePlinkoStore((s) => s.lastResult);
  const resolvedCount = usePlinkoStore((s) => s.resolvedCount);

  const profit = lastResult?.profit ?? 0;
  const win = profit > 0;
  const even = profit === 0;

  return (
    <AnimatePresence mode="wait">
      {lastResult && (
        <motion.div
          key={resolvedCount}
          initial={{ opacity: 0, scale: 0.9, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
            win
              ? 'bg-accent/15 text-accent'
              : even
                ? 'bg-white/10 text-white'
                : 'bg-danger/15 text-danger'
          }`}
        >
          <span className="tabular-nums">{formatMultiplier(lastResult.multiplier)}</span>
          <span className="tabular-nums">
            {profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
