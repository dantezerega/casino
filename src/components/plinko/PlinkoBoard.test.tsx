import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { PlinkoBoard } from '@/components/plinko/PlinkoBoard';
import { usePlinkoStore } from '@/store/plinkoStore';
import { getMultipliers } from '@/game/plinko/payoutTables';
import type { PlinkoPath } from '@/game/plinko/types';

beforeEach(() => {
  usePlinkoStore.setState({
    rows: 8,
    risk: 'high',
    balls: [],
    lastResult: null,
    resolvedCount: 0,
    dropCount: 0,
    commitment: null,
    nonce: 0,
    nextId: 0,
  });
});
afterEach(cleanup);

describe('PlinkoBoard', () => {
  it('renders one slot label per multiplier', () => {
    const { container } = render(<PlinkoBoard />);
    expect(container.querySelectorAll('text')).toHaveLength(getMultipliers(8, 'high').length);
  });

  it('reports the airborne ball count and rows on the svg', () => {
    const { container } = render(<PlinkoBoard />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-active-balls')).toBe('0');
    expect(svg?.getAttribute('aria-label')).toContain('8 rows');
  });

  it('highlights the most recently landed slot', () => {
    const path: PlinkoPath = ['R', 'R', 'R', 'L', 'L', 'L', 'L', 'L'];
    usePlinkoStore.setState({
      lastResult: { path, slot: 3, multiplier: 0.3, payout: 3, profit: -7 },
    });
    const { container } = render(<PlinkoBoard />);
    expect(container.querySelector('svg')?.getAttribute('data-slot')).toBe('3');
  });
});
