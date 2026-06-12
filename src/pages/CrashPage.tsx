import { CrashGraph } from '@/components/crash/CrashGraph';
import { CrashControls } from '@/components/crash/CrashControls';
import { CrashHistory } from '@/components/crash/CrashHistory';
import { CrashResult } from '@/components/crash/CrashResult';
import { useCrashClock } from '@/hooks/useCrashClock';
import { useCrashAudio } from '@/hooks/useCrashAudio';

export function CrashPage() {
  useCrashClock();
  useCrashAudio();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <span className="text-xl">🚀</span>
        <h1 className="text-lg font-bold tracking-tight">Crash</h1>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-80 lg:shrink-0">
          <CrashControls />
          <CrashResult />
        </div>
        <div className="order-1 flex flex-col gap-3 lg:order-2 lg:flex-1">
          <CrashGraph />
          <CrashHistory />
        </div>
      </div>

      <footer className="pb-2 text-center text-[11px] text-muted">
        Cash out before it crashes · 99% RTP · provably fair · play-money demo
      </footer>
    </div>
  );
}
