import { describe, it, expect, beforeEach } from 'vitest';
import {
  useCrashStore,
  selectCanStart,
  selectCanCashOut,
  selectPotentialProfit,
  selectPotentialPayout,
  CRASH_HISTORY_LIMIT,
} from '@/store/crashStore';
import { useGameStore } from '@/store/gameStore';
import { timeToMultiplier } from '@/game/crash/crashEngine';

const C = () => useCrashStore.getState();
const balance = () => useGameStore.getState().balance;

beforeEach(() => {
  useGameStore.setState({ balance: 1000 });
  useCrashStore.setState({
    status: 'IDLE',
    betAmount: 10,
    currentMultiplier: 1,
    startedAt: null,
    result: null,
    history: [],
    clientSeed: 'client',
    nonce: 0,
    houseEdge: 0.01,
    round: null,
    commitment: null,
  });
});

/** Elapsed (ms) that lands the live multiplier just below `target`. */
const elapsedFor = (target: number): number => timeToMultiplier(target);

describe('start / guards', () => {
  it('begins IDLE', () => {
    expect(C().status).toBe('IDLE');
  });

  it('start deducts the bet, fixes a round, commits a hash, goes RUNNING', () => {
    C().start();
    expect(C().status).toBe('RUNNING');
    expect(balance()).toBe(990);
    expect(C().round?.crashPoint).toBeGreaterThanOrEqual(1);
    expect(C().commitment?.serverSeedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(C().currentMultiplier).toBe(1);
  });

  it('rejects a start when the bet exceeds the balance', () => {
    C().setBetAmount(99999);
    C().start();
    expect(C().status).toBe('IDLE');
    expect(balance()).toBe(1000);
  });

  it('rejects a start with a non-positive bet', () => {
    C().setBetAmount(0);
    C().start();
    expect(C().status).toBe('IDLE');
    expect(balance()).toBe(1000);
  });

  it('a second start while RUNNING is a no-op (no double-deduct)', () => {
    C().start();
    const afterStart = balance();
    C().start();
    expect(balance()).toBe(afterStart);
  });

  it('locks bet and seed edits while RUNNING', () => {
    C().start();
    C().setBetAmount(50);
    C().setClientSeed('hacked');
    C().regenerateClientSeed();
    expect(C().betAmount).toBe(10);
    expect(C().clientSeed).toBe('client');
  });

  it('sets and regenerates the client seed while not RUNNING', () => {
    C().setClientSeed('mine');
    expect(C().clientSeed).toBe('mine');
    C().regenerateClientSeed();
    expect(C().clientSeed).not.toBe('mine');
    expect(C().clientSeed).toMatch(/^[0-9a-f]+$/);
  });
});

describe('tick / crash', () => {
  it('advances the live multiplier while below the crash point', () => {
    C().start();
    const cp = C().round!.crashPoint;
    C().tick(elapsedFor(Math.min(cp, 1.5) * 0.9));
    expect(C().status).toBe('RUNNING');
    expect(C().currentMultiplier).toBeGreaterThan(1);
    expect(C().currentMultiplier).toBeLessThan(cp);
  });

  it('crashes when the multiplier reaches the crash point', () => {
    C().start();
    const cp = C().round!.crashPoint;
    C().tick(elapsedFor(cp) + 5000); // well past the crash point
    expect(C().status).toBe('CRASHED');
    expect(C().currentMultiplier).toBe(cp);
    expect(C().result?.won).toBe(false);
    expect(C().result?.profit).toBe(-10);
    expect(C().result?.payout).toBe(0);
  });

  it('tick is a no-op when not RUNNING', () => {
    C().tick(5000);
    expect(C().status).toBe('IDLE');
    expect(C().currentMultiplier).toBe(1);
  });
});

describe('cashOut', () => {
  it('banks bet × current multiplier and goes CASHED_OUT', () => {
    // Force a high crash point so a mid-run cash-out is reachable.
    useCrashStore.setState({ clientSeed: 'client' });
    let cp = 0;
    let n = 0;
    do {
      useCrashStore.setState({ nonce: n, status: 'IDLE' });
      C().start();
      cp = C().round!.crashPoint;
      if (cp <= 2) C().reset();
      n += 1;
    } while (cp <= 2 && n < 500);

    C().tick(elapsedFor(2)); // climb to ~2×, safely below cp
    const mult = C().currentMultiplier;
    const before = balance();
    C().cashOut();

    expect(C().status).toBe('CASHED_OUT');
    expect(C().result?.won).toBe(true);
    expect(balance() - before).toBeCloseTo(10 * mult, 8);
    expect(C().result?.profit).toBeCloseTo(10 * mult - 10, 8);
  });

  it('cashOut is a no-op when not RUNNING', () => {
    const before = balance();
    C().cashOut();
    expect(C().status).toBe('IDLE');
    expect(balance()).toBe(before);
  });

  it('cannot cash out after a crash', () => {
    C().start();
    C().tick(elapsedFor(C().round!.crashPoint) + 5000);
    const afterCrash = balance();
    C().cashOut();
    expect(C().status).toBe('CRASHED');
    expect(balance()).toBe(afterCrash);
  });
});

describe('reset / history', () => {
  it('records the finished round and returns to IDLE, advancing the nonce', () => {
    C().start();
    const startNonce = C().nonce;
    C().tick(elapsedFor(C().round!.crashPoint) + 5000);
    const cp = C().result!.crashPoint;
    C().reset();
    expect(C().status).toBe('IDLE');
    expect(C().round).toBeNull();
    expect(C().history[0]).toEqual({ crashPoint: cp, won: false, multiplier: cp });
    expect(C().nonce).toBe(startNonce + 1);
  });

  it('refuses to reset while RUNNING', () => {
    C().start();
    C().reset();
    expect(C().status).toBe('RUNNING');
  });

  it('reset with no settled result leaves history untouched', () => {
    useCrashStore.setState({ history: [{ crashPoint: 2, won: true, multiplier: 2 }] });
    C().reset(); // IDLE, result === null
    expect(C().history).toEqual([{ crashPoint: 2, won: true, multiplier: 2 }]);
  });

  it('caps the history at the limit', () => {
    for (let i = 0; i < CRASH_HISTORY_LIMIT + 5; i++) {
      useGameStore.setState({ balance: 1000 });
      C().start();
      C().tick(elapsedFor(C().round!.crashPoint) + 5000);
      C().reset();
    }
    expect(C().history).toHaveLength(CRASH_HISTORY_LIMIT);
  });
});

describe('money invariant (Δbalance === reported profit) over many rounds', () => {
  it('holds across crashes and cash-outs', () => {
    for (let round = 0; round < 300; round++) {
      useGameStore.setState({ balance: 1_000_000 });
      useCrashStore.setState({
        status: 'IDLE',
        nonce: round,
        round: null,
        result: null,
        currentMultiplier: 1,
      });

      C().setBetAmount(1 + (round % 50));
      const start = balance();
      C().start();
      const cp = C().round!.crashPoint;

      // Alternate strategies: cash out below cp, or ride into the crash.
      if (round % 2 === 0 && cp > 1.2) {
        C().tick(elapsedFor(Math.min(cp * 0.8, cp - 0.05)));
        C().cashOut();
      } else {
        C().tick(elapsedFor(cp) + 5000);
      }

      expect(balance() - start).toBeCloseTo(C().result!.profit, 8);
    }
  });
});

describe('selectors', () => {
  it('selectCanStart tracks bet vs balance and the RUNNING lock', () => {
    expect(selectCanStart(C())).toBe(true);
    C().start();
    expect(selectCanStart(C())).toBe(false); // RUNNING
  });

  it('selectCanCashOut is true only while RUNNING', () => {
    expect(selectCanCashOut(C())).toBe(false);
    C().start();
    expect(selectCanCashOut(C())).toBe(true);
  });

  it('potential profit/payout reflect the live multiplier mid-run', () => {
    C().start();
    C().tick(elapsedFor(Math.min(C().round!.crashPoint, 1.4) * 0.9));
    const m = C().currentMultiplier;
    expect(selectPotentialPayout(C())).toBeCloseTo(10 * m, 8);
    expect(selectPotentialProfit(C())).toBeCloseTo(10 * m - 10, 8);
  });

  it('potential profit is 0 when not RUNNING', () => {
    expect(selectPotentialProfit(C())).toBe(0);
  });
});
