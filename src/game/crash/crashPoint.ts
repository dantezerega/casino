/**
 * Provably-fair crash-point derivation.
 *
 * The crash point is fixed the instant a round starts, derived deterministically
 * from the seed triplet — never from elapsed time. The player is shown
 * `sha256(serverSeed)` before the round (commitment); after the round the
 * plaintext server seed is revealed so the same inputs reproduce the exact
 * crash point (`verifyCrash`).
 *
 * Formula (the standard bustabit / Stake-compatible closed form):
 *
 *   1. H = first 52 bits of HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`),
 *      i.e. parseInt(hmacHex.slice(0, 13), 16) → an integer uniform in [0, 2^52).
 *   2. E = 2^52.
 *   3. raw = (E / (E − H)) × (1 − houseEdge).
 *   4. crashPoint = max(1.00, floor(raw × 100) / 100)   (2-decimal cents).
 *
 * Why this gives RTP 99% with a 1% edge:
 *   - For m > 1, P(crashPoint > m) = 0.99 / m, so cashing out at any target m
 *     has expected value m · (0.99/m) = 0.99 = 99% RTP.
 *   - P(raw ≤ 1) = P(H ≤ 0.01·E) = 0.01 → a 1% chance of an instant 1.00× bust,
 *     which is exactly where the house edge lives.
 *   - The max(1, …) clamp means the crash point is never below 1.00×.
 *   - As H → E the value diverges, giving the characteristic long, heavy tail
 *     (rare but unbounded high multipliers).
 *
 * Pure module: no React, no global state, no async.
 */

import { hmacSha256Hex } from '@/utils/crypto';
import { hashServerSeed } from '@/game/provablyFair';
import type { ProvablyFairSeeds } from '@/types';
import { CRASH_HOUSE_EDGE, type CrashVerification } from '@/game/crash/types';

/** 2^52 — the size of the 52-bit integer space the HMAC is reduced into. */
const E = 2 ** 52;

/**
 * Derive the crash point for a round from its seeds.
 * Deterministic and reproducible; the verification panel calls the same path.
 */
export function computeCrashPoint(
  seeds: ProvablyFairSeeds,
  houseEdge: number = CRASH_HOUSE_EDGE,
): number {
  const hex = hmacSha256Hex(seeds.serverSeed, `${seeds.clientSeed}:${seeds.nonce}`);
  // 13 hex digits = 52 bits, safely inside Number's 53-bit integer precision.
  const h = parseInt(hex.slice(0, 13), 16);

  const raw = (E / (E - h)) * (1 - houseEdge);
  // Floor to 2 decimals, then clamp so an instant bust shows a clean 1.00×.
  return Math.max(1, Math.floor(raw * 100) / 100);
}

/**
 * Verify a finished round: confirm the revealed server seed matches the original
 * commitment hash, and reproduce the crash point from the seeds.
 */
export function verifyCrash(
  seeds: ProvablyFairSeeds,
  houseEdge: number,
  expectedServerSeedHash: string,
): CrashVerification {
  return {
    hashValid: hashServerSeed(seeds.serverSeed) === expectedServerSeedHash,
    crashPoint: computeCrashPoint(seeds, houseEdge),
  };
}
