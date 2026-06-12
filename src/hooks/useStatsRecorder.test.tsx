import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useStatsRecorder } from '@/hooks/useStatsRecorder';
import { useStatsStore, selectScopeStat } from '@/store/statsStore';
import { useGameStore } from '@/store/gameStore';
import { useBlackjackStore } from '@/store/blackjackStore';
import { usePlinkoStore } from '@/store/plinkoStore';
import { useCrashStore } from '@/store/crashStore';

function Host() {
  useStatsRecorder();
  return null;
}

const stat = (scope: Parameters<typeof selectScopeStat>[0]) =>
  selectScopeStat(scope)(useStatsStore.getState());

beforeEach(() => {
  useStatsStore.getState().reset();
  useGameStore.setState({ status: 'IDLE', betAmount: 10, profit: 0 });
  useBlackjackStore.setState({ status: 'IDLE', bet: 0, betAmount: 10, profit: 0 });
  usePlinkoStore.setState({ dropCount: 0, resolvedCount: 0, betAmount: 10, lastResult: null });
  useCrashStore.setState({ status: 'IDLE', betAmount: 10, result: null });
});
afterEach(cleanup);

describe('useStatsRecorder', () => {
  it('records a Mines cash-out (wager + profit)', () => {
    render(<Host />);
    act(() => useGameStore.setState({ status: 'PLAYING' }));
    act(() => useGameStore.setState({ status: 'CASHED_OUT', betAmount: 10, profit: 7 }));
    expect(stat('mines')).toEqual({ bets: 1, wagered: 10, pnl: 7 });
  });

  it('records a Mines loss as −bet', () => {
    render(<Host />);
    act(() => useGameStore.setState({ status: 'PLAYING' }));
    act(() => useGameStore.setState({ status: 'LOST', betAmount: 10 }));
    expect(stat('mines')).toEqual({ bets: 1, wagered: 10, pnl: -10 });
  });

  it('records a Blackjack resolve using the live (doubled) bet', () => {
    render(<Host />);
    act(() => useBlackjackStore.setState({ status: 'PLAYER_TURN', bet: 10 }));
    act(() => useBlackjackStore.setState({ status: 'RESOLVED', bet: 20, profit: 20 }));
    expect(stat('blackjack')).toEqual({ bets: 1, wagered: 20, pnl: 20 });
  });

  it('falls back to betAmount for a natural-blackjack ordering (bet still 0)', () => {
    render(<Host />);
    act(() => useBlackjackStore.setState({ status: 'RESOLVED', bet: 0, betAmount: 15, profit: 22.5 }));
    expect(stat('blackjack')).toEqual({ bets: 1, wagered: 15, pnl: 22.5 });
  });

  it('records Plinko wager per drop and profit per land', () => {
    render(<Host />);
    act(() => usePlinkoStore.setState({ dropCount: 1, betAmount: 10 }));
    act(() => usePlinkoStore.setState({ dropCount: 2, betAmount: 10 }));
    act(() =>
      usePlinkoStore.setState({
        resolvedCount: 1,
        lastResult: { path: ['L'], slot: 0, multiplier: 2, payout: 20, profit: 10 },
      }),
    );
    expect(stat('plinko')).toEqual({ bets: 2, wagered: 20, pnl: 10 });
  });

  it('records a Crash cash-out and a Crash bust', () => {
    render(<Host />);
    act(() => useCrashStore.setState({ status: 'RUNNING' }));
    act(() =>
      useCrashStore.setState({
        status: 'CASHED_OUT',
        betAmount: 10,
        result: { crashPoint: 5, cashedOutAt: 2, multiplier: 2, payout: 20, profit: 10, won: true },
      }),
    );
    act(() => useCrashStore.setState({ status: 'RUNNING' }));
    act(() =>
      useCrashStore.setState({
        status: 'CRASHED',
        betAmount: 10,
        result: { crashPoint: 1.4, cashedOutAt: null, multiplier: 1.4, payout: 0, profit: -10, won: false },
      }),
    );
    expect(stat('crash')).toEqual({ bets: 2, wagered: 20, pnl: 0 });
  });

  it('aggregates everything into the "all" scope', () => {
    render(<Host />);
    act(() => useGameStore.setState({ status: 'PLAYING' }));
    act(() => useGameStore.setState({ status: 'CASHED_OUT', betAmount: 10, profit: 7 }));
    act(() => usePlinkoStore.setState({ dropCount: 1, betAmount: 5 }));
    act(() =>
      usePlinkoStore.setState({
        resolvedCount: 1,
        lastResult: { path: ['R'], slot: 1, multiplier: 0, payout: 0, profit: -5 },
      }),
    );
    expect(stat('all')).toEqual({ bets: 2, wagered: 15, pnl: 2 });
  });
});
