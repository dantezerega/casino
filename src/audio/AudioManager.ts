/**
 * AudioManager — singleton Web Audio playback engine.
 *
 * Why Web Audio over HTMLAudioElement: each sound is fetched and decoded once
 * into an AudioBuffer, then played through lightweight, fire-and-forget
 * AudioBufferSourceNodes. That gives instant, overlapping playback (e.g. rapid
 * tile clicks) and a single master GainNode for global volume + mute — none of
 * which HTMLAudioElement does well.
 *
 * Responsibilities: preload + cache buffers, dedupe in-flight loads, play/stop,
 * master volume, and mute. It owns no React and no store; the sound store pushes
 * settings in. Autoplay rules are respected: the context starts suspended and is
 * resumed only after a user gesture (`unlock`).
 */

import type { PlayOptions, SoundDef, SoundName } from '@/audio/soundTypes';
import { SOUND_MANIFEST, SOUND_NAMES } from '@/audio/soundManifest';

type Ctx = AudioContext;

class AudioManagerImpl {
  private ctx: Ctx | null = null;
  private masterGain: GainNode | null = null;

  private readonly buffers = new Map<SoundName, AudioBuffer>();
  private readonly loaders = new Map<SoundName, Promise<AudioBuffer | null>>();
  /** Active sources grouped by sound, so `stop(name)` and `stopAll` can halt them. */
  private readonly active = new Map<SoundName, Set<AudioBufferSourceNode>>();

  // Settings mirrored locally so they apply even before the context exists.
  private volume = 1;
  private muted = true; // muted by default — user must opt in
  private enabled = true;

  /** Web Audio availability (false in SSR/older test envs). */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof window.AudioContext !== 'undefined' ||
        typeof (window as unknown as { webkitAudioContext?: unknown })
          .webkitAudioContext !== 'undefined')
    );
  }

  /** Lazily create the context (suspended until a gesture unlocks it). */
  private ensureContext(): Ctx | null {
    if (this.ctx || !this.isSupported()) return this.ctx;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Resume the context after a user gesture (call from a click/keydown). */
  async unlock(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* ignore — will retry on next gesture */
      }
    }
  }

  // --- loading -------------------------------------------------------------

  /** Load + decode one sound, deduped: concurrent calls share one fetch. */
  async load(name: SoundName): Promise<AudioBuffer | null> {
    if (this.buffers.has(name)) return this.buffers.get(name)!;
    const existing = this.loaders.get(name);
    if (existing) return existing;

    const def: SoundDef | undefined = SOUND_MANIFEST[name];
    const ctx = this.ensureContext();
    if (!def || !ctx) return null;

    const promise = fetch(def.src)
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(name, buffer);
        this.loaders.delete(name);
        return buffer;
      })
      .catch(() => {
        this.loaders.delete(name);
        return null;
      });

    this.loaders.set(name, promise);
    return promise;
  }

  /** Preload every manifest sound. Safe to call once on startup. */
  async preloadAll(): Promise<void> {
    if (!this.isSupported()) return;
    await Promise.all(SOUND_NAMES.map((n) => this.load(n)));
  }

  /** Whether a sound's buffer is decoded and ready. */
  isLoaded(name: SoundName): boolean {
    return this.buffers.has(name);
  }

  // --- playback ------------------------------------------------------------

  /** Play a sound now. No-op when disabled, muted, unsupported, or not loaded. */
  play(name: SoundName, opts: PlayOptions = {}): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensureContext();
    const buffer = this.buffers.get(name);
    if (!ctx || !this.masterGain || !buffer) {
      // Not ready yet — kick off a load so it's available next time.
      if (ctx && !this.loaders.has(name)) void this.load(name);
      return;
    }
    if (ctx.state === 'suspended') void ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = opts.loop ?? false;

    const trim = SOUND_MANIFEST[name]?.volume ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = trim * (opts.volume ?? 1);

    source.connect(gain).connect(this.masterGain);

    let set = this.active.get(name);
    if (!set) {
      set = new Set();
      this.active.set(name, set);
    }
    set.add(source);
    source.onended = () => set!.delete(source);

    source.start();
  }

  /** Stop all currently-playing instances of one sound. */
  stop(name: SoundName): void {
    const set = this.active.get(name);
    if (!set) return;
    for (const src of set) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    set.clear();
  }

  /** Stop every playing sound. */
  stopAll(): void {
    for (const name of this.active.keys()) this.stop(name);
  }

  // --- settings ------------------------------------------------------------

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this.muted) this.masterGain.gain.value = this.volume;
  }

  getVolume(): number {
    return this.volume;
  }

  mute(): void {
    this.muted = true;
    if (this.masterGain) this.masterGain.gain.value = 0;
  }

  unmute(): void {
    this.muted = false;
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  setMuted(muted: boolean): void {
    if (muted) this.mute();
    else this.unmute();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stopAll();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

/** Process-wide singleton. */
export const AudioManager = new AudioManagerImpl();

export type { AudioManagerImpl };
