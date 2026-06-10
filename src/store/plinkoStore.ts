import { create } from 'zustand';
import { useGameStore } from '@/store/gameStore';
import type { ProvablyFairCommitment } from '@/types';
import {
  PLINKO_ROWS,
  PLINKO_RISKS,
  type PlinkoResult,
  type PlinkoRisk,
  type PlinkoRound,
  type PlinkoRows,
  type PlinkoStatus,
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

interface PlinkoStoreState {
  status: PlinkoStatus;
  betAmount: number;
  rows: PlinkoRows;
  risk: PlinkoRisk;
  bet: number;
  profit: number;
  round: PlinkoRound | null;
  result: PlinkoResult | null;
  commitment: ProvablyFairCommitment | null;
  clientSeed: string;
  nonce: number;

  setBetAmount: (amount: number) => void;
  setRows: (rows: PlinkoRows) => void;
  setRisk: (risk: PlinkoRisk) => void;
  setClientSeed: (seed: string) => void;
  regenerateClientSeed: () => void;
  drop: () => void;
  resolve: () => void;
  reset: () => void;
}

export const usePlinkoStore = create<PlinkoStoreState>((set, get) => ({
  status: 'IDLE',
  betAmount: DEFAULT_PLINKO_BET,
  rows: DEFAULT_PLINKO_ROWS,
  risk: DEFAULT_PLINKO_RISK,
  bet: 0,
  profit: 0,
  round: null,
  result: null,
  commitment: null,
  clientSeed: generateClientSeed(),
  nonce: 0,

  setBetAmount: (amount) => {
    if (get().status === 'DROPPING') return;
    set({ betAmount: Number.isFinite(amount) && amount > 0 ? amount : 0 });
  },

  setRows: (rows) => {
    if (get().status === 'DROPPING') return;
    if (!PLINKO_ROWS.includes(rows)) return;
    set({ rows });
  },

  setRisk: (risk) => {
    if (get().status === 'DROPPING') return;
    if (!PLINKO_RISKS.includes(risk)) return;
    set({ risk });
  },

  setClientSeed: (seed) => {
    if (get().status === 'DROPPING') return;
    set({ clientSeed: seed });
  },

  regenerateClientSeed: () => {
    if (get().status === 'DROPPING') return;
    set({ clientSeed: generateClientSeed() });
  },

  drop: () => {
    const { status, betAmount, rows, risk, clientSeed, nonce } = get();
    if (status === 'DROPPING') return;
    if (betAmount <= 0 || betAmount > readBalance()) return;

    const nextNonce = status === 'RESOLVED' ? nonce + 1 : nonce;
    const serverSeed = generateServerSeed();
    const seeds = { serverSeed, clientSeed, nonce: nextNonce };
    const round = createRound(seeds, rows, risk);
    const result = resolveDrop(round, betAmount);

    adjustBalance(-betAmount);
    set({
      status: 'DROPPING',
      bet: betAmount,
      profit: 0,
      round,
      result,
      commitment: {
        serverSeedHash: hashServerSeed(serverSeed),
        clientSeed,
        nonce: nextNonce,
      },
      nonce: nextNonce,
    });
  },

  resolve: () => {
    const { status, result } = get();
    if (status !== 'DROPPING' || !result) return;
    adjustBalance(result.payout);
    set({ status: 'RESOLVED', profit: result.profit });
  },

  reset: () => {
    if (get().status === 'DROPPING') return;
    set((state) => ({
      status: 'IDLE',
      bet: 0,
      profit: 0,
      round: null,
      result: null,
      commitment: null,
      nonce: state.nonce + 1,
    }));
  },
}));

export const selectMultipliers = (s: PlinkoStoreState): readonly number[] =>
  getMultipliers(s.rows, s.risk);

export const selectResultMultiplier = (s: PlinkoStoreState): number | null =>
  s.result ? s.result.multiplier : null;

export const selectCanDrop = (s: PlinkoStoreState): boolean =>
  s.status !== 'DROPPING' && s.betAmount > 0 && s.betAmount <= readBalance();
