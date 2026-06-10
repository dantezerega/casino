import { BlackjackPanel } from '@/components/blackjack/BlackjackPanel';
import { BlackjackTable } from '@/components/blackjack/BlackjackTable';
import { useBlackjackAudio } from '@/hooks/useBlackjackAudio';

/**
 * Blackjack screen. Stake-style: controls left, felt table right on desktop;
 * the table stacks above the controls on mobile.
 */
export function BlackjackPage() {
  useBlackjackAudio();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <span className="text-xl">🃏</span>
        <h1 className="text-lg font-bold tracking-tight">Blackjack</h1>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="order-2 w-full lg:order-1 lg:w-80 lg:shrink-0">
          <BlackjackPanel />
        </div>
        <div className="order-1 lg:order-2 lg:flex-1">
          <BlackjackTable />
        </div>
      </div>

      <footer className="pb-2 text-center text-[11px] text-muted">
        Dealer stands on 17 · Blackjack pays 3:2 · play-money demo
      </footer>
    </div>
  );
}
