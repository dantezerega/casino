/**
 * Deck construction, shuffling, and dealing — pure and immutable.
 */

import type { Card, DealResult } from '@/game/blackjack/types';
import { RANKS, SUITS } from '@/game/blackjack/cardUtils';

/** A fresh, ordered standard 52-card deck. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle. Pure: returns a new array, never mutates the input.
 * The RNG is injectable (defaults to `Math.random`) so tests are deterministic.
 */
export function shuffleDeck(
  deck: Card[],
  rng: () => number = Math.random,
): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * Draw the top card. Returns the card and the remaining deck; the original deck
 * is untouched. Throws if the deck is empty.
 */
export function dealCard(deck: Card[]): DealResult {
  if (deck.length === 0) {
    throw new RangeError('cannot deal from an empty deck');
  }
  return { card: deck[0], deck: deck.slice(1) };
}
