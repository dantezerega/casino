import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { PlinkoBoard } from '@/components/plinko/PlinkoBoard';
import { usePlinkoStore } from '@/store/plinkoStore';
import { getMultipliers } from '@/game/plinko/payoutTables';
import type { PlinkoPath } from '@/game/plinko/types';

beforeEach(() => {
  usePlinkoStore.setState({
    status: 'IDLE',
    rows: 8,
    risk: 'high',
    bet: 0,
    profit: 0,
    round: null,
    result: null,
    commitment: null,
    nonce: 0,
  });
});
afterEach(cleanup);

describe('PlinkoBoard', () => {
  it('renders one slot label per multiplier', () => {
    const { container } = render(<PlinkoBoard />);
    const labels = container.querySelectorAll('text');
    expect(labels).toHaveLength(getMultipliers(8, 'high').length);
  });

  it('exposes the rows status on the svg', () => {
    const { container } = render(<PlinkoBoard />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-status')).toBe('IDLE');
    expect(svg?.getAttribute('aria-label')).toContain('8 rows');
  });

  it('publishes the landed slot when resolved', () => {
    const path: PlinkoPath = ['R', 'R', 'R', 'L', 'L', 'L', 'L', 'L'];
    usePlinkoStore.setState({
      status: 'RESOLVED',
      result: { path, slot: 3, multiplier: 0.3, payout: 3, profit: -7 },
    });
    const { container } = render(<PlinkoBoard />);
    expect(container.querySelector('svg')?.getAttribute('data-slot')).toBe('3');
  });
});
