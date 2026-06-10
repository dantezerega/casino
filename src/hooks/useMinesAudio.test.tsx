import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GamePage } from '@/pages/GamePage';
import { useGameStore } from '@/store/gameStore';
import { AudioManager } from '@/audio/AudioManager';

const firstSafe = () =>
  [...Array(25).keys()].find(
    (i) => !useGameStore.getState().round!.minePositions.includes(i),
  )!;

let playSpy: ReturnType<typeof vi.spyOn>;
const names = () => playSpy.mock.calls.map((c) => c[0]);

beforeEach(() => {
  playSpy = vi.spyOn(AudioManager, 'play').mockImplementation(() => {});
  useGameStore.setState({
    status: 'IDLE',
    balance: 1000,
    betAmount: 10,
    mineCount: 3,
    tiles: [],
    round: null,
    gemsRevealed: 0,
    multiplier: 1,
    profit: 0,
  });
});
afterEach(() => {
  cleanup();
  playSpy.mockRestore();
  vi.useRealTimers();
});

describe('Mines audio triggers', () => {
  it('start → button-click, safe pick → multiplier-up, cash out → cashout', () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );
    const g = () => useGameStore.getState();
    g().startGame();
    expect(names()).toContain('button-click');
    g().revealTile(firstSafe());
    expect(names()).toContain('multiplier-up');
    g().cashOut();
    expect(names()).toContain('cashout');
  });

  it('mine hit schedules game-over after the explosion', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );
    const g = () => useGameStore.getState();
    g().startGame();
    playSpy.mockClear();
    g().revealTile(g().round!.minePositions[0]);
    expect(names()).not.toContain('game-over');
    vi.advanceTimersByTime(400);
    expect(names()).toContain('game-over');
  });
});
