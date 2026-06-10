import { useEffect } from 'react';
import { usePlinkoStore } from '@/store/plinkoStore';
import { useSound } from '@/hooks/useSound';
import type { SoundName } from '@/audio/soundTypes';

const BIG_WIN_MULTIPLIER = 10;

export function usePlinkoAudio(): void {
  const { play } = useSound();

  useEffect(() => {
    let prev = usePlinkoStore.getState();

    const unsub = usePlinkoStore.subscribe((s) => {
      if (prev.status !== 'DROPPING' && s.status === 'DROPPING') {
        play('ball-drop');
      }

      if (prev.status === 'DROPPING' && s.status === 'RESOLVED' && s.result) {
        const { multiplier, profit } = s.result;
        const sound: SoundName =
          multiplier >= BIG_WIN_MULTIPLIER
            ? 'big-win'
            : profit > 0
              ? 'win'
              : profit < 0
                ? 'lose'
                : 'slot-land';
        play(sound);
      }

      prev = s;
    });

    return unsub;
  }, [play]);
}
