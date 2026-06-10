/**
 * Blackjack game flow — pure orchestration over the deck and card math.
 * No React, no state, no mutation. The Zustand store (Phase 3) drives these.
 */

import type {
  Card,
  DealerPlayResult,
  Hand,
  InitialDeal,
  Outcome,
  Payout,
} from '@/game/blackjack/types';
import { dealCard } from '@/game/blackjack/deck';
import {
  calculateHandValue,
  isBlackjack,
  isBust,
} from '@/game/blackjack/cardUtils';

/** Dealer stands once the total reaches this. */
export const DEALER_STANDS_ON = 17;

/** Payout multiples (total returned per unit stake) keyed by outcome. */
const PAYOUT_MULTIPLE: Record<Outcome, number> = {
  blackjack: 2.5, // 3:2 — stake + 1.5× profit
  win: 2, // 1:1 — stake + 1× profit
  push: 1, // stake returned
  lose: 0,
};

/**
 * Opening deal: player, dealer, player, dealer (standard alternating order).
 * Returns both hands and the remaining deck.
 */
export function dealInitial(deck: Card[]): InitialDeal {
  const d0 = dealCard(deck);
  const d1 = dealCard(d0.deck);
  const d2 = dealCard(d1.deck);
  const d3 = dealCard(d2.deck);
  return {
    playerHand: [d0.card, d2.card],
    dealerHand: [d1.card, d3.card],
    deck: d3.deck,
  };
}

/**
 * Play out the dealer's hand: hit while under 17, stand on 17+ (including
 * soft 17). Returns the completed dealer hand and remaining deck.
 */
export function dealerPlay(deck: Card[], dealerHand: Hand): DealerPlayResult {
  let workingDeck = deck;
  let hand = [...dealerHand];

  while (calculateHandValue(hand).total < DEALER_STANDS_ON) {
    const { card, deck: rest } = dealCard(workingDeck);
    hand = [...hand, card];
    workingDeck = rest;
  }

  return { dealerHand: hand, deck: workingDeck };
}

/**
 * Decide the round from the player's perspective. Natural blackjack (two-card
 * 21) is distinguished from a drawn 21, and a dealer natural beats it to a tie
 * only against a player natural.
 */
export function determineWinner(playerHand: Hand, dealerHand: Hand): Outcome {
  const playerBJ = isBlackjack(playerHand);
  const dealerBJ = isBlackjack(dealerHand);

  if (playerBJ && dealerBJ) return 'push';
  if (playerBJ) return 'blackjack';
  if (dealerBJ) return 'lose';

  if (isBust(playerHand)) return 'lose';
  if (isBust(dealerHand)) return 'win';

  const player = calculateHandValue(playerHand).total;
  const dealer = calculateHandValue(dealerHand).total;

  if (player > dealer) return 'win';
  if (player < dealer) return 'lose';
  return 'push';
}

/** Settle a bet against an outcome: total returned and net profit. */
export function resolvePayout(outcome: Outcome, bet: number): Payout {
  const payout = bet * PAYOUT_MULTIPLE[outcome];
  return { payout, profit: payout - bet };
}

/** Double down is only allowed on the opening two-card hand. */
export const canDoubleDown = (hand: Hand): boolean => hand.length === 2;

// Re-export hand helpers so consumers have a single engine entry point.
export { calculateHandValue, isBlackjack, isBust } from '@/game/blackjack/cardUtils';
