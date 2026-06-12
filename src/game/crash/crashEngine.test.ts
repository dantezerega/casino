import { describe, it, expect } from 'vitest';
import {
  createRound,
  multiplierAt,
  timeToMultiplier,
  computePayout,
  computeProfit,
  resolveCashOut,
  resolveCrash,
} from '@/game/crash/crashEngine';
import { computeCrashPoint } from '@/game/crash/crashPoint';
import type { ProvablyFairSeeds } from '@/types';

const seeds = (over: Partial<ProvablyFairSeeds> = {}): ProvablyFairSeeds => ({
  serverSeed: 'srv',
  clientSeed: 'cli',
  nonce: 0,
  ...over,
});

describe('createRound', () => {
  it('reproduces an identical round for identical seeds', () => {
    expect(createRound(seeds())).toEqual(createRound(seeds()));
  });

  it('fixes the crash point from the seeds', () => {
    const round = createRound(seeds({ nonce: 5 }));
    expect(round.crashPoint).toBe(computeCrashPoint(seeds({ nonce: 5 })));
    expect(round.seeds).toEqual(seeds({ nonce: 5 }));
  });
});

describe('multiplierAt', () => {
  it('is exactly 1.00× at t = 0', () => {
    expect(multiplierAt(0)).toBe(1);
  });

  it('clamps negative elapsed time to t = 0', () => {
    expect(multiplierAt(-500)).toBe(1);
  });

  it('is strictly increasing in time', () => {
    let prev = multiplierAt(0);
    for (let ms = 100; ms <= 30000; ms += 100) {
      const next = multiplierAt(ms);
      expect(next).toBeGreaterThan(prev);
      prev = next;
    }
  });

  it('follows e^(0.06·s) (Stake-like pacing)', () => {
    expect(multiplierAt(7000)).toBeCloseTo(Math.exp(0.06 * 7), 10);
    expect(multiplierAt(12000)).toBeCloseTo(Math.exp(0.06 * 12), 10);
  });
});

describe('timeToMultiplier', () => {
  it('maps multipliers ≤ 1 to t = 0', () => {
    expect(timeToMultiplier(1)).toBe(0);
    expect(timeToMultiplier(0.5)).toBe(0);
  });

  it('is the inverse of multiplierAt', () => {
    for (const m of [1.1, 1.5, 2, 5, 10, 100]) {
      expect(multiplierAt(timeToMultiplier(m))).toBeCloseTo(m, 9);
    }
  });
});

describe('money helpers', () => {
  it('computes payout and profit', () => {
    expect(computePayout(100, 2.5)).toBe(250);
    expect(computeProfit(100, 2.5)).toBe(150);
    expect(computeProfit(100, 1)).toBe(0);
  });
});

describe('resolveCashOut', () => {
  it('settles a win at the cash-out multiplier', () => {
    const round = createRound(seeds());
    const result = resolveCashOut(round, 20, 2.5);
    expect(result.won).toBe(true);
    expect(result.cashedOutAt).toBe(2.5);
    expect(result.multiplier).toBe(2.5);
    expect(result.payout).toBe(50);
    expect(result.profit).toBe(30);
    expect(result.crashPoint).toBe(round.crashPoint);
  });

  it('keeps profit === payout − bet across many random cash-outs', () => {
    for (let n = 0; n < 300; n++) {
      const round = createRound(seeds({ nonce: n, serverSeed: `s${n}` }));
      const bet = 1 + (n % 50);
      const mult = 1 + (n % 17) * 0.37;
      const result = resolveCashOut(round, bet, mult);
      expect(result.profit).toBeCloseTo(result.payout - bet, 10);
      expect(result.payout).toBeCloseTo(bet * mult, 10);
    }
  });
});

describe('resolveCrash', () => {
  it('settles a loss with zero payout and −bet profit', () => {
    const round = createRound(seeds());
    const result = resolveCrash(round, 20);
    expect(result.won).toBe(false);
    expect(result.cashedOutAt).toBeNull();
    expect(result.multiplier).toBe(round.crashPoint);
    expect(result.payout).toBe(0);
    expect(result.profit).toBe(-20);
  });
});
