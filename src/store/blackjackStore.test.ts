import { describe, it, expect, beforeEach } from 'vitest';
import {
  useBlackjackStore,
  selectPlayerTotal,
  selectDealerVisibleTotal,
  selectCanDouble,
} from '@/store/blackjackStore';
import { useGameStore } from '@/store/gameStore';
import type { Rank, Suit } from '@/game/blackjack/types';

const B = () => useBlackjackStore.getState();
const balance = () => useGameStore.getState().balance;
const c = (rank: Rank, suit: Suit = 'hearts') => ({ rank, suit });

beforeEach(() => {
  useGameStore.setState({ balance: 1000 });
  useBlackjackStore.setState({
    status: 'IDLE',
    deck: [],
    playerHand: [],
    dealerHand: [],
    betAmount: 10,
    bet: 0,
    dealerHoleHidden: false,
    doubled: false,
    outcome: null,
    profit: 0,
  });
});

describe('initial / guards', () => {
  it('starts IDLE', () => {
    expect(B().status).toBe('IDLE');
  });

  it('hit/stand/double are no-ops while IDLE', () => {
    B().hit();
    B().stand();
    B().doubleDown();
    expect(B().status).toBe('IDLE');
    expect(balance()).toBe(1000);
  });

  it('rejects a deal when the bet exceeds the balance', () => {
    B().setBetAmount(99999);
    B().deal();
    expect(B().status).toBe('IDLE');
    expect(balance()).toBe(1000);
  });

  it('locks the bet input while a hand is in play', () => {
    useBlackjackStore.setState({ status: 'PLAYER_TURN' });
    B().setBetAmount(500);
    expect(B().betAmount).toBe(10);
  });
});

describe('money invariant (Δbalance === profit) over many real rounds', () => {
  it('holds for deal → stand/hit across 200 rounds', () => {
    let naturals = 0;
    for (let i = 0; i < 200; i++) {
      useGameStore.setState({ balance: 1000 });
      B().newHand();
      B().setBetAmount(10);
      const before = balance();
      B().deal();

      if (B().status === 'PLAYER_TURN') {
        expect(balance()).toBe(before - 10); // stake deducted
        if (i % 4 === 0 && selectPlayerTotal(B()) < 12) B().hit();
        if (B().status === 'PLAYER_TURN') B().stand();
      } else {
        naturals += 1; // resolved immediately on a natural
      }

      expect(B().status).toBe('RESOLVED');
      expect(['win', 'lose', 'push', 'blackjack']).toContain(B().outcome);
      expect(balance() - before).toBe(B().profit);
      expect(B().dealerHoleHidden).toBe(false); // hole always revealed at end
    }
    expect(naturals).toBeGreaterThan(0); // sanity: some naturals occurred
  });
});

describe('hit → bust', () => {
  it('busting ends the round as a loss', () => {
    useBlackjackStore.setState({
      status: 'PLAYER_TURN',
      bet: 10,
      dealerHoleHidden: true,
      playerHand: [c('10'), c('10', 'clubs')],
      dealerHand: [c('9', 'spades'), c('7')],
      deck: [c('5', 'diamonds'), c('2', 'clubs')],
    });
    B().hit();
    expect(B().status).toBe('RESOLVED');
    expect(B().outcome).toBe('lose');
    expect(B().profit).toBe(-10);
    expect(B().dealerHoleHidden).toBe(false);
  });
});

describe('double down', () => {
  beforeEach(() => {
    useGameStore.setState({ balance: 1000 });
    useBlackjackStore.setState({
      status: 'PLAYER_TURN',
      bet: 10,
      dealerHoleHidden: true,
      playerHand: [c('5'), c('6', 'clubs')], // 11
      dealerHand: [c('10', 'spades'), c('8')], // 18, stands
      deck: [c('9', 'diamonds')], // → 20
    });
  });

  it('doubles the bet, draws exactly one card, and resolves', () => {
    expect(selectCanDouble(B())).toBe(true);
    B().doubleDown();
    expect(B().playerHand).toHaveLength(3);
    expect(B().bet).toBe(20);
    expect(B().doubled).toBe(true);
    expect(B().status).toBe('RESOLVED');
    expect(B().outcome).toBe('win'); // 20 beats 18
  });

  it('cannot double after the hand grows past two cards', () => {
    B().doubleDown();
    expect(selectCanDouble(B())).toBe(false);
  });

  it('is blocked when the balance cannot match the stake', () => {
    useGameStore.setState({ balance: 5 }); // < bet 10
    expect(selectCanDouble(B())).toBe(false);
    B().doubleDown();
    expect(B().playerHand).toHaveLength(2); // unchanged
  });

  it('resolves as a loss when the double-down card busts', () => {
    useBlackjackStore.setState({
      playerHand: [c('10'), c('6', 'clubs')], // 16
      dealerHand: [c('10', 'spades'), c('7')],
      deck: [c('10', 'diamonds')], // → 26 bust
    });
    B().doubleDown();
    expect(B().playerHand).toHaveLength(3);
    expect(B().bet).toBe(20);
    expect(B().status).toBe('RESOLVED');
    expect(B().outcome).toBe('lose');
  });
});

describe('selectors', () => {
  it('dealer visible total shows only the up-card while the hole is hidden', () => {
    useBlackjackStore.setState({
      status: 'PLAYER_TURN',
      dealerHoleHidden: true,
      dealerHand: [c('10', 'spades'), c('9')], // up-card 10, hidden 9
    });
    expect(selectDealerVisibleTotal(B())).toBe(10);
  });

  it('dealer visible total shows the full hand once revealed', () => {
    useBlackjackStore.setState({
      status: 'RESOLVED',
      dealerHoleHidden: false,
      dealerHand: [c('10', 'spades'), c('9')],
    });
    expect(selectDealerVisibleTotal(B())).toBe(19);
  });

  it('player total reflects the hand', () => {
    useBlackjackStore.setState({ playerHand: [c('A'), c('7')] });
    expect(selectPlayerTotal(B())).toBe(18);
  });
});

describe('newHand', () => {
  it('clears the table to IDLE but preserves the shared wallet', () => {
    useGameStore.setState({ balance: 742 });
    useBlackjackStore.setState({
      status: 'RESOLVED',
      playerHand: [c('A'), c('K')],
      dealerHand: [c('10'), c('9')],
      outcome: 'blackjack',
    });
    B().newHand();
    expect(B().status).toBe('IDLE');
    expect(B().playerHand).toHaveLength(0);
    expect(B().dealerHand).toHaveLength(0);
    expect(B().outcome).toBeNull();
    expect(balance()).toBe(742);
  });

  it('refuses to clear mid-hand', () => {
    useBlackjackStore.setState({ status: 'PLAYER_TURN' });
    B().newHand();
    expect(B().status).toBe('PLAYER_TURN');
  });
});
