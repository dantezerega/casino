import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useBlackjackStore, selectCanDouble } from '@/store/blackjackStore';
import { formatCurrency } from '@/utils/format';
import type { Outcome } from '@/game/blackjack/types';

const OUTCOME_LABEL: Record<Outcome, string> = {
  blackjack: 'Blackjack!',
  win: 'You win',
  push: 'Push',
  lose: 'Dealer wins',
};

/** Bet field with ½ / 2× quick-adjust, locked while a hand is in play. */
function BetField() {
  const betAmount = useBlackjackStore((s) => s.betAmount);
  const setBetAmount = useBlackjackStore((s) => s.setBetAmount);
  const status = useBlackjackStore((s) => s.status);
  const balance = useGameStore((s) => s.balance);

  const locked = status === 'PLAYER_TURN' || status === 'DEALER_TURN';
  const clamp = (v: number) =>
    setBetAmount(Math.max(0, Math.min(balance, Number.isFinite(v) ? v : 0)));

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">Bet Amount</span>
      <div className="flex overflow-hidden rounded-md bg-bg ring-1 ring-white/10 focus-within:ring-accent/50">
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={betAmount}
          disabled={locked}
          onChange={(e) => setBetAmount(e.currentTarget.valueAsNumber)}
          className="w-full bg-transparent px-3 py-2 text-sm font-semibold tabular-nums outline-none disabled:opacity-60"
        />
        <button
          type="button"
          disabled={locked}
          onClick={() => clamp(betAmount / 2)}
          className="px-3 text-xs font-semibold text-muted transition-colors hover:text-white disabled:opacity-40"
        >
          ½
        </button>
        <span className="my-2 w-px bg-white/10" />
        <button
          type="button"
          disabled={locked}
          onClick={() => clamp(betAmount * 2)}
          className="px-3 text-xs font-semibold text-muted transition-colors hover:text-white disabled:opacity-40"
        >
          2×
        </button>
      </div>
    </label>
  );
}

/**
 * Left control column: bet, live status, and the morphing action set.
 * IDLE → Deal · PLAYER_TURN → Hit/Stand/Double · RESOLVED → New Hand.
 */
export function BlackjackPanel() {
  const status = useBlackjackStore((s) => s.status);
  const betAmount = useBlackjackStore((s) => s.betAmount);
  const bet = useBlackjackStore((s) => s.bet);
  const outcome = useBlackjackStore((s) => s.outcome);
  const profit = useBlackjackStore((s) => s.profit);
  const doubled = useBlackjackStore((s) => s.doubled);
  const canDouble = useBlackjackStore(selectCanDouble);

  const deal = useBlackjackStore((s) => s.deal);
  const hit = useBlackjackStore((s) => s.hit);
  const stand = useBlackjackStore((s) => s.stand);
  const doubleDown = useBlackjackStore((s) => s.doubleDown);

  const balance = useGameStore((s) => s.balance);

  const playing = status === 'PLAYER_TURN';
  const resolved = status === 'RESOLVED';
  const idle = status === 'IDLE';
  const canDeal = betAmount > 0 && betAmount <= balance;

  const win = outcome === 'win' || outcome === 'blackjack';
  const push = outcome === 'push';

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-panel p-4">
      <BetField />

      {(playing || resolved) && (
        <div className="flex items-center justify-between rounded-md bg-bg px-3 py-2 ring-1 ring-white/10">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {doubled ? 'Bet (doubled)' : 'Bet'}
          </span>
          <span className="text-sm font-bold tabular-nums">{formatCurrency(bet)}</span>
        </div>
      )}

      <AnimatePresence>
        {resolved && outcome && (
          <motion.div
            key={outcome}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${
              win
                ? 'bg-accent/15 text-accent'
                : push
                  ? 'bg-white/10 text-white'
                  : 'bg-danger/15 text-danger'
            }`}
          >
            {OUTCOME_LABEL[outcome]}
            {' · '}
            {profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {playing ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={hit}
            className="rounded-md bg-accent px-4 py-3 text-sm font-bold text-black transition-[filter] hover:brightness-110"
          >
            Hit
          </button>
          <button
            type="button"
            onClick={stand}
            className="rounded-md bg-gold px-4 py-3 text-sm font-bold text-black transition-[filter] hover:brightness-110"
          >
            Stand
          </button>
          <button
            type="button"
            onClick={doubleDown}
            disabled={!canDouble}
            className="col-span-2 rounded-md bg-panel-light px-4 py-3 text-sm font-bold transition-colors hover:bg-tile disabled:cursor-not-allowed disabled:opacity-50"
          >
            Double Down
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={deal}
          disabled={!canDeal}
          className="mt-1 rounded-md bg-accent px-4 py-3 text-sm font-bold text-black transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {idle ? 'Deal' : 'New Hand'}
        </button>
      )}
    </div>
  );
}
