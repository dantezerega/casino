import { create } from 'zustand';
import { useGameStore } from '@/store/gameStore';
import type { ProvablyFairCommitment } from '@/types';
import {
  PLINKO_ROWS,
  PLINKO_RISKS,
  type PlinkoPath,
  type PlinkoResult,
  type PlinkoRisk,
  type PlinkoRows,
} from '@/game/plinko/types';
import { createRound, resolveDrop } from '@/game/plinko/plinkoEngine';
import { getMultipliers } from '@/game/plinko/payoutTables';
import {
  generateClientSeed,
  generateServerSeed,
  hashServerSeed,
} from '@/game/provablyFair';

export const DEFAULT_PLINKO_BET = 1;
export const DEFAULT_PLINKO_ROWS: PlinkoRows = 16;
export const DEFAULT_PLINKO_RISK: PlinkoRisk = 'medium';

const adjustBalance = (delta: number): void =>
  useGameStore.setState((s) => ({ balance: s.balance + delta }));

const readBalance = (): number => useGameStore.getState().balance;

export interface ActiveBall {
  id: number;
  rows: PlinkoRows;
  path: PlinkoPath;
  result: PlinkoResult;
}

interface PlinkoStoreState {
  betAmount: number;
  rows: PlinkoRows;
  risk: PlinkoRisk;
  balls: ActiveBall[];
  lastResult: PlinkoResult | null;
  resolvedCount: number;
  dropCount: number;
  commitment: ProvablyFairCommitment | null;
  clientSeed: string;
  nonce: number;
  nextId: number;

  setBetAmount: (amount: number) => void;
  setRows: (rows: PlinkoRows) => void;
  setRisk: (risk: PlinkoRisk) => void;
  setClientSeed: (seed: string) => void;
  regenerateClientSeed: () => void;
  drop: () => void;
  land: (id: number) => void;
  reset: () => void;
}

export const usePlinkoStore = create<PlinkoStoreState>((set, get) => ({
  betAmount: DEFAULT_PLINKO_BET,
  rows: DEFAULT_PLINKO_ROWS,
  risk: DEFAULT_PLINKO_RISK,
  balls: [],
  lastResult: null,
  resolvedCount: 0,
  dropCount: 0,
  commitment: null,
  clientSeed: generateClientSeed(),
  nonce: 0,
  nextId: 0,

  setBetAmount: (amount) => {
    set({ betAmount: Number.isFinite(amount) && amount > 0 ? amount : 0 });
  },

  setRows: (rows) => {
    if (get().balls.length > 0) return;
    if (!PLINKO_ROWS.includes(rows)) return;
    set({ rows });
  },

  setRisk: (risk) => {
    if (get().balls.length > 0) return;
    if (!PLINKO_RISKS.includes(risk)) return;
    set({ risk });
  },

  setClientSeed: (seed) => set({ clientSeed: seed }),

  regenerateClientSeed: () => {
    if (get().balls.length > 0) return;
    set({ clientSeed: generateClientSeed() });
  },

  drop: () => {
    const { betAmount, rows, risk, clientSeed, nonce, nextId } = get();
    if (betAmount <= 0 || betAmount > readBalance()) return;

    const serverSeed = generateServerSeed();
    const seeds = { serverSeed, clientSeed, nonce };
    const round = createRound(seeds, rows, risk);
    const result = resolveDrop(round, betAmount);

    adjustBalance(-betAmount);
    set((s) => ({
      balls: [...s.balls, { id: nextId, rows, path: result.path, result }],
      nextId: nextId + 1,
      nonce: nonce + 1,
      dropCount: s.dropCount + 1,
      commitment: {
        serverSeedHash: hashServerSeed(serverSeed),
        clientSeed,
        nonce,
      },
    }));
  },

  land: (id) => {
    const ball = get().balls.find((b) => b.id === id);
    if (!ball) return;
    adjustBalance(ball.result.payout);
    set((s) => ({
      balls: s.balls.filter((b) => b.id !== id),
      lastResult: ball.result,
      resolvedCount: s.resolvedCount + 1,
    }));
  },

  reset: () => {
    if (get().balls.length > 0) return;
    set((state) => ({
      lastResult: null,
      commitment: null,
      nonce: state.nonce + 1,
    }));
  },
}));

export const selectMultipliers = (s: PlinkoStoreState): readonly number[] =>
  getMultipliers(s.rows, s.risk);

export const selectCanDrop = (s: PlinkoStoreState): boolean =>
  s.betAmount > 0 && s.betAmount <= readBalance();

export const selectConfigLocked = (s: PlinkoStoreState): boolean => s.balls.length > 0;
