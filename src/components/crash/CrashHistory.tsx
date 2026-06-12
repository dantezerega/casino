import { useCrashStore } from '@/store/crashStore';
import { formatMultiplier } from '@/utils/format';

/** Colour a past crash point: low busts red, healthy multipliers cyan→violet. */
const pillClass = (crashPoint: number): string =>
  crashPoint < 2
    ? 'bg-danger/15 text-danger'
    : crashPoint < 10
      ? 'bg-cyan/15 text-cyan'
      : 'bg-violet/20 text-violet';

/** Newest-first strip of recent crash points. */
export function CrashHistory() {
  const history = useCrashStore((s) => s.history);

  if (history.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-xl bg-panel/60 p-2.5"
      role="list"
      aria-label="Recent crash points"
    >
      {history.map((h, i) => (
        <span
          key={i}
          role="listitem"
          className={`rounded px-2 py-1 text-xs font-bold tabular-nums ${pillClass(h.crashPoint)}`}
        >
          {formatMultiplier(h.crashPoint)}
        </span>
      ))}
    </div>
  );
}
