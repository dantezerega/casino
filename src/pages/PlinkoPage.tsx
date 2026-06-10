import { PlinkoBoard } from '@/components/plinko/PlinkoBoard';
import { PlinkoControls } from '@/components/plinko/PlinkoControls';
import { PlinkoResult } from '@/components/plinko/PlinkoResult';

export function PlinkoPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <span className="text-xl">🎯</span>
        <h1 className="text-lg font-bold tracking-tight">Plinko</h1>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-80 lg:shrink-0">
          <PlinkoControls />
          <PlinkoResult />
        </div>
        <div className="order-1 lg:order-2 lg:flex-1">
          <PlinkoBoard />
        </div>
      </div>

      <footer className="pb-2 text-center text-[11px] text-muted">
        Edges pay the most · provably fair · play-money demo
      </footer>
    </div>
  );
}
