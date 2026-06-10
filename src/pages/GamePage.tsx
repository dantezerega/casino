import { Header } from '@/components/Header';
import { BettingPanel } from '@/components/BettingPanel';
import { Board } from '@/components/Board';
import { WinBurst } from '@/components/WinBurst';
import { ProvablyFairPanel } from '@/components/ProvablyFairPanel';
import { useMinesAudio } from '@/hooks/useMinesAudio';

/**
 * Top-level layout. Stake-style: controls left, board right on desktop; the
 * board stacks above the controls on mobile (board-first), provably-fair drawer
 * spans the full width beneath.
 */
export function GamePage() {
  useMinesAudio();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <Header />

      <main className="flex flex-col gap-4 lg:flex-row">
        {/* Controls: below board on mobile, left column on desktop */}
        <div className="order-2 w-full lg:order-1 lg:w-80 lg:shrink-0">
          <BettingPanel />
        </div>

        {/* Board */}
        <div className="order-1 lg:order-2 lg:flex-1">
          <div className="relative rounded-xl bg-panel-light/40 p-3 sm:p-4">
            <WinBurst />
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <Board />
            </div>
          </div>
        </div>
      </main>

      <ProvablyFairPanel />

      <footer className="pb-2 text-center text-[11px] text-muted">
        Play-money demo · provably fair · no real wagering
      </footer>
    </div>
  );
}
