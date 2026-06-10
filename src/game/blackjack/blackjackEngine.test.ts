import { describe, it, expect } from 'vitest';
import {
  dealInitial,
  dealerPlay,
  determineWinner,
  resolvePayout,
  canDoubleDown,
  DEALER_STANDS_ON,
} from '@/game/blackjack/blackjackEngine';
import { calculateHandValue } from '@/game/blackjack/cardUtils';
import { createDeck } from '@/game/blackjack/deck';
import type { Hand, Rank, Suit } from '@/game/blackjack/types';

const c = (rank: Rank, suit: Suit = 'hearts') => ({ rank, suit });
const hand = (...ranks: Rank[]): Hand => ranks.map((r) => c(r));

describe('dealInitial', () => {
  it('deals two cards each (player gets cards 0 & 2) and leaves 48', () => {
    const deck = createDeck();
    const { playerHand, dealerHand, deck: rest } = dealInitial(deck);
    expect(playerHand).toHaveLength(2);
    expect(dealerHand).toHaveLength(2);
    expect(rest).toHaveLength(48);
    expect(playerHand).toEqual([deck[0], deck[2]]);
    expect(dealerHand).toEqual([deck[1], deck[3]]);
  });
});

describe('dealerPlay', () => {
  it('stands on 17+', () => {
    expect(DEALER_STANDS_ON).toBe(17);
    const { dealerHand } = dealerPlay([c('5')], hand('10', '7'));
    expect(dealerHand).toHaveLength(2); // 17 → no draw
  });

  it('hits on 16 until reaching at least 17', () => {
    const { dealerHand } = dealerPlay([c('5'), c('5'), c('5')], hand('10', '6'));
    expect(dealerHand.length).toBeGreaterThan(2);
    expect(calculateHandValue(dealerHand).total).toBeGreaterThanOrEqual(17);
  });

  it('stands on soft 17', () => {
    const { dealerHand } = dealerPlay([c('2')], hand('A', '6'));
    expect(dealerHand).toHaveLength(2);
  });

  it('returns the remaining deck', () => {
    const { deck } = dealerPlay([c('5'), c('5')], hand('10', '6'));
    expect(deck).toHaveLength(1); // drew one to reach 21... 16+5=21
  });
});

describe('determineWinner', () => {
  it('player bust loses regardless of dealer', () => {
    expect(determineWinner(hand('K', 'Q', '5'), hand('10', '7'))).toBe('lose');
  });
  it('dealer bust wins for a standing player', () => {
    expect(determineWinner(hand('10', '8'), hand('K', 'Q', '5'))).toBe('win');
  });
  it('higher total wins, lower loses, equal pushes', () => {
    expect(determineWinner(hand('10', '9'), hand('10', '7'))).toBe('win');
    expect(determineWinner(hand('10', '5'), hand('10', '9'))).toBe('lose');
    expect(determineWinner(hand('10', '8'), hand('10', '8'))).toBe('push');
  });
  it('natural blackjack beats a plain 21', () => {
    expect(determineWinner(hand('A', 'K'), hand('10', '9'))).toBe('blackjack');
  });
  it('two naturals push', () => {
    expect(determineWinner(hand('A', 'K'), hand('A', 'Q'))).toBe('push');
  });
  it('dealer natural beats a three-card 21', () => {
    expect(determineWinner(hand('7', '7', '7'), hand('A', 'K'))).toBe('lose');
  });
});

describe('resolvePayout', () => {
  it.each<[Parameters<typeof resolvePayout>[0], number, number]>([
    ['blackjack', 25, 15], // 2.5× → +1.5×
    ['win', 20, 10], // 2× → +1×
    ['push', 10, 0], // stake back
    ['lose', 0, -10], // stake lost
  ])('settles %s to payout %i / profit %i for a 10 bet', (outcome, payout, profit) => {
    expect(resolvePayout(outcome, 10)).toEqual({ payout, profit });
  });
});

describe('canDoubleDown', () => {
  it('allows only a two-card hand', () => {
    expect(canDoubleDown(hand('5', '6'))).toBe(true);
    expect(canDoubleDown(hand('5', '6', '2'))).toBe(false);
  });
});
