/**
 * Pure sparkline geometry for the stats chart — cumulative PnL series in, SVG
 * coordinates out. No React, no store (mirrors `crash/curve.ts`).
 */

export interface SparkPoint {
  x: number;
  y: number;
}

export interface Sparkline {
  points: SparkPoint[];
  line: string;
  area: string;
  /** y of the zero baseline within the box. */
  zeroY: number;
  /** Last cumulative value (drives colour / sign). */
  last: number;
}

/** Build a sparkline for a series within a [0,width]×[0,height] box. */
export function buildSparkline(series: number[], width: number, height: number): Sparkline {
  const data = series.length > 0 ? series : [0];
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 0);
  const range = max - min || 1;
  const last = data[data.length - 1];

  const toY = (v: number): number => height - ((v - min) / range) * height;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points: SparkPoint[] = data.map((v, i) => ({ x: i * stepX, y: toY(v) }));
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const lastPt = points[points.length - 1];
  const area =
    points.length > 1
      ? `${line} L${lastPt.x.toFixed(2)},${height} L0,${height} Z`
      : '';

  return { points, line, area, zeroY: toY(0), last };
}
