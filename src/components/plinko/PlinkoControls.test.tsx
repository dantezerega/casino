import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PlinkoControls } from '@/components/plinko/PlinkoControls';
import {
  usePlinkoStore,
  DEFAULT_PLINKO_ROWS,
  DEFAULT_PLINKO_RISK,
} from '@/store/plinkoStore';
import { useGameStore } from '@/store/gameStore';

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
afterEach(cleanup);

describe('PlinkoControls', () => {
  it('renders Drop while idle', () => {
    render(<PlinkoControls />);
    expect(screen.getByRole('button', { name: 'Drop' })).toBeInTheDocument();
  });

  it('selecting risk and rows updates the store', () => {
    render(<PlinkoControls />);
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    expect(usePlinkoStore.getState().risk).toBe('high');
    expect(usePlinkoStore.getState().rows).toBe(8);
  });

  it('drop moves the machine to DROPPING and deducts the stake', () => {
    render(<PlinkoControls />);
    fireEvent.click(screen.getByRole('button', { name: 'Drop' }));
    expect(usePlinkoStore.getState().status).toBe('DROPPING');
    expect(useGameStore.getState().balance).toBe(990);
  });

  it('locks selectors and the button while dropping', () => {
    usePlinkoStore.setState({ status: 'DROPPING' });
    render(<PlinkoControls />);
    expect(screen.getByRole('button', { name: 'Dropping…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'High' })).toBeDisabled();
  });

  it('disables Drop when the bet exceeds the balance', () => {
    usePlinkoStore.setState({ betAmount: 99999 });
    render(<PlinkoControls />);
    expect(screen.getByRole('button', { name: 'Drop' })).toBeDisabled();
  });
});
