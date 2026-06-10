import { describe, it, expect } from 'vitest';
import {
  createRound,
  resolveDrop,
  computePayout,
  computeProfit,
} from '@/game/plinko/plinkoEngine';
import { slotFromPath } from '@/game/plinko/pathGenerator';
import { getSlotMultiplier } from '@/game/plinko/payoutTables';
import { PLINKO_ROWS, PLINKO_RISKS } from '@/game/plinko/types';
import type { ProvablyFairSeeds } from '@/types';

const seeds = (over: Partial<ProvablyFairSeeds> = {}): ProvablyFairSeeds => ({
  serverSeed: 'srv',
  clientSeed: 'cli',
  nonce: 0,
  ...over,
});

describe('createRound', () => {
  it('reproduces an identical round for identical seeds', () => {
    expect(createRound(seeds(), 12, 'medium')).toEqual(createRound(seeds(), 12, 'medium'));
  });

  it('derives slot from its own path', () => {
    const round = createRound(seeds(), 16, 'high');
    expect(round.slot).toBe(slotFromPath(round.path));
    expect(round.path).toHaveLength(16);
  });

  it('rejects invalid rows and risk', () => {
    expect(() => createRound(seeds(), 10 as never, 'low')).toThrow(RangeError);
    expect(() => createRound(seeds(), 8, 'wild' as never)).toThrow(RangeError);
  });
});

describe('resolveDrop', () => {
  it('resolves the multiplier from the round slot', () => {
    const round = createRound(seeds(), 8, 'high');
    const result = resolveDrop(round, 10);
    expect(result.multiplier).toBe(getSlotMultiplier(8, 'high', round.slot));
    expect(result.slot).toBe(round.slot);
    expect(result.path).toEqual(round.path);
  });

  it('computes payout and profit from the bet', () => {
    const round = createRound(seeds(), 8, 'high');
    const mult = getSlotMultiplier(8, 'high', round.slot);
    const result = resolveDrop(round, 20);
    expect(result.payout).toBe(20 * mult);
    expect(result.profit).toBe(20 * mult - 20);
  });

  it('keeps profit === payout - bet across many random rounds', () => {
    for (const rows of PLINKO_ROWS) {
      for (const risk of PLINKO_RISKS) {
        for (let n = 0; n < 100; n++) {
          const bet = 1 + (n % 50);
          const round = createRound(seeds({ nonce: n, serverSeed: `s${n}` }), rows, risk);
          const result = resolveDrop(round, bet);
          expect(result.profit).toBeCloseTo(result.payout - bet, 10);
          expect(result.payout).toBeCloseTo(bet * result.multiplier, 10);
        }
      }
    }
  });
});

describe('money helpers', () => {
  it('computes payout and profit', () => {
    expect(computePayout(100, 2.5)).toBe(250);
    expect(computeProfit(100, 2.5)).toBe(150);
    expect(computeProfit(100, 1)).toBe(0);
    expect(computeProfit(100, 0.2)).toBeCloseTo(-80, 10);
  });
});
