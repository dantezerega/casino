/**
 * Crash game engine — pure rules and math.
 *
 * Responsibilities:
 *   - build a round (fixes the hidden crash point from the seeds),
 *   - map elapsed time → the rising multiplier (and its inverse),
 *   - settle a round into a `CrashResult` (cash-out win or crash loss).
 *
 * No React, no store, no clock, no side effects. The store owns the wallet and
 * the state machine; a hook owns the wall-clock that feeds `multiplierAt`.
 */

import type { ProvablyFairSeeds } from '@/types';
import {
  CRASH_GROWTH_RATE,
  CRASH_HOUSE_EDGE,
  type CrashResult,
  type CrashRound,
} from '@/game/crash/types';
import { computeCrashPoint } from '@/game/crash/crashPoint';

/** Build a round; the crash point is fixed now and does not depend on time. */
export function createRound(
  seeds: ProvablyFairSeeds,
  houseEdge: number = CRASH_HOUSE_EDGE,
): CrashRound {
  return { seeds, crashPoint: computeCrashPoint(seeds, houseEdge) };
}

/**
 * The rising multiplier at a given elapsed time: `m(t) = e^(RATE · seconds)`.
 * Equals exactly 1.00 at t = 0 and is strictly increasing. Purely cosmetic
 * pacing — it never decides the crash point.
 */
export function multiplierAt(elapsedMs: number): number {
  const seconds = Math.max(0, elapsedMs) / 1000;
  return Math.exp(CRASH_GROWTH_RATE * seconds);
}

/**
 * Inverse of `multiplierAt`: the elapsed time (ms) at which the climb reaches a
 * given multiplier. Lets the clock know when the visual crash should land.
 * Multipliers ≤ 1 map to t = 0.
 */
export function timeToMultiplier(multiplier: number): number {
  if (multiplier <= 1) return 0;
  return (Math.log(multiplier) / CRASH_GROWTH_RATE) * 1000;
}

export const computePayout = (bet: number, mult: number): number => bet * mult;

export const computeProfit = (bet: number, mult: number): number => bet * mult - bet;

/**
 * Settle a successful cash-out at `atMultiplier`. The caller (store) only calls
 * this while RUNNING, where `atMultiplier < crashPoint` is guaranteed, so no
 * crash-point check is needed here.
 */
export function resolveCashOut(
  round: CrashRound,
  bet: number,
  atMultiplier: number,
): CrashResult {
  return {
    crashPoint: round.crashPoint,
    cashedOutAt: atMultiplier,
    multiplier: atMultiplier,
    payout: computePayout(bet, atMultiplier),
    profit: computeProfit(bet, atMultiplier),
    won: true,
  };
}

/** Settle a crashed round: the player banked nothing and forfeits the stake. */
export function resolveCrash(round: CrashRound, bet: number): CrashResult {
  return {
    crashPoint: round.crashPoint,
    cashedOutAt: null,
    multiplier: round.crashPoint,
    payout: 0,
    profit: -bet,
    won: false,
  };
}
