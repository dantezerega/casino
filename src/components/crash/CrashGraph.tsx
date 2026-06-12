import { motion, useReducedMotion } from 'framer-motion';
import { useCrashStore } from '@/store/crashStore';
import { CrashMultiplier } from '@/components/crash/CrashMultiplier';
import { buildCurve, pointsToArea, pointsToPath } from '@/components/crash/curve';

const VIEW_W = 320;
const VIEW_H = 200;

/** The rising-multiplier graph: glowing curve + area fill, with the live tip. */
export function CrashGraph() {
  const reduce = useReducedMotion();
  const status = useCrashStore((s) => s.status);
  const currentMultiplier = useCrashStore((s) => s.currentMultiplier);
  const crashPoint = useCrashStore((s) => s.result?.crashPoint ?? null);

  const crashed = status === 'CRASHED';
  const cashed = status === 'CASHED_OUT';
  const shown = crashed && crashPoint != null ? crashPoint : currentMultiplier;

  const points = buildCurve(shown, { width: VIEW_W, height: VIEW_H });
  const tip = points[points.length - 1];
  const line = pointsToPath(points);
  const area = pointsToArea(points, VIEW_H);

  const stroke = crashed
    ? 'var(--color-danger)'
    : cashed
      ? 'var(--color-accent)'
      : 'var(--color-cyan)';

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_bottom,#1a2740_0%,#0b1320_72%)] ring-1 ring-white/5">
      <motion.svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        className="block h-auto w-full"
        role="img"
        aria-label="Crash multiplier graph"
        data-status={status}
        data-multiplier={shown.toFixed(2)}
        animate={crashed && !reduce ? { x: [0, -6, 5, -3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <defs>
          <linearGradient id="crash-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line
          x1="0"
          y1={VIEW_H - 0.5}
          x2={VIEW_W}
          y2={VIEW_H - 0.5}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        <path d={area} fill="url(#crash-fill)" />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${stroke})` }}
        />

        {tip && (
          <circle
            cx={tip.x}
            cy={tip.y}
            r={status === 'RUNNING' ? 4 : 5}
            fill={stroke}
            style={{ filter: `drop-shadow(0 0 8px ${stroke})` }}
          />
        )}
      </motion.svg>

      <CrashMultiplier />
    </div>
  );
}
