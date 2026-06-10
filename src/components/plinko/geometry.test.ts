import { describe, it, expect } from 'vitest';
import { pegRows, slotX, ballWaypoints } from '@/components/plinko/geometry';
import { slotFromPath } from '@/game/plinko/pathGenerator';
import { PLINKO_ROWS, type PlinkoPath, type PlinkoRows } from '@/game/plinko/types';

describe('plinko geometry', () => {
  it('builds a Galton triangle: row i has i pegs', () => {
    for (const rows of PLINKO_ROWS) {
      const grid = pegRows(rows);
      expect(grid).toHaveLength(rows);
      grid.forEach((row, i) => expect(row).toHaveLength(i + 1));
    }
  });

  it('places each slot in the gap between adjacent bottom-row pegs', () => {
    for (const rows of PLINKO_ROWS) {
      const bottom = pegRows(rows)[rows - 1];
      for (let s = 1; s < rows; s++) {
        const mid = (bottom[s - 1].x + bottom[s].x) / 2;
        expect(slotX(rows, s)).toBeCloseTo(mid, 6);
      }
    }
  });

  it('edge slots sit half a gap outside the outer pegs', () => {
    const rows: PlinkoRows = 8;
    const bottom = pegRows(rows)[rows - 1];
    const gap = bottom[1].x - bottom[0].x;
    expect(slotX(rows, 0)).toBeCloseTo(bottom[0].x - gap / 2, 6);
    expect(slotX(rows, rows)).toBeCloseTo(bottom[rows - 1].x + gap / 2, 6);
  });

  it('ball lands at the slot its path resolves to, stepping half a gap per row', () => {
    const path: PlinkoPath = ['R', 'L', 'R', 'R', 'L', 'L', 'R', 'L'];
    const rows: PlinkoRows = 8;
    const pts = ballWaypoints(path, rows);
    expect(pts).toHaveLength(rows + 2);
    expect(pts[pts.length - 1].x).toBeCloseTo(slotX(rows, slotFromPath(path)), 6);

    const gap = pegRows(rows)[rows - 1][1].x - pegRows(rows)[rows - 1][0].x;
    for (let i = 1; i <= rows; i++) {
      expect(Math.abs(pts[i + 1].x - pts[i].x)).toBeCloseTo(gap / 2, 6);
    }
  });

  it('every peg contact lands exactly on a peg of that row', () => {
    const path: PlinkoPath = ['R', 'R', 'L', 'R', 'L', 'L', 'L', 'R'];
    const rows: PlinkoRows = 8;
    const pts = ballWaypoints(path, rows);
    const grid = pegRows(rows);
    for (let row = 1; row <= rows; row++) {
      const xs = grid[row - 1].map((p) => p.x);
      const hit = xs.some((x) => Math.abs(x - pts[row].x) < 1e-6);
      expect(hit).toBe(true);
    }
  });
});
