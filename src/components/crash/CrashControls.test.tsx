import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { CrashControls } from '@/components/crash/CrashControls';
import { useCrashStore } from '@/store/crashStore';
import { useGameStore } from '@/store/gameStore';

beforeEach(() => {
  useGameStore.setState({ balance: 1000 });
  useCrashStore.setState({
    status: 'IDLE',
    betAmount: 10,
    currentMultiplier: 1,
    startedAt: null,
    result: null,
    history: [],
    clientSeed: 'client',
    nonce: 0,
    houseEdge: 0.01,
    round: null,
    commitment: null,
  });
});
afterEach(cleanup);

describe('CrashControls', () => {
  it('starts a round, deducting the stake and entering RUNNING', () => {
    render(<CrashControls />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(useCrashStore.getState().status).toBe('RUNNING');
    expect(useGameStore.getState().balance).toBe(990);
  });

  it('disables Start when the bet exceeds the balance', () => {
    useCrashStore.setState({ betAmount: 99999 });
    render(<CrashControls />);
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  });

  it('shows a Cash Out button mid-run and banks the payout', () => {
    render(<CrashControls />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => useCrashStore.setState({ currentMultiplier: 2 }));
    const cashOut = screen.getByRole('button', { name: /Cash Out/ });
    expect(cashOut).toHaveTextContent('20.00');
    fireEvent.click(cashOut);
    expect(useCrashStore.getState().status).toBe('CASHED_OUT');
    expect(useGameStore.getState().balance).toBe(1010); // 1000 - 10 + 20
  });

  it('locks the bet input while RUNNING', () => {
    render(<CrashControls />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });

  it('offers Next Round after a crash and resets to IDLE', () => {
    render(<CrashControls />);
    act(() =>
      useCrashStore.setState({
        status: 'CRASHED',
        result: { crashPoint: 1.5, cashedOutAt: null, multiplier: 1.5, payout: 0, profit: -10, won: false },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next Round' }));
    expect(useCrashStore.getState().status).toBe('IDLE');
  });
});
