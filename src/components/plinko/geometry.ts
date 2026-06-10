import type { PlinkoPath, PlinkoRows } from '@/game/plinko/types';

export const PEG_GAP_X = 26;
export const PEG_GAP_Y = 24;
export const MARGIN_X = PEG_GAP_X;
export const TOP = 16;
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

const pegX = (rows: PlinkoRows, row: number, k: number): number =>
  centerX(rows) + (k - (row - 1) / 2) * PEG_GAP_X;

export function pegRows(rows: PlinkoRows): Point[][] {
  const out: Point[][] = [];
  for (let row = 1; row <= rows; row++) {
    const r: Point[] = [];
    for (let k = 0; k < row; k++) {
      r.push({ x: pegX(rows, row, k), y: TOP + row * PEG_GAP_Y });
    }
    out.push(r);
  }
  return out;
}

export const slotX = (rows: PlinkoRows, slot: number): number =>
  centerX(rows) + (slot - rows / 2) * PEG_GAP_X;

export const slotWidth = (): number => PEG_GAP_X;

export const slotTop = (rows: PlinkoRows): number => TOP + rows * PEG_GAP_Y + 6;

const slotCenterY = (rows: PlinkoRows): number => slotTop(rows) + (SLOT_H - 8) / 2;

export function ballWaypoints(path: PlinkoPath, rows: PlinkoRows): Point[] {
  const points: Point[] = [{ x: centerX(rows), y: TOP }];
  let rights = 0;
  for (let row = 1; row <= rows; row++) {
    points.push({ x: pegX(rows, row, rights), y: TOP + row * PEG_GAP_Y });
    if (path[row - 1] === 'R') rights += 1;
  }
  points.push({ x: slotX(rows, rights), y: slotCenterY(rows) });
  return points;
}
