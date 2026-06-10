import { describe, it, expect } from 'vitest';
import {
  rankValue,
  calculateHandValue,
  isBlackjack,
  isBust,
  handTotal,
} from '@/game/blackjack/cardUtils';
import type { Hand, Rank, Suit } from '@/game/blackjack/types';

const c = (rank: Rank, suit: Suit = 'hearts') => ({ rank, suit });
const hand = (...ranks: Rank[]): Hand => ranks.map((r) => c(r));

describe('rankValue', () => {
  it('scores aces as 11, faces as 10, numbers at face value', () => {
    expect(rankValue('A')).toBe(11);
    expect(rankValue('K')).toBe(10);
    expect(rankValue('Q')).toBe(10);
    expect(rankValue('J')).toBe(10);
    expect(rankValue('10')).toBe(10);
    expect(rankValue('2')).toBe(2);
    expect(rankValue('7')).toBe(7);
  });
});

describe('calculateHandValue (ace logic)', () => {
  it.each<[Rank[], number, boolean]>([
    [[], 0, false],
    [['A', 'A'], 12, true], // one ace 11, one ace 1
    [['A', 'K'], 21, true], // soft 21
    [['A', '6'], 17, true], // soft 17
    [['A', '6', '10'], 17, false], // ace demoted → hard 17
    [['10', '10', '2'], 22, false], // bust
    [['A', 'A', '9'], 21, true], // 11 + 1 + 9 → soft 21 (one ace still 11)
    [['K', 'Q'], 20, false],
  ])('scores %j as %i (soft=%s)', (ranks, total, soft) => {
    const v = calculateHandValue(hand(...ranks));
    expect(v.total).toBe(total);
    expect(v.soft).toBe(soft);
  });

  it('handTotal returns the numeric total', () => {
    expect(handTotal(hand('A', 'K'))).toBe(21);
  });
});

describe('isBlackjack', () => {
  it('is true only for a two-card 21', () => {
    expect(isBlackjack(hand('A', 'Q'))).toBe(true);
    expect(isBlackjack(hand('A', 'K'))).toBe(true);
  });

  it('is false for a drawn 21 or a non-21 pair', () => {
    expect(isBlackjack(hand('7', '7', '7'))).toBe(false);
    expect(isBlackjack(hand('10', 'J'))).toBe(false); // 20
    expect(isBlackjack(hand('A', '5', '5'))).toBe(false); // 21 in 3 cards
  });
});

describe('isBust', () => {
  it('detects totals over 21', () => {
    expect(isBust(hand('K', 'Q', '5'))).toBe(true);
    expect(isBust(hand('A', 'K'))).toBe(false);
    expect(isBust(hand('A', 'A'))).toBe(false); // 12
  });
});
