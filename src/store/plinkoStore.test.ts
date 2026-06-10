import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePlinkoStore,
  selectMultipliers,
  selectResultMultiplier,
  selectCanDrop,
  DEFAULT_PLINKO_ROWS,
  DEFAULT_PLINKO_RISK,
} from '@/store/plinkoStore';
import { useGameStore } from '@/store/gameStore';
import { getMultipliers } from '@/game/plinko/payoutTables';

const P = () => usePlinkoStore.getState();
const balance = () => useGameStore.getState().balance;

beforeEach(() => {
  useGameStore.setState({ balance: 1000 });
  usePlinkoStore.setState({
    status: 'IDLE',
    betAmount: 10,
    rows: DEFAULT_PLINKO_ROWS,
    risk: DEFAULT_PLINKO_RISK,
    bet: 0,
    profit: 0,
    round: null,
    result: null,
    commitment: null,
    clientSeed: 'client',
    nonce: 0,
  });
});

describe('initial / guards', () => {
  it('starts IDLE', () => {
    expect(P().status).toBe('IDLE');
  });

  it('resolve/reset are no-ops while IDLE', () => {
    P().resolve();
    expect(P().status).toBe('IDLE');
  });

  it('rejects a drop when the bet exceeds the balance', () => {
    P().setBetAmount(99999);
    P().drop();
    expect(P().status).toBe('IDLE');
    expect(balance()).toBe(1000);
  });

  it('rejects a drop when the bet is zero', () => {
    P().setBetAmount(0);
    P().drop();
    expect(P().status).toBe('IDLE');
  });

  it('locks config while dropping', () => {
    P().drop();
    expect(P().status).toBe('DROPPING');
    P().setBetAmount(500);
    P().setRows(8);
    P().setRisk('high');
    expect(P().betAmount).toBe(10);
    expect(P().rows).toBe(DEFAULT_PLINKO_ROWS);
    expect(P().risk).toBe(DEFAULT_PLINKO_RISK);
  });

  it('ignores invalid rows and risk', () => {
    P().setRows(10 as never);
    P().setRisk('wild' as never);
    expect(P().rows).toBe(DEFAULT_PLINKO_ROWS);
    expect(P().risk).toBe(DEFAULT_PLINKO_RISK);
  });
});

describe('drop lifecycle', () => {
  it('deducts the stake and arms a result on drop', () => {
    P().drop();
    expect(P().status).toBe('DROPPING');
    expect(balance()).toBe(990);
    expect(P().bet).toBe(10);
    expect(P().result).not.toBeNull();
    expect(P().commitment).not.toBeNull();
    expect(P().result!.path).toHaveLength(P().rows);
  });

  it('credits the payout on resolve and reports profit', () => {
    P().drop();
    const armed = P().result!;
    P().resolve();
    expect(P().status).toBe('RESOLVED');
    expect(balance()).toBe(1000 - 10 + armed.payout);
    expect(P().profit).toBe(armed.profit);
  });

  it('advances the nonce on a drop following a resolved round', () => {
    P().drop();
    P().resolve();
    const firstNonce = P().nonce;
    P().drop();
    expect(P().nonce).toBe(firstNonce + 1);
  });

  it('reset returns to IDLE and bumps the nonce, preserving the wallet', () => {
    P().drop();
    P().resolve();
    useGameStore.setState({ balance: 555 });
    const n = P().nonce;
    P().reset();
    expect(P().status).toBe('IDLE');
    expect(P().result).toBeNull();
    expect(P().round).toBeNull();
    expect(P().nonce).toBe(n + 1);
    expect(balance()).toBe(555);
  });

  it('refuses to reset mid-drop', () => {
    P().drop();
    P().reset();
    expect(P().status).toBe('DROPPING');
  });
});

describe('money invariant (Δbalance === profit) over many rounds', () => {
  it('holds across rows/risk for hundreds of drops', () => {
    const rowsOptions = [8, 12, 16] as const;
    const riskOptions = ['low', 'medium', 'high'] as const;
    for (let i = 0; i < 300; i++) {
      useGameStore.setState({ balance: 100000 });
      usePlinkoStore.setState({ status: 'IDLE', nonce: i });
      P().setRows(rowsOptions[i % rowsOptions.length]);
      P().setRisk(riskOptions[i % riskOptions.length]);
      P().setBetAmount(1 + (i % 25));
      const before = balance();
      P().drop();
      expect(balance()).toBe(before - P().bet);
      P().resolve();
      expect(P().status).toBe('RESOLVED');
      expect(balance() - before).toBeCloseTo(P().profit, 10);
    }
  });
});

describe('selectors', () => {
  it('selectMultipliers returns the active table', () => {
    P().setRows(8);
    P().setRisk('high');
    expect(selectMultipliers(P())).toEqual(getMultipliers(8, 'high'));
  });

  it('selectResultMultiplier is null until a drop, then the slot multiplier', () => {
    expect(selectResultMultiplier(P())).toBeNull();
    P().drop();
    expect(selectResultMultiplier(P())).toBe(P().result!.multiplier);
  });

  it('selectCanDrop reflects bet and balance', () => {
    expect(selectCanDrop(P())).toBe(true);
    P().setBetAmount(99999);
    expect(selectCanDrop(P())).toBe(false);
    P().setBetAmount(10);
    P().drop();
    expect(selectCanDrop(P())).toBe(false);
  });
});
