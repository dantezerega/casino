/**
 * Sound manifest — the only place that maps sound ids to asset files.
 *
 * Assets are imported so Vite fingerprints and bundles them; swapping a sound
 * means replacing the file in `./sounds/` (same name) — no code changes. The
 * AudioManager preloads everything listed here.
 *
 * Per-sound `volume` trims balance the synthesized placeholders; tune freely.
 */

import type { SoundDef, SoundName } from '@/audio/soundTypes';

// UI
import buttonClick from './sounds/button-click.wav';
import menuOpen from './sounds/menu-open.wav';
import menuClose from './sounds/menu-close.wav';
import hover from './sounds/hover.wav';
// Mines
import tileClick from './sounds/tile-click.wav';
import gemReveal from './sounds/gem-reveal.wav';
import multiplierUp from './sounds/multiplier-up.wav';
import cashout from './sounds/cashout.wav';
import explosion from './sounds/explosion.wav';
import gameOver from './sounds/game-over.wav';
// Blackjack
import cardDeal from './sounds/card-deal.wav';
import cardFlip from './sounds/card-flip.wav';
import chipBet from './sounds/chip-bet.wav';
import win from './sounds/win.wav';
import lose from './sounds/lose.wav';
import push from './sounds/push.wav';
import blackjack from './sounds/blackjack.wav';
// Plinko
import ballDrop from './sounds/ball-drop.wav';
import pegHit from './sounds/peg-hit.wav';
import slotLand from './sounds/slot-land.wav';
import bigWin from './sounds/big-win.wav';
// Crash
import crashStart from './sounds/crash-start.wav';
import tickUp from './sounds/tick-up.wav';
// Casino
import notification from './sounds/notification.wav';
import bonus from './sounds/bonus.wav';
import achievement from './sounds/achievement.wav';

export const SOUND_MANIFEST: Record<SoundName, SoundDef> = {
  'button-click': { src: buttonClick, volume: 0.6 },
  'menu-open': { src: menuOpen, volume: 0.7 },
  'menu-close': { src: menuClose, volume: 0.7 },
  hover: { src: hover, volume: 0.4 },

  'tile-click': { src: tileClick, volume: 0.7 },
  'gem-reveal': { src: gemReveal, volume: 0.8 },
  'multiplier-up': { src: multiplierUp, volume: 0.7 },
  cashout: { src: cashout, volume: 0.9 },
  explosion: { src: explosion, volume: 1 },
  'game-over': { src: gameOver, volume: 0.8 },

  'card-deal': { src: cardDeal, volume: 0.7 },
  'card-flip': { src: cardFlip, volume: 0.7 },
  'chip-bet': { src: chipBet, volume: 0.7 },
  win: { src: win, volume: 0.9 },
  lose: { src: lose, volume: 0.8 },
  push: { src: push, volume: 0.7 },
  blackjack: { src: blackjack, volume: 1 },

  'ball-drop': { src: ballDrop, volume: 0.6 },
  'peg-hit': { src: pegHit, volume: 0.35 },
  'slot-land': { src: slotLand, volume: 0.7 },
  'big-win': { src: bigWin, volume: 1 },

  'crash-start': { src: crashStart, volume: 0.7 },
  'tick-up': { src: tickUp, volume: 0.45 },

  notification: { src: notification, volume: 0.7 },
  bonus: { src: bonus, volume: 0.8 },
  achievement: { src: achievement, volume: 0.9 },
};

/** All sound ids, for preloading and iteration. */
export const SOUND_NAMES = Object.keys(SOUND_MANIFEST) as SoundName[];
