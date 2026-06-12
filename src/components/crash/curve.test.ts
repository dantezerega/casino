import { describe, it, expect } from 'vitest';
import { buildCurve, curveBounds, pointsToArea, pointsToPath } from '@/components/crash/curve';

describe('curveBounds', () => {
  it('keeps headroom above the current multiplier', () => {
    const { yMax } = curveBounds(4);
    expect(yMax).toBeGreaterThan(4);
  });

  it('floors the window/axis at sensible minimums near 1.00×', () => {
    const { tWindow, yMax } = curveBounds(1);
    expect(tWindow).toBeGreaterThanOrEqual(4000);
    expect(yMax).toBeGreaterThanOrEqual(2);
  });
});

describe('buildCurve', () => {
  const box = { width: 320, height: 200, samples: 24 };

  it('returns samples+1 points', () => {
    expect(buildCurve(3, box)).toHaveLength(25);
  });

  it('starts at the bottom-left (1.00× origin) and rises toward the tip', () => {
    const pts = buildCurve(3, box);
    expect(pts[0].x).toBeCloseTo(0, 6);
    expect(pts[0].y).toBeCloseTo(box.height, 6); // 1.00× sits on the baseline
    const tip = pts[pts.length - 1];
    expect(tip.x).toBeGreaterThan(0);
    expect(tip.y).toBeLessThan(box.height); // climbed above the baseline
  });

  it('is monotonic: x increases, y decreases (rising line)', () => {
    const pts = buildCurve(5, box);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].x).toBeGreaterThanOrEqual(pts[i - 1].x);
      expect(pts[i].y).toBeLessThanOrEqual(pts[i - 1].y);
    }
  });

  it('stays within the box bounds', () => {
    for (const m of [1, 1.5, 10, 100]) {
      for (const p of buildCurve(m, box)) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(box.width);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(box.height);
      }
    }
  });
});

describe('path serialisers', () => {
  it('pointsToPath starts with a moveto then linetos', () => {
    const d = pointsToPath([
      { x: 0, y: 200 },
      { x: 10, y: 180 },
    ]);
    expect(d).toBe('M0.00,200.00 L10.00,180.00');
  });

  it('pointsToArea closes back down to the baseline', () => {
    const d = pointsToArea([{ x: 0, y: 200 }, { x: 10, y: 180 }], 200);
    expect(d.endsWith('L0,200 Z')).toBe(true);
  });

  it('pointsToArea is empty for no points', () => {
    expect(pointsToArea([], 200)).toBe('');
  });
});
