import { GameCard } from '@/components/GameCard';
import { GAMES } from '@/config/games';

/** Casino lobby — grid of game cards rendered from the registry. */
export function LobbyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Casino Lobby</h1>
        <p className="mt-1 text-sm text-muted">Pick a game and play. More on the way.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
