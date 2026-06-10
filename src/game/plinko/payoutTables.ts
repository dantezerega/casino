import { PLINKO_ROWS, PLINKO_RISKS, type PlinkoRisk, type PlinkoRows } from '@/game/plinko/types';

const PAYOUTS: Record<PlinkoRisk, Record<PlinkoRows, readonly number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [24, 5, 2, 1.4, 0.6, 0.4, 0.2, 0.4, 0.6, 1.4, 2, 5, 24],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [58, 8, 3, 2, 0.5, 0.2, 0.2, 0.2, 0.5, 2, 3, 8, 58],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

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

export function getMultipliers(rows: PlinkoRows, risk: PlinkoRisk): readonly number[] {
  assertRows(rows);
  assertRisk(risk);
  return PAYOUTS[risk][rows];
}

export function getSlotMultiplier(rows: PlinkoRows, risk: PlinkoRisk, slot: number): number {
  const multipliers = getMultipliers(rows, risk);
  if (!Number.isInteger(slot) || slot < 0 || slot >= multipliers.length) {
    throw new RangeError(`slot must be an integer in [0, ${multipliers.length - 1}], got ${slot}`);
  }
  return multipliers[slot];
}
