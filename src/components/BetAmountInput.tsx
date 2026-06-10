import { useGameStore } from '@/store/gameStore';

/** Bet amount field with ½ / 2× quick-adjust buttons (Stake-style). Locked while PLAYING. */
export function BetAmountInput() {
  const betAmount = useGameStore((s) => s.betAmount);
  const balance = useGameStore((s) => s.balance);
  const status = useGameStore((s) => s.status);
  const setBetAmount = useGameStore((s) => s.setBetAmount);

  const locked = status === 'PLAYING';

  const setClamped = (v: number) =>
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
          onClick={() => setClamped(betAmount / 2)}
          className="px-3 text-xs font-semibold text-muted transition-colors hover:text-white disabled:opacity-40"
        >
          ½
        </button>
        <span className="my-2 w-px bg-white/10" />
        <button
          type="button"
          disabled={locked}
          onClick={() => setClamped(betAmount * 2)}
          className="px-3 text-xs font-semibold text-muted transition-colors hover:text-white disabled:opacity-40"
        >
          2×
        </button>
      </div>
    </label>
  );
}
