import { describe, it, expect } from 'vitest';
import { generatePath, slotFromPath } from '@/game/plinko/pathGenerator';
import { PLINKO_ROWS } from '@/game/plinko/types';
import type { ProvablyFairSeeds } from '@/types';

const seeds = (over: Partial<ProvablyFairSeeds> = {}): ProvablyFairSeeds => ({
  serverSeed: 'server-seed-abc',
  clientSeed: 'client-seed-xyz',
  nonce: 0,
  ...over,
});

describe('generatePath', () => {
  it('produces a path of length equal to rows', () => {
    for (const rows of PLINKO_ROWS) {
      expect(generatePath(seeds(), rows)).toHaveLength(rows);
    }
  });

  it('emits only L or R', () => {
    const path = generatePath(seeds(), 16);
    for (const dir of path) {
      expect(dir === 'L' || dir === 'R').toBe(true);
    }
  });

  it('is deterministic for the same seeds and rows', () => {
    expect(generatePath(seeds(), 12)).toEqual(generatePath(seeds(), 12));
  });

  it('changes with the nonce', () => {
    const a = generatePath(seeds({ nonce: 0 }), 16);
    const b = generatePath(seeds({ nonce: 1 }), 16);
    expect(a).not.toEqual(b);
  });

  it('changes with the client seed', () => {
    const a = generatePath(seeds({ clientSeed: 'one' }), 16);
    const b = generatePath(seeds({ clientSeed: 'two' }), 16);
    expect(a).not.toEqual(b);
  });

  it('rejects invalid row counts', () => {
    expect(() => generatePath(seeds(), 10 as never)).toThrow(RangeError);
  });
});

describe('slotFromPath', () => {
  it('counts right moves', () => {
    expect(slotFromPath(['L', 'L', 'L'])).toBe(0);
    expect(slotFromPath(['R', 'R', 'R'])).toBe(3);
    expect(slotFromPath(['L', 'R', 'L', 'R'])).toBe(2);
  });

  it('always yields a slot in [0, rows] over many random seeds', () => {
    for (const rows of PLINKO_ROWS) {
      for (let n = 0; n < 500; n++) {
        const path = generatePath(seeds({ nonce: n, serverSeed: `s${n}` }), rows);
        const slot = slotFromPath(path);
        expect(slot).toBeGreaterThanOrEqual(0);
        expect(slot).toBeLessThanOrEqual(rows);
      }
    }
  });

  it('covers a spread of slots across many seeds (not stuck on one)', () => {
    const slots = new Set<number>();
    for (let n = 0; n < 1000; n++) {
      slots.add(slotFromPath(generatePath(seeds({ nonce: n }), 16)));
    }
    expect(slots.size).toBeGreaterThan(5);
  });
});
