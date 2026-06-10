import { describe, it, expect } from 'vitest';
import {
  createRound,
  createTiles,
  pickTile,
  isMine,
  revealTile,
  revealAll,
  safeTilesRemaining,
} from '@/game/minesEngine';
import { multiplier } from '@/game/multiplier';
import { TILE_COUNT } from '@/types';

const seeds = { serverSeed: 's', clientSeed: 'c', nonce: 1 };

const round = createRound(seeds, 3);
const firstSafe = (): number =>
  [...Array(TILE_COUNT).keys()].find((i) => !round.minePositions.includes(i))!;

describe('createRound', () => {
  it('generates a round with the given mine count and seeds', () => {
    expect(round.mineCount).toBe(3);
    expect(round.minePositions).toHaveLength(3);
    expect(round.seeds).toEqual(seeds);
  });

  it('rejects invalid mine counts', () => {
    expect(() => createRound(seeds, 0)).toThrow(RangeError);
    expect(() => createRound(seeds, 25)).toThrow(RangeError);
  });
});

describe('createTiles', () => {
  const tiles = createTiles(round.minePositions);

  it('builds 25 tiles, all hidden and unpicked', () => {
    expect(tiles).toHaveLength(TILE_COUNT);
    expect(tiles.every((t) => !t.revealed && !t.picked)).toBe(true);
  });

  it('marks exactly mineCount tiles as mines', () => {
    expect(tiles.filter((t) => t.kind === 'mine')).toHaveLength(3);
  });

  it('places mines at the round positions', () => {
    for (const p of round.minePositions) expect(tiles[p].kind).toBe('mine');
  });
});

describe('isMine', () => {
  it('identifies mine and safe tiles', () => {
    expect(isMine(round, round.minePositions[0])).toBe(true);
    expect(isMine(round, firstSafe())).toBe(false);
  });

  it('rejects out-of-range indices', () => {
    expect(() => isMine(round, -1)).toThrow(RangeError);
    expect(() => isMine(round, 25)).toThrow(RangeError);
  });
});

describe('pickTile', () => {
  it('returns a mine outcome with collapsed multiplier', () => {
    const out = pickTile(round, round.minePositions[0], 0);
    expect(out).toEqual({ kind: 'mine', gemsRevealed: 0, multiplier: 1 });
  });

  it('returns a gem outcome with incremented count and correct multiplier', () => {
    const out = pickTile(round, firstSafe(), 0);
    expect(out.kind).toBe('gem');
    expect(out.gemsRevealed).toBe(1);
    expect(out.multiplier).toBeCloseTo(
      multiplier({ mineCount: 3, gemsRevealed: 1 }),
      12,
    );
  });

  it('rejects out-of-range indices', () => {
    expect(() => pickTile(round, 99, 0)).toThrow(RangeError);
  });
});

describe('reveal helpers', () => {
  it('revealTile marks one tile revealed + picked, leaving the rest untouched', () => {
    const tiles = createTiles(round.minePositions);
    const idx = firstSafe();
    const next = revealTile(tiles, idx);
    expect(next[idx].revealed && next[idx].picked).toBe(true);
    expect(next.filter((t) => t.picked)).toHaveLength(1);
    expect(tiles[idx].revealed).toBe(false); // original not mutated
  });

  it('revealAll reveals every tile but preserves picked', () => {
    const tiles = revealTile(createTiles(round.minePositions), firstSafe());
    const all = revealAll(tiles);
    expect(all.every((t) => t.revealed)).toBe(true);
    expect(all.filter((t) => t.picked)).toHaveLength(1);
  });
});

describe('safeTilesRemaining', () => {
  it('counts hidden safe tiles', () => {
    expect(safeTilesRemaining(round, 0)).toBe(TILE_COUNT - 3);
    expect(safeTilesRemaining(round, 5)).toBe(TILE_COUNT - 3 - 5);
  });

  it('reaches zero when the board is cleared', () => {
    expect(safeTilesRemaining(round, TILE_COUNT - 3)).toBe(0);
  });
});
