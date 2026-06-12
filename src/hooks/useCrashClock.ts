/**
 * Drives the live Crash multiplier. While the round is RUNNING this runs a
 * `requestAnimationFrame` loop and feeds the elapsed wall-clock time into the
 * store's `tick`, which delegates to the pure engine (`multiplierAt`) and
 * auto-crashes at the boundary. This is the Plinko-style split: motion lives in
 * a hook, truth lives in the store/engine. The component computes nothing.
 *
 * Reduced motion does not disable the clock — the rising number is gameplay, not
 * decoration — but decorative animations in the components honour it separately.
 */

import { useEffect } from 'react';
import { useCrashStore } from '@/store/crashStore';

export function useCrashClock(): void {
  const status = useCrashStore((s) => s.status);
  const startedAt = useCrashStore((s) => s.startedAt);
  const tick = useCrashStore((s) => s.tick);

  useEffect(() => {
    if (status !== 'RUNNING' || startedAt == null) return;

    let raf = 0;
    const loop = () => {
      tick(performance.now() - startedAt);
      // Stop as soon as `tick` flips us out of RUNNING (the crash).
      if (useCrashStore.getState().status === 'RUNNING') {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, startedAt, tick]);
}
