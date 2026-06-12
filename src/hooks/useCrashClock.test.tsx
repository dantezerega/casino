import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useCrashClock } from '@/hooks/useCrashClock';
import { useCrashStore } from '@/store/crashStore';
import { useGameStore } from '@/store/gameStore';
import { timeToMultiplier } from '@/game/crash/crashEngine';

function Host() {
  useCrashClock();
  return null;
}

// Controllable animation-frame queue + clock.
let frames: FrameRequestCallback[] = [];
let now = 0;
const flushFrame = () =>
  act(() => {
    const due = frames;
    frames = [];
    due.forEach((cb) => cb(now));
  });

beforeEach(() => {
  frames = [];
  now = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.spyOn(performance, 'now').mockImplementation(() => now);

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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useCrashClock', () => {
  it('does not schedule frames while IDLE', () => {
    render(<Host />);
    expect(frames).toHaveLength(0);
  });

  it('advances the live multiplier and keeps scheduling while RUNNING', () => {
    render(<Host />);
    act(() => useCrashStore.getState().start()); // startedAt = now (0)
    const cp = useCrashStore.getState().round!.crashPoint;

    now = timeToMultiplier(Math.min(cp, 1.5)) / 2; // safely below the crash point
    flushFrame();

    const s = useCrashStore.getState();
    expect(s.status).toBe('RUNNING');
    expect(s.currentMultiplier).toBeGreaterThan(1);
    expect(frames.length).toBeGreaterThan(0); // re-scheduled
  });

  it('crashes when the frame time passes the crash point and stops scheduling', () => {
    render(<Host />);
    act(() => useCrashStore.getState().start());
    const cp = useCrashStore.getState().round!.crashPoint;

    now = timeToMultiplier(cp) + 5000; // past the crash point
    flushFrame();

    const s = useCrashStore.getState();
    expect(s.status).toBe('CRASHED');
    expect(frames).toHaveLength(0); // no further frames after the crash
  });
});
