import { AnimatePresence, motion } from 'framer-motion';
import { usePlinkoStore } from '@/store/plinkoStore';
import { formatCurrency, formatMultiplier } from '@/utils/format';

export function PlinkoResult() {
  const status = usePlinkoStore((s) => s.status);
  const result = usePlinkoStore((s) => s.result);
  const profit = usePlinkoStore((s) => s.profit);
  const nonce = usePlinkoStore((s) => s.nonce);

  const show = status === 'RESOLVED' && result !== null;
  const win = profit > 0;
  const even = profit === 0;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={nonce}
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
          <span className="tabular-nums">{formatMultiplier(result!.multiplier)}</span>
          <span className="tabular-nums">
            {profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
