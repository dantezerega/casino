/**
 * Pure SVG geometry for the Crash graph — mirrors `plinko/geometry.ts` in
 * spirit: plain math in, plain coordinates out. No React, no store. Keeps the
 * graph component dumb (it only feeds in the live multiplier + box size).
 *
 * The curve plots the rising multiplier against time using the engine's own
 * `multiplierAt` (so the drawn line is exactly the played curve). Axes auto-scale
 * to the current multiplier so the climb always fills the box.
 */

import { multiplierAt, timeToMultiplier } from '@/game/crash/crashEngine';

export interface CurvePoint {
  x: number;
  y: number;
}

export interface CurveBox {
  width: number;
  height: number;
  /** Number of segments to sample along the curve. */
  samples?: number;
}

/** Auto-scaled axis bounds for a given live multiplier. */
export function curveBounds(currentMultiplier: number): {
  tCur: number;
  tWindow: number;
  yMax: number;
} {
  const m = Math.max(1, currentMultiplier);
  const tCur = timeToMultiplier(m);
  // Keep a little headroom so the leading dot never hugs the right/top edge.
  const tWindow = Math.max(4000, tCur * 1.15);
  const yMax = Math.max(2, m * 1.25);
  return { tCur, tWindow, yMax };
}

/**
 * Sample the multiplier curve from round start (1.00×) up to the current
 * multiplier, mapped into the [0,width]×[0,height] box. y is flipped so 1.00×
 * sits on the bottom edge and `yMax` at the top.
 */
export function buildCurve(currentMultiplier: number, box: CurveBox): CurvePoint[] {
  const { width, height, samples = 48 } = box;
  const { tCur, tWindow, yMax } = curveBounds(currentMultiplier);

  const points: CurvePoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (tCur * i) / samples;
    const m = multiplierAt(t);
    const x = (t / tWindow) * width;
    const y = height - ((m - 1) / (yMax - 1)) * height;
    points.push({ x, y });
  }
  return points;
}

/** Turn sampled points into an SVG path `d` string. */
export function pointsToPath(points: CurvePoint[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
}

/** Close the curve down to the baseline for an area fill. */
export function pointsToArea(points: CurvePoint[], height: number): string {
  if (points.length === 0) return '';
  const last = points[points.length - 1];
  return `${pointsToPath(points)} L${last.x.toFixed(2)},${height} L0,${height} Z`;
}
