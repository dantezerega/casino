/**
 * Sound system contracts. `SoundName` is the single canonical id used by every
 * caller — components reference sounds by these names, never by file path.
 */

export type UISound = 'button-click' | 'menu-open' | 'menu-close' | 'hover';

export type MinesSound =
  | 'tile-click'
  | 'gem-reveal'
  | 'multiplier-up'
  | 'cashout'
  | 'explosion'
  | 'game-over';

export type BlackjackSound =
  | 'card-deal'
  | 'card-flip'
  | 'chip-bet'
  | 'win'
  | 'lose'
  | 'push'
  | 'blackjack';

export type CasinoSound = 'notification' | 'bonus' | 'achievement';

export type SoundName = UISound | MinesSound | BlackjackSound | CasinoSound;

/** One manifest entry: the asset URL plus an optional per-sound volume trim. */
export interface SoundDef {
  src: string;
  /** Per-sound gain multiplier in [0, 1], applied on top of master volume. */
  volume?: number;
}

/** Options for a single playback. */
export interface PlayOptions {
  /** Per-play gain multiplier in [0, 1]. */
  volume?: number;
  /** Loop the sound until explicitly stopped. */
  loop?: boolean;
}
