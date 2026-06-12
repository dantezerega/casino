import { describe, it, expect } from 'vitest';
import { buildSparkline } from '@/components/stats/sparkline';

describe('buildSparkline', () => {
  it('maps a flat series and reports its last value', () => {
    const s = buildSparkline([0], 100, 50);
    expect(s.points).toHaveLength(1);
    expect(s.last).toBe(0);
    expect(s.area).toBe(''); // need ≥2 points to fill
  });

  it('spreads points across the width and flips y (higher value = lower y)', () => {
    const s = buildSparkline([0, 10], 100, 50);
    expect(s.points[0].x).toBeCloseTo(0, 6);
    expect(s.points[1].x).toBeCloseTo(100, 6);
    expect(s.points[1].y).toBeLessThan(s.points[0].y); // 10 sits above 0
    expect(s.last).toBe(10);
  });

  it('places the zero baseline inside the box for a mixed series', () => {
    const s = buildSparkline([0, 5, -5], 100, 50);
    expect(s.zeroY).toBeGreaterThan(0);
    expect(s.zeroY).toBeLessThan(50);
  });

  it('closes the area path back to the baseline for ≥2 points', () => {
    const s = buildSparkline([0, 3, 1], 100, 50);
    expect(s.area.endsWith('L0,50 Z')).toBe(true);
  });

  it('stays within the box bounds', () => {
    const s = buildSparkline([0, 12, -4, 7, -9, 20], 120, 60);
    for (const p of s.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(120);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(60);
    }
  });
});
