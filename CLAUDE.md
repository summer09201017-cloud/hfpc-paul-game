# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

「保羅宣教之旅」(Paul's Missionary Journey) — a single-page React + Vite PWA. A Monopoly-style board game where 1–4 players roll dice and walk Paul's first missionary journey (Acts 13–14), triggering story / event / Bible-quiz tiles. Built for classroom projection and tablet/phone (installable, offline-capable). Content and UI are in **Traditional Chinese**; preserve that in user-facing strings.

## Commands

```bash
npm install            # first-time setup (Node 18+)
npm run dev            # dev server on :5173, host exposed for LAN tablets/projector
npm run build          # bundle to dist/
npm run preview        # serve the built bundle on :4173

npm run test:selfplay  # pure-engine self-play (1–4 players × 300 seeds); fast, no browser
npm run test:browser   # Playwright plays a full game in a real browser — REQUIRES a running
                       #   preview server first (defaults to URL=http://localhost:4173/)
npm run gen:icons      # regenerate PWA icons in public/
npm run gen:map        # regenerate the real-geography board map + station coordinates
                       #   (downloads Natural Earth 50m data to scripts/_geodata/ on first run)
```

There is no lint step and no per-test runner — the two `test:*` scripts are plain Node scripts, not a test framework. To run a single self-play scenario, edit/duplicate `scripts/selfplay.mjs` (e.g. call `playOneGame(2, 42)`).

## Architecture: pure engine + swappable view

The whole design intent is **"game rules live only in `core/`; the view only reads state and dispatches clicks."** Honor this when extending — it's what makes future Phaser/3D/online-multiplayer swaps possible without touching rules.

- **`src/core/engine.js`** — the only place game rules exist. Imports nothing from React/DOM. Three hard invariants, do not break them:
  1. Every function **returns a new state**; it never mutates its input (see `clonefPlayers`).
  2. **Randomness is injected**, not generated here — `roll(state, value)` takes the dice value, and `advance(state, quizRoll, cardRoll)` takes the random floats [0,1) used to pick which quiz (from a `quizzes[]` pool) and which card (from a deck) this landing draws. This is what makes deterministic seeded self-play possible — never call `Math.random()` inside the engine.
  3. **`getGameStatus()` is the single source of truth** for "is the game over?" The game ends when **all** players have finished the journey (`reason: 'all_finished'`) *or* the `turnCap` safety limit is hit. The **winner is the player with the most 福音點數 (gospel points)** — not whoever reaches the end first (gospel points break to finished-state then board position only on a tie). Don't add a competing end-game or win check elsewhere.

- **`src/state/useGame.js`** — the React hook that wires the engine to the screen and owns all animation timing (`ROLL_MS`, `MOVE_MS`) and timer cleanup.

- **`src/data/journey1.json`** — all game content (stations, story text, events, quiz questions, card decks). Non-programmers (teachers) edit only this file. Top-level fields: `title`, `subtitle`, `scoreLabel`, `turnCap`, `decks` (機會/命運 card decks `chance`/`fate`), `stations[]`. The README documents the per-station schema and the `effect` fields (`gospelPoints`, `addCompanion`, `removeCompanion`, `skipNext`, `drawCard`). A station can carry **multiple quiz questions** via a `quizzes[]` array (one is drawn at random on landing); the legacy single `quiz` still works. Each station also carries a `history` block (`year` / `companions` / `willMeet`) shown as a "歷史小檔案" card in the arrival popup — keep it historically accurate (Acts 13–14, first journey ≈ AD 46–48).

- **`src/components/`** — presentational only (Board, DicePanel, PlayerPanel, StationModal, SetupScreen, GameOverScreen, MapBackground).

### The board map is real geography (generated, do not hand-edit)

The board background is a **real coastline map** of the eastern Mediterranean, and each station sits at its **true latitude/longitude** (Syrian Antioch is on the east/right, the route climbs north-west to Pisidian Antioch, Cyprus is an island in the sea). This is produced by a pipeline, not hand-placed:

- **`scripts/gen-map.mjs`** owns the truth. It holds each city's real `lat`/`lon` in its `CITIES` map, projects Natural Earth 50m country outlines (equirectangular, cosine-corrected) into the board's 0–100 space, and emits **`src/data/region-map.json`** (coastline SVG paths + `aspect` ratio + projected city marks). It also **writes `x`/`y`/`lat`/`lon` back into `journey1.json`**.
- Therefore **station `x`/`y` in `journey1.json` are generated output — do not hand-edit them.** To move or add a city, edit its `lat`/`lon` in the `CITIES` map in `gen-map.mjs` and re-run `npm run gen:map`. To widen/shift the visible map frame, edit the `LON_MIN/LON_MAX/LAT_MIN/LAT_MAX` bounds there.
- `Board.jsx` reads `region-map.json` for the `aspect` ratio (applied as the board's `aspect-ratio`, which is what keeps the geography undistorted) and renders `MapBackground.jsx` (sea rect + land paths + HTML labels/compass). Route legs are drawn per-segment: a leg is styled as a **sea voyage** (blue dashes) when the arrival station has `arriveBy: "sea"`, otherwise overland (brown dashes).

### Two distinct phase vocabularies (common confusion)

The engine and the UI hook use **different `phase` enums** — don't conflate them:

- **Engine** (`engine.js`): `idle → rolled → resolving → turnEnd → gameover`. Each step is one pure function: `roll` → `advance` → `resolve` → `endTurn`.
- **UI** (`useGame.js`): `setup → idle → rolling → moving → station → result → gameover`. The hook collapses the engine's `rolled`/`resolving` steps into the `rolling`/`moving`/`station` animation phases, advancing the engine instantly behind dice/pawn animations.

A board tile is resolved in **two UI steps**: `station` (show story/quiz, not yet scored) then `result` (scored, show outcome). `resolveStation({ answerIndex })` carries the chosen answer whenever the landed tile **has a `quiz` block** (see below) — any tile type can; tiles without one ignore the payload.

### Station types & turn flow

Tile `type` is one of `start | story | event | quiz | chance | fate | end` (it drives the icon/label and the narrative effect). **Quizzes and cards are decoupled from type:** `resolve` applies the tile's event/story `effect`, *then* applies any drawn 機會/命運 card's effect, *then* scores the drawn quiz if the tile carries one — so every city you can land on can have a question for points (use `getActiveQuiz`/`getActiveCard`, not `station.quiz`, since multi-question pools and cards mean "what was drawn this turn" lives in `state.pendingQuizIndex`/`state.pendingCard`). Cards fire when `type` is `chance`/`fate` **or** any tile's `effect`/`event.effect` carries `drawCard: "chance"|"fate"` (the latter is preferred on the real-geography board so you don't insert non-city tiles). Movement is driven by an injected **1–3** value (the "跑馬燈" — `roll(state, value)`), small steps so players don't skip cities. Movement clamps at the last station (can't overshoot the destination); landing on the last station sets `finished`. In `nextActiveIndex`, **`finished` (reached the end, permanently out) and `skipNext` (paused one turn) are different things** — the game must not be declared over just because everyone is currently paused. That termination logic and the `turnCap` are exactly what the self-play harness exists to guard; if you touch turn order, effects, dice range, or end conditions, run `npm run test:selfplay`.

## Adding a new journey

Copy `journey1.json` to e.g. `journey2.json` and edit content. Note: `useGame.js` currently **hardcodes** `import journey from '../data/journey1.json'`, so adding a selectable second journey requires a code change there (and likely in `SetupScreen`), not just a new data file. A new journey also needs its own real-geography coordinates: add the journey's cities to the `CITIES` map (and a matching map-frame/bounds) in `gen-map.mjs` so its `x`/`y` and the coastline can be generated.

## Conventions

- Comments and identifiers in this codebase are written in Chinese; match that style when editing existing files.
- `vite.config.js` sets `base: './'` (relative paths) so the build deploys to any subdirectory; PWA is configured to precache all static assets for offline play. Keep the relative base.
