import { describe, it, expect } from 'vitest';
import { getMultipliers, getSlotMultiplier } from '@/game/plinko/payoutTables';
import { PLINKO_ROWS, PLINKO_RISKS } from '@/game/plinko/types';

describe('payout tables', () => {
  it('has a table of length rows+1 for every rows/risk pair', () => {
    for (const rows of PLINKO_ROWS) {
      for (const risk of PLINKO_RISKS) {
        expect(getMultipliers(rows, risk)).toHaveLength(rows + 1);
      }
    }
  });

  it('is symmetric about the center slot', () => {
    for (const rows of PLINKO_ROWS) {
      for (const risk of PLINKO_RISKS) {
        const m = getMultipliers(rows, risk);
        for (let i = 0; i < m.length; i++) {
          expect(m[i]).toBe(m[m.length - 1 - i]);
        }
      }
    }
  });

  it('pays the most at the edges and least near the center', () => {
    for (const rows of PLINKO_ROWS) {
      for (const risk of PLINKO_RISKS) {
        const m = getMultipliers(rows, risk);
        const center = m[Math.floor(m.length / 2)];
        expect(m[0]).toBeGreaterThan(center);
        expect(m[m.length - 1]).toBeGreaterThan(center);
      }
    }
  });

  it('higher risk has a higher edge multiplier at equal rows', () => {
    for (const rows of PLINKO_ROWS) {
      const low = getMultipliers(rows, 'low')[0];
      const medium = getMultipliers(rows, 'medium')[0];
      const high = getMultipliers(rows, 'high')[0];
      expect(medium).toBeGreaterThan(low);
      expect(high).toBeGreaterThan(medium);
    }
  });

  it('looks up a slot multiplier', () => {
    expect(getSlotMultiplier(8, 'high', 0)).toBe(29);
    expect(getSlotMultiplier(8, 'high', 8)).toBe(29);
    expect(getSlotMultiplier(8, 'high', 4)).toBe(0.2);
    expect(getSlotMultiplier(16, 'high', 0)).toBe(1000);
  });

  it('rejects invalid rows, risk, and slot', () => {
    expect(() => getMultipliers(10 as never, 'low')).toThrow(RangeError);
    expect(() => getMultipliers(8, 'extreme' as never)).toThrow(RangeError);
    expect(() => getSlotMultiplier(8, 'low', -1)).toThrow(RangeError);
    expect(() => getSlotMultiplier(8, 'low', 9)).toThrow(RangeError);
    expect(() => getSlotMultiplier(8, 'low', 1.5)).toThrow(RangeError);
  });
});
