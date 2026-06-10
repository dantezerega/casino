/**
 * Zustand store — Blackjack state machine.
 *
 * Holds table view state and sequences IDLE → PLAYER_TURN → DEALER_TURN →
 * RESOLVED. All card/flow math comes from `@/game/blackjack/*`; no game logic
 * lives here. Actions guard on `status`, so illegal moves are silent no-ops.
 *
 * Wallet: balance is shared with Mines via the existing `gameStore` — Blackjack
 * deducts stakes from and credits payouts to that single bankroll, leaving the
 * Mines store's own logic untouched.
 */

import { create } from 'zustand';
import { useGameStore } from '@/store/gameStore';
import type {
  BlackjackStatus,
  Card,
  Hand,
  Outcome,
} from '@/game/blackjack/types';
import { createDeck, dealCard, shuffleDeck } from '@/game/blackjack/deck';
import {
  canDoubleDown,
  dealInitial,
  dealerPlay,
  determineWinner,
  isBlackjack,
  isBust,
  resolvePayout,
  calculateHandValue,
} from '@/game/blackjack/blackjackEngine';

export const DEFAULT_BLACKJACK_BET = 1;

/** Adjust the shared wallet held in the Mines gameStore. */
const adjustBalance = (delta: number): void =>
  useGameStore.setState((s) => ({ balance: s.balance + delta }));

const readBalance = (): number => useGameStore.getState().balance;

interface BlackjackStoreState {
  status: BlackjackStatus;
  deck: Card[];
  playerHand: Hand;
  dealerHand: Hand;
  /** Editable bet input. */
  betAmount: number;
  /** Active wager for the live round (doubles on double-down). */
  bet: number;
  /** Dealer's second card is face-down during the player's turn. */
  dealerHoleHidden: boolean;
  /** Set when the player doubled down this round. */
  doubled: boolean;
  outcome: Outcome | null;
  /** Net profit/loss of the resolved round. */
  profit: number;

  setBetAmount: (amount: number) => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  newHand: () => void;
}

export const useBlackjackStore = create<BlackjackStoreState>((set, get) => {
  /** Reveal the hole card, decide the round, credit the payout, go RESOLVED. */
  const settle = (
    playerHand: Hand,
    dealerHand: Hand,
    bet: number,
    deck: Card[],
  ): void => {
    const outcome = determineWinner(playerHand, dealerHand);
    const { payout, profit } = resolvePayout(outcome, bet);
    adjustBalance(payout);
    set({
      status: 'RESOLVED',
      dealerHoleHidden: false,
      outcome,
      profit,
      deck,
      playerHand,
      dealerHand,
    });
  };

  /** Dealer draws to completion, then the round settles. */
  const finishWithDealer = (
    deck: Card[],
    playerHand: Hand,
    dealerHand: Hand,
    bet: number,
  ): void => {
    const { dealerHand: finalDealer, deck: rest } = dealerPlay(deck, dealerHand);
    settle(playerHand, finalDealer, bet, rest);
  };

  const acting = (): boolean => {
    const s = get().status;
    return s === 'PLAYER_TURN' || s === 'DEALER_TURN';
  };

  return {
    status: 'IDLE',
    deck: [],
    playerHand: [],
    dealerHand: [],
    betAmount: DEFAULT_BLACKJACK_BET,
    bet: 0,
    dealerHoleHidden: false,
    doubled: false,
    outcome: null,
    profit: 0,

    setBetAmount: (amount) => {
      if (acting()) return;
      set({ betAmount: Number.isFinite(amount) && amount > 0 ? amount : 0 });
    },

    deal: () => {
      if (acting()) return;
      const { betAmount } = get();
      if (betAmount <= 0 || betAmount > readBalance()) return;

      adjustBalance(-betAmount);
      const { playerHand, dealerHand, deck } = dealInitial(
        shuffleDeck(createDeck()),
      );

      // Natural blackjack on either side ends the round immediately.
      if (isBlackjack(playerHand) || isBlackjack(dealerHand)) {
        settle(playerHand, dealerHand, betAmount, deck);
        set({ bet: betAmount, doubled: false });
        return;
      }

      set({
        status: 'PLAYER_TURN',
        deck,
        playerHand,
        dealerHand,
        bet: betAmount,
        dealerHoleHidden: true,
        doubled: false,
        outcome: null,
        profit: 0,
      });
    },

    hit: () => {
      const { status, deck, playerHand, dealerHand, bet } = get();
      if (status !== 'PLAYER_TURN') return;

      const { card, deck: rest } = dealCard(deck);
      const next = [...playerHand, card];

      if (isBust(next)) {
        settle(next, dealerHand, bet, rest); // bust — dealer need not draw
        return;
      }
      set({ deck: rest, playerHand: next });
    },

    stand: () => {
      const { status, deck, playerHand, dealerHand, bet } = get();
      if (status !== 'PLAYER_TURN') return;
      set({ status: 'DEALER_TURN', dealerHoleHidden: false });
      finishWithDealer(deck, playerHand, dealerHand, bet);
    },

    doubleDown: () => {
      const { status, deck, playerHand, dealerHand, bet } = get();
      if (status !== 'PLAYER_TURN' || !canDoubleDown(playerHand)) return;
      if (readBalance() < bet) return; // must be able to match the stake

      adjustBalance(-bet);
      const doubledBet = bet * 2;
      const { card, deck: rest } = dealCard(deck);
      const next = [...playerHand, card];

      set({
        playerHand: next,
        bet: doubledBet,
        doubled: true,
        dealerHoleHidden: false,
      });

      if (isBust(next)) {
        settle(next, dealerHand, doubledBet, rest);
        return;
      }
      set({ status: 'DEALER_TURN' });
      finishWithDealer(rest, next, dealerHand, doubledBet);
    },

    newHand: () => {
      if (acting()) return;
      set({
        status: 'IDLE',
        deck: [],
        playerHand: [],
        dealerHand: [],
        bet: 0,
        dealerHoleHidden: false,
        doubled: false,
        outcome: null,
        profit: 0,
      });
    },
  };
});

// --- non-reactive selectors ------------------------------------------------

/** Player's current hand total. */
export const selectPlayerTotal = (s: BlackjackStoreState): number =>
  calculateHandValue(s.playerHand).total;

/**
 * Dealer total visible to the player: only the up-card while the hole is
 * hidden, the full hand once revealed.
 */
export const selectDealerVisibleTotal = (s: BlackjackStoreState): number => {
  if (s.dealerHand.length === 0) return 0;
  if (s.dealerHoleHidden) return calculateHandValue([s.dealerHand[0]]).total;
  return calculateHandValue(s.dealerHand).total;
};

/** Whether double-down is currently allowed (needs a matchable balance). */
export const selectCanDouble = (s: BlackjackStoreState): boolean =>
  s.status === 'PLAYER_TURN' &&
  canDoubleDown(s.playerHand) &&
  readBalance() >= s.bet;
