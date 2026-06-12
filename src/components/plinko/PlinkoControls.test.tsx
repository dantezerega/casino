import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PlinkoControls } from '@/components/plinko/PlinkoControls';
import {
  usePlinkoStore,
  DEFAULT_PLINKO_ROWS,
  DEFAULT_PLINKO_RISK,
} from '@/store/plinkoStore';
import { useGameStore } from '@/store/gameStore';

const dropButton = () => screen.getByRole('button', { name: /^Drop/ });

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
afterEach(cleanup);

describe('PlinkoControls', () => {
  it('renders a Drop button', () => {
    render(<PlinkoControls />);
    expect(dropButton()).toBeInTheDocument();
  });

  it('selecting risk and rows updates the store', () => {
    render(<PlinkoControls />);
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    expect(usePlinkoStore.getState().risk).toBe('high');
    expect(usePlinkoStore.getState().rows).toBe(8);
  });

  it('can be spammed — each click stacks another ball and deducts a stake', () => {
    render(<PlinkoControls />);
    fireEvent.click(dropButton());
    fireEvent.click(dropButton());
    fireEvent.click(dropButton());
    expect(usePlinkoStore.getState().balls).toHaveLength(3);
    expect(useGameStore.getState().balance).toBe(970);
    expect(dropButton()).toHaveTextContent('3 in play');
  });

  it('locks rows/risk while balls are airborne but keeps Drop enabled', () => {
    render(<PlinkoControls />);
    fireEvent.click(dropButton());
    expect(screen.getByRole('button', { name: 'High' })).toBeDisabled();
    expect(dropButton()).not.toBeDisabled();
  });

  it('disables Drop when the bet exceeds the balance', () => {
    usePlinkoStore.setState({ betAmount: 99999 });
    render(<PlinkoControls />);
    expect(dropButton()).toBeDisabled();
  });
});
