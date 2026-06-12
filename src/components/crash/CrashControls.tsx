import { useGameStore } from '@/store/gameStore';
import {
  useCrashStore,
  selectCanStart,
  selectPotentialPayout,
} from '@/store/crashStore';
import { formatCurrency } from '@/utils/format';

function BetField() {
  const betAmount = useCrashStore((s) => s.betAmount);
  const setBetAmount = useCrashStore((s) => s.setBetAmount);
  const locked = useCrashStore((s) => s.status === 'RUNNING');
  const balance = useGameStore((s) => s.balance);

  const clamp = (v: number) =>
    setBetAmount(Math.max(0, Math.min(balance, Number.isFinite(v) ? v : 0)));

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">Bet Amount</span>
      <div className="flex overflow-hidden rounded-md bg-bg ring-1 ring-white/10 focus-within:ring-cyan/50">
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          disabled={locked}
          value={betAmount}
          onChange={(e) => setBetAmount(e.currentTarget.valueAsNumber)}
          className="w-full bg-transparent px-3 py-2 text-sm font-semibold tabular-nums outline-none disabled:opacity-50"
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

/** Primary action — morphs across the state machine: Start → Cash Out → Next. */
function PrimaryButton() {
  const status = useCrashStore((s) => s.status);
  const canStart = useCrashStore(selectCanStart);
  const payout = useCrashStore(selectPotentialPayout);
  const start = useCrashStore((s) => s.start);
  const cashOut = useCrashStore((s) => s.cashOut);
  const reset = useCrashStore((s) => s.reset);

  if (status === 'RUNNING') {
    return (
      <button
        type="button"
        onClick={cashOut}
        className="rounded-md bg-cyan px-4 py-3 text-sm font-bold text-black shadow-[0_0_24px_-4px_var(--color-cyan)] transition-[filter] hover:brightness-110"
      >
        Cash Out · {formatCurrency(payout)}
      </button>
    );
  }

  if (status === 'CASHED_OUT' || status === 'CRASHED') {
    return (
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-violet px-4 py-3 text-sm font-bold text-black transition-[filter] hover:brightness-110"
      >
        Next Round
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={!canStart}
      className="rounded-md bg-cyan px-4 py-3 text-sm font-bold text-black transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Start
    </button>
  );
}

export function CrashControls() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-panel p-4">
      <BetField />
      <PrimaryButton />
    </div>
  );
}
