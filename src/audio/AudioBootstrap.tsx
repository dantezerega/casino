import { useEffect } from 'react';
import { AudioManager } from '@/audio/AudioManager';
import { syncAudioSettings } from '@/audio/soundStore';

/**
 * App-level audio bootstrap (renders nothing):
 *  - applies persisted settings to the AudioManager
 *  - preloads every sound on startup (low-latency first play)
 *  - resumes the AudioContext on the first user gesture, satisfying browser
 *    autoplay rules
 *
 * Mounted once near the app root.
 */
export function AudioBootstrap() {
  useEffect(() => {
    syncAudioSettings();
    void AudioManager.preloadAll();

    const unlock = () => void AudioManager.unlock();
    const opts = { once: true } as const;
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, opts);
    window.addEventListener('touchstart', unlock, opts);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  return null;
}
