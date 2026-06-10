/**
 * Mines game engine — the rules layer.
 *
 * Pure orchestration over provably-fair board generation and multiplier math.
 * Every function takes plain data and returns new data; nothing is mutated and
 * there is no React or store dependency. The Zustand store (Phase 3) drives
 * these functions and holds the resulting view state.
 */

import {
  MAX_MINES,
  MIN_MINES,
  TILE_COUNT,
  type PickOutcome,
  type ProvablyFairSeeds,
  type Round,
  type Tile,
  type TileIndex,
} from '@/types';
import { generateMinePositions } from '@/game/provablyFair';
import { DEFAULT_HOUSE_EDGE, multiplier } from '@/game/multiplier';

function assertMineCount(mineCount: number): void {
  if (!Number.isInteger(mineCount) || mineCount < MIN_MINES || mineCount > MAX_MINES) {
    throw new RangeError(
      `mineCount must be an integer in [${MIN_MINES}, ${MAX_MINES}], got ${mineCount}`,
    );
  }
}

function assertTileIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= TILE_COUNT) {
    throw new RangeError(`tile index must be in [0, ${TILE_COUNT - 1}], got ${index}`);
  }
}

/**
 * Create an immutable round: validate inputs and deterministically place mines
 * from the provably-fair seeds.
 */
export function createRound(seeds: ProvablyFairSeeds, mineCount: number): Round {
  assertMineCount(mineCount);
  return {
    seeds,
    mineCount,
    minePositions: generateMinePositions(seeds, mineCount),
  };
}

/** All 25 tiles for a round, each hidden, kind set from the mine layout. */
export function createTiles(minePositions: TileIndex[]): Tile[] {
  const mineSet = new Set(minePositions);
  return Array.from({ length: TILE_COUNT }, (_, index) => ({
    index,
    kind: mineSet.has(index) ? ('mine' as const) : ('gem' as const),
    revealed: false,
    picked: false,
  }));
}

/** Whether a given tile is a mine in this round. */
export const isMine = (round: Round, index: TileIndex): boolean => {
  assertTileIndex(index);
  return round.minePositions.includes(index);
};

/**
 * Resolve a single tile pick.
 *
 * @param gemsRevealedBefore safe gems already revealed this round (pre-pick).
 * Returns the tile kind, the new gem count, and the multiplier locked in.
 * On a mine the multiplier collapses to 1 and gem count to 0 (round is lost).
 */
export function pickTile(
  round: Round,
  index: TileIndex,
  gemsRevealedBefore: number,
  houseEdge: number = DEFAULT_HOUSE_EDGE,
): PickOutcome {
  assertTileIndex(index);

  if (isMine(round, index)) {
    return { kind: 'mine', gemsRevealed: 0, multiplier: 1 };
  }

  const gemsRevealed = gemsRevealedBefore + 1;
  return {
    kind: 'gem',
    gemsRevealed,
    multiplier: multiplier({ mineCount: round.mineCount, gemsRevealed, houseEdge }),
  };
}

/** Reveal every tile (used on loss / cash-out to expose the full board). */
export const revealAll = (tiles: Tile[]): Tile[] =>
  tiles.map((tile) => ({ ...tile, revealed: true }));

/**
 * Reveal a single tile by index as a deliberate player pick (marks `picked`),
 * leaving the rest unchanged.
 */
export const revealTile = (tiles: Tile[], index: TileIndex): Tile[] => {
  assertTileIndex(index);
  return tiles.map((tile) =>
    tile.index === index ? { ...tile, revealed: true, picked: true } : tile,
  );
};

/** Count of safe tiles still hidden — zero means the board is cleared. */
export const safeTilesRemaining = (round: Round, gemsRevealed: number): number =>
  TILE_COUNT - round.mineCount - gemsRevealed;
