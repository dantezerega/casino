import type { PlinkoPath, PlinkoRows } from '@/game/plinko/types';

export const PEG_GAP_X = 26;
export const PEG_GAP_Y = 24;
export const MARGIN_X = 24;
export const TOP = 18;
export const SLOT_H = 30;
export const PEG_R = 2.6;
export const BALL_R = 6;

export interface Point {
  x: number;
  y: number;
}

export const boardWidth = (rows: PlinkoRows): number => rows * PEG_GAP_X + MARGIN_X * 2;

export const boardHeight = (rows: PlinkoRows): number => TOP + rows * PEG_GAP_Y + SLOT_H;

export const centerX = (rows: PlinkoRows): number => boardWidth(rows) / 2;

export function pegRows(rows: PlinkoRows): Point[][] {
  const cx = centerX(rows);
  const out: Point[][] = [];
  for (let r = 1; r <= rows; r++) {
    const row: Point[] = [];
    for (let k = 0; k <= r; k++) {
      row.push({ x: cx + (k - r / 2) * PEG_GAP_X, y: TOP + r * PEG_GAP_Y });
    }
    out.push(row);
  }
  return out;
}

export const slotX = (rows: PlinkoRows, slot: number): number =>
  centerX(rows) + (2 * slot - rows) * (PEG_GAP_X / 2);

export const slotWidth = (): number => PEG_GAP_X;

export const slotTop = (rows: PlinkoRows): number => TOP + rows * PEG_GAP_Y + 4;

export function ballWaypoints(path: PlinkoPath, rows: PlinkoRows): Point[] {
  const cx = centerX(rows);
  const points: Point[] = [{ x: cx, y: TOP }];
  let rights = 0;
  for (let i = 0; i < path.length; i++) {
    if (path[i] === 'R') rights += 1;
    const level = i + 1;
    points.push({
      x: cx + (2 * rights - level) * (PEG_GAP_X / 2),
      y: TOP + level * PEG_GAP_Y,
    });
  }
  return points;
}
