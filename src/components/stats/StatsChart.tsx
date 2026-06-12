import { useStatsStore, selectSeries, type StatsScope } from '@/store/statsStore';
import { buildSparkline } from '@/components/stats/sparkline';

const W = 264;
const H = 72;

/** Live cumulative-PnL sparkline for the active scope. */
export function StatsChart({ scope }: { scope: StatsScope }) {
  const series = useStatsStore(selectSeries(scope));
  const { line, area, zeroY, last } = buildSparkline(series, W, H);

  const color = last > 0 ? 'var(--color-accent)' : last < 0 ? 'var(--color-danger)' : 'var(--color-muted)';
  const empty = series.length < 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="block h-auto w-full"
      role="img"
      aria-label="Cumulative profit and loss"
      data-scope={scope}
      data-points={series.length}
    >
      <defs>
        <linearGradient id={`spark-${scope}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* zero baseline */}
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3" />

      {empty ? (
        <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="var(--color-muted)">
          No settled bets yet
        </text>
      ) : (
        <>
          <path d={area} fill={`url(#spark-${scope})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </>
      )}
    </svg>
  );
}
