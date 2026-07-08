# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ✅ **已修(2026-06-23):地圖「拖曳整片變海藍 / 縮放整頁變白」** —— 真因不是特定顯卡,而是**所有大富翁地圖共用的 Board 渲染**:
> ① 海是一個 `preserveAspectRatio="none"` 被拉伸成超大的 SVG `<rect fill:#acd3e0>`;② 平移用每幀改 `left/top`,強制把這張巨大 SVG **每幀重新點陣化** → 超過 GPU 紋理上限 → 整片變海藍(白是縮放時同因)。在 PC Chrome + 手機 + 任何地圖、只要拖曳就會犯(不需放大),故與顯卡無關。
> **修法**(`MapBackground.jsx` / `Board.jsx` / `styles.css`):海改成 `.board` 的 **CSS `background:#acd3e0`**(純色背景零點陣成本、移除 SVG 大 rect);平移改用 **`transform: translate3d`**(只在合成器移動、不重繪),縮放仍走 width/height %。實機驗收:地圖正常、拖曳平移正常、不再變色。心法見 skill `gpu-safe-rendering`(本案是它的活範例)。
> 本輪也做:3D 骰子→2D(`DicePanel.jsx`)、`sync:paulsilas`、保羅西拉嵌入同步最新版。

> ✝️ **耶穌生平之旅 7 關已接 6 關(2026-07-05,PR #55-58 全併已上線)**:①`?demo=wilderness`(卡片配對)⑤`?demo=goodSamaritan`(卡片抉擇)⑥`?demo=gethsemane`(撐住不睡新引擎,守「撐住≠改寫聖經」)⑦`?demo=jesusFinale`(五幕終局,剪影不見血)。**只剩④水面行走——使用者拍板跨 repo 嵌彼得走海(照 paulsilas 前例)**。題庫送審清單=docs/耶穌旅程-題庫送審-2026-07-05.html,過審才點大廳卡。
> 🔊 **朗讀鐵則(2026-07-05 牧者定案,絕不可違)**:**不准機器聲**——固定句子一律 `speakScripture(text,{ref})`(mp3 優先),絕不用 `speakText`;新關卡**同一輪**把句子烤進 scripts/tts-verses.json(合輯 `/tts-bake` 一鍵)。現況:manifest 27 句曉臻、precache 39 entries;spokenRef 有書卷縮寫→全名表。⚠ gen-tts 的 manifest 是**累加式**,刪句要修剪孤兒(見 /tts-bake)。
> ✝️ **耶穌生平之旅骨架上線(2026-07-04,`?journey=jesus`,牧師已核准設計+定調六項)**:21 站聖地 gen-map 棋盤(伯利恆→加利利→耶路撒冷),玩家=無名門徒「你」、耶穌永不受操控;②平靜風浪已接約拿暴風雨引擎(cast:false);①③④⑤⑥⑦先用問答撐住、待接(清單見 journey-jesus.json `_note`;⑥客西馬尼=牧師拍板要做「撐住不睡」,守「撐住≠改寫聖經」神學守法,見 bible-journey-planner references/耶穌生平-設計.md)。題庫全部待牧者審核;**大廳卡片照核准順序等全部關卡接上才點亮**。
> 🥁 **節奏家族補完(2026-07-04):`?demo=davidharp` 大衛彈琴(GuitarHero 型透視琴弦,撒上16,愁煩條)、`?demo=miriam` 米利暗擊鼓(太鼓型單軌雙打點:紅拍鼓 F/J、藍搖鈴 D/K;觸控拍鈴鼓中間=鼓/旁邊=鈴;出15:20-21 慶祝關不會輸)** —— 加上 FNF 三站與 psalm100,四子型全有活範例(見 skill rhythm-beat-minigame)。長條規則(psalm100/davidharp):按頭=開始、撐到尾=命中、放早=斷。
> 🎹 **新機制(2026-07-03):`?demo=psalm100` 讚美琴鍵** —— 系列第一個 **4K 下落式節奏關(VSRG)**(`src/minigames/psalm100/`,自成一體引擎,sync:jonah 不碰):四欄琴鍵落下,判定線=「稱謝之門」(詩 100:4),DFJK/方向鍵/多點觸控,單點+長條(按住),年齡三檔(幼稚園長條退化成單點)。★設計:旋律照譜面排程播、漏按歌不斷——歌是神的,按對是「加入讚美」;不會輸,星等看命中率。原創 84BPM 五聲音階曲,經文已過 cuv 核對,how/win 文案標待牧者審核。
> 📌 **現況速覽（2026-06-17，全部已併 main 並自動部署）**：線上 = 七旅程 + 多個單獨可玩的 `?demo=`：
> 動作關 `?demo=sling`（大衛甩石）/ `elijah-action`（盼望·以利亞，遇天使後**跳吃空中餅水**回體力）/
> `cornelius-action`（福音跑酷）/ `saul-action`（大光跑酷）/ `jehoshaphat-action`（**聖歌·約沙法,戰爭關已搬進 paul**，敵軍放大有表情）/
> `arkpairs`（挪亞配對,難度旋鈕+星等）/ `arkbuild`（挪亞蓋舟）/ `redsea`（紅海）；
> 卡片關 `?demo=<key>` 走 `CardDemo`（cornelius/elijah/saul/**jehoshaphat/balaam**/danielFinale/exodusFinale… **全部 L6 手繪 Canvas、無 emoji 小劇場**）。
> 入口分派在 `src/main.jsx`（`SlingDemo`/`ElijahDemo`/`RedSeaDemo`/`CorneliusActionDemo`/`SaulActionDemo`/`JehoshaphatActionDemo`/`ArkPairsDemo`/`ArkBuildDemo`/`CardDemo`）。
> 🖥️ **動作關手機全螢幕已一條龍處理**（16:9 取最大框、遊玩時隱藏標題列讓遊戲最大、⛶ 全螢幕鈕 + 暫停鈕、開場框可捲動不被切、挖孔安全區鋪暖底）——
> 走 `MiniGameModal` 的 `fill` 參數 + `.carddemo--game`/`.carddemo--playing`；心法見 skill **`embed-fullscreen-fit`**（debug 「黑邊/不夠大/沒暫停鈕/開場框被切」先讀它）。
> ⚔️ **戰爭關永久家 = 本 repo(2026-07-05 全數到齊)**:聖歌 `?demo=jehoshaphat-action`、紅海 `?demo=redsea`、**摩西 `?demo=moses-action`、巴蘭 `?demo=balaam-action`(07-05 搬入,L7/L10)**——四關都住 paul 自動部署,大廳卡改指 paul 後 `hfpc-war-games`(手動 B 站)可退役。
> 🚢 **挪亞記大富翁已上線（2026-06-18）**：`?journey=noah`（14 站手繪洪水板 + arkbuild/arkpairs 闖關站 + 🌈 noahCovenant 五幕卡片終局關）。`?journey=` 深連結預選已修好（之前 SetupScreen 沒讀、大廳連結都落在保羅）。
> 🏆 **通關獎狀（2026-06-18 晚，PR #39）**：結束畫面每位玩家可下載一張 PNG 獎狀（`src/certificate.js`，純 Canvas、零美術檔、可離線/列印）；任何旅程通用（帶旅程名/頭銜/分數/日期）。
> 📐 **桌遊內卡片關已滿版（2026-06-18 晚，PR #40）**：卡片關（`minigame.cards`）一律走 `.carddemo` 滿版（不分 `fill`）——以前桌遊內走 `.modal__overlay` 置中小框、字被擠窄（每列 ~8 字），現在跟 `?demo=`／聖歌·反轉動作版一樣寬（~21 字）、只剩一顆按鈕、右上有 ⛶；桌遊內 Canvas 關（配對/蓋舟）維持原置中彈窗。`.carddemo` 加 `z-index:60` 才蓋得住棋盤。
> 🧰 **本 repo `.claude/` 有給開發 AI 的工具**：slash `/playtest <key>`（手機橫向截圖驗收）、agent `bible-content-reviewer`（內容送審）、hook（.bat CRLF / journey·specs 改動提醒 validate）。
> **完整「已完成 vs 待做」+ CP 排序（含 slash/agent/hook/MCP）→ `roadmap.md` 最上方 2026-06-18 段 與 `docs/未來功能與skill點子-CP排序.md`。**

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

- **`src/data/journey1.json`** — all game content (stations, story text, events, quiz questions, card decks). Non-programmers (teachers) edit only this file. Top-level fields: `title`, `subtitle`, `scoreLabel`, `turnCap`, `decks` (機會/命運 card decks `chance`/`fate`), and the optional **輕 RPG** layer `companions` / `gifts` / `titles` (see below), then `stations[]`.

  **輕 RPG 層（data-driven，可整段刪掉而不影響核心；目前只 journey1 有）：** 引擎在 `resolve()` 結算問答/闖關時，會加上「被動加成」——
  - `companions{ "<名字>": { label, quizBonus?, minigameBonus?, blurb } }`：隊上有這位同工(玩家 `companions[]`，靠 `addCompanion`/`startCompanions` 取得)就生效。例：巴拿巴 `quizBonus:1`、馬可 `minigameBonus:1`(他在旁非利亞 `removeCompanion` 後失效)。
  - `gifts{ "<id>": { name, ref, icon?, quizBonus?, minigameBonus?, guard?, blurb } }`：屬靈裝備/恩賜(全副軍裝 弗 6)。玩家靠 effect `addGift:"<id>"`(機會卡)取得，存在 `player.gifts[]`。`guard:true`(信德的盾牌)會擋下一次 `skipNext`。
  - `titles[{ min, name, quizBonus? }]`：依 `gospelPoints` 門檻給頭銜(門徒→傳道者→使徒)，可帶小 `quizBonus` 特權。`getTitle(board, points)` 取目前頭銜(畫面 `PlayerPanel` 用)。
  - effect 字彙因此多了 `addGift`/`removeGift`(validate 已檢查它們指向真實 `gifts`)。加成只「加分」，不影響回合終止，三旅程 selfplay 各 1200 場仍全數正常結束。 The README documents the per-station schema and the `effect` fields (`gospelPoints`, `addCompanion`, `removeCompanion`, `skipNext`, `drawCard`). A station can carry **multiple quiz questions** via a `quizzes[]` array (one is drawn at random on landing); the legacy single `quiz` still works. Each station also carries a `history` block (`year` / `companions` / `willMeet`) shown as a "歷史小檔案" card in the arrival popup — keep it historically accurate (Acts 13–14, first journey ≈ AD 46–48).

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

Tile `type` is one of `start | story | event | quiz | chance | fate | challenge | end` (it drives the icon/label and the narrative effect). **Quizzes and cards are decoupled from type:** `resolve` applies the tile's event/story `effect`, *then* applies any drawn 機會/命運 card's effect, *then* scores the drawn quiz if the tile carries one — so every city you can land on can have a question for points (use `getActiveQuiz`/`getActiveCard`, not `station.quiz`, since multi-question pools and cards mean "what was drawn this turn" lives in `state.pendingQuizIndex`/`state.pendingCard`). Cards fire when `type` is `chance`/`fate` **or** any tile's `effect`/`event.effect` carries `drawCard: "chance"|"fate"` (the latter is preferred on the real-geography board so you don't insert non-city tiles). Movement is driven by an injected **1–6** value (a standard die — `roll(state, value)`; the UI shows a pip die in `DicePanel`). Movement clamps at the last station (can't overshoot the destination) **and at any `mustStop: true` checkpoint** in range (you can't jump past a forced station like the storm mini-game — `advance` stops you on the first such tile); landing on the last station sets `finished`. In `nextActiveIndex`, **`finished` (reached the end, permanently out) and `skipNext` (paused one turn) are different things** — the game must not be declared over just because everyone is currently paused. That termination logic and the `turnCap` are exactly what the self-play harness exists to guard; if you touch turn order, effects, dice range, or end conditions, run `npm run test:selfplay`.

