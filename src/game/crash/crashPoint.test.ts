import { describe, it, expect } from 'vitest';
import { computeCrashPoint, verifyCrash } from '@/game/crash/crashPoint';
import { hashServerSeed } from '@/game/provablyFair';
import { hmacSha256Hex } from '@/utils/crypto';
import { CRASH_HOUSE_EDGE } from '@/game/crash/types';
import type { ProvablyFairSeeds } from '@/types';

const seeds = (over: Partial<ProvablyFairSeeds> = {}): ProvablyFairSeeds => ({
  serverSeed: 'srv',
  clientSeed: 'cli',
  nonce: 0,
  ...over,
});

/** Reference implementation of the published formula, recomputed independently. */
function reference(s: ProvablyFairSeeds, edge = CRASH_HOUSE_EDGE): number {
  const E = 2 ** 52;
  const h = parseInt(hmacSha256Hex(s.serverSeed, `${s.clientSeed}:${s.nonce}`).slice(0, 13), 16);
  return Math.max(1, Math.floor((E / (E - h)) * (1 - edge) * 100) / 100);
}

describe('computeCrashPoint', () => {
  it('is deterministic for identical seeds', () => {
    expect(computeCrashPoint(seeds())).toBe(computeCrashPoint(seeds()));
  });

  it('matches an independent reference implementation of the formula', () => {
    for (let n = 0; n < 50; n++) {
      const s = seeds({ nonce: n, serverSeed: `server-${n}`, clientSeed: `client-${n}` });
      expect(computeCrashPoint(s)).toBe(reference(s));
    }
  });

  it('never returns below 1.00×', () => {
    for (let n = 0; n < 2000; n++) {
      expect(computeCrashPoint(seeds({ nonce: n, serverSeed: `s${n}` }))).toBeGreaterThanOrEqual(1);
    }
  });

  it('is quantised to 2 decimals (cents)', () => {
    for (let n = 0; n < 200; n++) {
      const cp = computeCrashPoint(seeds({ nonce: n, serverSeed: `q${n}` }));
      expect(Math.round(cp * 100)).toBeCloseTo(cp * 100, 9);
    }
  });

  it('a different house edge changes the result downward', () => {
    // A bigger edge shrinks (1 - edge), so the crash point can only fall or hold.
    const s = seeds({ serverSeed: 'edge-test', nonce: 7 });
    expect(computeCrashPoint(s, 0.1)).toBeLessThanOrEqual(computeCrashPoint(s, 0.01));
  });

  describe('distribution (provably-fair sanity over many seeds)', () => {
    const N = 20000;
    let instantBust = 0;
    let atLeastTwo = 0;
    let sumRtpAtTwo = 0;
    for (let n = 0; n < N; n++) {
      const cp = computeCrashPoint(seeds({ nonce: n, serverSeed: `dist-${n}` }));
      if (cp <= 1) instantBust += 1;
      if (cp >= 2) {
        atLeastTwo += 1;
        sumRtpAtTwo += 2; // payout multiple when cashing at 2× and surviving
      }
    }

    it('busts instantly (shows 1.00×) on ~2% of rounds', () => {
      // The economic edge is 1% (see the RTP test below), but cents-flooring
      // rounds every raw value in [1.00, 1.01) down to 1.00×, so the *displayed*
      // instant-bust mass is ~1.98% — the 1% edge plus the sub-1.01 tail.
      expect(instantBust / N).toBeGreaterThan(0.015);
      expect(instantBust / N).toBeLessThan(0.025);
    });

    it('reaches 2× on about 0.99/2 ≈ 49.5% of rounds', () => {
      expect(atLeastTwo / N).toBeGreaterThan(0.46);
      expect(atLeastTwo / N).toBeLessThan(0.53);
    });

    it('yields ~99% RTP for a fixed 2× cash-out strategy', () => {
      // EV per unit staked = (fraction surviving to 2×) × 2.
      expect(sumRtpAtTwo / N).toBeGreaterThan(0.95);
      expect(sumRtpAtTwo / N).toBeLessThan(1.03);
    });

    it('produces a long tail (occasional very high multipliers)', () => {
      let max = 0;
      for (let n = 0; n < N; n++) {
        const cp = computeCrashPoint(seeds({ nonce: n, serverSeed: `tail-${n}` }));
        if (cp > max) max = cp;
      }
      // P(≥50×) ≈ 2%, so across 20k rounds a 50×+ is essentially certain.
      expect(max).toBeGreaterThan(50);
    });
  });
});

describe('verifyCrash', () => {
  it('confirms a matching commitment and reproduces the crash point', () => {
    const s = seeds({ serverSeed: 'reveal-me', nonce: 3 });
    const hash = hashServerSeed(s.serverSeed);
    const result = verifyCrash(s, CRASH_HOUSE_EDGE, hash);
    expect(result.hashValid).toBe(true);
    expect(result.crashPoint).toBe(computeCrashPoint(s));
  });

  it('flags a tampered commitment', () => {
    const s = seeds({ serverSeed: 'reveal-me', nonce: 3 });
    const result = verifyCrash(s, CRASH_HOUSE_EDGE, 'deadbeef');
    expect(result.hashValid).toBe(false);
    // The crash point is still reproduced from whatever seeds were supplied.
    expect(result.crashPoint).toBe(computeCrashPoint(s));
  });
});
