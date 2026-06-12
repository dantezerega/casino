import { usePlinkoStore, selectMultipliers } from '@/store/plinkoStore';
import { PlinkoBall } from '@/components/plinko/PlinkoBall';
import {
  PEG_R,
  SLOT_H,
  boardHeight,
  boardWidth,
  pegRows,
  slotTop,
  slotWidth,
  slotX,
} from '@/components/plinko/geometry';

const slotColor = (m: number): string =>
  m >= 10
    ? 'var(--color-danger)'
    : m >= 2
      ? 'var(--color-gold)'
      : m >= 1
        ? 'var(--color-accent)'
        : 'var(--color-tile-hover)';

const labelFor = (m: number): string => `${m}×`;

export function PlinkoBoard() {
  const rows = usePlinkoStore((s) => s.rows);
  const balls = usePlinkoStore((s) => s.balls);
  const lastResult = usePlinkoStore((s) => s.lastResult);
  const land = usePlinkoStore((s) => s.land);
  const multipliers = usePlinkoStore(selectMultipliers);

  const width = boardWidth(rows);
  const height = boardHeight(rows);
  const pegs = pegRows(rows);
  const sw = slotWidth();
  const landedSlot = lastResult?.slot ?? null;

  return (
    <div className="w-full overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_top,#1c3142_0%,#13212e_70%)] p-3 ring-1 ring-white/5 sm:p-5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="block h-auto w-full"
        role="img"
        aria-label={`Plinko board, ${rows} rows`}
        data-active-balls={balls.length}
        data-slot={lastResult?.slot ?? ''}
      >
        {pegs.map((row, r) =>
          row.map((p, k) => (
            <circle key={`${r}-${k}`} cx={p.x} cy={p.y} r={PEG_R} fill="rgba(255,255,255,0.55)" />
          )),
        )}

        {multipliers.map((m, slot) => {
          const x = slotX(rows, slot) - sw / 2;
          const y = slotTop(rows);
          const active = landedSlot === slot;
          return (
            <g key={slot}>
              <rect
                x={x + 1}
                y={y}
                width={sw - 2}
                height={SLOT_H - 8}
                rx={2}
                fill={slotColor(m)}
                opacity={active ? 1 : 0.78}
                stroke={active ? '#fff' : 'transparent'}
                strokeWidth={active ? 1 : 0}
              />
              <text
                x={slotX(rows, slot)}
                y={y + (SLOT_H - 8) / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={rows >= 16 ? 5.5 : 7}
                fontWeight="700"
                fill="#0f1923"
              >
                {labelFor(m)}
              </text>
            </g>
          );
        })}

        {balls.map((b) => (
          <PlinkoBall key={b.id} path={b.path} rows={b.rows} onLand={() => land(b.id)} />
        ))}
      </svg>
    </div>
  );
}
