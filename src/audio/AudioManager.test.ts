import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AudioManager } from '@/audio/AudioManager';

/**
 * The first group runs while Web Audio is unsupported (jsdom has no
 * AudioContext) — verifying graceful no-op behavior. The final group installs a
 * fake AudioContext + fetch to exercise the loading/playback path.
 */

describe('AudioManager — settings (no context)', () => {
  it('starts muted and enabled', () => {
    expect(AudioManager.isMuted()).toBe(true);
    expect(AudioManager.isEnabled()).toBe(true);
  });

  it('reports Web Audio as unsupported in jsdom', () => {
    expect(AudioManager.isSupported()).toBe(false);
  });

  it('clamps volume to [0, 1]', () => {
    AudioManager.setVolume(0.5);
    expect(AudioManager.getVolume()).toBe(0.5);
    AudioManager.setVolume(2);
    expect(AudioManager.getVolume()).toBe(1);
    AudioManager.setVolume(-1);
    expect(AudioManager.getVolume()).toBe(0);
  });

  it('toggles mute', () => {
    AudioManager.unmute();
    expect(AudioManager.isMuted()).toBe(false);
    AudioManager.mute();
    expect(AudioManager.isMuted()).toBe(true);
    AudioManager.setMuted(false);
    expect(AudioManager.isMuted()).toBe(false);
  });

  it('toggles enabled', () => {
    AudioManager.setEnabled(false);
    expect(AudioManager.isEnabled()).toBe(false);
    AudioManager.setEnabled(true);
    expect(AudioManager.isEnabled()).toBe(true);
  });

  it('play / stop / stopAll never throw without a context', () => {
    expect(() => {
      AudioManager.play('button-click');
      AudioManager.stop('button-click');
      AudioManager.stopAll();
    }).not.toThrow();
  });

  it('load resolves null and caches nothing when unsupported', async () => {
    expect(await AudioManager.load('win')).toBeNull();
    expect(AudioManager.isLoaded('win')).toBe(false);
  });
});

// --- supported path: fake AudioContext + fetch -----------------------------

const startedSources: Array<{ start: ReturnType<typeof vi.fn> }> = [];

class FakeGain {
  gain = { value: 0 };
  connect() {
    return this;
  }
}
class FakeSource {
  buffer: unknown = null;
  loop = false;
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  connect() {
    return this as unknown as AudioNode;
  }
}
class FakeAudioContext {
  state = 'suspended';
  destination = {};
  createGain() {
    return new FakeGain() as unknown as GainNode;
  }
  createBufferSource() {
    const s = new FakeSource();
    startedSources.push(s);
    return s as unknown as AudioBufferSourceNode;
  }
  decodeAudioData() {
    return Promise.resolve({ duration: 0.1 } as AudioBuffer);
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

describe('AudioManager — loading & playback (mocked Web Audio)', () => {
  beforeAll(() => {
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    globalThis.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;
    AudioManager.unmute();
    AudioManager.setEnabled(true);
    AudioManager.setVolume(0.8);
  });

  it('is now supported', () => {
    expect(AudioManager.isSupported()).toBe(true);
  });

  it('dedupes concurrent loads of the same sound (one fetch)', async () => {
    // Two concurrent loads must share the single in-flight fetch.
    await Promise.all([AudioManager.load('win'), AudioManager.load('win')]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(AudioManager.isLoaded('win')).toBe(true);
  });

  it('returns the cached buffer on subsequent loads (no refetch)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockClear();
    await AudioManager.load('win');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('play starts a buffer source when loaded + audible', async () => {
    await AudioManager.load('explosion');
    startedSources.length = 0;
    AudioManager.play('explosion');
    expect(startedSources.length).toBe(1);
    expect(startedSources[0].start).toHaveBeenCalled();
  });

  it('does not play when muted', async () => {
    await AudioManager.load('cashout');
    startedSources.length = 0;
    AudioManager.mute();
    AudioManager.play('cashout');
    expect(startedSources.length).toBe(0);
    AudioManager.unmute();
  });

  it('does not play when disabled', async () => {
    startedSources.length = 0;
    AudioManager.setEnabled(false);
    AudioManager.play('explosion');
    expect(startedSources.length).toBe(0);
    AudioManager.setEnabled(true);
  });

  it('stop / stopAll halt active sources without throwing', () => {
    AudioManager.play('explosion');
    expect(() => {
      AudioManager.stop('explosion');
      AudioManager.stopAll();
    }).not.toThrow();
  });
});
