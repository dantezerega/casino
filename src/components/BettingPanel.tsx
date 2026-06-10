import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, selectPotentialProfit } from '@/store/gameStore';
import { formatCurrency, formatMultiplier } from '@/utils/format';
import { BetAmountInput } from '@/components/BetAmountInput';
import { MineSelector } from '@/components/MineSelector';

/** Small labelled readout; value pops when it changes (keyed remount). */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-bg px-3 py-2 ring-1 ring-white/10">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 overflow-hidden text-sm font-bold tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Left control column: bet amount, mines, live multiplier/payout, and the
 * single morphing action button (Bet ↔ Cashout). All numbers come from store
 * selectors — the panel computes nothing itself.
 */
export function BettingPanel() {
  const status = useGameStore((s) => s.status);
  const betAmount = useGameStore((s) => s.betAmount);
  const balance = useGameStore((s) => s.balance);
  const multiplier = useGameStore((s) => s.multiplier);
  const gemsRevealed = useGameStore((s) => s.gemsRevealed);
  const profit = useGameStore((s) => s.profit);

  const startGame = useGameStore((s) => s.startGame);
  const cashOut = useGameStore((s) => s.cashOut);
  const resetGame = useGameStore((s) => s.resetGame);

  const potentialProfit = useGameStore(selectPotentialProfit);

  const playing = status === 'PLAYING';
  const ended = status === 'LOST' || status === 'CASHED_OUT';
  const canBet = betAmount > 0 && betAmount <= balance;
  const canCashout = playing && gemsRevealed > 0;

  const onAction = () => {
    if (playing) {
      cashOut();
      return;
    }
    if (ended) resetGame(); // advance nonce, clear board
    startGame();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-panel p-4">
      <BetAmountInput />
      <MineSelector />

      {playing && (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Multiplier" value={formatMultiplier(multiplier)} />
          <Stat label="Profit" value={formatCurrency(potentialProfit)} />
        </div>
      )}

      <AnimatePresence>
        {ended && (
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${
              status === 'CASHED_OUT'
                ? 'bg-accent/15 text-accent'
                : 'bg-danger/15 text-danger'
            }`}
          >
            {status === 'CASHED_OUT'
              ? `Cashed out +${formatCurrency(profit)} at ${formatMultiplier(multiplier)}`
              : 'Mine hit — round lost'}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onAction}
        disabled={playing ? !canCashout : !canBet}
        whileTap={{ scale: 0.98 }}
        className={`mt-1 rounded-md px-4 py-3 text-sm font-bold transition-[filter,opacity] disabled:cursor-not-allowed disabled:opacity-50 ${
          playing
            ? 'bg-gold text-black hover:brightness-110'
            : 'bg-accent text-black hover:brightness-110'
        }`}
      >
        {playing
          ? canCashout
            ? `Cashout ${formatCurrency(betAmount * multiplier)}`
            : 'Cashout'
          : ended
            ? 'Bet Again'
            : 'Bet'}
      </motion.button>
    </div>
  );
}
