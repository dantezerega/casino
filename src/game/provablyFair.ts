/**
 * Provably-fair board generation.
 *
 * Guarantees:
 *  - Commitment: the player is shown `sha256(serverSeed)` BEFORE a round. After
 *    the round the plaintext server seed is revealed; hashing it must reproduce
 *    the commitment, proving the layout was fixed in advance.
 *  - Reproducible: the same (serverSeed, clientSeed, nonce) always yields the
 *    same mine positions. `verifyRound` recomputes them from revealed seeds.
 *
 * Algorithm (Stake-compatible):
 *  1. Random byte stream = HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${round}`)
 *     for round = 0, 1, 2, … concatenated until enough bytes are produced.
 *  2. Bytes are consumed 4 at a time into floats in [0, 1).
 *  3. Floats drive a Fisher-Yates shuffle of the tile indices [0..24].
 *  4. The first `mineCount` shuffled indices are the mines (returned sorted).
 *
 * Pure module: no React, no global state, no async.
 */

import { hmacSha256Bytes, sha256Hex, utf8 } from '@/utils/crypto';
import {
  MAX_MINES,
  MIN_MINES,
  TILE_COUNT,
  type ProvablyFairSeeds,
  type TileIndex,
  type VerificationResult,
} from '@/types';

/** SHA-256 of the server seed — the public pre-round commitment. */
export const hashServerSeed = (serverSeed: string): string => sha256Hex(serverSeed);

/**
 * Lazily yields uniform floats in [0, 1) derived from the seed triplet.
 * Each HMAC round provides 32 bytes = 8 floats; rounds advance as needed.
 */
function* floatStream(seeds: ProvablyFairSeeds): Generator<number> {
  const key = utf8(seeds.serverSeed);
  let round = 0;
  while (true) {
    const block = hmacSha256Bytes(
      key,
      utf8(`${seeds.clientSeed}:${seeds.nonce}:${round}`),
    );
    for (let i = 0; i + 4 <= block.length; i += 4) {
      // Big-endian base-256 fraction → uniform in [0, 1).
      const float =
        block[i] / 256 +
        block[i + 1] / 256 ** 2 +
        block[i + 2] / 256 ** 3 +
        block[i + 3] / 256 ** 4;
      yield float;
    }
    round += 1;
  }
}

function assertMineCount(mineCount: number): void {
  if (!Number.isInteger(mineCount) || mineCount < MIN_MINES || mineCount > MAX_MINES) {
    throw new RangeError(
      `mineCount must be an integer in [${MIN_MINES}, ${MAX_MINES}], got ${mineCount}`,
    );
  }
}

/**
 * Generate the sorted mine positions for a round from its seeds.
 * Deterministic and reproducible; the verification panel calls the same path.
 */
export function generateMinePositions(
  seeds: ProvablyFairSeeds,
  mineCount: number,
): TileIndex[] {
  assertMineCount(mineCount);

  const tiles: TileIndex[] = Array.from({ length: TILE_COUNT }, (_, i) => i);
  const rng = floatStream(seeds);

  // Fisher-Yates: one fresh float per swap, high index → low.
  for (let i = TILE_COUNT - 1; i > 0; i--) {
    const r = rng.next().value as number;
    const j = Math.floor(r * (i + 1));
    const tmp = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = tmp;
  }

  return tiles.slice(0, mineCount).sort((a, b) => a - b);
}

/**
 * Verify a finished round: confirm the revealed server seed matches the
 * original commitment hash, and reproduce the mine positions.
 */
export function verifyRound(
  seeds: ProvablyFairSeeds,
  mineCount: number,
  expectedServerSeedHash: string,
): VerificationResult {
  return {
    hashValid: hashServerSeed(seeds.serverSeed) === expectedServerSeedHash,
    minePositions: generateMinePositions(seeds, mineCount),
  };
}

// --- seed helpers -----------------------------------------------------------

/** Cryptographically-random hex string (browser/node `crypto.getRandomValues`). */
export function randomHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

/** Fresh server seed (32 random bytes, hex). */
export const generateServerSeed = (): string => randomHex(32);

/** Default client seed (16 random bytes, hex) — player may override. */
export const generateClientSeed = (): string => randomHex(16);
