import type { ProvablyFairSeeds } from '@/types';

export type PlinkoRows = 8 | 12 | 16;

export type PlinkoRisk = 'low' | 'medium' | 'high';

export type Direction = 'L' | 'R';

export type PlinkoPath = Direction[];

export type PlinkoStatus = 'IDLE' | 'DROPPING' | 'RESOLVED';

export const PLINKO_ROWS: readonly PlinkoRows[] = [8, 12, 16];

export const PLINKO_RISKS: readonly PlinkoRisk[] = ['low', 'medium', 'high'];

export interface PlinkoConfig {
  rows: PlinkoRows;
  risk: PlinkoRisk;
}

export interface PlinkoRound {
  seeds: ProvablyFairSeeds;
  rows: PlinkoRows;
  risk: PlinkoRisk;
  path: PlinkoPath;
  slot: number;
}

export interface PlinkoResult {
  path: PlinkoPath;
  slot: number;
  multiplier: number;
  payout: number;
  profit: number;
}
