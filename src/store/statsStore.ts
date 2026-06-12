/**
 * Cross-game session statistics — a thin aggregation store.
 *
 * It records two kinds of events, fed in by `useStatsRecorder` (which subscribes
 * read-only to every game store — game logic is never modified for stats):
 *   - `recordWager(game, amount)`  — a stake left the wallet (a bet was placed).
 *   - `recordSettle(game, profit)` — a round resolved with a net profit/loss.
 *
 * From those it keeps per-game bet counts, total wagered, net PnL, and a capped
 * cumulative-PnL series per scope for the live chart. Everything is derived from
 * the recorded events, so it stays exactly in step with the shared wallet.
 *
 * This store owns no money — `balance` still lives in `gameStore`. Resetting
 * stats does not touch the wallet (it's a session view, independently clearable).
 */

import { create } from 'zustand';

export type StatsGameId = 'mines' | 'blackjack' | 'plinko' | 'crash';
export const STATS_GAMES: readonly StatsGameId[] = ['mines', 'blackjack', 'plinko', 'crash'];

export type StatsScope = 'all' | StatsGameId;

export interface GameStat {
  bets: number;
  wagered: number;
  pnl: number;
}

/** Cumulative-PnL chart points kept per scope (sliding window). */
export const SERIES_CAP = 150;

const emptyGameStat = (): GameStat => ({ bets: 0, wagered: 0, pnl: 0 });

const emptyPerGame = (): Record<StatsGameId, GameStat> => ({
  mines: emptyGameStat(),
  blackjack: emptyGameStat(),
  plinko: emptyGameStat(),
  crash: emptyGameStat(),
});

// Every series starts at a 0 origin so a single settlement already draws a line.
const emptySeries = (): Record<StatsScope, number[]> => ({
  all: [0],
  mines: [0],
  blackjack: [0],
  plinko: [0],
  crash: [0],
});

/** Append a cumulative point and keep only the last SERIES_CAP entries. */
const pushPoint = (series: number[], delta: number): number[] => {
  const last = series.length > 0 ? series[series.length - 1] : 0;
  const next = [...series, last + delta];
  return next.length > SERIES_CAP ? next.slice(next.length - SERIES_CAP) : next;
};

interface StatsState {
  perGame: Record<StatsGameId, GameStat>;
  series: Record<StatsScope, number[]>;
  /** Total settled rounds across all games (drives live chart keys). */
  settleCount: number;

  recordWager: (game: StatsGameId, amount: number) => void;
  recordSettle: (game: StatsGameId, profit: number) => void;
  reset: () => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  perGame: emptyPerGame(),
  series: emptySeries(),
  settleCount: 0,

  recordWager: (game, amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    set((s) => ({
      perGame: {
        ...s.perGame,
        [game]: {
          ...s.perGame[game],
          bets: s.perGame[game].bets + 1,
          wagered: s.perGame[game].wagered + amount,
        },
      },
    }));
  },

  recordSettle: (game, profit) => {
    if (!Number.isFinite(profit)) return;
    set((s) => ({
      perGame: {
        ...s.perGame,
        [game]: { ...s.perGame[game], pnl: s.perGame[game].pnl + profit },
      },
      series: {
        ...s.series,
        all: pushPoint(s.series.all, profit),
        [game]: pushPoint(s.series[game], profit),
      },
      settleCount: s.settleCount + 1,
    }));
  },

  reset: () =>
    set({ perGame: emptyPerGame(), series: emptySeries(), settleCount: 0 }),
}));

// --- selectors / derivations -----------------------------------------------

/**
 * Aggregate a scope from a perGame map ('all' sums every game). Pure — pass the
 * `perGame` slice in. NOTE: for 'all' this allocates a fresh object, so never
 * use it as a *reactive* zustand selector (that loops); select `perGame` and
 * memoise this in the component instead.
 */
export const computeScopeStat = (
  perGame: Record<StatsGameId, GameStat>,
  scope: StatsScope,
): GameStat => {
  if (scope !== 'all') return perGame[scope];
  return STATS_GAMES.reduce<GameStat>(
    (acc, g) => ({
      bets: acc.bets + perGame[g].bets,
      wagered: acc.wagered + perGame[g].wagered,
      pnl: acc.pnl + perGame[g].pnl,
    }),
    emptyGameStat(),
  );
};

/** Convenience for tests / non-reactive reads. */
export const selectScopeStat = (scope: StatsScope) => (s: StatsState): GameStat =>
  computeScopeStat(s.perGame, scope);

/** Cumulative-PnL series for a scope. */
export const selectSeries = (scope: StatsScope) => (s: StatsState): number[] =>
  s.series[scope];