## Adding a new journey

**Multi-journey is now wired.** `useGame.js` holds a `JOURNEYS` array — currently `paul` (journey1, 20 tiles), `paul2` (journey2, into Europe, 20 tiles), `paul3` (journey3, Ephesus years → Jerusalem, 20 tiles), **`paul4` (journey4 海路到羅馬, Acts 27–28, 20 tiles, 2026-06-12 晚)**, `jonah` (journey-jonah, 20 tiles), **`exodus` (journey-exodus, 22 tiles, 2026-06-12)** and **`daniel` (journey-daniel, 20 tiles, 2026-06-12)**. Each entry can carry `nextKey` (宣教接力: finishing a journey offers "continue to the next one", carrying name/points/gifts; companions reset to the new journey's `startCompanions`) — the relay now runs `paul1 → paul2 → paul3 → paul4`. `SetupScreen` shows a journey picker. To add another:
1. Create `src/data/journeyN.json` (copy an existing one; edit content — see [[roll-and-move-game]]).
2. Add its cities (real `lat`/`lon`) as a new `buildRegion({...})` call in `gen-map.mjs` (each region has its own bounds + ISO country set + output `region-mapN.json`), then `npm run gen:map` — this writes `x`/`y` back and emits the coastline.
3. Add `{ key, journey, map }` to `JOURNEYS` in `useGame.js`.
4. `npm run test:selfplay` already loops over all journey files — add the new one to its `JOURNEYS` list too. `npm run validate` chains all journey files in package.json — add it there as well.

**⚠️ `daniel` is the one exception to the gen-map rule:** 但以理 90% 的劇情都在巴比倫一座城，so it uses a **hand-drawn "seventy-years timeline" board** — `region-map-daniel.json` is hand-written (NOT a gen-map artifact; edit it freely) and the station `x`/`y` in `journey-daniel.json` are hand-placed (a 4-row serpentine across four dynasties). gen-map skips it entirely (it has no `buildRegion` entry); never run gen:map expecting it to manage daniel. All other journeys (including `exodus`) follow the normal generated-geography rule above. The daniel map also carries a **`decor` layer** (Babylon city silhouettes: walls/ziggurat/gardens/palace + river waves) — `MapBackground.jsx` renders any `map.decor` array of `{ d, fill?, stroke?, sw?, opacity? }` paths after the lands (backward-compatible; generated maps simply don't have it), plus `kind: "deco"` emoji labels.

> **但以理 / 出埃及記的完整遊戲設計**（六關闖關表、RPG 道具表、開發順序）live in the `bible-journey-planner` skill's `references/` (但以理-設計.md / 出埃及記-設計.md); the RPG item vocabulary and per-book item tables live in `bible-rpg-items`. Current state: 旅程骨架 done (stations/quizzes/decks/titles + challenge stations reusing Jonah levels); 待做 = card-flow minigames, RPG gifts layer, reflection finales — see roadmap.md item 0.

> **目前進度（已完成 vs 真正待做）見 `roadmap.md`。** Embedded mini-games live in `src/minigames/` (see [[embed-minigame]]); challenge stations use `type: "challenge"` + `minigame` + optional `mustStop` (see [[add-challenge-station]]).

## Embedded mini-games (`src/minigames/`)

### 引擎總覽(2026-07-09 對賬;45 個引擎一行一個,防「程式有、文件沒提」)

> ⚠ 這張表是 2026-07-05 用 `/route-doc-check` 對賬補的——當時發現 saul-spear/nehemiah/joash/slingshot/jericho/fishing/shore **七個引擎(06-26~06-28 HFP 機所做)完全沒進過文件**。日後每加一個引擎,在這裡補一行(交接前跑 `/route-doc-check` 驗證 🔴=0)。

| 引擎資料夾 | 單獨玩 | 書卷/主題 | 機制(對應 skill) |
|---|---|---|---|
| `jonah/` | 旅程站點嵌入;`?demo=redsea` / `jehoshaphat-action` / `moses-action` / `balaam-action` | 約拿書全六關 + 戰爭關子模組(摩西 L7/紅海 L8/約沙法 L9/巴蘭 L10) | 跑酷/風暴/卡片;**sync:jonah 複本,來源必 `--from=<jonah feat/redsea-tts>`**;戰爭四關 2026-07-05 全數搬進 paul(擺脫 war-games B 站) |
| `cards/` | `?demo=<cardKey>`(balaam/wilderness…) | 各卷卡片關(specs.js 全部 key) | 純 React 卡片流程,L6 手繪([[card-flow-minigame]]) |
| `sling/` | `?demo=sling` | 撒上 17 大衛甩石 | 拖曳彈弓瞄準([[slingshot-physics-minigame]]);未接旅程 |
| `joash/` | `?demo=joash` | 王下 13:14-19 約阿施射得勝箭 | 甩石引擎換皮・多箭「射越多次=得勝越完全」;大廳有卡(06-26) |
| `saul-spear/` | `?demo=saul-spear` | 撒上 18-19 掃羅擲槍・大衛閃避 | 閃避不還手([[dodge-projectile-minigame]]);大廳「🛡️ 靠神得勝·閃避」合輯(06-26) |
| `nehemiah/` | `?demo=nehemiah` | 尼 4;6 尼希米修牆躲攻擊 | 閃避引擎換皮+築牆進度(城牆 maxH 210);同上合輯(06-26) |
| `slingshot/` | `?demo=slingshot` | 技術原型(無書卷) | 忿怒鳥式拖曳彈弓+疊磚崩塌;**原型**,正式關=jericho(06-27) |
| `jericho/` | `?demo=jericho` | 書 6:20 耶利哥城牆 | 蓄力吹角吶喊震塌;**牆是神拆的不是人砸的**;大廳直達卡(06-27) |
| `fishing/` | `?demo=fishing` | 路 5:1-11 下網得魚 | 收集類:魚種大小/顏色/速度、大魚高分、青少年更難;「彼得的一生」合輯(06-28) |
| `shore/` | `?demo=shore` | 約 21:15-19 海邊的復興 | 三問「你愛我嗎」點答+逐隻餵羊;**不見殉道**;「彼得的一生」收尾(06-28) |
| `arkpairs/` | `?demo=arkpairs` | 創 6-7 一公一母進方舟 | 翻牌配對+排房謎題([[match-pairs-minigame]]) |
| `arkbuild/` | `?demo=arkbuild` | 創 6:14-22 一步一步蓋方舟 | 走板釘釘時機瞄準;挪亞有臉、鬍子隨進度變白 |
| `elijah/` | `?demo=elijah-action` | 王上 19 盼望・以利亞 | 收集恢復([[collect-recover-minigame]]);拾穗/嗎哪類的母引擎 |
| `loaves/` | `?demo=loaves` | 太 14 五餅二魚(耶穌旅程③) | 分餅給群眾——分出去不減反增 |
| `gethsemane/` | `?demo=gethsemane` | 太 26:36-46 客西馬尼・警醒(⑥) | 撐住不睡([[stay-awake-minigame]]);撐不住=溫柔敘事,永遠 won:true |
| `shepherd/` | `?demo=shepherd` | 路 15:3-7 好牧人尋羊 | **系列第一個迷宮尋路**:循「咩~」找迷失的羊、扛回羊圈;年齡三檔(青=夜霧提燈,07-06 加難:地圖加大至 23×13+擬真咩聲立體聲定位/距離音量、青漂浮字不帶方向純聽,PR #67);永不會輸;牧者已過審(07-05)、大廳卡已亮 |
| `samuel/` | `?demo=samuel` | 撒上 3 撒母耳聽呼喚 | **新類型②記憶序列(Simon 型)**:油燈依序亮、照順序點回(聽與順服);年齡三檔(幼3/童4/青5輪更快);聽錯溫柔重聽、永不會輸;撒上 3:10 mp3 已烤;牧者已過審(07-06)、大廳卡已亮 |
| `joseph/` | `?demo=joseph` | 創 37→50 約瑟的彩衣 | **新類型③滑塊拼圖**:點空格旁碎塊拼回手繪彩衣(離屏 Canvas 切塊);年齡三檔(幼3×3淺亂/童3×3深亂/青4×4);打亂=從完成態合法亂走 N 步(必可解);💡提示=3×3 BFS 最佳下一步、4×4 閃示完成圖;永不會輸;創 50:20 mp3 已烤;牧者已過審(07-06,PR #65 併)、大廳卡已亮 |
| `petersea/` | `?demo=petersea` | 太 14 水面行走(耶穌旅程④) | 跨 repo 嵌入彼得走海(sync:petersea 複本) |
| `paulsilas/` | `?demo=paulsilas` | 徒 16 保羅西拉監獄 | 跨 repo 嵌入(sync:paulsilas 複本) |
| `psalm100/` | `?demo=psalm100` | 詩 100 | 下落式節奏([[rhythm-beat-minigame]]) |
| `davidharp/` | `?demo=davidharp` | 撒上 16 大衛彈琴 | 透視琴弦節奏(GuitarHero 型,愁煩條) |
| `miriam/` | `?demo=miriam` | 出 15:20-21 米利暗擊鼓 | 太鼓型單軌雙打點;慶祝關不會輸 |
| `harptoy/` | `?demo=harptoy` | 自由演奏 | 琴玩具模式(無輸贏) |
| `wallguard/` | `?demo=wallguard` | 尼 3-6 尼希米守望 | **新類型⑤塔防(佈置守望)**:牆六段工人自動修,點牆段佈置吹角守望者(人數有限),仇敵靠近角聲退敵(尼 4:20/6:16);守望者不殺敵、永不會輸;與 nehemiah 閃避版 two-forms;⚠ 文案待牧者審(feat/wallguard-ezra) |
| `ezra/` | `?demo=ezra` | 拉 8:21-23 以斯拉護送 | **新類型⑥護送**:隊伍自動前行,點暗影=以斯拉去舉手禱告、光罩退敵;玩家無武器唯一動作是禱告(拉 8:22 不求兵丁);永不會輸;PR #69 牧者過審、大廳卡已亮 |
| `sower/` | `?demo=sower` | 太 13:4;路 8:15 護住好種子 | **新類型⑦守護反應(打地鼠家族)第一式・驅趕型**:點飛鳥拍手趕走(鳥不受傷),護種子長成小苗;被啄只倒退、永不會輸;PR #70 牧者過審、大廳卡已亮 |
| `foxes/` | `?demo=foxes` | 歌 2:15 擒拿小狐狸 | **⑦第二式・分辨型擒拿**:點狐狸=網子擒走(經文動詞「擒拿」,不打死);蝴蝶/瓢蟲無害別抓錯(分辨);花況被咬會恢復、永不會輸;07-06 使用者點名加難:洞數 6/8/10 依年齡檔、每波 1/2/3-4 隻齊出 |
| `sparks/` | `?demo=sparks` | 雅 3:5;箴 21:23 撲滅小火苗 | **⑦第三式・蔓延型撲滅**:點火苗倒水滅;拖久蔓延+天色變暗(corruption 式漸變)但永遠救得回來;永不會輸;PR #70 牧者過審、大廳卡已亮 |
| `armor/` | `?demo=armor` | 弗 6:11-17 穿戴全副軍裝 | **新類型⑧拖曳裝備/換裝**:六件軍裝拖到士兵正確部位(幼=部位常亮/童=拖起才亮/青=無提示+穿完意義三選一配對);全程無敵人不揮砍、放錯溫柔彈回;永不會輸;PR #71 牧者過審、大廳卡已亮 |
| `basket/` | `?demo=basket` | 出 2:1-10 摩西的籃子 | **新類型⑨縱向捲軸漂流閃避(雷電骨架反向化:開火整個拿掉,只躲不打)**:蒲草箱順尼羅河漂,←→/觸控閃蘆葦・漩渦・鱷魚(可愛版);碰到=輕推+緩流,嬰孩永遠平安;米利暗在岸上看顧(出 2:4);幼兒友善;⚠ 文案待牧者審(feat/moses-basket) |
| `temple/` | `?demo=temple` | 王上 6:7;彼前 2:5 活石蓋聖殿 | **新類型⑩落石砌合(俄羅斯方塊反向化)**:石頭山中鑿好才落下(←→移動/↑轉/↓輕放/觸控拖・點轉・下滑放),湊滿一排=「砌合完工發光」砌進聖殿的牆(絕非爆炸消失);堆到頂=「歇口氣」場地輕輕沉降,永不會輸;全程無鎚斧聲(王上 6:7);年齡三檔=速度/預覽(2/1/1)/石形(3/5/7 種);07-08 加 ⏸ 暫停(P/Esc/鈕+pause/resume 契約)與「暫存(C)」交換石頭(每次落定前限一次);✅ 牧者已過審(2026-07-07,PR #73 併入)、大廳卡已亮 |
| `gideon/` | `?demo=gideon` | 士 6:25-27 基甸拆祭壇 | **新類型⑪打磚塊**:夜色+火把光,滑鼠跟隨/←→/拖曳移木槓彈石球拆巴力壇石塊,頂上木偶 2 下砍倒;球掉出=僕人悄悄撿回不扣命,永不會輸;拆完必接「築真壇」一幕(士 6:26,先拆假的才立真的);⚠ **絕不可換皮成耶利哥**(牆是神拆的不是人砸的);年齡三檔=球速/槓寬/磚層(3/4/5);✅ 牧者已過審(2026-07-07,PR #73 併入)、大廳卡已亮;07-09 牧者拍板加料(✅ 已過審 PR #80 併入):**應許卷軸掉落**——道具名=士 6 神對基甸的原話(6:12 同在=多一顆球/6:14 能力=木槓加寬 8s/6:16 擊打=**石鑿**連發 4s,工匠鑿石非開槍);沒接到落地淡去不懲罰;滑鼠不按住也跟隨 |
| `steward/` | `?demo=steward` | 太 25:14-30 好管家 | **經營管理②(④家族第二個活實作)**:每季把銀袋分到「市集(做買賣)」或「地裡的坑(埋起來)」;★星等按「忠心運用比例」不按金額(比喻裡五千的和二千的得同一句稱讚,幼檔二千全運用=童檔五千全運用=3 星);做買賣永遠有收成(兩忠僕都翻倍,無虧損劇情);埋太多=主人溫柔教導(不罵「又惡又懶」),永不會輸;年齡三檔=二千 2 季/五千 3 季/五千 4 季;✅ 牧者已過審(2026-07-08,PR #74 併入)、大廳卡已亮 |
| `lostcoin/` | `?demo=lostcoin` | 路 15:8-10 失錢找物 | **新類型⑫找物/找碴(點燈尋找)**:暗屋+油燈跟手指,在罐籃布凳間細細地找失落的一塊錢(偶爾閃光引導);青檔錢幣藏家具底下要先點「打掃」挪開;★沒有時間失敗——「直到找著」,永不會輸;找著=請鄰舍一同歡喜(路 15:9-10 天上的歡喜);年齡三檔=亮度/家具數/要不要打掃;✅ 牧者已過審(2026-07-08,PR #74 併入)、大廳卡已亮 |
| `arkmatch/` | `?demo=arkmatch` | 創 6:20;7:8-9,14-16 各從其類・動物歸艙 | **新類型⑭彈珠配對(泡泡龍反向化)**:六角網格動物泡泡(獅/羊/豬/蛙/鳥向量圓臉),瞄準發射,同類連通 3+=「各從其類」**一起進方舟**(絕非爆破消失);懸空的=神親自招聚也歸艙;堆太低=神招聚下層(溫柔收回),永不會輸;全清=**耶和華關門**(創 7:16)+光;只發場上還有的種類(防死局);年齡三檔=動物種類(3/4/5)×排數;✅ 牧者已過審(2026-07-08,PR #74 併入)、大廳卡已亮 |
| `herd/` | `?demo=herd` | 約 10:16;詩 23 趕羊入圈 | **新類型⑯撞球物理(撞球反向化)**:頂視草場,拖曳牧羊犬🐕蓄力發射,圓-圓彈性碰撞+桌邊反彈+摩擦漸停(子步進防穿透);把羊撞進上方羊圈閘門=「歸聚」安歇(非落袋消失);牧羊犬進閘門=汪汪跑回起點不扣桿;無桿數限制永不會輸,星等看效率;物理積木源自 slingshot/projectile+gideon 反彈;年齡三檔=羊數 3/5/7×圈門寬×草地摩擦;✅ 牧者已過審(2026-07-08,PR #76 併入) |
| `goalkick/` | `?demo=goalkick` | (無經文)射門練習 | **憫安製作休閒關(運動練習型)**:頂視球場,拖球蓄力射門(sling/herd 手感)+守門員左右滑動撲救(時機窗);踢 10 球看進幾球,踢偏/被撲不扣血、永不會輸,星等看進球數;★使用者拍板:運動題材做練習不做競技對戰、不硬掛經文,進大廳「憫安製作闖關合輯」;無 speak.js(休閒無朗讀);年齡三檔=門寬/守門員速度與大小;PR #77 併入(無經文免送審文案) |
| `lotrun/` | `?demo=lotrun` | 創 19:15-17;路 17:32 羅得紅綠燈 | **新類型⑬忍住誘惑・向前跑(123 木頭人反向化)**:按住=往山上跑;誘惑時刻跳出大大的「👀 回頭看一眼」鈕(千萬別按!)+忍耐倒數圈;按了=定住鹽白化驚險一刻→**天使拉住**(創 19:16 耶和華憐恤),繼續逃、永不會輸;星等=忍住幾次(0 回頭=3 星);羅得妻子結局不畫,用路 17:32 溫柔帶教導;青檔誘惑中鬆手=頭不由自主轉過去;✅ 牧者已過審(2026-07-08,PR #74 併入)、大廳卡已亮 |
| `fragments/` | `?demo=fragments` | 約 6:11-13 五餅二魚・收拾零碎 | **彈珠配對⑭第二個活實作(arkmatch 換皮)**:餅魚零碎五種,同類 3+=「收拾起來」收進籃子(免得有糟蹋的,非消失);十二個籃子逐一裝滿,結局=約 6:13;懸空=門徒兜住;永不會輸;✅ 牧者已過審(2026-07-08,PR #75 併入) |
| `fruits/` | `?demo=fruits` | 加 5:22-23;約 15:5 聖靈果子・結果子 | **彈珠配對⑭第三個活實作**:果子帶字(仁愛/喜樂/和平/忍耐/恩慈),同款 3+=「結出果子」結到樹上(常駐可見);★守法:果子是聖靈結的——教導句約 15:5 把功勞還給主;邊玩邊背九果子前五種;永不會輸;✅ 牧者已過審(2026-07-08,PR #75 併入) |
| `gems/` | `?demo=gems` | 出 28:17-21,29 大祭司胸牌・寶石歸位 | **新類型⑮歸位配對**:點托盤寶石→點胸牌槽位;石名與四行排序完全照出 28:17-20、支派照生來次序;放錯=溫柔搖頭不懲罰;幼 6 塊看顏色/童 12 槽標石名/青 12 對照經文卡放;完成=名字帶在胸前(28:29)+金光;永不會輸;✅ 牧者已過審(2026-07-08,PR #75 併入);07-09 補重玩性加料兩式(可疊加,✅ 已過審 PR #79 併入):🧠 **記憶挑戰**(提示亮 10 秒遮起來憑記憶放+「再看一眼」不限次只記錄)+❓ **名字的意思**(放對跳該支派二選一,意思全出自和合本括號註 創 29-30;35:18,cuv 逐字核) |
| `flock/` | `?demo=flock` | 創 30:31-33;31:9 雅各的斑點羊 | **撞球物理⑯第二個活實作(herd 換皮)+★雙欄分類進階版**:上方兩個欄——左拉班(純白)/右雅各(有點有斑和黑色的,創 30:32);撞球第一次有「分對邊」策略;走錯欄=牧人輕輕帶回不懲罰;信息兩層=分得清=雅各的誠實(30:33 證出我的公義)+羊群加增=神的賞賜(31:9 神把牲畜賜給我,非雅各聰明);年齡三檔=4/6/8 隻×欄門寬×草地摩擦;✅ 牧者已過審(2026-07-09,PR #80 併入) |
| `manna/` | `?demo=manna` | 出 16:14-18;太 6:11 嗎哪收取 | **新類型⑰交換配對(消消樂/Candy 反向化)**:點兩塊相鄰嗎哪交換,3 連=「收取」**收進俄梅珥罐**(絕非糖果爆裂消滅);補位=新嗎哪**從天而降**(每早晨降嗎哪的經文直接變機制);無步數/時間限制、換不成溫柔換回、無可動手=「風把嗎哪吹勻了」重洗,永不會輸;信息=多收的沒有餘少收的沒有缺(16:18)+主禱文日用飲食(太 6:11);嗎哪五形態(珠/片/捲/團/屑)全白霜色系靠形狀分辨;年齡三檔=6×6・4款・8罐/7×7・5款・12罐/8×8・5款・16罐;✅ 牧者已過審(2026-07-09,PR #78 併入)、大廳卡已亮(新 kind swap3) |
| `glean/` | `?demo=glean` | 得 2:12,15-17 拾穗的路得 | **交換配對⑰第二個活實作(manna 換皮)+★斜線實驗版(全系列唯一,牧者拍板)**:橫、直、**斜**都算一排——語意釘在得 2:15-16 波阿斯吩咐**故意從捆裡抽出些留給路得**,斜的一排也算=恩典故意多給;拾取=**兩拍慢節奏**(先捆繩+整排金光亮 0.7 秒看清,才收進**伊法籃**;得 2:17 約有一伊法);平衡:四方向連鎖會雪崩,補位軟迴避(重擲≤2 次)壓回每手 3-6 穗;麥穗五形態(直穗/彎穗/雙穗/穗頭/散粒)金黃色系;永不會輸;信息=投靠耶和華翅膀下滿得賞賜(2:12,波阿斯預表基督);年齡三檔同 manna(收 8/12/16 捆);✅ 牧者已過審(2026-07-09,PR #79 併入) |

- **雙擊啟動器 `play-*.bat`(repo 根,47 支,以 `ls play-*.bat | wc -l` 實數為準;07-09 加 play-glean.bat、play-flock.bat;07-08 深夜加 play-manna.bat;07-08 晚加 play-herd.bat、play-fragments.bat、play-fruits.bat、play-gems.bat;07-07 晚加 play-steward.bat、play-lostcoin.bat、play-lotrun.bat、play-arkmatch.bat;07-07 加 play-temple.bat、play-gideon.bat;07-06 晚加 play-wallguard.bat、play-ezra.bat、play-sower.bat、play-foxes.bat、play-sparks.bat、play-armor.bat、play-basket.bat)**:每支 = `npm run dev -- --open "/?demo=<key>"` 的一鍵版,純 ASCII+CRLF。⚠ 檔名和路由鍵不一定同形:`play-ark-build.bat` → `?demo=arkbuild`、`play-ark-pairs.bat` → `?demo=arkpairs`、`play-balaam.bat`/`play-noah.bat`/`play-peter.bat`/`play-saul.bat`/`play-jehoshaphat.bat` 開的是**卡片版**(cards 引擎的 key),不是同名資料夾。
- `cards/`/`jonah/`(部分關)只被旅程站點的 `minigame` 欄使用、沒有同名 `?demo=` 路由——正常,不是漏接。
- 文案審核:joash/jericho/fishing/shore 等 06-26~28 那批的送審紀錄未見於 docs(當時牧者自審居多);要對外正式推廣前,建議用 `/review-queue` 盤一次、缺的補送 [[pastor-review]]。

A station can trigger a real-time 2D mini-game by carrying a `minigame: { level, mode?, winPoints, label?, how?, hudLabels?, cast? }` field (`cast: false` on Paul's sea-challenge stations skips the storm level's「拋約拿入海」ending — that beat belongs only to the Jonah story; the engine option is `opts.stormCast`) (decoupled from `type`, like quiz/card; the dedicated tile uses `type: "challenge"`). `src/minigames/jonah/` is a **copy of the `約拿闖關` (Jonah) arcade engine** (vanilla Canvas, zero deps) driven in **embed mode**: `new Game(canvas, { ui, embed: true, level, mode, hudLabels, onComplete })` — `embed` skips the title screen + suppresses fullscreen/orientation takeover, and the level-finish paths call `onComplete({ won, score, level })` instead of the Jonah overlay. `Game.destroy()` stops the loop, removes listeners (`Input.detach()`), and stops its audio.

**In-repo card-flow minigames (2026-06-12, `src/minigames/cards/`):** a station can instead carry `minigame: { cards: "<key>", winPoints, label? }` — `MiniGameModal` then renders the pure-React `CardGame.jsx` player with the spec from `specs.js` (goldImage / wallWriting / tenPlagues / tenCommandments / danielFinale / exodusFinale) and never boots the Canvas engine. These live **outside the Jonah fork**, so `sync:jonah` never touches them; they cannot lose (wrong answers gently retry; order-steps shake), and finish via the same `onComplete({ won:true, score })` path. To add one, write a spec in `specs.js` (step kinds: `info` / `question` / `order`) and point a station's `minigame.cards` at it. Their copy goes through the same pastoral review gate as quizzes (`scripts/export-quiz-review.mjs --cards=src/minigames/cards/specs.js`).

**Card-flow upgrades (2026-06-14, `feat/cornelius-card`):** the card player gained three orthogonal, opt-in layers — see skill [[card-canvas-scenes]] for the full pattern:
- **L6-style hand-drawn Canvas scenes** (`scenes.js` + `CardScene.jsx`): a `drawBackdrop` generic animated background (gradient/glow/motes) behind *every* card, plus per-beat bespoke `drawer(ctx,w,h,t)` functions (the `person()` helper + props, `rays`/`flame`/`dove`/etc) that replace emoji. Scenes are grouped per book (`CORNELIUS`/`ELIJAH`/`SAUL`/`DANIEL`/`EXODUS`), registered in `CardScene`'s `DRAWERS`, and selected by a step's `scene.canvas` key (or a spec-level `canvas` default with `SceneArea`'s `fallback`). `CardScene` runs a rAF loop, re-measures via `ResizeObserver`/per-frame `size()` (else the canvas gets squashed), and respects `prefers-reduced-motion`. Zero art files, offline. **Because there are no art assets, always screenshot-verify each beat with Playwright at `?demo=<key>` after editing** (`.jsx` can't be `node --check`ed). The nine card games (5 commandos + daniel/exodus) are all L6 as of 2026-06-14; blueprint = Jonah's `_drawGourd`.
- **Opt-in 3-lives** (`spec.lives = 3`): wrong answers cost a life, 0 → a 💔 lose screen with restart; hearts show in the header. Specs **without** `lives` keep the gentle "cannot lose" behavior (daniel/exodus reflection finales stay gentle).
- **Per-game background music** (`cardAudio.js`, zero-file Web Audio): `spec.music` picks a mood track (`warm`/`tender`/`bright`/`majestic`/`solemn`); `CardGame` plays on mount, stops on unmount, with a 🎵/🔇 mute toggle (localStorage-remembered). Audio only sounds after a user gesture (browser rule) — the card container resumes it on `pointerdown`.

**In-repo projectile engine (2026-06-13, `src/minigames/sling/`, branch `feat/david-sling`):** a real-time aim+power throwing minigame (David's sling vs Goliath). A station carries `minigame: { engine: 'sling', winPoints, label }`; `MiniGameModal` boots `SlingGame` on the canvas (same `boot()`/`destroy()`/`onComplete` contract as the Jonah engine). **Outside the Jonah fork** (`sync:jonah` never touches it), self-contained: `config.js` (tunables), `projectile.js` (pure physics — shared by the game loop AND `scripts/sling-physics-test.mjs`), `game.js` (fixed-timestep loop + state machine intro→aim→flying→win/miss→lose), `renderer.js` (humanoid figures + scripture beats), `input.js`, `audio.js`, `content.js`. Difficulty = tolerance-window(sec) = hit-band(deg) / sweep(deg·s⁻¹); fair floor ≈ 0.10s — tune by shrinking the hit zone in `config.js`, not by speeding the sweep. Dev preview: `?demo=sling` (mounts `SlingDemo`). The reusable core is meant for **all future throwing levels** (spear/bow/Gideon/Jericho); blueprint = the `projectile-minigame` skill. **Not yet wired to a journey** — a future David journey plugs it in as a challenge station.

**In-repo Noah engines (2026-06-15, `feat/noah-minigames`, PR #15):** two self-contained Canvas minigames outside the Jonah fork (`sync:jonah` never touches them), same embed contract (`new Game(canvas,{embed,onComplete,...})`/`boot()`/`destroy()`). A station carries `minigame: { engine: 'arkpairs' | 'arkbuild', winPoints, ... }`; dev preview `?demo=arkpairs` / `?demo=arkbuild`.
- **`src/minigames/arkpairs/` — 一公一母進方舟**: two phases. ① **memory-match** (flip cards, same species ♂+♀ — female wears 🎀 — pair up into ark rooms); ② **constraint-arrangement puzzle** (tap a room, tap another = swap; predators 獅/虎/熊/狐 may only neighbor a `safe` animal = elephant or a bird; all-peaceful wins, Isa 11:6). Each animal has `role: predator|safe|prey`; `composeRound(pairs)` **guarantees solvability** (always includes a lion + enough `safe` buffer + dog/rabbit). `opts.pairs` (6/8/10/12, default 8). Room geometry + neighbor relation are shared between renderer/game via `config.arkRoomRects()` / `roomNeighbors()` (don't duplicate the layout math — it drifts and mis-hits). Cannot lose. Reusable pattern = skill [[match-pairs-minigame]].
- **`src/minigames/arkbuild/` — 一步一步蓋方舟**: **operate Noah** — he walks the current plank row with a hammer; tap/space when he's over the glowing nail-point ✛ to nail the plank (within `AIM.tol`); a miss wobbles and retries. Per-row nail positions differ (`config.STUDS`); **difficulty ramps with progress** — `game.aimSpeed()`/`aimTol()` interpolate `AIM.speed→speedMax` and `AIM.tol→tolMin` by `placedCount/total` (fair floor ≈0.10s window; renderer reads `game.aimTol()` so the ✛ tolerance brackets match). **Noah has a face** (eyes/eyebrows/mouth that react: smile when aligned, grimace on miss, squint mid-swing) and a **beard that grows longer and fades black→white as the ark rises** (driven by `game.progress`) — visually "he built it for many years". Three mockers stand on dry land jeering (rotating taunts, atmosphere+teaching, no scoring effect); the flood hasn't come so the ground is dry, not sea. Five sections (hull/3-deck walls/door/window/roof) each gated by a scripture beat; closes on Heb 11:7. Cannot lose.

**All six Jonah levels are embeddable (2026-06-10), in two classes:**
- **Levels 1/2/4 (pure-Canvas)** — parkour / storm / desert-run: pass the no-op `NullUI` Proxy as `ui`.
- **Levels 3/5/6 (card-flow)** — fish-belly prayer / Nineveh preaching / gourd reflection: their card steps call `ui.showFishIntro/Question/Reveal/TryAgain`, `showPreach*`, `showGourd*`. `MiniGameModal.jsx`'s `makeEmbedUI(setCard)` implements那組方法 as React cards over the canvas; card buttons dispatch back via `game.handleFishAction/handlePreachAction/handleGourdAction(act, ds)`. These three levels cannot lose (`_finish(true)` on completion). The contract lives in the Jonah `CLAUDE.md` (item 4).

`MiniGameModal.jsx` mounts the canvas (boot is deferred to a "開始挑戰" click for the audio-unlock gesture), passes `hudLabels` (level 1 defaults to generic 起點/終點 so the parkour engine fits any journey; other levels fall back to the engine's per-level defaults), and on completion calls `resolveStation({ minigameWon, minigameScore })` — the engine scores it in `resolve` (pure, result injected like a quiz answer).

**Re-syncing the Jonah copy is now one command: `npm run sync:jonah`** (`scripts/sync-jonah-engine.mjs`). The upstream Jonah engine is **embed-aware and backward-compatible** — `ui` is injected (so `game.js` does NOT `import './ui.js'`), and `new Game(canvas, { embed, level, mode, hudLabels, onComplete })` drives the embed path. Because of that contract the sync is a **safe verbatim copy**, not a re-patch: the script follows `import` from `game.js`, copies the whole module graph into `src/minigames/jonah/`, and hard-excludes the DOM shell (`ui.js`/`main.js`). It auto-includes any new upstream module (e.g. a future level), errors loudly if the embed contract breaks (engine re-imports `ui.js`) or an import dangles, and reports orphans. Point it at a non-default upstream with `--from=<jonah/src>` or `JONAH_SRC=…`; preview with `--check`. After syncing, run `npm run build` + `npm run test:selfplay`. Add more challenge stations by giving a station a `minigame` field (+ a `gen-map` coordinate if it's a new tile) — see the `add-challenge-station` skill. If upstream adds a new card-flow level, also extend `makeEmbedUI` in `MiniGameModal.jsx` with its `showXxx*` methods.

## Machine gotcha: silent `vite build` death on the agape250 PC

On the agape250 machine (Node 24), `npm run build` can die **silently** right after「✓ 67 modules transformed」(the write/`emptyOutDir` phase), leaving `dist/` stale — exit code is unreliable, so **check the `dist/index.html` timestamp** to know whether a build really happened. Verified fix (2026-06-12): **delete `dist/` manually first** (`Remove-Item dist -Recurse -Force`), then run `npm run build` — with no old dist to recursively remove, the build completes. The HFPC machine does not have this problem; Netlify cloud builds (Node 20) are unaffected.

## Conventions

- Comments and identifiers in this codebase are written in Chinese; match that style when editing existing files.
- `vite.config.js` sets `base: './'` (relative paths) so the build deploys to any subdirectory; PWA is configured to precache all static assets for offline play. Keep the relative base.
