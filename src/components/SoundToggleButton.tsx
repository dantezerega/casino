import { useSoundStore } from '@/audio/soundStore';

/**
 * Compact speaker toggle — flips mute on the shared sound store. Used in the
 * mobile top bar for one-tap sound enable/disable.
 */
export function SoundToggleButton({ className = '' }: { className?: string }) {
  const isMuted = useSoundStore((s) => s.isMuted);
  const soundEnabled = useSoundStore((s) => s.soundEnabled);
  const toggleMute = useSoundStore((s) => s.toggleMute);

  const silent = isMuted || !soundEnabled;

  return (
    <button
      type="button"
      onClick={toggleMute}
      disabled={!soundEnabled}
      aria-label={silent ? 'Enable sound' : 'Mute sound'}
      aria-pressed={!silent}
      className={`grid h-9 w-9 place-items-center rounded-lg bg-panel-light text-lg transition-colors hover:bg-tile disabled:opacity-40 ${className}`}
    >
      {silent ? '🔇' : '🔊'}
    </button>
  );
}
