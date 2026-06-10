import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SoundSettings } from '@/components/SoundSettings';
import { useSoundStore } from '@/audio/soundStore';
import { AudioManager } from '@/audio/AudioManager';

beforeEach(() => {
  useSoundStore.setState({ masterVolume: 0.7, isMuted: true, soundEnabled: true });
  AudioManager.setMuted(true);
  AudioManager.setEnabled(true);
  AudioManager.setVolume(0.7);
});
afterEach(cleanup);

describe('SoundSettings panel', () => {
  it('shows the current volume percentage', () => {
    render(<SoundSettings />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('mute toggle enables sound and syncs the manager', () => {
    render(<SoundSettings />);
    fireEvent.click(screen.getByText(/tap to enable/));
    expect(useSoundStore.getState().isMuted).toBe(false);
    expect(AudioManager.isMuted()).toBe(false);
    expect(screen.getByText('Sound on')).toBeInTheDocument();
  });

  it('volume slider updates store, manager, and label', () => {
    render(<SoundSettings />);
    fireEvent.change(screen.getByLabelText('Master volume'), { target: { value: '30' } });
    expect(useSoundStore.getState().masterVolume).toBeCloseTo(0.3, 5);
    expect(AudioManager.getVolume()).toBeCloseTo(0.3, 5);
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('SFX switch disables and re-enables the system', () => {
    render(<SoundSettings />);
    const sw = screen.getByRole('switch', { name: 'Sound effects' });
    fireEvent.click(sw);
    expect(useSoundStore.getState().soundEnabled).toBe(false);
    expect(AudioManager.isEnabled()).toBe(false);
    fireEvent.click(sw);
    expect(AudioManager.isEnabled()).toBe(true);
  });
});
