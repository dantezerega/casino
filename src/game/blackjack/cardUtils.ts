/**
 * Card and hand math — pure, no React, no deck/flow concerns.
 */

import type { Hand, HandValue, Rank, Suit } from '@/game/blackjack/types';

export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const RANKS: readonly Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

/**
 * Base value of a rank. Aces are 11 here; demotion to 1 happens during hand
 * scoring. Face cards are 10.
 */
export function rankValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return Number(rank);
}

/**
 * Score a hand with optimal ace handling: count every ace as 11, then demote
 * aces to 1 one at a time while the hand would bust. `soft` is true when an ace
 * is still counted as 11 (and the hand is not bust).
 */
export function calculateHandValue(hand: Hand): HandValue {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += rankValue(card.rank);
    if (card.rank === 'A') aces += 1;
  }

  while (total > 21 && aces > 0) {
    total -= 10; // count one ace as 1 instead of 11
    aces -= 1;
  }

  return { total, soft: aces > 0 };
}

/** Natural blackjack: exactly two cards totalling 21. */
export function isBlackjack(hand: Hand): boolean {
  return hand.length === 2 && calculateHandValue(hand).total === 21;
}

/** Hand exceeds 21. */
export function isBust(hand: Hand): boolean {
  return calculateHandValue(hand).total > 21;
}

/** Convenience numeric total (ace-optimized). */
export const handTotal = (hand: Hand): number => calculateHandValue(hand).total;
