import { GameCard } from '@/components/GameCard';
import { GAMES, LIVE_GAMES } from '@/config/games';

/** Casino lobby — hero banner + grid of game cards rendered from the registry. */
export function LobbyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/5 bg-panel/40 p-6 backdrop-blur-sm sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" aria-hidden />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent ring-1 ring-accent/30">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px] shadow-accent" />
            Provably fair
          </span>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            <span className="text-shimmer">Play the house.</span>
            <br />
            Beat the odds.
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted sm:text-base">
            Play-money casino with cryptographically verifiable rolls. Pick a game and go —
            no wallet, no risk, all neon.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-white/5 px-3 py-1.5 font-semibold ring-1 ring-white/10">
              <span className="font-display text-accent">{LIVE_GAMES.length}</span>{' '}
              <span className="text-muted">live games</span>
            </span>
            <span className="rounded-lg bg-white/5 px-3 py-1.5 font-semibold ring-1 ring-white/10">
              <span className="font-display text-gold">100%</span>{' '}
              <span className="text-muted">provably fair</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
