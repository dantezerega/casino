import { describe, it, expect, beforeEach } from 'vitest';
import {
  useGameStore,
  selectPotentialProfit,
  selectPotentialPayout,
  selectDisplayMultiplier,
  DEFAULT_BALANCE,
} from '@/store/gameStore';

const S = () => useGameStore.getState();

const firstSafe = (): number =>
  [...Array(25).keys()].find((i) => !S().round!.minePositions.includes(i))!;

beforeEach(() => {
  // Reset the singleton to a known state (actions are preserved on merge).
  useGameStore.setState({
    status: 'IDLE',
    tiles: [],
    betAmount: 1,
    mineCount: 3,
    balance: DEFAULT_BALANCE,
    gemsRevealed: 0,
    multiplier: 1,
    profit: 0,
    lastPickIndex: null,
    nonce: 0,
    round: null,
    commitment: null,
  });
});

describe('initial state', () => {
  it('starts IDLE with the default balance', () => {
    expect(S().status).toBe('IDLE');
    expect(S().balance).toBe(DEFAULT_BALANCE);
  });
});

describe('startGame', () => {
  it('enters PLAYING, deducts the bet, builds the board and commitment', () => {
    S().setBetAmount(10);
    S().startGame();
    expect(S().status).toBe('PLAYING');
    expect(S().balance).toBe(990);
    expect(S().tiles).toHaveLength(25);
    expect(S().commitment?.serverSeedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(S().commitment?.nonce).toBe(0);
  });

  it('rejects a bet larger than the balance', () => {
    S().setBetAmount(999999);
    S().startGame();
    expect(S().status).toBe('IDLE');
  });

  it('rejects a non-positive bet', () => {
    S().setBetAmount(0);
    S().startGame();
    expect(S().status).toBe('IDLE');
  });
});

describe('input guards while PLAYING', () => {
  beforeEach(() => {
    S().setBetAmount(10);
    S().startGame();
  });

  it('locks bet and mine inputs', () => {
    S().setBetAmount(500);
    S().setMineCount(10);
    expect(S().betAmount).toBe(10);
    expect(S().mineCount).toBe(3);
  });

  it('ignores reveal of an already-revealed tile', () => {
    const idx = firstSafe();
    S().revealTile(idx);
    const gems = S().gemsRevealed;
    S().revealTile(idx);
    expect(S().gemsRevealed).toBe(gems);
  });
});

describe('safe pick', () => {
  it('reveals a gem, raises the multiplier, tracks pick + profit', () => {
    S().setBetAmount(10);
    S().startGame();
    const idx = firstSafe();
    S().revealTile(idx);
    expect(S().gemsRevealed).toBe(1);
    expect(S().multiplier).toBeGreaterThan(1);
    expect(S().tiles[idx].revealed && S().tiles[idx].picked).toBe(true);
    expect(S().lastPickIndex).toBe(idx);
    expect(selectPotentialProfit(S())).toBeGreaterThan(0);
    expect(selectPotentialPayout(S())).toBeCloseTo(10 * S().multiplier, 10);
  });
});

describe('cashOut', () => {
  it('credits payout, records net profit, reveals the board', () => {
    S().setBetAmount(10);
    S().startGame();
    S().revealTile(firstSafe());
    const mult = S().multiplier;
    S().cashOut();
    expect(S().status).toBe('CASHED_OUT');
    expect(S().balance).toBeCloseTo(990 + 10 * mult, 10);
    expect(S().profit).toBeCloseTo(10 * mult - 10, 10);
    expect(S().tiles.every((t) => t.revealed)).toBe(true);
  });

  it('refuses to cash out with zero gems revealed', () => {
    S().setBetAmount(10);
    S().startGame();
    S().cashOut();
    expect(S().status).toBe('PLAYING');
  });
});

describe('loss path', () => {
  it('hitting a mine ends the round, forfeits the stake, reveals all', () => {
    S().setBetAmount(20);
    S().startGame();
    const balAfterBet = S().balance;
    const mine = S().round!.minePositions[0];
    S().revealTile(mine);
    expect(S().status).toBe('LOST');
    expect(S().balance).toBe(balAfterBet);
    expect(S().profit).toBe(0);
    expect(S().multiplier).toBe(1);
    expect(S().tiles.every((t) => t.revealed)).toBe(true);
    expect(S().tiles.filter((t) => t.picked)).toHaveLength(1); // only the hit tile
  });
});

describe('resetGame', () => {
  it('returns to IDLE, advances the nonce, clears the round', () => {
    S().setBetAmount(10);
    S().startGame();
    S().revealTile(firstSafe());
    S().cashOut();
    S().resetGame();
    expect(S().status).toBe('IDLE');
    expect(S().nonce).toBe(1);
    expect(S().round).toBeNull();
    expect(S().commitment).toBeNull();
  });

  it('refuses to abandon a live round', () => {
    S().setBetAmount(10);
    S().startGame();
    S().resetGame();
    expect(S().status).toBe('PLAYING');
  });
});

describe('auto-win on board clear', () => {
  it('revealing the last safe tile force-cashes at max multiplier', () => {
    S().setBetAmount(10);
    S().setMineCount(24); // single safe tile
    S().startGame();
    const safe = firstSafe();
    const balBefore = S().balance;
    S().revealTile(safe);
    expect(S().status).toBe('CASHED_OUT');
    expect(S().balance - balBefore).toBeCloseTo(10 * 24.75, 6);
  });
});

describe('revealTile outside PLAYING', () => {
  it('is a no-op when IDLE', () => {
    S().revealTile(0);
    expect(S().tiles).toHaveLength(0);
    expect(S().status).toBe('IDLE');
  });
});

describe('client seed actions', () => {
  it('sets and randomizes the client seed when not playing', () => {
    S().setClientSeed('my-seed');
    expect(S().clientSeed).toBe('my-seed');
    S().regenerateClientSeed();
    expect(S().clientSeed).not.toBe('my-seed');
    expect(S().clientSeed).toMatch(/^[0-9a-f]{32}$/);
  });

  it('locks the client seed while PLAYING', () => {
    S().setClientSeed('fixed');
    S().setBetAmount(10);
    S().startGame();
    S().setClientSeed('changed');
    S().regenerateClientSeed();
    expect(S().clientSeed).toBe('fixed');
  });
});

describe('display selectors', () => {
  it('round the multiplier and zero potential profit when idle', () => {
    useGameStore.setState({ multiplier: 2.34567 });
    expect(selectDisplayMultiplier(S())).toBe(2.35);
    expect(selectPotentialProfit(S())).toBe(0); // not PLAYING
  });
});
