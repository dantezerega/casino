import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GAMES, LIVE_GAMES } from '@/config/games';
import { GameCard } from '@/components/GameCard';

afterEach(cleanup);

describe('game registry — Plinko', () => {
  const plinko = GAMES.find((g) => g.id === 'plinko');

  it('is registered and live at /plinko', () => {
    expect(plinko).toBeDefined();
    expect(plinko!.status).toBe('live');
    expect(plinko!.path).toBe('/plinko');
  });

  it('is included among the live games', () => {
    expect(LIVE_GAMES.map((g) => g.id)).toContain('plinko');
  });

  it('renders a Play link on its lobby card', () => {
    render(
      <MemoryRouter>
        <GameCard game={plinko!} />
      </MemoryRouter>,
    );
    const play = screen.getByRole('link', { name: 'Play' });
    expect(play).toHaveAttribute('href', '/plinko');
  });
});
