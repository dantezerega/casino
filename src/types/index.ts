/**
 * Domain types for the Mines game — single source of truth.
 *
 * Imported by the engine (Phase 2), store (Phase 3), and UI (Phase 4).
 * Pure type module: no runtime values, no React, no side effects.
 */

// ---------------------------------------------------------------------------
// Board geometry
// ---------------------------------------------------------------------------

/** Grid is fixed 5x5. */
export const GRID_SIZE = 5;
/** Total tiles on the board (25). */
export const TILE_COUNT = GRID_SIZE * GRID_SIZE;
/** Mines must stay in [1, 24] so at least one safe tile always exists. */
export const MIN_MINES = 1;
export const MAX_MINES = TILE_COUNT - 1;

/** Flat board index, 0..24. Branded for intent, still assignable to number. */
export type TileIndex = number;

// ---------------------------------------------------------------------------
// Tiles
// ---------------------------------------------------------------------------

/** What a tile turns out to be once the board is generated. */
export type TileKind = 'gem' | 'mine';

/**
 * A single tile's view state. `kind` is the ground truth (known internally
 * from board generation); `revealed` controls what the player has uncovered.
 */
export interface Tile {
  index: TileIndex;
  kind: TileKind;
  revealed: boolean;
  /** True only for tiles the player actively clicked (vs auto-revealed on end). */
  picked: boolean;
}

// ---------------------------------------------------------------------------
// Game status
// ---------------------------------------------------------------------------

/**
 * IDLE        — no active round; awaiting bet.
 * PLAYING     — round live; player picking tiles or able to cash out.
 * LOST        — a mine was hit; board fully revealed, stake forfeited.
 * CASHED_OUT  — player banked profit; board revealed, round closed.
 */
export type GameStatus = 'IDLE' | 'PLAYING' | 'LOST' | 'CASHED_OUT';

// ---------------------------------------------------------------------------
// Provably fair
// ---------------------------------------------------------------------------

/**
 * The three inputs that deterministically generate a board.
 * Same triplet -> same mine layout, always (reproducible / verifiable).
 */
export interface ProvablyFairSeeds {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

/**
 * Public commitment shown before a round: the player sees the hashed server
 * seed up front, then the plaintext server seed is revealed after the round
 * so they can verify it matches the commitment and reproduce the board.
 */
export interface ProvablyFairCommitment {
  /** SHA-256 of the server seed, shown before play. */
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

/** Result of verifying a finished round against its revealed seeds. */
export interface VerificationResult {
  /** Recomputed hash matches the original commitment. */
  hashValid: boolean;
  /** Mine positions reproduced from the revealed seeds. */
  minePositions: TileIndex[];
}

// ---------------------------------------------------------------------------
// Engine round model
// ---------------------------------------------------------------------------

/**
 * Immutable description of a generated round produced by the engine.
 * The store layers mutable view state (revealed picks, status) on top.
 */
export interface Round {
  seeds: ProvablyFairSeeds;
  mineCount: number;
  /** Sorted flat indices that contain mines. */
  minePositions: TileIndex[];
}

/** Outcome of a single tile pick, returned by the engine. */
export interface PickOutcome {
  kind: TileKind;
  /** Safe tiles revealed so far including this pick (0 if mine hit). */
  gemsRevealed: number;
  /** Multiplier earned at this pick count (1 if mine hit). */
  multiplier: number;
}

// ---------------------------------------------------------------------------
// Multiplier
// ---------------------------------------------------------------------------

/**
 * Inputs to a multiplier calculation. House edge is a fraction in [0, 1)
 * applied to the fair multiplier (e.g. 0.01 = 1% edge).
 */
export interface MultiplierParams {
  mineCount: number;
  gemsRevealed: number;
  houseEdge?: number;
}

// ---------------------------------------------------------------------------
// Aggregate game state (shape the Zustand store will hold)
// ---------------------------------------------------------------------------

export interface GameState {
  status: GameStatus;
  tiles: Tile[];
  betAmount: number;
  mineCount: number;
  /** Count of safe tiles the player has revealed this round. */
  gemsRevealed: number;
  /** Multiplier locked in by the current number of safe picks. */
  multiplier: number;
  /** Realized profit once cashed out (0 while playing / on loss). */
  profit: number;
  /** Player balance/bankroll the bet is drawn from. */
  balance: number;
  commitment: ProvablyFairCommitment | null;
}
