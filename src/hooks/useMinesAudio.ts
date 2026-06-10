/**
 * Drives Mines sound effects from store state transitions — no game-logic
 * changes, purely a read-only subscription. Animation-synced cues (gem reveal,
 * explosion) live in the Tile via `onAnimationStart`; this hook covers the
 * non-animation events:
 *
 *   IDLE → PLAYING            game start (subtle)
 *   gemsRevealed increases    multiplier-up (rising pitch)
 *   PLAYING → CASHED_OUT      cash-out win
 *   PLAYING → LOST            game-over loss tone (after the explosion)
 *
 * Mount once on the Mines screen.
 */

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSound } from '@/hooks/useSound';

export function useMinesAudio(): void {
  const { play } = useSound();

  useEffect(() => {
    let prev = useGameStore.getState();

    const unsub = useGameStore.subscribe((s) => {
      // Game start
      if (prev.status !== 'PLAYING' && s.status === 'PLAYING') {
        play('button-click');
      }
      // Each safe pick raises the multiplier
      if (s.status === 'PLAYING' && s.gemsRevealed > prev.gemsRevealed) {
        play('multiplier-up');
      }
      // Cash out
      if (prev.status === 'PLAYING' && s.status === 'CASHED_OUT') {
        play('cashout');
      }
      // Loss — the explosion plays from the Tile; follow it with the lose tone.
      if (prev.status === 'PLAYING' && s.status === 'LOST') {
        window.setTimeout(() => play('game-over'), 350);
      }

      prev = s;
    });

    return unsub;
  }, [play]);
}
