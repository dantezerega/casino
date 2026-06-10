/**
 * Zustand store — the Mines game state machine.
 *
 * Holds view state (status, tiles, balances, multiplier) and orchestrates the
 * pure engine. No game math lives here: board generation, picks, and
 * multipliers all come from `@/game/*`. Actions guard on `status` so illegal
 * moves (e.g. revealing a tile while IDLE) are silent no-ops rather than throws.
 *
 * Lifecycle: IDLE → PLAYING → (LOST | CASHED_OUT) → IDLE.
 */

import { create } from 'zustand';
import {
  MAX_MINES,
  MIN_MINES,
  type GameStatus,
  type ProvablyFairCommitment,
  type Round,
  type Tile,
  type TileIndex,
} from '@/types';
import {
  createRound,
  createTiles,
  pickTile,
  revealAll,
  revealTile as revealTileInTiles,
  safeTilesRemaining,
} from '@/game/minesEngine';
import {
  computeProfit,
  DEFAULT_HOUSE_EDGE,
  roundMultiplier,
} from '@/game/multiplier';
import {
  generateClientSeed,
  generateServerSeed,
  hashServerSeed,
} from '@/game/provablyFair';

export const DEFAULT_BALANCE = 1000;
export const DEFAULT_BET = 1;
export const DEFAULT_MINES = 3;

interface GameStoreState {
  // --- view state ---
  status: GameStatus;
  tiles: Tile[];
  betAmount: number;
  mineCount: number;
  balance: number;
  /** Safe tiles revealed this round. */
  gemsRevealed: number;
  /** Multiplier locked in by current safe picks (1 before any pick). */
  multiplier: number;
  /** Realized net profit after cash-out (0 while playing / on loss). */
  profit: number;
  /** Index of the tile most recently clicked (animation origin). Null if none. */
  lastPickIndex: TileIndex | null;

  // --- provably fair ---
  clientSeed: string;
  nonce: number;
  houseEdge: number;
  /** Current/last round (mines + seeds); kept after end for verification. */
  round: Round | null;
  /** Public pre-round commitment (hashed server seed). */
  commitment: ProvablyFairCommitment | null;

  // --- actions ---
  setBetAmount: (amount: number) => void;
  setMineCount: (count: number) => void;
  setClientSeed: (seed: string) => void;
  regenerateClientSeed: () => void;
  startGame: () => void;
  revealTile: (index: TileIndex) => void;
  cashOut: () => void;
  resetGame: () => void;
}

const clampMines = (n: number): number =>
  Math.max(MIN_MINES, Math.min(MAX_MINES, Math.round(n)));

export const useGameStore = create<GameStoreState>((set, get) => ({
  status: 'IDLE',
  tiles: [],
  betAmount: DEFAULT_BET,
  mineCount: DEFAULT_MINES,
  balance: DEFAULT_BALANCE,
  gemsRevealed: 0,
  multiplier: 1,
  profit: 0,
  lastPickIndex: null,

  clientSeed: generateClientSeed(),
  nonce: 0,
  houseEdge: DEFAULT_HOUSE_EDGE,
  round: null,
  commitment: null,

  setBetAmount: (amount) => {
    if (get().status === 'PLAYING') return;
    set({ betAmount: Number.isFinite(amount) && amount > 0 ? amount : 0 });
  },

  setMineCount: (count) => {
    if (get().status === 'PLAYING') return;
    set({ mineCount: clampMines(count) });
  },

  setClientSeed: (seed) => {
    if (get().status === 'PLAYING') return;
    set({ clientSeed: seed });
  },

  regenerateClientSeed: () => {
    if (get().status === 'PLAYING') return;
    set({ clientSeed: generateClientSeed() });
  },

  startGame: () => {
    const { status, betAmount, mineCount, balance, clientSeed, nonce } = get();
    if (status === 'PLAYING') return;
    if (betAmount <= 0 || betAmount > balance) return;

    const serverSeed = generateServerSeed();
    const seeds = { serverSeed, clientSeed, nonce };
    const round = createRound(seeds, mineCount);

    set({
      status: 'PLAYING',
      tiles: createTiles(round.minePositions),
      balance: balance - betAmount,
      gemsRevealed: 0,
      multiplier: 1,
      profit: 0,
      lastPickIndex: null,
      round,
      commitment: {
        serverSeedHash: hashServerSeed(serverSeed),
        clientSeed,
        nonce,
      },
    });
  },

  revealTile: (index) => {
    const { status, round, tiles, gemsRevealed, houseEdge } = get();
    if (status !== 'PLAYING' || !round) return;
    if (tiles[index]?.revealed) return;

    const outcome = pickTile(round, index, gemsRevealed, houseEdge);

    if (outcome.kind === 'mine') {
      // Loss: expose the whole board, stake already forfeited.
      set({
        status: 'LOST',
        tiles: revealAll(revealTileInTiles(tiles, index)),
        multiplier: 1,
        profit: 0,
        lastPickIndex: index,
      });
      return;
    }

    // Safe pick.
    set({
      tiles: revealTileInTiles(tiles, index),
      gemsRevealed: outcome.gemsRevealed,
      multiplier: outcome.multiplier,
      lastPickIndex: index,
    });

    // Board cleared → forced max-multiplier win.
    if (safeTilesRemaining(round, outcome.gemsRevealed) === 0) {
      get().cashOut();
    }
  },

  cashOut: () => {
    const { status, round, tiles, betAmount, multiplier, balance, gemsRevealed } =
      get();
    if (status !== 'PLAYING' || !round) return;
    if (gemsRevealed === 0) return; // nothing earned yet

    const payout = betAmount * multiplier;
    set({
      status: 'CASHED_OUT',
      tiles: revealAll(tiles),
      balance: balance + payout,
      profit: computeProfit(betAmount, multiplier),
    });
  },

  resetGame: () => {
    const { status } = get();
    if (status === 'PLAYING') return; // can't abandon a live round
    set((state) => ({
      status: 'IDLE',
      tiles: [],
      gemsRevealed: 0,
      multiplier: 1,
      profit: 0,
      lastPickIndex: null,
      round: null,
      commitment: null,
      // advance nonce so the next round is a distinct provably-fair draw
      nonce: state.nonce + 1,
    }));
  },
}));

// --- non-reactive selectors (safe to call outside React) -------------------

/** Multiplier rounded for display. */
export const selectDisplayMultiplier = (s: GameStoreState): number =>
  roundMultiplier(s.multiplier);

/** What the player would bank if they cashed out right now (net profit). */
export const selectPotentialProfit = (s: GameStoreState): number =>
  s.status === 'PLAYING' && s.gemsRevealed > 0
    ? computeProfit(s.betAmount, s.multiplier)
    : 0;

/** Total payout (stake + profit) at the current multiplier. */
export const selectPotentialPayout = (s: GameStoreState): number =>
  s.betAmount * s.multiplier;
