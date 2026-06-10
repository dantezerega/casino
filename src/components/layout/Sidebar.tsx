import { NavLink } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/utils/format';
import { GAMES } from '@/config/games';
import { SoundSettings } from '@/components/SoundSettings';

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

/**
 * Navigation contents shared by the desktop rail and the mobile drawer.
 * `onNavigate` lets the mobile drawer close itself after a selection.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const balance = useGameStore((s) => s.balance);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="text-2xl">🎰</span>
        <span className="text-lg font-bold tracking-tight">Casino</span>
      </NavLink>

      <div className="rounded-xl bg-bg p-3 ring-1 ring-white/10">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted">Balance</div>
        <div className="mt-0.5 text-lg font-bold tabular-nums text-accent">
          {formatCurrency(balance)}
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-panel-light text-white' : 'text-muted hover:bg-panel-light/50 hover:text-white'}`
          }
        >
          <span className="text-base">🏠</span> Lobby
        </NavLink>

        <div className="mt-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Games
        </div>

        {GAMES.map((game) => {
          const live = game.status === 'live';
          const inner = (
            <>
              <span className={`h-5 w-5 ${game.accent}`}>{game.icon}</span>
              <span className="flex-1">{game.name}</span>
              {!live && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted">
                  Soon
                </span>
              )}
            </>
          );

          return live ? (
            <NavLink
              key={game.id}
              to={game.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-panel-light text-white' : 'text-muted hover:bg-panel-light/50 hover:text-white'}`
              }
            >
              {inner}
            </NavLink>
          ) : (
            <div
              key={game.id}
              className={`${linkBase} cursor-not-allowed text-muted/60`}
              aria-disabled
            >
              {inner}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <SoundSettings />
        <div className="px-1 text-[10px] leading-relaxed text-muted">
          Play-money demo · provably fair · no real wagering
        </div>
      </div>
    </div>
  );
}

/** Fixed desktop navigation rail. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-panel/40 lg:block">
      <div className="sticky top-0 h-screen">
        <SidebarContent />
      </div>
    </aside>
  );
}
