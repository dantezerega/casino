# Handoff — context for the next Claude Code instance

This is a **provably-fair play-money casino** (Vite + React 18 + TypeScript strict + Tailwind v4 + Zustand 5 + Framer Motion 11 + React Router 6, tested with Vitest 3). Built incrementally across many approved phases. Read this before changing anything; it captures the architecture, conventions, and the non-obvious decisions that aren't visible in a quick skim.

/ `README.md` is the user-facing doc and is kept current — read it too.

---

## Current state (all green)

- **211 tests pass** (`npm test`). Build green (`npm run build`).
- Three complete games: **Mines**, **Blackjack**, **Plinko**, a **lobby** with sidebar nav (desktop rail + mobile drawer), and a **centralized audio system**.
- Coming-soon placeholders: Crash, Dice (registry entries only, `status: 'soon'`).

### What's done, in order built
1. Mines: engine (`provablyFair`, `multiplier`, `minesEngine`), store, UI, animations, tests.
2. Casino shell: React Router, lobby, sidebar nav, reusable `GameCard` + game registry.
3. Blackjack: engine (`game/blackjack/*`), store (shared wallet), table UI, animations, tests.
4. Audio: `AudioManager` (Web Audio singleton), persisted `soundStore`, manifest + 24 SFX, `useSound`, animation-synced + state-driven triggers in every game, sidebar settings panel, tests.
5. Plinko: pure engine (`game/plinko/*`), multi-ball store (shared wallet), real-physics board UI, route + registry, audio. See the Plinko section below.

---

## Architecture (one rule above all)

**Dependencies point one way:**
```
types → utils/crypto → game/* (pure) → store (state machine) → components (UI)
```

- **Engines are pure** (`src/game/**`): plain data in, new data out. No React, no mutation, no async, no side effects. This is why they're trivially unit-testable. Do not add React/store imports here.
- **Stores orchestrate, never compute** (`src/store/**`): they sequence a status state machine and delegate ALL math to the engine. Illegal actions are **silent no-ops** (guarded on status), never throws — so the UI can't drive a bad state.
- **UI computes nothing**: components subscribe to store slices (`useStore(s => s.x)`, never the whole store) and use exported selectors.
- **One shared wallet**: `balance` lives in `gameStore` (Mines). `blackjackStore` reads/writes it via `useGameStore.getState()/setState`. The sidebar shows it. Don't duplicate balance.

### Path alias
`@/` → `src/`. Always use it (no `../../`).

---

## Key files

```
src/
├── config/games.tsx          GAME REGISTRY — single source for sidebar + lobby.
│                             Add a game = one entry here (+ engine, store, page, route).
├── game/
│   ├── minesEngine.ts        createRound, createTiles, pickTile, revealAll/revealTile, safeTilesRemaining
│   ├── multiplier.ts         FAIR ODDS multiplier (see "Mines multiplier" below)
│   ├── provablyFair.ts       commitment, HMAC board gen, verifyRound, seed gen
│   └── blackjack/
│       ├── types.ts          Card/Hand/Outcome/Status
│       ├── cardUtils.ts      rankValue, calculateHandValue (ace logic), isBlackjack, isBust
│       ├── deck.ts           createDeck, shuffleDeck(deck, rng?), dealCard
│       └── blackjackEngine.ts dealInitial, dealerPlay, determineWinner, resolvePayout, canDoubleDown
│   └── plinko/
│       ├── types.ts          PlinkoRows(8|12|16)/PlinkoRisk(low|med|high)/Direction/Path/Round/Result
│       ├── payoutTables.ts   PAYOUTS[risk][rows] (edge baked in), getMultipliers, getSlotMultiplier
│       ├── pathGenerator.ts  generatePath (HMAC float stream, float<0.5→L), slotFromPath (count R)
│       └── plinkoEngine.ts   createRound, resolveDrop, computePayout/computeProfit
├── store/
│   ├── gameStore.ts          Mines machine: IDLE→PLAYING→LOST|CASHED_OUT→IDLE; holds `balance`
│   ├── blackjackStore.ts     BJ machine: IDLE→PLAYER_TURN→DEALER_TURN→RESOLVED; uses shared wallet
│   └── plinkoStore.ts        Plinko: NO status machine — concurrent `balls[]`; uses shared wallet
├── audio/
│   ├── AudioManager.ts       Web Audio singleton (preload, dedupe, play/stop, volume, mute)
│   ├── soundStore.ts         persisted settings (safe localStorage wrapper); pushes into AudioManager
│   ├── soundManifest.ts      id → asset URL (ONLY path table). SOUND_NAMES for iteration.
│   ├── soundTypes.ts         SoundName union
│   ├── AudioBootstrap.tsx    startup preload + gesture-unlock (mounted in AppLayout)
│   └── sounds/*.wav          20 synthesized placeholders (swappable)
├── hooks/
│   ├── useSound.ts           { play, stop, stopAll } — components call play('id')
│   ├── useMinesAudio.ts      store subscription → start/multiplier/cashout/game-over
│   ├── useBlackjackAudio.ts  store subscription → chip-bet/outcome
│   └── usePlinkoAudio.ts     store subscription → ball-drop (per drop) / outcome (per land)
├── components/ (+ layout/, blackjack/, plinko/)
│   └── plinko/               geometry.ts (pure layout), PlinkoBoard, PlinkoBall, PlinkoControls, PlinkoResult
├── pages/                    LobbyPage, GamePage (Mines), BlackjackPage, PlinkoPage
└── utils/                    crypto.ts (hand-rolled sync SHA-256/HMAC), format.ts
scripts/generate-sounds.mjs   regenerates placeholder SFX (node, no deps)
```

