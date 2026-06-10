import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/utils/format';

/** Top bar: game title + live balance. */
export function Header() {
  const balance = useGameStore((s) => s.balance);

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">💣</span>
        <h1 className="text-lg font-bold tracking-tight">Mines</h1>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-panel px-3 py-1.5 ring-1 ring-white/10">
        <span className="text-xs font-medium text-muted">Balance</span>
        <span className="text-sm font-bold tabular-nums text-accent">
          {formatCurrency(balance)}
        </span>
      </div>
    </header>
  );
}
