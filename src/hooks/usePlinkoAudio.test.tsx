import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { usePlinkoAudio } from '@/hooks/usePlinkoAudio';
import { usePlinkoStore, DEFAULT_PLINKO_ROWS, DEFAULT_PLINKO_RISK } from '@/store/plinkoStore';
import { useGameStore } from '@/store/gameStore';
import { AudioManager } from '@/audio/AudioManager';
import type { PlinkoResult } from '@/game/plinko/types';

let playSpy: ReturnType<typeof vi.spyOn>;
const names = () => playSpy.mock.calls.map((c) => c[0]);

function Host() {
  usePlinkoAudio();
  return null;
}

const result = (multiplier: number, profit: number): PlinkoResult => ({
  path: ['L'],
  slot: 0,
  multiplier,
  payout: profit + 10,
  profit,
});

beforeEach(() => {
  playSpy = vi.spyOn(AudioManager, 'play').mockImplementation(() => {});
  useGameStore.setState({ balance: 1000 });
  usePlinkoStore.setState({
    betAmount: 10,
    rows: DEFAULT_PLINKO_ROWS,
    risk: DEFAULT_PLINKO_RISK,
    balls: [],
    lastResult: null,
    resolvedCount: 0,
    dropCount: 0,
    commitment: null,
    clientSeed: 'client',
    nonce: 0,
    nextId: 0,
  });
});
afterEach(() => {
  cleanup();
  playSpy.mockRestore();
});

describe('Plinko audio triggers', () => {
  it('plays ball-drop on every drop (spammable)', () => {
    render(<Host />);
    usePlinkoStore.getState().drop();
    usePlinkoStore.getState().drop();
    expect(names().filter((n) => n === 'ball-drop')).toHaveLength(2);
  });

  it('maps each landed result to its sound', () => {
    render(<Host />);
    const cases: Array<[PlinkoResult, string]> = [
      [result(29, 280), 'big-win'],
      [result(2, 10), 'win'],
      [result(0.2, -8), 'lose'],
      [result(1, 0), 'slot-land'],
    ];
    let count = 0;
    for (const [res, sound] of cases) {
      playSpy.mockClear();
      count += 1;
      usePlinkoStore.setState({ lastResult: res, resolvedCount: count });
      expect(names()).toContain(sound);
    }
  });
});
