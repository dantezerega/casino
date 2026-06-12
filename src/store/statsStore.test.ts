import { describe, it, expect, beforeEach } from 'vitest';
import {
  useStatsStore,
  selectScopeStat,
  selectSeries,
  SERIES_CAP,
} from '@/store/statsStore';

const S = () => useStatsStore.getState();

beforeEach(() => {
  S().reset();
});

describe('recordWager', () => {
  it('counts bets and accumulates wagered per game', () => {
    S().recordWager('mines', 10);
    S().recordWager('mines', 5);
    const stat = selectScopeStat('mines')(S());
    expect(stat.bets).toBe(2);
    expect(stat.wagered).toBe(15);
  });

  it('ignores non-positive or non-finite stakes', () => {
    S().recordWager('crash', 0);
    S().recordWager('crash', -4);
    S().recordWager('crash', Number.NaN);
    expect(selectScopeStat('crash')(S()).bets).toBe(0);
  });
});

describe('recordSettle', () => {
  it('accumulates pnl and extends the cumulative series', () => {
    S().recordSettle('plinko', 4);
    S().recordSettle('plinko', -1.5);
    expect(selectScopeStat('plinko')(S()).pnl).toBeCloseTo(2.5, 10);
    expect(selectSeries('plinko')(S())).toEqual([0, 4, 2.5]);
  });

  it('ignores non-finite profit', () => {
    S().recordSettle('mines', Number.NaN);
    expect(selectScopeStat('mines')(S()).pnl).toBe(0);
    expect(S().settleCount).toBe(0);
  });

  it('feeds the global "all" scope as well', () => {
    S().recordSettle('mines', 3);
    S().recordSettle('crash', -1);
    expect(selectSeries('all')(S())).toEqual([0, 3, 2]);
  });

  it('caps each series at SERIES_CAP points', () => {
    for (let i = 0; i < SERIES_CAP + 50; i++) S().recordSettle('mines', 1);
    expect(selectSeries('mines')(S())).toHaveLength(SERIES_CAP);
    // cumulative value is still correct at the tail
    const series = selectSeries('mines')(S());
    expect(series[series.length - 1]).toBe(SERIES_CAP + 50);
  });
});

describe("selectScopeStat('all')", () => {
  it('sums bets, wagered and pnl across every game', () => {
    S().recordWager('mines', 10);
    S().recordSettle('mines', 5);
    S().recordWager('blackjack', 20);
    S().recordSettle('blackjack', -8);
    const all = selectScopeStat('all')(S());
    expect(all.bets).toBe(2);
    expect(all.wagered).toBe(30);
    expect(all.pnl).toBe(-3);
  });
});

describe('reset', () => {
  it('clears all stats and series back to origin', () => {
    S().recordWager('mines', 10);
    S().recordSettle('mines', 5);
    S().reset();
    expect(selectScopeStat('all')(S())).toEqual({ bets: 0, wagered: 0, pnl: 0 });
    expect(selectSeries('all')(S())).toEqual([0]);
    expect(S().settleCount).toBe(0);
  });
});
