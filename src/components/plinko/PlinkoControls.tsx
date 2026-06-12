import { useGameStore } from '@/store/gameStore';
import { usePlinkoStore, selectCanDrop, selectConfigLocked } from '@/store/plinkoStore';
import { PLINKO_ROWS, PLINKO_RISKS, type PlinkoRisk, type PlinkoRows } from '@/game/plinko/types';

const RISK_LABEL: Record<PlinkoRisk, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function BetField() {
  const betAmount = usePlinkoStore((s) => s.betAmount);
  const setBetAmount = usePlinkoStore((s) => s.setBetAmount);
  const balance = useGameStore((s) => s.balance);

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
          onChange={(e) => setBetAmount(e.currentTarget.valueAsNumber)}
          className="w-full bg-transparent px-3 py-2 text-sm font-semibold tabular-nums outline-none"
        />
        <button
          type="button"
          onClick={() => clamp(betAmount / 2)}
          className="px-3 text-xs font-semibold text-muted transition-colors hover:text-white"
        >
          ½
        </button>
        <span className="my-2 w-px bg-white/10" />
        <button
          type="button"
          onClick={() => clamp(betAmount * 2)}
          className="px-3 text-xs font-semibold text-muted transition-colors hover:text-white"
        >
          2×
        </button>
      </div>
    </label>
  );
}

function RiskSelector({ locked }: { locked: boolean }) {
  const risk = usePlinkoStore((s) => s.risk);
  const setRisk = usePlinkoStore((s) => s.setRisk);

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">Risk</span>
      <div role="group" aria-label="Risk" className="grid grid-cols-3 gap-1.5">
        {PLINKO_RISKS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={locked}
            aria-pressed={risk === r}
            onClick={() => setRisk(r)}
            className={`rounded-md px-2 py-2 text-xs font-bold transition-colors disabled:opacity-40 ${
              risk === r ? 'bg-accent text-black' : 'bg-bg text-muted hover:text-white'
            }`}
          >
            {RISK_LABEL[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

function RowsSelector({ locked }: { locked: boolean }) {
  const rows = usePlinkoStore((s) => s.rows);
  const setRows = usePlinkoStore((s) => s.setRows);

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">Rows</span>
      <div role="group" aria-label="Rows" className="grid grid-cols-3 gap-1.5">
        {PLINKO_ROWS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={locked}
            aria-pressed={rows === n}
            onClick={() => setRows(n as PlinkoRows)}
            className={`rounded-md px-2 py-2 text-xs font-bold tabular-nums transition-colors disabled:opacity-40 ${
              rows === n ? 'bg-accent text-black' : 'bg-bg text-muted hover:text-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlinkoControls() {
  const drop = usePlinkoStore((s) => s.drop);
  const canDrop = usePlinkoStore(selectCanDrop);
  const locked = usePlinkoStore(selectConfigLocked);
  const active = usePlinkoStore((s) => s.balls.length);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-panel p-4">
      <BetField />
      <RiskSelector locked={locked} />
      <RowsSelector locked={locked} />
      <button
        type="button"
        onClick={drop}
        disabled={!canDrop}
        className="mt-1 rounded-md bg-accent px-4 py-3 text-sm font-bold text-black transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Drop{active > 0 ? ` · ${active} in play` : ''}
      </button>
    </div>
  );
}
