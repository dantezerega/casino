/**
 * Domain types for the Crash game.
 *
 * Pure type module: no runtime logic, no React, no side effects. The seed
 * triplet (`ProvablyFairSeeds`) and the public commitment shape are shared with
 * Mines/Plinko and imported from `@/types` rather than redefined.
 */

import type { ProvablyFairSeeds } from '@/types';

/**
 * IDLE        — no active round; awaiting bet.
 * RUNNING     — multiplier rising; player may cash out before the crash.
 * CASHED_OUT  — player banked `bet × multiplier` before the crash.
 * CRASHED     — multiplier reached the hidden crash point; stake forfeited.
 */
export type CrashStatus = 'IDLE' | 'RUNNING' | 'CASHED_OUT' | 'CRASHED';

/** 1% house edge — baked into the crash-point distribution (RTP 99%). */
export const CRASH_HOUSE_EDGE = 0.01;

/**
 * Per-second growth rate of the rising multiplier: `m(t) = e^(RATE · seconds)`.
 * Tuned Stake-like (~1.5× at 7s, ~2× at 12s, ~3× at 18s). Purely cosmetic —
 * it sets the *pace* of the climb, never the crash point (which is fixed at
 * round start from the seeds, independent of time).
 */
export const CRASH_GROWTH_RATE = 0.06;

/**
 * Immutable description of a generated round produced by the engine. The crash
 * point is fixed the moment the round is created; the store hides it from the
 * UI until the round ends, then reveals it for verification.
 */
export interface CrashRound {
  seeds: ProvablyFairSeeds;
  /** Hidden multiplier at which the round busts (≥ 1.00). */
  crashPoint: number;
}

/** Outcome of a finished round, returned by the engine. */
export interface CrashResult {
  crashPoint: number;
  /** Multiplier the player locked in by cashing out, or null if they crashed. */
  cashedOutAt: number | null;
  /** Settled multiplier: the cash-out multiplier on a win, else the crash point. */
  multiplier: number;
  /** Credited back to the wallet (0 on a crash). */
  payout: number;
  /** Net profit: `payout − bet`. Negative (−bet) on a crash. */
  profit: number;
  won: boolean;
}

/** Compact record of a past round for the history strip. */
export interface CrashHistoryEntry {
  crashPoint: number;
  won: boolean;
  /** Multiplier the player realised (cash-out mult on a win, crash point on a loss). */
  multiplier: number;
}

/** Result of verifying a finished round against its revealed seeds. */
export interface CrashVerification {
  /** Recomputed hash matches the original commitment. */
  hashValid: boolean;
  /** Crash point reproduced from the revealed seeds. */
  crashPoint: number;
}
