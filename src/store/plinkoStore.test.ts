import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePlinkoStore,
  selectMultipliers,
  selectCanDrop,
  selectConfigLocked,
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
    betAmount: 10,
    rows: DEFAULT_PLINKO_ROWS,
    risk: DEFAULT_PLINKO_RISK,
    balls: [],
    lastResult: null,
    resolvedCount: 0,
    dropCount: 0,
    commitment: null,
    clientSeed: 'client',
    nonce: 0,
    nextId: 0,
  });
});

describe('drop / guards', () => {
  it('starts with no balls', () => {
    expect(P().balls).toHaveLength(0);
  });

  it('rejects a drop when the bet exceeds the balance', () => {
    P().setBetAmount(99999);
    P().drop();
    expect(P().balls).toHaveLength(0);
    expect(balance()).toBe(1000);
  });

  it('a drop spawns a ball, deducts the stake, advances the nonce', () => {
    P().drop();
    expect(P().balls).toHaveLength(1);
    expect(balance()).toBe(990);
    expect(P().nonce).toBe(1);
    expect(P().dropCount).toBe(1);
    expect(P().balls[0].path).toHaveLength(P().rows);
  });
});

describe('spamming — concurrent balls', () => {
  it('stacks many balls at once, each deducting its stake', () => {
    useGameStore.setState({ balance: 1000 });
    for (let i = 0; i < 25; i++) P().drop();
    expect(P().balls).toHaveLength(25);
    expect(balance()).toBe(1000 - 25 * 10);
    const ids = P().balls.map((b) => b.id);
    expect(new Set(ids).size).toBe(25); // unique ids
  });

  it('each ball derives from a distinct nonce', () => {
    for (let i = 0; i < 10; i++) P().drop();
    expect(P().nonce).toBe(10);
  });

  it('landing a ball credits its payout and removes only that ball', () => {
    P().drop();
    P().drop();
    const [a, b] = P().balls;
    const afterDrops = balance();
    P().land(a.id);
    expect(P().balls.map((x) => x.id)).toEqual([b.id]);
    expect(balance()).toBe(afterDrops + a.result.payout);
    expect(P().lastResult).toEqual(a.result);
    expect(P().resolvedCount).toBe(1);
  });

  it('landing an unknown id is a no-op', () => {
    P().drop();
    const before = balance();
    P().land(9999);
    expect(P().balls).toHaveLength(1);
    expect(balance()).toBe(before);
  });
});

describe('config lock while balls airborne', () => {
  it('locks rows/risk until every ball lands', () => {
    P().drop();
    P().setRows(8);
    P().setRisk('high');
    expect(P().rows).toBe(DEFAULT_PLINKO_ROWS);
    expect(P().risk).toBe(DEFAULT_PLINKO_RISK);
    P().land(P().balls[0].id);
    P().setRows(8);
    expect(P().rows).toBe(8);
  });

  it('bet stays editable while balls are airborne (spam different stakes)', () => {
    P().drop();
    P().setBetAmount(50);
    expect(P().betAmount).toBe(50);
  });
});

describe('money invariant (Δbalance === Σ profit) over many concurrent balls', () => {
  it('holds when dropping a burst then landing all', () => {
    const rowsOptions = [8, 12, 16] as const;
    const riskOptions = ['low', 'medium', 'high'] as const;
    for (let round = 0; round < 60; round++) {
      useGameStore.setState({ balance: 1_000_000 });
      usePlinkoStore.setState({ balls: [], lastResult: null, nextId: 0, nonce: round * 100 });
      P().setRows(rowsOptions[round % 3]);
      P().setRisk(riskOptions[round % 3]);

      const start = balance();
      const count = 5 + (round % 20);
      for (let i = 0; i < count; i++) {
        P().setBetAmount(1 + (i % 7));
        P().drop();
      }
      const expectedProfit = P().balls.reduce((sum, b) => sum + b.result.profit, 0);
      for (const b of [...P().balls]) P().land(b.id);

      expect(P().balls).toHaveLength(0);
      expect(balance() - start).toBeCloseTo(expectedProfit, 8);
    }
  });
});

describe('selectors', () => {
  it('selectMultipliers returns the active table', () => {
    P().setRows(8);
    P().setRisk('high');
    expect(selectMultipliers(P())).toEqual(getMultipliers(8, 'high'));
  });

  it('selectCanDrop tracks bet vs balance and ignores airborne balls', () => {
    expect(selectCanDrop(P())).toBe(true);
    P().drop();
    expect(selectCanDrop(P())).toBe(true); // still droppable while balls fly
    P().setBetAmount(99999);
    expect(selectCanDrop(P())).toBe(false);
  });

  it('selectConfigLocked is true while any ball is airborne', () => {
    expect(selectConfigLocked(P())).toBe(false);
    P().drop();
    expect(selectConfigLocked(P())).toBe(true);
  });
});
