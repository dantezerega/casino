import type { ProvablyFairSeeds } from '@/types';
import {
  PLINKO_ROWS,
  PLINKO_RISKS,
  type PlinkoResult,
  type PlinkoRisk,
  type PlinkoRound,
  type PlinkoRows,
} from '@/game/plinko/types';
import { generatePath, slotFromPath } from '@/game/plinko/pathGenerator';
import { getSlotMultiplier } from '@/game/plinko/payoutTables';

function assertRows(rows: number): asserts rows is PlinkoRows {
  if (!PLINKO_ROWS.includes(rows as PlinkoRows)) {
    throw new RangeError(`rows must be one of ${PLINKO_ROWS.join(', ')}, got ${rows}`);
  }
}

function assertRisk(risk: string): asserts risk is PlinkoRisk {
  if (!PLINKO_RISKS.includes(risk as PlinkoRisk)) {
    throw new RangeError(`risk must be one of ${PLINKO_RISKS.join(', ')}, got ${risk}`);
  }
}

export function createRound(
  seeds: ProvablyFairSeeds,
  rows: PlinkoRows,
  risk: PlinkoRisk,
): PlinkoRound {
  assertRows(rows);
  assertRisk(risk);
  const path = generatePath(seeds, rows);
  return {
    seeds,
    rows,
    risk,
    path,
    slot: slotFromPath(path),
  };
}

export const computePayout = (bet: number, mult: number): number => bet * mult;

export const computeProfit = (bet: number, mult: number): number => bet * mult - bet;

export function resolveDrop(round: PlinkoRound, bet: number): PlinkoResult {
  const multiplier = getSlotMultiplier(round.rows, round.risk, round.slot);
  return {
    path: round.path,
    slot: round.slot,
    multiplier,
    payout: computePayout(bet, multiplier),
    profit: computeProfit(bet, multiplier),
  };
}
