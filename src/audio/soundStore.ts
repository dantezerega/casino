/**
 * Global sound settings — persisted to localStorage.
 *
 * Source of truth for user audio preferences; every change is pushed into the
 * AudioManager so the engine and UI stay in sync. Defaults to muted (the user
 * must explicitly enable sound — accessibility + autoplay friendliness).
 */

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { AudioManager } from '@/audio/AudioManager';

/**
 * localStorage-backed storage that degrades to an in-memory map when storage is
 * unavailable or throwing (SSR, private mode, test runners without a backing
 * store). Keeps persistence working in the browser without ever crashing.
 */
const memoryStore = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: (key, value) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: (key) => {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

interface SoundSettingsState {
  /** Master volume in [0, 1]. */
  masterVolume: number;
  /** Muted overrides volume to silence without losing the level. */
  isMuted: boolean;
  /** Whether the SFX system is active at all. */
  soundEnabled: boolean;

  toggleMute: () => void;
  setVolume: (v: number) => void;
  enableSounds: () => void;
  disableSounds: () => void;
}

export const useSoundStore = create<SoundSettingsState>()(
  persist(
    (set, get) => ({
      masterVolume: 0.7,
      isMuted: true, // muted on first visit by design
      soundEnabled: true,

      toggleMute: () => {
        const next = !get().isMuted;
        AudioManager.setMuted(next);
        if (!next) void AudioManager.unlock(); // unmuting counts as intent to hear
        set({ isMuted: next });
      },

      setVolume: (v) => {
        const vol = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
        AudioManager.setVolume(vol);
        set({ masterVolume: vol });
      },

      enableSounds: () => {
        AudioManager.setEnabled(true);
        set({ soundEnabled: true });
      },

      disableSounds: () => {
        AudioManager.setEnabled(false);
        set({ soundEnabled: false });
      },
    }),
    {
      name: 'casino-sound-settings',
      storage: createJSONStorage(() => safeStorage),
      // Re-apply persisted settings to the AudioManager after rehydration.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        AudioManager.setVolume(state.masterVolume);
        AudioManager.setEnabled(state.soundEnabled);
        AudioManager.setMuted(state.isMuted);
      },
    },
  ),
);

/** Apply the current store settings to the AudioManager (e.g. on startup). */
export function syncAudioSettings(): void {
  const { masterVolume, isMuted, soundEnabled } = useSoundStore.getState();
  AudioManager.setVolume(masterVolume);
  AudioManager.setEnabled(soundEnabled);
  AudioManager.setMuted(isMuted);
}
