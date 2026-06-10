import { describe, it, expect } from 'vitest';
import { createDeck, shuffleDeck, dealCard } from '@/game/blackjack/deck';
import { RANKS, SUITS } from '@/game/blackjack/cardUtils';

const key = (c: { rank: string; suit: string }) => `${c.rank}-${c.suit}`;

describe('createDeck', () => {
  const deck = createDeck();

  it('has 52 unique cards', () => {
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(key)).size).toBe(52);
  });

  it('has 13 cards per suit and 4 of each rank', () => {
    for (const suit of SUITS) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
    for (const rank of RANKS) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(4);
    }
  });
});

describe('shuffleDeck', () => {
  // Deterministic LCG so the test is stable.
  const seededRng = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  };

  it('preserves the exact multiset of cards', () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original, seededRng(1));
    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map(key))).toEqual(new Set(original.map(key)));
  });

  it('does not mutate the input deck', () => {
    const original = createDeck();
    const snapshot = original.map(key);
    shuffleDeck(original, seededRng(7));
    expect(original.map(key)).toEqual(snapshot);
  });

  it('changes the order', () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original, seededRng(99));
    expect(shuffled.map(key)).not.toEqual(original.map(key));
  });

  it('is deterministic for the same seed', () => {
    const original = createDeck();
    expect(shuffleDeck(original, seededRng(42))).toEqual(
      shuffleDeck(original, seededRng(42)),
    );
  });
});

describe('dealCard', () => {
  it('returns the top card and the remaining deck immutably', () => {
    const deck = createDeck();
    const { card, deck: rest } = dealCard(deck);
    expect(card).toEqual(deck[0]);
    expect(rest).toHaveLength(51);
    expect(deck).toHaveLength(52); // original untouched
  });

  it('throws on an empty deck', () => {
    expect(() => dealCard([])).toThrow(RangeError);
  });
});
