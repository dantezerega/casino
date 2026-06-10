import { describe, it, expect } from 'vitest';
import {
  generateMinePositions,
  hashServerSeed,
  verifyRound,
  generateServerSeed,
  generateClientSeed,
} from '@/game/provablyFair';
import { sha256Hex } from '@/utils/crypto';
import { MAX_MINES, MIN_MINES, TILE_COUNT } from '@/types';

const seeds = { serverSeed: 'srv_abc', clientSeed: 'cli_xyz', nonce: 7 };

describe('hashServerSeed', () => {
  it('is sha256 of the server seed', () => {
    expect(hashServerSeed('srv_abc')).toBe(sha256Hex('srv_abc'));
  });
});

describe('generateMinePositions', () => {
  it('is reproducible for identical seeds', () => {
    expect(generateMinePositions(seeds, 5)).toEqual(generateMinePositions(seeds, 5));
  });

  it('returns exactly mineCount positions', () => {
    for (const m of [1, 3, 5, 12, 24]) {
      expect(generateMinePositions(seeds, m)).toHaveLength(m);
    }
  });

  it('returns distinct, in-range, sorted indices', () => {
    const mines = generateMinePositions(seeds, 10);
    expect(new Set(mines).size).toBe(10);
    expect(mines.every((i) => i >= 0 && i < TILE_COUNT)).toBe(true);
    expect(mines).toEqual([...mines].sort((a, b) => a - b));
  });

  it('changes layout when the nonce changes', () => {
    expect(generateMinePositions(seeds, 5)).not.toEqual(
      generateMinePositions({ ...seeds, nonce: 8 }, 5),
    );
  });

  it('changes layout when the client seed changes', () => {
    expect(generateMinePositions(seeds, 5)).not.toEqual(
      generateMinePositions({ ...seeds, clientSeed: 'other' }, 5),
    );
  });

  it('covers every tile across many seeded draws (unbiased)', () => {
    const seen = new Set<number>();
    for (let nonce = 0; nonce < 300; nonce++) {
      for (const p of generateMinePositions({ ...seeds, nonce }, 5)) seen.add(p);
    }
    expect(seen.size).toBe(TILE_COUNT);
  });

  it.each([0, -1, MAX_MINES + 1, 2.5])('rejects invalid mineCount %j', (m) => {
    expect(() => generateMinePositions(seeds, m)).toThrow(RangeError);
  });

  it('accepts the boundary mine counts', () => {
    expect(() => generateMinePositions(seeds, MIN_MINES)).not.toThrow();
    expect(() => generateMinePositions(seeds, MAX_MINES)).not.toThrow();
  });
});

describe('verifyRound', () => {
  const commitment = hashServerSeed(seeds.serverSeed);

  it('validates a correct commitment and reproduces the board', () => {
    const expected = generateMinePositions(seeds, 3);
    const result = verifyRound(seeds, 3, commitment);
    expect(result.hashValid).toBe(true);
    expect(result.minePositions).toEqual(expected);
  });

  it('flags a mismatched commitment hash', () => {
    expect(verifyRound(seeds, 3, 'deadbeef').hashValid).toBe(false);
  });

  it('detects a tampered server seed', () => {
    const tampered = { ...seeds, serverSeed: 'srv_TAMPERED' };
    expect(verifyRound(tampered, 3, commitment).hashValid).toBe(false);
  });
});

describe('seed generators', () => {
  it('server seed is 64 hex chars (32 bytes)', () => {
    expect(generateServerSeed()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('client seed is 32 hex chars (16 bytes)', () => {
    expect(generateClientSeed()).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces unique seeds', () => {
    expect(generateServerSeed()).not.toBe(generateServerSeed());
  });
});