---

## Visual design / theme (added after initial build)

The app was reskinned from a flat dark UI to a **neon-noir** look. All changes are UI-only — no logic, store, or money-invariant impact.

- **Brand name is "LuckyBit"** (sidebar + mobile top bar). Was generic "Casino".
- **Two fonts** (`index.css`): body `Inter`, display `Space Grotesk` (`--font-display`, used via `font-display`) for headings + numbers. Loaded from Google Fonts `@import` in `index.css`.
- **Palette** (`@theme` in `index.css`): deeper base (`--color-bg-deep: #05080d`), plus `--color-cyan` and `--color-violet` tokens. Old tokens kept.
- **Ambient animated background**: `src/components/layout/Background.tsx` renders two fixed, `pointer-events-none`, `z-0` layers — `.app-bg` (3 radial aurora gradients + 2 drifting blurred orbs via `orb-a`/`orb-b` keyframes) and `.app-bg-grid` (masked dotted grid). Defined in `index.css`. Mounted once in `AppLayout`, which is now `relative isolate`; sidebar + content are `z-10` to sit above it. `prefers-reduced-motion` disables the animations (CSS media query).
- **Game cards carry per-game glow**: `GameMeta` gained a required `glow: string` (raw hex of the accent — NOT a class; classes can't be interpolated). `GameCard` sets it as a `--glow` CSS var for corner wash + hover ring/shadow in each game's color. **Adding a game now requires a `glow` hex in the registry entry.**
- **Lobby hero** (`LobbyPage`): shimmer gradient headline (`.text-shimmer`), "Provably fair" pill, glow orbs, live-game/fairness stat chips.
- Sidebar is now a glass panel (`backdrop-blur-xl`) with gradient logo tile, glowing balance card, and an inset accent bar on the active nav link.

---

## Non-obvious decisions / gotchas

- **Mines multiplier is intentionally fair-odds.** `multiplier = (1 - houseEdge) / P(survival)`, `houseEdge = 0.01`. So 1 mine / 24 picks = **24.75×** (24.75 = 25 × 0.99). This was questioned as a bug and confirmed CORRECT by the user — they chose to keep the 1% edge. Do not "fix" it. Low-mine curves are near-flat early then spike; that's correct, not a bug.
- **Hand-rolled SHA-256/HMAC** in `utils/crypto.ts` is deliberate: `crypto.subtle` is async and would make board generation async/untestable. Keep it synchronous. Pinned to known-answer vectors in tests.
- **Audio is muted by default** (accessibility + autoplay). Context starts suspended, resumed on first user gesture (`AudioBootstrap`). The user must explicitly unmute (sidebar Sound panel / mobile speaker button).
- **`soundStore` uses a safe localStorage wrapper** — Node/jsdom's experimental `localStorage` throws on `setItem`; the wrapper falls back to an in-memory map so tests/SSR never crash. Don't replace it with raw `localStorage`.
- **Audio triggers, two styles, by intent:**
  - *Animation-synced* via Framer `onAnimationStart` (gem reveal, mine explosion, card deal, card flip) — fires exactly with the visual. Guarded so the end-of-round cascade reveal stays silent (`tile.picked`, `owned`, `wasFaceDown` ref for card flip).
  - *State-driven* via read-only store subscriptions (`useMinesAudio`, `useBlackjackAudio`). Game logic was NOT modified to add sound.
- **`Tile.picked`** distinguishes the player's actual clicks from the auto-reveal at round end (drives which tiles explode/glow/sound). `revealTile` sets it; `revealAll` preserves it.
- **Blackjack hidden hole**: `dealerHoleHidden` controls the face-down 2nd dealer card; `selectDealerVisibleTotal` shows only the up-card until reveal.
- **Plinko has NO status state machine** — unlike Mines/Blackjack. The store holds a `balls[]` array of in-flight balls; `drop()` is never locked (spam = one independent ball per click, each its own bet/nonce/path), and `land(id)` credits that ball's payout and removes only it. Balls fall and resolve simultaneously but independently. `setRows`/`setRisk` are no-ops while any ball is airborne (`selectConfigLocked`); the bet stays editable. Money invariant is the Σ-form: `Δbalance === Σ profit` across a burst.
- **Plinko payout tables bake in the house edge** (Stake-style values in `payoutTables.ts`), unlike Mines which computes the edge live. Tables are symmetric, edge slots pay most. No extra edge multiply in the engine.
- **Plinko ball is a real ballistic sim, not keyframes.** `PlinkoBall` runs a `requestAnimationFrame` integrator (gravity + restitution bounce off each peg); horizontal velocity per row is forced by the provably-fair L/R path so it deterministically lands in the engine's slot. The effect runs **once per ball** with `onLand`/`play` held in refs — depending on the `onLand` prop identity would restart every in-flight ball on each new click (the bug that broke spam). Reduced-motion snaps to the slot.
- **Money invariant** holds for all three stores: across a resolved round (or burst), `Δbalance === reported profit`. Tests assert this over hundreds of random rounds — preserve it if you touch betting/payout.
- **SSR caveat**: zustand `getServerSnapshot` returns the initial snapshot, so `renderToString` of a state-dependent component shows defaults. The app is a client SPA (never SSR'd). Test UI with `@testing-library/react` (client render), not `renderToString`.

---

## Conventions

- Comments match surrounding density; explain "why", not "what".
- Tests co-located: `src/**/*.test.ts(x)`. Vitest config in `vite.config.ts` (jsdom, globals).
- Coverage scope = logic only: `game/`, `store/`, `utils/`, `audio/`, `hooks/`. UI/type-only files excluded. ~98% lines; engines/hooks 100%.
- New sounds: add id to `soundTypes.ts` + entry to `soundManifest.ts` (+ a file in `audio/sounds/`). Never hardcode a sound path in a component — call `play('id')`.
- Tailwind v4 theme tokens in `src/index.css` `@theme` (`bg`, `panel`, `tile`, `accent`, `danger`, `gold`, `muted`). Use them (`bg-panel`, `text-accent`).
- Respect `useReducedMotion()` for any new animation.

---

## Commands

```bash
npm run dev            # http://localhost:5173
npm run build          # tsc -b + vite build (must stay green)
npm test               # 158 tests
npm run test:coverage  # text + HTML coverage
npm run typecheck      # strict, no emit
node scripts/generate-sounds.mjs   # regenerate placeholder SFX
```

When verifying in tests: spy `AudioManager.play` for sound triggers; use fake timers for delayed cues (`game-over` +350ms, BJ outcome +250ms). Reset the singleton stores in `beforeEach`.

---

## Likely next work (the obvious extension)

Build one of the coming-soon games (Crash / Dice). The pattern is fixed and proven (Plinko is the most recent worked example — engine → store → UI → route → audio):
1. Flip its `status` to `'live'` in `config/games.tsx` (+ keep the icon).
2. Pure engine in `src/game/<name>/`.
3. Store in `src/store/<name>Store.ts` — use the shared wallet (`useGameStore` balance), guarded status machine, money invariant.
4. Page + route in `App.tsx`; UI in `components/<name>/`.
5. Audio: add a `use<Name>Audio` hook or just call `useSound().play(...)`; add new sound ids to the manifest if needed. **No changes to the audio layer required.**
6. Co-located Vitest suites; keep coverage ≥ current.

Do not modify existing game logic when extending. Keep engines pure and the one-way dependency rule intact.
