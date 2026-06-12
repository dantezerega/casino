import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useCrashAudio } from '@/hooks/useCrashAudio';
import { useCrashStore } from '@/store/crashStore';
import { useGameStore } from '@/store/gameStore';
import { AudioManager } from '@/audio/AudioManager';
import type { CrashResult } from '@/game/crash/types';

let playSpy: ReturnType<typeof vi.spyOn>;
const names = () => playSpy.mock.calls.map((c) => c[0]);

function Host() {
  useCrashAudio();
  return null;
}

const cashResult = (multiplier: number): CrashResult => ({
  crashPoint: multiplier + 5,
  cashedOutAt: multiplier,
  multiplier,
  payout: multiplier * 10,
  profit: multiplier * 10 - 10,
  won: true,
});

const crashResult = (crashPoint: number): CrashResult => ({
  crashPoint,
  cashedOutAt: null,
  multiplier: crashPoint,
  payout: 0,
  profit: -10,
  won: false,
});

beforeEach(() => {
  playSpy = vi.spyOn(AudioManager, 'play').mockImplementation(() => {});
  useGameStore.setState({ balance: 1000 });
  useCrashStore.setState({
    status: 'IDLE',
    betAmount: 10,
    currentMultiplier: 1,
    startedAt: null,
    result: null,
    history: [],
    clientSeed: 'client',
    nonce: 0,
    houseEdge: 0.01,
    round: null,
    commitment: null,
  });
});
afterEach(() => {
  cleanup();
  playSpy.mockRestore();
});

describe('Crash audio triggers', () => {
  it('plays crash-start when a round begins', () => {
    render(<Host />);
    act(() => useCrashStore.getState().start());
    expect(names()).toContain('crash-start');
  });

  it('ticks up on each whole-number multiplier milestone', () => {
    render(<Host />);
    act(() => useCrashStore.setState({ status: 'RUNNING', currentMultiplier: 1 }));
    playSpy.mockClear();
    act(() => useCrashStore.setState({ currentMultiplier: 2.1 }));
    act(() => useCrashStore.setState({ currentMultiplier: 3.4 }));
    expect(names().filter((n) => n === 'tick-up')).toHaveLength(2);
  });

  it('plays cashout on a modest cash-out and big-win on a large one', () => {
    render(<Host />);

    act(() => useCrashStore.setState({ status: 'RUNNING', currentMultiplier: 2 }));
    playSpy.mockClear();
    act(() => useCrashStore.setState({ status: 'CASHED_OUT', result: cashResult(2) }));
    expect(names()).toContain('cashout');

    act(() => useCrashStore.setState({ status: 'RUNNING', currentMultiplier: 12 }));
    playSpy.mockClear();
    act(() => useCrashStore.setState({ status: 'CASHED_OUT', result: cashResult(12) }));
    expect(names()).toContain('big-win');
  });

  it('plays explosion on a crash', () => {
    render(<Host />);
    act(() => useCrashStore.setState({ status: 'RUNNING', currentMultiplier: 1.4 }));
    playSpy.mockClear();
    act(() => useCrashStore.setState({ status: 'CRASHED', result: crashResult(1.5) }));
    expect(names()).toContain('explosion');
  });
});
