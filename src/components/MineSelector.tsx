import { useGameStore } from '@/store/gameStore';
import { MAX_MINES, MIN_MINES } from '@/types';

const OPTIONS = Array.from(
  { length: MAX_MINES - MIN_MINES + 1 },
  (_, i) => MIN_MINES + i,
);

/** Mine-count dropdown (1–24). Locked while PLAYING. */
export function MineSelector() {
  const mineCount = useGameStore((s) => s.mineCount);
  const status = useGameStore((s) => s.status);
  const setMineCount = useGameStore((s) => s.setMineCount);

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">Mines</span>
      <select
        value={mineCount}
        disabled={status === 'PLAYING'}
        onChange={(e) => setMineCount(Number(e.currentTarget.value))}
        className="w-full cursor-pointer rounded-md bg-bg px-3 py-2 text-sm font-semibold tabular-nums outline-none ring-1 ring-white/10 transition-shadow focus:ring-accent/50 disabled:cursor-default disabled:opacity-60"
      >
        {OPTIONS.map((n) => (
          <option key={n} value={n} className="bg-panel">
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
