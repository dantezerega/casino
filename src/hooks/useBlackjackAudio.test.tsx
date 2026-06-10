import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BlackjackPage } from '@/pages/BlackjackPage';
import { useBlackjackStore } from '@/store/blackjackStore';
import { useGameStore } from '@/store/gameStore';
import { AudioManager } from '@/audio/AudioManager';
import type { Outcome } from '@/game/blackjack/types';

let playSpy: ReturnType<typeof vi.spyOn>;
const names = () => playSpy.mock.calls.map((c) => c[0]);

beforeEach(() => {
  playSpy = vi.spyOn(AudioManager, 'play').mockImplementation(() => {});
  useGameStore.setState({ balance: 1000 });
  useBlackjackStore.getState().newHand();
  useBlackjackStore.setState({ betAmount: 10 });
});
afterEach(() => {
  cleanup();
  playSpy.mockRestore();
  vi.useRealTimers();
});

const mount = () =>
  render(
    <MemoryRouter>
      <BlackjackPage />
    </MemoryRouter>,
  );

describe('Blackjack audio triggers', () => {
  it('deal places the stake → chip-bet', () => {
    mount();
    useBlackjackStore.getState().deal();
    expect(names()).toContain('chip-bet');
  });

  it('outcome cue plays after resolve, delayed', () => {
    vi.useFakeTimers();
    mount();
    playSpy.mockClear();
    useBlackjackStore.setState({
      status: 'PLAYER_TURN',
      bet: 10,
      dealerHoleHidden: true,
      playerHand: [{ suit: 'hearts', rank: '10' }, { suit: 'clubs', rank: '9' }],
      dealerHand: [{ suit: 'spades', rank: '10' }, { suit: 'hearts', rank: '8' }],
      deck: [{ suit: 'diamonds', rank: '2' }],
    });
    useBlackjackStore.getState().stand(); // player 19 beats dealer 18 → win
    expect(names()).not.toContain('win');
    vi.advanceTimersByTime(300);
    expect(names()).toContain('win');
  });

  it('maps every outcome to its sound', () => {
    vi.useFakeTimers();
    mount();
    const cases: Array<[Outcome, string]> = [
      ['blackjack', 'blackjack'],
      ['lose', 'lose'],
      ['push', 'push'],
    ];
    for (const [outcome, sound] of cases) {
      useBlackjackStore.getState().newHand();
      playSpy.mockClear();
      useBlackjackStore.setState({ status: 'DEALER_TURN', bet: 10, outcome: null });
      useBlackjackStore.setState({ status: 'RESOLVED', outcome });
      vi.advanceTimersByTime(300);
      expect(names()).toContain(sound);
    }
  });
});
