/**
 * Mines multiplier math — isolated, pure, exact.
 *
 * After revealing `k` safe gems with `m` mines on `n = 25` tiles, the
 * probability the player survived every pick is:
 *
 *     P(survive k) = ∏_{i=0}^{k-1} (n - m - i) / (n - i)
 *
 * The fair (zero-edge) multiplier is the reciprocal of that probability. A
 * house edge shrinks the payout multiplicatively:
 *
 *     multiplier = (1 - houseEdge) / P(survive k)
 *
 * Properties this guarantees:
 *  - 0 gems revealed → multiplier 1 (no risk taken yet, before edge).
 *  - More mines → steeper growth per pick (each pick is riskier).
 *  - Strictly increasing in gems revealed.
 */

import {
  MAX_MINES,
  MIN_MINES,
  TILE_COUNT,
  type MultiplierParams,
} from '@/types';

/** Default house edge: 1%. */
export const DEFAULT_HOUSE_EDGE = 0.01;

function assertInputs(mineCount: number, gemsRevealed: number): void {
  if (!Number.isInteger(mineCount) || mineCount < MIN_MINES || mineCount > MAX_MINES) {
    throw new RangeError(
      `mineCount must be an integer in [${MIN_MINES}, ${MAX_MINES}], got ${mineCount}`,
    );
  }
  const maxGems = TILE_COUNT - mineCount;
  if (!Number.isInteger(gemsRevealed) || gemsRevealed < 0 || gemsRevealed > maxGems) {
    throw new RangeError(
      `gemsRevealed must be an integer in [0, ${maxGems}] for ${mineCount} mines, got ${gemsRevealed}`,
    );
  }
}

/**
 * Multiplier for `gemsRevealed` safe picks at a given mine count.
 * Returns the raw (unrounded) value; round for display only.
 */
export function multiplier({
  mineCount,
  gemsRevealed,
  houseEdge = DEFAULT_HOUSE_EDGE,
}: MultiplierParams): number {
  assertInputs(mineCount, gemsRevealed);
  if (gemsRevealed === 0) return 1;

  // Survival probability as a running product of safe-tile odds per pick.
  let survival = 1;
  for (let i = 0; i < gemsRevealed; i++) {
    survival *= (TILE_COUNT - mineCount - i) / (TILE_COUNT - i);
  }

  return (1 - houseEdge) / survival;
}

/** Multiplier when every safe tile has been revealed (the round's ceiling). */
export const maxMultiplier = (
  mineCount: number,
  houseEdge: number = DEFAULT_HOUSE_EDGE,
): number =>
  multiplier({ mineCount, gemsRevealed: TILE_COUNT - mineCount, houseEdge });

/** Round a multiplier to 2 decimals for display (e.g. 1.0309 → 1.03). */
export const roundMultiplier = (value: number): number =>
  Math.round(value * 100) / 100;

/** Total returned to the player on cash-out (stake included). */
export const computePayout = (bet: number, mult: number): number => bet * mult;

/** Net profit on cash-out (stake excluded). */
export const computeProfit = (bet: number, mult: number): number => bet * mult - bet;
