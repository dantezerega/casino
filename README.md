# Casino

A polished, provably-fair casino built as a clean, layered, fully-tested module — a lobby plus two complete games (**Mines** and **Blackjack**) that share one bankroll, designed so adding the next game is a single registry entry.

Play-money only. No authentication, no deposits/withdrawals, no real wagering.

![status](https://img.shields.io/badge/tests-158%20passing-00e701) ![coverage](https://img.shields.io/badge/logic%20coverage-100%25%20lines-00e701)

---

## What it is

- **Casino lobby** — sidebar navigation, game cards, responsive (desktop rail + mobile drawer)
- **Mines** — 5×5 grid, 1–24 mines, exact multipliers, SHA-256 provably fair
- **Blackjack** — full single-player table: hit / stand / double down, dealer AI, 3:2 blackjack
- **Shared wallet** — one balance across all games
- **React Router** — `/`, `/mines`, `/blackjack`
- **Framer Motion** throughout — reveals, flips, deals, explosions, win bursts
- **Audio system** — centralized Web Audio engine, animation-synced SFX, persisted volume/mute settings (muted by default)
- **100% line coverage** on all game logic (engines + stores)
- **Easily extensible** — Crash, Plinko, Dice scaffolded as "coming soon"

---

## Tech stack

| Concern | Choice |
|---|---|
| Build / dev server | Vite 6 |
| UI | React 18 + TypeScript (strict) |
| Routing | React Router 6 |
| Styling | Tailwind CSS v4 (`@theme` tokens, no PostCSS config) |
| State | Zustand 5 (+ `persist` for sound settings) |
| Animation | Framer Motion 11 |
| Audio | Web Audio API (custom singleton engine) |
| Testing | Vitest 3 + Testing Library + jsdom |
| Crypto | Hand-rolled sync SHA-256 / HMAC-SHA256 (zero deps) |

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the built `dist/` |
| `npm test` | Run the Vitest suite once (128 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Coverage report → `coverage/` (text + HTML) |
| `npm run typecheck` | Strict type-check, no emit |

---

## Routes

| Path | Screen |
|---|---|
| `/` | Casino lobby |
| `/mines` | Mines game |
| `/blackjack` | Blackjack game |
| `*` | → redirect to lobby |

---

## Project structure

```
src/
├── config/games.tsx         Game registry — drives the sidebar & lobby
├── types/index.ts           Mines domain types
├── game/
│   ├── minesEngine.ts        Mines rules (pick, reveal)
│   ├── multiplier.ts         Exact Mines multiplier math
│   ├── provablyFair.ts       Commit/reveal, board generation, verification
│   └── blackjack/
│       ├── types.ts          Card / Hand / Outcome contracts
│       ├── cardUtils.ts      Value, ace logic, blackjack, bust
│       ├── deck.ts           createDeck, shuffleDeck, dealCard
│       └── blackjackEngine.ts  dealInitial, dealerPlay, determineWinner, payout
├── store/
│   ├── gameStore.ts          Mines state machine + shared wallet (balance)
│   └── blackjackStore.ts     Blackjack state machine (uses the shared wallet)
├── audio/
│   ├── AudioManager.ts       Singleton Web Audio engine (preload, play, mute)
│   ├── soundStore.ts         Persisted volume/mute/enabled settings
│   ├── soundManifest.ts      Sound id → asset URL map (the only path table)
│   ├── soundTypes.ts         SoundName + option contracts
│   ├── AudioBootstrap.tsx    Startup preload + gesture-unlock (no UI)
│   └── sounds/               20 SFX assets (swappable)
├── hooks/
│   ├── useSound.ts           play / stop handle for components
│   ├── useMinesAudio.ts      Mines state → sound subscription
│   └── useBlackjackAudio.ts  Blackjack state → sound subscription
├── components/
│   ├── layout/               Sidebar, AppLayout (desktop rail + mobile drawer)
│   ├── GameCard.tsx          Reusable lobby card
│   ├── GameGlyphs.tsx        Per-game SVG icons
│   ├── SoundSettings.tsx     Volume / mute / SFX controls
│   ├── …                     Mines UI (Board, Tile, BettingPanel, …)
│   └── blackjack/            Blackjack UI (Card, Hand, Table, Panel, chip, burst)
├── pages/                    LobbyPage, GamePage (Mines), BlackjackPage
├── utils/                    crypto.ts, format.ts
└── App.tsx                   Router
scripts/generate-sounds.mjs   Regenerates the placeholder SFX assets
```

---

## Architecture

Every layer is independently testable and dependencies point one direction only:

```
types ─→ utils/crypto ─→ game/* (pure) ─→ store (state machine) ─→ components (UI)
```

- **Engines are pure** — every function in `game/` takes plain data and returns
  new data. No mutation, no React, no side effects, no async. This is what makes
  the rules trivially unit-testable, and it's identical for Mines and Blackjack.
- **Stores orchestrate, never compute** — each Zustand store sequences its state
  machine and delegates all math to its engine. Illegal actions are silent
  no-ops, so the UI can never drive a store into a bad state.
- **UI computes nothing** — components subscribe to store slices and selectors.
- **One wallet** — the balance lives in `gameStore`; `blackjackStore` reads and
  adjusts it, so both games (and the sidebar) share a single bankroll.

### Adding a game

The lobby and sidebar both render from `src/config/games.tsx`. To add a game:

1. Add an entry to `GAMES` (id, name, path, description, icon, `status: 'live'`).
2. Build its engine in `game/<name>/` and a store in `store/`.
3. Add its page and a route in `App.tsx`.

Crash, Plinko, and Dice are already listed as `status: 'soon'` — flip them to
`'live'` once built.

---

## Mines

A 5×5 grid hides a chosen number of mines (1–24). Reveal safe gems to grow your
multiplier; cash out before you hit a mine. Clear every safe tile for an
automatic max-multiplier win.

### Multiplier math

After revealing `k` safe gems with `m` mines on `n = 25` tiles, the survival
probability is `P = ∏_{i=0}^{k-1} (n−m−i)/(n−i)`, and the payout is
`multiplier = (1 − houseEdge) / P` (default edge 1%). Strictly increasing per
gem, steeper with more mines, capped at **24.75×** (24 mines).

### Provably fair

Each round derives from a **server seed**, a **client seed**, and a **nonce**:

1. Before the round you see `serverSeedHash = SHA-256(serverSeed)` (a commitment).
2. Mines come from `HMAC-SHA256(serverSeed, "client:nonce:round")` → a
   Fisher-Yates shuffle of tiles `[0..24]`; the first `mineCount` are mines.
3. After the round the plaintext server seed is revealed — hashing it must
   reproduce the commitment, and the same three inputs always regenerate the
   exact board. The **Provably Fair** panel verifies this live.

> SHA-256 is hand-rolled and synchronous (`utils/crypto.ts`) so board generation
> stays pure and testable rather than async via `crypto.subtle`. It's pinned to
> published known-answer vectors.

---

## Blackjack

Single-player against the dealer. Place a bet, get two cards; the dealer shows
one card and hides the hole card. Hit, stand, or double down. The dealer then
**hits below 17 and stands on 17+** (including soft 17).

### Rules

- Standard 52-card deck, reshuffled each hand
- Ace counts as 1 or 11 (optimized automatically)
- Face cards are 10
- **Outcomes:** blackjack (natural 21, pays **3:2**), win (1:1), push (stake
  returned), lose
- **Double down** — only on the opening two-card hand; doubles the stake, draws
  exactly one card, then stands
- A natural blackjack on the deal settles immediately

### State machine

`IDLE → PLAYER_TURN → DEALER_TURN → RESOLVED → IDLE`

The engine (`game/blackjack/`) is pure — `createDeck`, `shuffleDeck` (injectable
RNG), `dealCard`, `calculateHandValue`, `isBlackjack`, `isBust`, `dealerPlay`,
`determineWinner`, `resolvePayout`. The store wraps it and shares the wallet.

---

## Audio

A centralized, low-latency sound system shared by every game.

### How it works

- **`AudioManager`** (singleton, Web Audio API) — decodes each sound once into an
  `AudioBuffer` and plays it through throwaway source nodes routed via one master
  `GainNode`. This gives instant, overlapping playback and a single point for
  volume/mute. Buffers are cached; concurrent loads of the same sound are deduped.
- **`soundStore`** (Zustand + `persist`) — `masterVolume`, `isMuted`,
  `soundEnabled`, saved to `localStorage`. Every change is pushed into the
  AudioManager. **Muted by default** — the user must explicitly enable sound
  (accessibility + browser autoplay rules); the context is resumed on the first
  user gesture.
- **`soundManifest.ts`** — the *only* place sound ids map to files. Components
  never reference paths — only ids.

### Using it

```ts
import { useSound } from '@/hooks/useSound';

const { play } = useSound();
play('explosion');        // gated by mute/enabled automatically
```

Sounds are triggered two ways: **animation-synced** via Framer Motion
`onAnimationStart` (gem reveal, mine explosion, card deal, card flip) so audio
lands exactly with the visual, and **state-driven** via read-only store
subscriptions (`useMinesAudio`, `useBlackjackAudio`) for start / multiplier /
cash-out / outcome cues. No game logic was modified to add sound.

### Sounds

20 effects across four groups: **UI** (button, hover, menu open/close),
**Mines** (tile, gem, multiplier, cashout, explosion, game-over), **Blackjack**
(card-deal, card-flip, chip-bet, win, lose, push, blackjack), and **Casino**
(notification, bonus, achievement).

The shipped assets are synthesized placeholders. Replace any file in
`src/audio/sounds/` (same name) with a real asset — no code change. Regenerate
the placeholders with:

```bash
node scripts/generate-sounds.mjs
```

### Adding sound to a future game

A new game needs **zero** audio changes — call `useSound().play('…')` from a
component, or subscribe to its store in a small `use<Game>Audio` hook. Add new
ids to `soundTypes.ts` + `soundManifest.ts` if you need new effects.

### Settings

The sidebar **Sound** panel (and a mobile quick-mute button) controls mute,
master volume (with live %), and an effects on/off switch — all persisted.

---

## Testing

```bash
npm test              # 158 tests
npm run test:coverage # with coverage report
```

Suites, layered bottom-up:

| Area | Suites |
|---|---|
| Crypto | SHA-256 / HMAC known-answer vectors |
| Mines | provably-fair, multiplier, engine, store |
| Blackjack | deck, cardUtils (ace logic), engine, store |
| Audio | AudioManager (mocked Web Audio), store, settings panel, game triggers |
| Shared | formatting |

Both stores are validated by a **money invariant** — across hundreds of randomized
rounds, the change in balance always equals the reported profit. The audio engine
is tested with a mocked `AudioContext` (load dedupe, mute/enable gating, playback)
and the triggers via spied playback through the real game flows.

Coverage on game + audio logic (`game/`, `store/`, `utils/`, `audio/`, `hooks/`):

```
                Stmts   Branch  Funcs  Lines
All files       98.1%   94.5%   97.1%  98.1%
game / store    100%    ~96%    100%   100%
hooks           100%    100%    100%   100%
```

---

## Scope & notes

This is a polished play-money demo, not a production casino — no auth, no real
money, no backend. The provably-fair system (Mines) runs client-side for
demonstration; in production the server seed would be committed and revealed by a
trusted backend, and the pure engines in `game/` are designed to drop behind such
a service unchanged. Both games share one in-memory bankroll that resets on
reload.
```
# casino
