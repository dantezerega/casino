/**
 * Blackjack domain types — single source of truth for the engine, store, and UI.
 * Pure type module: no runtime values, no React.
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type Hand = Card[];

/** A scored hand. `soft` means an ace is still being counted as 11. */
export interface HandValue {
  total: number;
  soft: boolean;
}

/**
 * Round outcome from the player's perspective.
 *  - blackjack — natural 21 on the first two cards (pays 3:2)
 *  - win       — beat the dealer (pays 1:1)
 *  - push      — tie (stake returned)
 *  - lose      — busted or out-scored by the dealer
 */
export type Outcome = 'blackjack' | 'win' | 'push' | 'lose';

/**
 * Round lifecycle (used by the store in Phase 3).
 *  IDLE        — awaiting a bet
 *  PLAYER_TURN — player acting (hit / stand / double)
 *  DEALER_TURN — dealer drawing
 *  RESOLVED    — outcome decided, hands revealed
 */
export type BlackjackStatus = 'IDLE' | 'PLAYER_TURN' | 'DEALER_TURN' | 'RESOLVED';

/** Result of settling a bet against an outcome. */
export interface Payout {
  /** Total returned to the player including stake (0 on a loss). */
  payout: number;
  /** Net profit (negative on a loss). */
  profit: number;
}

/** Result of drawing from a deck — immutable: returns the card and remaining deck. */
export interface DealResult {
  card: Card;
  deck: Card[];
}

/** Result of the opening deal. */
export interface InitialDeal {
  deck: Card[];
  playerHand: Hand;
  dealerHand: Hand;
}

/** Result of the dealer playing out its turn. */
export interface DealerPlayResult {
  deck: Card[];
  dealerHand: Hand;
}
