/**
 * Central game registry. The sidebar and lobby both render from this list, so
 * adding a new game is a single entry here (plus its route + page).
 */
import type { ReactNode } from 'react';
import { MinesGlyph, BlackjackGlyph, CrashGlyph, PlinkoGlyph, DiceGlyph } from '@/components/GameGlyphs';

export type GameStatus = 'live' | 'soon';

export interface GameMeta {
  id: string;
  name: string;
  /** Route path; only meaningful for live games. */
  path: string;
  description: string;
  icon: ReactNode;
  /** Tailwind text/from color token used for the card's accent. */
  accent: string;
  /** Raw hex of the accent — drives card glow/gradient (CSS, not a class). */
  glow: string;
  status: GameStatus;
}

export const GAMES: GameMeta[] = [
  {
    id: 'mines',
    name: 'Mines',
    path: '/mines',
    description: 'Reveal gems, dodge the mines, cash out before you blow it.',
    icon: <MinesGlyph />,
    accent: 'text-accent',
    glow: '#00e701',
    status: 'live',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    path: '/blackjack',
    description: 'Beat the dealer to 21. Hit, stand, or double down.',
    icon: <BlackjackGlyph />,
    accent: 'text-gold',
    glow: '#ffd700',
    status: 'live',
  },
  {
    id: 'crash',
    name: 'Crash',
    path: '/crash',
    description: 'Ride the multiplier and bail before it crashes.',
    icon: <CrashGlyph />,
    accent: 'text-danger',
    glow: '#ed4163',
    status: 'soon',
  },
  {
    id: 'plinko',
    name: 'Plinko',
    path: '/plinko',
    description: 'Drop the ball and watch it bounce into a payout.',
    icon: <PlinkoGlyph />,
    accent: 'text-[#00c2ff]',
    glow: '#00c2ff',
    status: 'live',
  },
  {
    id: 'dice',
    name: 'Dice',
    path: '/dice',
    description: 'Pick a target, roll under, win instantly.',
    icon: <DiceGlyph />,
    accent: 'text-[#b388ff]',
    glow: '#b388ff',
    status: 'soon',
  },
];

/** Games available to play right now. */
export const LIVE_GAMES = GAMES.filter((g) => g.status === 'live');
