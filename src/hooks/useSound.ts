/**
 * useSound — component-facing handle to the audio system.
 *
 * Returns stable `play` / `stop` / `stopAll` callbacks bound to the singleton
 * AudioManager. Components call `play('sound-name')`; the manager handles
 * enabled/muted gating, so callers never branch on settings. Sounds are
 * referenced only by their manifest id — never a file path.
 */

import { useCallback, useMemo } from 'react';
import { AudioManager } from '@/audio/AudioManager';
import type { PlayOptions, SoundName } from '@/audio/soundTypes';

export interface SoundControls {
  play: (name: SoundName, opts?: PlayOptions) => void;
  stop: (name: SoundName) => void;
  stopAll: () => void;
}

export function useSound(): SoundControls {
  const play = useCallback(
    (name: SoundName, opts?: PlayOptions) => AudioManager.play(name, opts),
    [],
  );
  const stop = useCallback((name: SoundName) => AudioManager.stop(name), []);
  const stopAll = useCallback(() => AudioManager.stopAll(), []);

  return useMemo(() => ({ play, stop, stopAll }), [play, stop, stopAll]);
}
