/**
 * Wires session stats to every game by subscribing read-only to each store and
 * recording wagers/settlements as rounds resolve. No game logic is touched — it
 * observes the same store transitions the audio hooks do.
 *
 * Stake captured per game:
 *   - Mines  : on PLAYING → CASHED_OUT | LOST  (loss profit = −bet).
 *   - Blackjack: on → RESOLVED, using the live `bet` (doubles on double-down),
 *                falling back to `betAmount` for the natural-blackjack ordering.
 *   - Plinko : wager per drop (independent balls), profit per land.
 *   - Crash  : on RUNNING → CASHED_OUT | CRASHED.
 *
 * Mount once (AppLayout). Subscriptions live for the app's lifetime.
 */

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useBlackjackStore } from '@/store/blackjackStore';
import { usePlinkoStore } from '@/store/plinkoStore';
import { useCrashStore } from '@/store/crashStore';
import { useStatsStore } from '@/store/statsStore';

export function useStatsRecorder(): void {
  useEffect(() => {
    const wager = useStatsStore.getState().recordWager;
    const settle = useStatsStore.getState().recordSettle;

    // --- Mines ---
    let m = useGameStore.getState();
    const unsubMines = useGameStore.subscribe((s) => {
      if (m.status === 'PLAYING' && s.status === 'CASHED_OUT') {
        wager('mines', s.betAmount);
        settle('mines', s.profit);
      } else if (m.status === 'PLAYING' && s.status === 'LOST') {
        wager('mines', s.betAmount);
        settle('mines', -s.betAmount);
      }
      m = s;
    });

    // --- Blackjack ---
    let b = useBlackjackStore.getState();
    const unsubBj = useBlackjackStore.subscribe((s) => {
      if (b.status !== 'RESOLVED' && s.status === 'RESOLVED') {
        wager('blackjack', s.bet > 0 ? s.bet : s.betAmount);
        settle('blackjack', s.profit);
      }
      b = s;
    });

    // --- Plinko (concurrent balls) ---
    let p = usePlinkoStore.getState();
    const unsubPlinko = usePlinkoStore.subscribe((s) => {
      if (s.dropCount > p.dropCount) wager('plinko', s.betAmount);
      if (s.resolvedCount > p.resolvedCount && s.lastResult) {
        settle('plinko', s.lastResult.profit);
      }
      p = s;
    });

    // --- Crash ---
    let c = useCrashStore.getState();
    const unsubCrash = useCrashStore.subscribe((s) => {
      const settled =
        c.status === 'RUNNING' &&
        (s.status === 'CASHED_OUT' || s.status === 'CRASHED');
      if (settled && s.result) {
        wager('crash', s.betAmount);
        settle('crash', s.result.profit);
      }
      c = s;
    });

    return () => {
      unsubMines();
      unsubBj();
      unsubPlinko();
      unsubCrash();
    };
  }, []);
}
