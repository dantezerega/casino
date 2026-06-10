import { describe, it, expect, beforeEach } from 'vitest';
import { useSoundStore, syncAudioSettings } from '@/audio/soundStore';
import { AudioManager } from '@/audio/AudioManager';

const S = () => useSoundStore.getState();

beforeEach(() => {
  useSoundStore.setState({ masterVolume: 0.7, isMuted: true, soundEnabled: true });
  AudioManager.setMuted(true);
  AudioManager.setEnabled(true);
  AudioManager.setVolume(0.7);
});

describe('soundStore defaults', () => {
  it('is muted by default with sound enabled', () => {
    expect(S().isMuted).toBe(true);
    expect(S().soundEnabled).toBe(true);
    expect(S().masterVolume).toBe(0.7);
  });
});

describe('actions sync the AudioManager', () => {
  it('setVolume clamps, updates state, and pushes to the manager', () => {
    S().setVolume(0.42);
    expect(S().masterVolume).toBe(0.42);
    expect(AudioManager.getVolume()).toBe(0.42);

    S().setVolume(5);
    expect(S().masterVolume).toBe(1);
    expect(AudioManager.getVolume()).toBe(1);
  });

  it('toggleMute flips both store and manager', () => {
    S().toggleMute();
    expect(S().isMuted).toBe(false);
    expect(AudioManager.isMuted()).toBe(false);
    S().toggleMute();
    expect(S().isMuted).toBe(true);
    expect(AudioManager.isMuted()).toBe(true);
  });

  it('enable / disable sounds syncs the manager', () => {
    S().disableSounds();
    expect(S().soundEnabled).toBe(false);
    expect(AudioManager.isEnabled()).toBe(false);
    S().enableSounds();
    expect(S().soundEnabled).toBe(true);
    expect(AudioManager.isEnabled()).toBe(true);
  });
});

describe('syncAudioSettings', () => {
  it('re-applies the current store state to the manager (session restore)', () => {
    useSoundStore.setState({ masterVolume: 0.33, isMuted: false, soundEnabled: false });
    // manager out of sync until we push:
    syncAudioSettings();
    expect(AudioManager.getVolume()).toBe(0.33);
    expect(AudioManager.isMuted()).toBe(false);
    expect(AudioManager.isEnabled()).toBe(false);
  });
});

describe('persistence configuration', () => {
  it('exposes a persist API bound to the storage key', () => {
    // zustand persist attaches a `.persist` controller to the hook.
    expect(typeof useSoundStore.persist?.rehydrate).toBe('function');
  });

  it('re-applies settings to the manager on rehydrate', async () => {
    useSoundStore.setState({ masterVolume: 0.25, isMuted: false, soundEnabled: false });
    AudioManager.setVolume(1); // desync the manager
    await useSoundStore.persist.rehydrate(); // fires onRehydrateStorage
    expect(AudioManager.getVolume()).toBe(useSoundStore.getState().masterVolume);
    expect(AudioManager.isEnabled()).toBe(useSoundStore.getState().soundEnabled);
  });
});
