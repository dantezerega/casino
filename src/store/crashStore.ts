/**
 * Zustand store — the Crash game state machine.
 *
 * Holds view state (status, live multiplier, result, history) and orchestrates
 * the pure engine. No game math lives here: the crash point, the rising-curve
 * value, and settlement all come from `@/game/crash/*`. Actions guard on
 * `status` so illegal moves (cash out while IDLE, double start, tick after a
 * crash) are silent no-ops rather than throws.
 *
 * Lifecycle: IDLE → RUNNING → (CASHED_OUT | CRASHED) → IDLE.
 *
 * The live multiplier is driven by `tick(elapsedMs)`, which a clock hook calls
 * each animation frame. `tick` is the only place a round auto-crashes, so while
 * RUNNING the invariant `currentMultiplier < round.crashPoint` always holds and
 * `cashOut` is always safe (no crash-point race).
 *
 * Wallet is shared: `balance` lives in `gameStore`; this store reads/adjusts it
 * via `useGameStore`. No duplicate balance state.
 */

import { create } from 'zustand';
import { useGameStore } from '@/store/gameStore';
import type { ProvablyFairCommitment } from '@/types';
import {
  CRASH_HOUSE_EDGE,
  type CrashHistoryEntry,
  type CrashResult,
  type CrashRound,
  type CrashStatus,
} from '@/game/crash/types';
import {
  createRound,
  multiplierAt,
  resolveCashOut,
  resolveCrash,
} from '@/game/crash/crashEngine';
import {
  generateClientSeed,
  generateServerSeed,
  hashServerSeed,
} from '@/game/provablyFair';

export const DEFAULT_CRASH_BET = 1;
/** Newest-first history strip is capped to this many entries. */
export const CRASH_HISTORY_LIMIT = 20;

const adjustBalance = (delta: number): void =>
  useGameStore.setState((s) => ({ balance: s.balance + delta }));

const readBalance = (): number => useGameStore.getState().balance;

interface CrashStoreState {
  // --- view state ---
  status: CrashStatus;
  betAmount: number;
  /** Live multiplier, =1 before/at round start, advanced by `tick`. */
  currentMultiplier: number;
  /** Wall-clock origin of the current run (performance.now() ms). */
  startedAt: number | null;
  /** Settled outcome of the last finished round (null while IDLE/first run). */
  result: CrashResult | null;
  /** Newest-first list of recent crash points for the history strip. */
  history: CrashHistoryEntry[];

  // --- provably fair ---
  clientSeed: string;
  nonce: number;
  houseEdge: number;
  /** Current/last round (seeds + hidden crash point); kept after end to verify. */
  round: CrashRound | null;
  /** Public pre-round commitment (hashed server seed). */
  commitment: ProvablyFairCommitment | null;

  // --- actions ---
  setBetAmount: (amount: number) => void;
  setClientSeed: (seed: string) => void;
  regenerateClientSeed: () => void;
  start: () => void;
  tick: (elapsedMs: number) => void;
  cashOut: () => void;
  reset: () => void;
}

export const useCrashStore = create<CrashStoreState>((set, get) => ({
  status: 'IDLE',
  betAmount: DEFAULT_CRASH_BET,
  currentMultiplier: 1,
  startedAt: null,
  result: null,
  history: [],

  clientSeed: generateClientSeed(),
  nonce: 0,
  houseEdge: CRASH_HOUSE_EDGE,
  round: null,
  commitment: null,

  setBetAmount: (amount) => {
    if (get().status === 'RUNNING') return;
    set({ betAmount: Number.isFinite(amount) && amount > 0 ? amount : 0 });
  },

  setClientSeed: (seed) => {
    if (get().status === 'RUNNING') return;
    set({ clientSeed: seed });
  },

  regenerateClientSeed: () => {
    if (get().status === 'RUNNING') return;
    set({ clientSeed: generateClientSeed() });
  },

  start: () => {
    const { status, betAmount, clientSeed, nonce, houseEdge } = get();
    if (status === 'RUNNING') return;
    if (betAmount <= 0 || betAmount > readBalance()) return;

    const serverSeed = generateServerSeed();
    const seeds = { serverSeed, clientSeed, nonce };
    const round = createRound(seeds, houseEdge);

    adjustBalance(-betAmount);
    set({
      status: 'RUNNING',
      currentMultiplier: 1,
      startedAt: performance.now(),
      result: null,
      round,
      commitment: {
        serverSeedHash: hashServerSeed(serverSeed),
        clientSeed,
        nonce,
      },
    });
  },

  tick: (elapsedMs) => {
    const { status, round, betAmount } = get();
    if (status !== 'RUNNING' || !round) return;

    const mult = multiplierAt(elapsedMs);

    // Reached the hidden crash point → bust. Stake already forfeited at start.
    if (mult >= round.crashPoint) {
      const result = resolveCrash(round, betAmount);
      set({
        status: 'CRASHED',
        currentMultiplier: round.crashPoint,
        result,
      });
      return;
    }

    set({ currentMultiplier: mult });
  },

  cashOut: () => {
    const { status, round, betAmount, currentMultiplier } = get();
    if (status !== 'RUNNING' || !round) return;

    // While RUNNING, currentMultiplier < crashPoint is guaranteed (tick crashes
    // at the boundary), so this cash-out is always valid.
    const result = resolveCashOut(round, betAmount, currentMultiplier);
    adjustBalance(result.payout);
    set({ status: 'CASHED_OUT', result });
  },

  reset: () => {
    const { status, result, history } = get();
    if (status === 'RUNNING') return; // can't abandon a live round

    const nextHistory = result
      ? [
          {
            crashPoint: result.crashPoint,
            won: result.won,
            multiplier: result.multiplier,
          },
          ...history,
        ].slice(0, CRASH_HISTORY_LIMIT)
      : history;

    set((state) => ({
      status: 'IDLE',
      currentMultiplier: 1,
      startedAt: null,
      result: null,
      round: null,
      commitment: null,
      history: nextHistory,
      // advance nonce so the next round is a distinct provably-fair draw
      nonce: state.nonce + 1,
    }));
  },
}));

// --- non-reactive selectors (safe to call outside React) -------------------

/** True when a fresh round can be started right now. */
export const selectCanStart = (s: CrashStoreState): boolean =>
  s.status !== 'RUNNING' && s.betAmount > 0 && s.betAmount <= readBalance();

/** True only mid-run, when the player can still bank a cash-out. */
export const selectCanCashOut = (s: CrashStoreState): boolean => s.status === 'RUNNING';

/** What the player would bank if they cashed out right now (net profit). */
export const selectPotentialProfit = (s: CrashStoreState): number =>
  s.status === 'RUNNING' ? s.betAmount * s.currentMultiplier - s.betAmount : 0;

/** Total payout (stake + profit) at the live multiplier. */
export const selectPotentialPayout = (s: CrashStoreState): number =>
  s.betAmount * s.currentMultiplier;
