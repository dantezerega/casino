/**
 * Drives Blackjack sound effects from store state transitions — read-only
 * subscription, no game-logic changes. Animation-synced cues (card-deal,
 * card-flip) live in the Card via `onAnimationStart`; this hook covers:
 *
 *   bet 0 → >0              chip-bet (stake placed on the deal)
 *   → RESOLVED              outcome cue (win / blackjack / lose / push),
 *                           delayed slightly to land after the reveal
 *
 * Mount once on the Blackjack screen.
 */

import { useEffect } from 'react';
import { useBlackjackStore } from '@/store/blackjackStore';
import { useSound } from '@/hooks/useSound';
import type { Outcome } from '@/game/blackjack/types';
import type { SoundName } from '@/audio/soundTypes';

const OUTCOME_SOUND: Record<Outcome, SoundName> = {
  win: 'win',
  blackjack: 'blackjack',
  lose: 'lose',
  push: 'push',
};

export function useBlackjackAudio(): void {
  const { play } = useSound();

  useEffect(() => {
    let prev = useBlackjackStore.getState();

    const unsub = useBlackjackStore.subscribe((s) => {
      // Stake placed (only the opening bet — double-down grows an existing bet).
      if (prev.bet === 0 && s.bet > 0) {
        play('chip-bet');
      }
      // Round resolved → outcome cue, after the cards have revealed.
      if (prev.status !== 'RESOLVED' && s.status === 'RESOLVED' && s.outcome) {
        const sound = OUTCOME_SOUND[s.outcome];
        window.setTimeout(() => play(sound), 250);
      }

      prev = s;
    });

    return unsub;
  }, [play]);
}
