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
    status: 'IDLE',
    betAmount: 10,
    rows: DEFAULT_PLINKO_ROWS,
    risk: DEFAULT_PLINKO_RISK,
    bet: 0,
    profit: 0,
    round: null,
    result: null,
    commitment: null,
    clientSeed: 'client',
    nonce: 0,
  });
});
afterEach(() => {
  cleanup();
  playSpy.mockRestore();
});

describe('Plinko audio triggers', () => {
  it('plays ball-drop when a drop begins', () => {
    render(<Host />);
    usePlinkoStore.getState().drop();
    expect(names()).toContain('ball-drop');
  });

  it('maps the resolved result to its sound', () => {
    render(<Host />);
    const cases: Array<[PlinkoResult, string]> = [
      [result(29, 280), 'big-win'],
      [result(2, 10), 'win'],
      [result(0.2, -8), 'lose'],
      [result(1, 0), 'slot-land'],
    ];
    for (const [res, sound] of cases) {
      usePlinkoStore.setState({ status: 'DROPPING', result: res });
      playSpy.mockClear();
      usePlinkoStore.getState().resolve();
      expect(names()).toContain(sound);
    }
  });
});
