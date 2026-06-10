import { describe, it, expect } from 'vitest';
import {
  multiplier,
  maxMultiplier,
  roundMultiplier,
  computePayout,
  computeProfit,
  DEFAULT_HOUSE_EDGE,
} from '@/game/multiplier';

describe('multiplier', () => {
  it('is 1 before any pick (0 gems)', () => {
    expect(multiplier({ mineCount: 5, gemsRevealed: 0 })).toBe(1);
  });

  it('matches the exact fair value for 1 mine / 1 gem (25/24)', () => {
    expect(multiplier({ mineCount: 1, gemsRevealed: 1, houseEdge: 0 })).toBeCloseTo(
      25 / 24,
      10,
    );
  });

  it('applies the house edge multiplicatively', () => {
    const fair = multiplier({ mineCount: 3, gemsRevealed: 4, houseEdge: 0 });
    const edged = multiplier({ mineCount: 3, gemsRevealed: 4, houseEdge: 0.01 });
    expect(edged).toBeCloseTo(fair * 0.99, 10);
  });

  it('defaults to a 1% house edge', () => {
    expect(DEFAULT_HOUSE_EDGE).toBe(0.01);
    expect(multiplier({ mineCount: 3, gemsRevealed: 4 })).toBeCloseTo(
      multiplier({ mineCount: 3, gemsRevealed: 4, houseEdge: 0.01 }),
      12,
    );
  });

  it('increases strictly with each gem revealed', () => {
    let prev = 0;
    for (let g = 1; g <= 20; g++) {
      const v = multiplier({ mineCount: 5, gemsRevealed: g });
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  it('grows faster with more mines at the same pick count', () => {
    expect(multiplier({ mineCount: 10, gemsRevealed: 3 })).toBeGreaterThan(
      multiplier({ mineCount: 3, gemsRevealed: 3 }),
    );
  });

  it('rejects out-of-range mine counts and gem counts', () => {
    expect(() => multiplier({ mineCount: 0, gemsRevealed: 1 })).toThrow(RangeError);
    expect(() => multiplier({ mineCount: 25, gemsRevealed: 1 })).toThrow(RangeError);
    // 24 mines → only 1 safe tile, so 2 gems is impossible
    expect(() => multiplier({ mineCount: 24, gemsRevealed: 2 })).toThrow(RangeError);
  });
});

describe('maxMultiplier', () => {
  it('is 24.75× for 24 mines (single safe tile, 1% edge)', () => {
    expect(maxMultiplier(24)).toBeCloseTo(24.75, 10);
  });

  it('equals the multiplier when all safe tiles are revealed', () => {
    expect(maxMultiplier(3)).toBeCloseTo(
      multiplier({ mineCount: 3, gemsRevealed: 22 }),
      12,
    );
  });
});

describe('rounding & money', () => {
  it('rounds a multiplier to 2 decimals', () => {
    expect(roundMultiplier(1.03094)).toBe(1.03);
    expect(roundMultiplier(2.999)).toBe(3);
  });

  it('computes total payout (stake included)', () => {
    expect(computePayout(100, 2.5)).toBe(250);
  });

  it('computes net profit (stake excluded)', () => {
    expect(computeProfit(100, 2.5)).toBe(150);
    expect(computeProfit(100, 1)).toBe(0);
  });
});
