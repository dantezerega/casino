import { useSoundStore } from '@/audio/soundStore';
import { useSound } from '@/hooks/useSound';

/**
 * Audio settings block (sidebar): mute toggle, master volume with live
 * percentage, and a sound-effects on/off switch. All state is the persisted
 * `soundStore`, which keeps the AudioManager in sync — this is pure UI.
 */
export function SoundSettings() {
  const masterVolume = useSoundStore((s) => s.masterVolume);
  const isMuted = useSoundStore((s) => s.isMuted);
  const soundEnabled = useSoundStore((s) => s.soundEnabled);
  const toggleMute = useSoundStore((s) => s.toggleMute);
  const setVolume = useSoundStore((s) => s.setVolume);
  const enableSounds = useSoundStore((s) => s.enableSounds);
  const disableSounds = useSoundStore((s) => s.disableSounds);

  const { play } = useSound();

  const pct = Math.round(masterVolume * 100);
  const audible = soundEnabled && !isMuted;

  const handleMute = () => {
    const wasMuted = isMuted;
    toggleMute();
    if (wasMuted) window.setTimeout(() => play('button-click'), 0); // confirm it's on
  };

  const handleSfx = () => (soundEnabled ? disableSounds() : enableSounds());

  return (
    <section className="rounded-xl bg-bg p-3 ring-1 ring-white/10">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Sound
        </span>
        {/* SFX on/off switch */}
        <button
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          aria-label="Sound effects"
          onClick={handleSfx}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            soundEnabled ? 'bg-accent' : 'bg-tile'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              soundEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Mute toggle */}
      <button
        type="button"
        onClick={handleMute}
        disabled={!soundEnabled}
        aria-pressed={audible}
        className={`mb-2.5 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
          audible ? 'bg-accent/15 text-accent' : 'bg-panel-light text-white'
        }`}
      >
        <span className="text-base">{audible ? '🔊' : '🔇'}</span>
        {audible ? 'Sound on' : isMuted ? 'Muted — tap to enable' : 'Sound off'}
      </button>

      {/* Master volume */}
      <div className={soundEnabled ? '' : 'pointer-events-none opacity-40'}>
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>Master volume</span>
          <span className="tabular-nums font-semibold text-white">{pct}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          disabled={!soundEnabled}
          onChange={(e) => setVolume(Number(e.currentTarget.value) / 100)}
          aria-label="Master volume"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tile accent-accent"
        />
      </div>
    </section>
  );
}
