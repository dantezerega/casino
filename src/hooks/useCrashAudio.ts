import { useEffect } from 'react';
import { useCrashStore } from '@/store/crashStore';
import { useSound } from '@/hooks/useSound';

/** Cash-outs at or above this multiplier get the celebratory big-win cue. */
const BIG_WIN_MULTIPLIER = 10;

/**
 * State-driven Crash audio. Subscribes read-only to the store (game logic is
 * never modified for sound) and maps transitions → existing sound ids:
 *   - start (IDLE → RUNNING)      → crash-start
 *   - each whole-number milestone → tick-up
 *   - cash-out                    → big-win (≥10×) / cashout
 *   - crash                       → explosion
 */
export function useCrashAudio(): void {
  const { play } = useSound();

  useEffect(() => {
    let prev = useCrashStore.getState();

    const unsub = useCrashStore.subscribe((s) => {
      // Round launch.
      if (s.status === 'RUNNING' && prev.status !== 'RUNNING') {
        play('crash-start');
      }

      // Whole-number multiplier milestones while climbing (2×, 3×, …).
      if (
        s.status === 'RUNNING' &&
        prev.status === 'RUNNING' &&
        Math.floor(s.currentMultiplier) > Math.floor(prev.currentMultiplier)
      ) {
        play('tick-up');
      }

      // Settlement.
      if (s.status === 'CASHED_OUT' && prev.status === 'RUNNING') {
        play((s.result?.multiplier ?? 0) >= BIG_WIN_MULTIPLIER ? 'big-win' : 'cashout');
      }
      if (s.status === 'CRASHED' && prev.status === 'RUNNING') {
        play('explosion');
      }

      prev = s;
    });

    return unsub;
  }, [play]);
}
