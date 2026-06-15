# 📖 保羅宣教之旅（v1 雛形）

[![CI](https://github.com/summer09201017-cloud/hfpc-paul-game/actions/workflows/ci.yml/badge.svg)](https://github.com/summer09201017-cloud/hfpc-paul-game/actions/workflows/ci.yml)

> 🌐 **線上版：https://hfpc-paul-game.netlify.app/**（push `main` 即自動重新部署；可在手機「加入主畫面」安裝、離線玩）
>
> 🆕 **2026-06-14（在 `feat/cornelius-card` 分支，尚未上線）**：暑假兒童營「逆轉奇兵」三個卡片奇兵
> （🕊️福音 `?demo=cornelius`／🌅盼望 `?demo=elijah`／💡大光 `?demo=saul`）+ 系列九個卡片關，
> 全部升級成**手繪 Canvas 動畫（不再只有 emoji）**、加了**背景音樂**與**奇兵關 3 條命（會輸）**。
> 怎麼做卡片關場景見 skill `card-canvas-scenes`；上線前的部署閘見 `讀我-HANDOFF.txt`。
>
> 🆕 **2026-06-15（在 `feat/elijah-action` 分支，尚未上線）**：🥉「盼望」**動作版**——以利亞重得力
> （`?demo=elijah-action`，王上 19）。灰心的以利亞在曠野**撿天使預備的餅🍞水💧恢復體力**、走到何烈山；
> 體力歸零不會失敗，神溫柔扶他起來再走。自成一體的 Canvas 引擎 `src/minigames/elijah/`（仿大衛甩石，
> 在約拿 fork 之外，`sync:jonah` 不會碰），雙擊 `play-elijah-action.bat` 試玩。**文案待牧者審**才上線。

互動式聖經地圖關卡遊戲。跟著使徒保羅走過**第一次宣教旅程**（使徒行傳 13–14 章）：
擲**骰子（1～6 點）**→ 沿著旅程地圖前進 → 停在城市看「**劇情 / 事件卡 + 歷史小檔案**」，
並回答**那座城市的聖經問答**來賺「**福音點數**」。
大家都走完旅程後，**福音點數最高的人獲勝**（所以答對問答、把握事件，才是真正贏的關鍵，不是比誰先到）。

- 🎯 「擲骰子 1～6 點＋移動＋踩格事件＋每城問答」
- 🗺️ 用保羅真實的旅程路線當棋盤（不是方形迴圈）
- 📚 每一格都連到聖經出處，邊玩邊學
- 👥 1 人（平板單機練習）～ 4 人（教室 / 小組投影對戰）
- 📱 可安裝到手機 / 平板 / PC 主畫面（PWA），裝好後**可離線玩**

> 這是 **v1 第一版雛形**，刻意做得簡單、好改。大富翁外框、城市探索、雲端存檔、AI 問答都是後面的事。

---

## 🚀 怎麼跑

需要先裝 [Node.js](https://nodejs.org/)（建議 18 以上）。

```bash
npm install        # 第一次先裝套件
npm run dev        # 開發模式，瀏覽器開 http://localhost:5173
```

正式 / 給別人玩：

```bash
npm run build      # 打包到 dist/
npm run preview    # 本機預覽打包後的版本
```

### 教室投影多人玩
1. 在電腦執行 `npm run dev`（終端機會顯示一個 **Network** 網址，例如 `http://192.168.0.204:5173`）。
2. 接上投影機，大家看著大螢幕，輪流上來擲骰、搶答。
3. 同一個 Wi-Fi 下的平板 / 手機也可以直接開那個 Network 網址。

### 安裝到手機 / PC（PWA）
先 `npm run build && npm run preview`（或正式部署），用瀏覽器打開後：
- **iPhone / iPad（Safari）**：分享 → 加入主畫面。
- **Android（Chrome）**：選單 → 安裝應用程式 / 加到主畫面。
- **PC（Chrome / Edge）**：網址列右側會出現「安裝」圖示。

> 要讓手機正式「安裝」，網站需透過 **https**（或 localhost）。部署到 GitHub Pages / Netlify / 教會主機都可以。

---

## ✏️ 怎麼改內容（老師最常動這裡）

所有劇情、事件、題目都在一個檔案：**`src/data/journey1.json`**。
改完存檔，開發模式下畫面會自動更新——**不用碰任何程式**。

每一站 `stations` 的格式：

```jsonc
{
  "id": "salamis",            // 唯一代號（英文，不要重複）
  "name": "撒拉米",            // 顯示在地圖上的城市名
  "type": "quiz",             // 格子類型：start / story / event / quiz / chance / fate / challenge / end
  "x": 53, "y": 72,           // ⚠️ 自動產生，請勿手改（見下方「地圖」）
  "arriveBy": "sea",          // 選填："sea"=這一段是搭船（地圖上畫成藍色航線）
  "mustStop": true,           // 選填：必停檢查點，棋子不能一步跨過，一定要停下來玩過才能前進
  "scripture": "使徒行傳 13:5",
  "text": "到了撒拉米，就在猶太人的各會堂裡傳講神的道。",

  // 城市歷史小檔案（停在這一格時，彈窗會顯示給小朋友看）：
  "history": {
    "year": "約西元 47 年",            // 保羅大約在西元幾年到這裡
    "companions": "巴拿巴、約翰‧馬可",  // 那時誰跟他在一起
    "willMeet": "一登島就進會堂傳道。"  // 他將在這裡遇見什麼事
  },

  // 問答題：每座會停留的城市都建議放（不限 type，event/story/end 也能放）。
  // 玩家停在這格時就會答這題來賺點數，劇情和問答會一起顯示。
  // 寫法一：單一題（最簡單）——
  "quiz": {
    "question": "……？",
    "options": ["選項A", "選項B", "選項C", "選項D"],
    "answerIndex": 1,         // 正解是第幾個（從 0 算起，0=A,1=B…）
    "explanation": "答案解析，答完會顯示。",
    "reward": 3               // 答對得幾分
  },

  // 寫法二：多題隨機抽（推薦）——放一個 "quizzes" 陣列，每次停這格會「隨機抽一題」，
  // 重玩比較不會背答案。每一題的欄位和上面 quiz 完全一樣。
  // ⚠️ 有 "quizzes" 時就用它；若同時有舊的 "quiz" 會被忽略，請擇一使用。
  "quizzes": [
    { "question": "第一題？", "options": ["A","B"], "answerIndex": 0, "explanation": "…", "reward": 3 },
    { "question": "第二題？", "options": ["A","B","C"], "answerIndex": 2, "explanation": "…", "reward": 3 }
  ],

  // type 是 "event" 才需要：
  "event": {
    "title": "方伯歸主",
    "kind": "good",           // good / bad（影響顏色）
    "effect": { "gospelPoints": 3 },   // 見下方「效果」
    "resultText": "翻牌後顯示的結果說明。"
  },

  // start / story / end 可選用：
  "effect": { "gospelPoints": 1 }
}
```

**效果 `effect` 支援：**

| 欄位 | 意思 | 範例 |
|---|---|---|
| `gospelPoints` | 福音點數加減 | `{ "gospelPoints": 3 }` / `{ "gospelPoints": -1 }` |
| `addCompanion` | 加入一位同工 | `{ "addCompanion": "提摩太" }` |
| `removeCompanion` | 某位同工離隊 | `{ "removeCompanion": "約翰‧馬可" }` |
| `skipNext` | 下一回合暫停一次 | `{ "skipNext": true }` |
| `drawCard` | 踩到這格就抽一張卡 | `{ "drawCard": "chance" }` / `{ "drawCard": "fate" }` |

### 🎲 機會 / 命運卡（牌庫）

頂層的 `decks` 放兩副牌（機會 `chance`、命運 `fate`），每副是一個卡片陣列。
卡片的 `effect` 用法和上表完全一樣（加減福音點數、暫停、增減同工…）：

```jsonc
"decks": {
  "chance": [
    { "title": "放膽傳道", "kind": "good", "text": "翻牌後顯示的說明。", "effect": { "gospelPoints": 2 } }
  ],
  "fate": [
    { "title": "旅途疲乏", "kind": "bad", "text": "……", "effect": { "skipNext": true } }
  ]
}
```

**怎麼讓玩家抽到卡？兩種方式（可並用）：**
1. **專用機會 / 命運格（journey1 目前用這種）**：把一站的 `type` 設成 `"chance"` 或 `"fate"`，整格就是抽卡。
   為了不破壞「真實城市、真經緯度」的地圖，這些卡站擺在**相鄰兩城的航線／路段中點**（是「旅途途中」的事件點，不是假城市）。
   座標一樣由 `gen-map.mjs` 產生：在 `CITIES` 給它一組路段中點的 `lat`/`lon`，再 `npm run gen:map`。
2. **任何城市掛抽卡**：在那一站的 `effect` 寫 `{ "drawCard": "chance" }`，停到該城就連同劇情/問答一起抽一張卡（命運用 `"fate"`）。

> 停到卡站時，畫面會攤開幾張**背面朝上的牌**，玩家用滑鼠**點一張翻開**。抽到哪張其實已由程式洗牌決定，
> 點牌只是把它翻過來（隨機值由畫面層注入，自我對戰用固定種子，確保公平與可重現）。

> 想新增整條旅程（第二次、第三次、到羅馬）？複製一份 `journey1.json` 改成 `journey2.json`，
> 之後可以做成「選章節」。新旅程的城市座標一樣用下方「地圖」的方式產生。

### 🎒 一點點 RPG：同工 / 屬靈裝備 / 頭銜（選用，目前在第一次旅程）

讓遊戲多一點「養成」味道，全部寫在 `journey1.json` 頂層，**不想要可以整段刪掉**，核心玩法不受影響。重點是：**它們只會「加分」，鼓勵收集與答題，不會卡關。**

```jsonc
// 1) 同工被動加成：隊上有這位同工(靠劇情 addCompanion / 起點 startCompanions 取得)就生效
"companions": {
  "巴拿巴":  { "label": "勸慰子巴拿巴", "quizBonus": 1, "blurb": "有他同行，答對問答額外 +1。" },
  "約翰‧馬可": { "label": "助手馬可", "minigameBonus": 1, "blurb": "闖關額外 +1（他離隊後就沒了）。" }
},
// 2) 屬靈裝備/恩賜（全副軍裝，弗 6）：玩家抽到帶 addGift 的機會卡就配備
"gifts": {
  "belt":   { "name": "真理的腰帶", "ref": "弗 6:14", "icon": "🥋", "quizBonus": 1, "blurb": "…" },
  "shield": { "name": "信德的盾牌", "ref": "弗 6:16", "icon": "🛡️", "guard": true, "blurb": "可擋下一次「暫停一回合」。" },
  "sword":  { "name": "聖靈的寶劍", "ref": "弗 6:17", "icon": "⚔️", "minigameBonus": 2, "blurb": "…" }
},
// 3) 頭銜：依福音點數的門檻自動升級(顯示在玩家卡)，高階可附小特權
"titles": [
  { "min": 0, "name": "蒙召的人" }, { "min": 6, "name": "門徒" },
  { "min": 14, "name": "傳道者", "quizBonus": 1 }, { "min": 26, "name": "使徒", "quizBonus": 1 }
]
```

- 要讓玩家**拿到裝備**：在機會牌庫加一張卡，`effect` 寫 `{ "addGift": "shield", "gospelPoints": 1 }`（每張卡仍須加減點數，見上）。
- `quizBonus`＝答對問答時額外加的分；`minigameBonus`＝闖關過關時額外加的分；`guard`＝可擋一次暫停。
- 數值都可自己調；想關掉某項，把那一段刪掉即可。改完記得跑 `npm run validate`（會檢查 `addGift` 有對應到 `gifts`）。

### ✅ 題庫審核清單（請老師 / 牧者過目後再上線）

新增或修改問答後，建議照這張清單檢查一遍——尤其是 AI 幫忙產的題目，務必人工把關：

- [ ] **經文出處正確**：每題 `explanation` 標的章節（如「徒 13:5」）確實支持該答案。
- [ ] **答案唯一且明確**：`answerIndex` 指的選項是唯一正解，其他選項不會「也算對」。
- [ ] **誘答選項不傳錯神學**：錯的選項只是「事實不對」，不要植入錯誤觀念（例：把得救說成靠行為）。
- [ ] **譯名一致**：人名地名（居比路、士求‧保羅、呂高尼…）用和合本 / 教會慣用譯名。
- [ ] **史實與旅程一致**：限第一次旅程（約 AD 46–48，徒 13–14），別混入第二、三次的人事（例：提摩太此時尚未加入）。
- [ ] **年齡合適、語氣正向**：兒童版避免太細的考據，問法鼓勵不刁難。
- [ ] **難度與分數相稱**：`reward` 對應題目難度；同城多題時難易混搭。
- [ ] **上線前跑驗證**：`npm run validate` 無錯誤（會自動抓選項過少、`answerIndex` 越界、缺欄位等）。

---

## 🗺️ 地圖（真實地理位置）

底圖是**真實的東地中海海岸線**，每座城市都擺在它**真正的經緯度**上：敘利亞安提阿在右邊、
路線往左上走到彼西底的安提阿、居比路（賽普勒斯）是海中的島。所以站點的 `x` / `y`
**不是手動填的，而是自動算出來的** —— 請不要手改。

要移動或新增城市：打開 `scripts/gen-map.mjs`，在 `CITIES` 裡改／加該城的 `lat`（緯度）、
`lon`（經度），然後執行：

```bash
npm run gen:map
```

它會重新產生海岸線（`src/data/region-map.json`）並把每一站的 `x` / `y` 寫回 `journey1.json`。
（第一次執行會自動下載一份公有領域的地理資料 Natural Earth 到 `scripts/_geodata/`，之後可離線重跑。）

---

## 🧪 測試（確保遊戲不會卡死）

```bash
npm test                # 一鍵全檢:內容驗證(全部旅程)+ 自我對戰(各 1200 場)+ 煙霧測試
npm run test:offline    # 再加 build + PWA 離線就緒檢查(上課前、給平板裝機前跑這個)
npm run test:browser    # 用真實瀏覽器把一整場玩完，抓動畫/算繪錯誤（需先 npm run preview）
```

---

## 🏗️ 程式架構（給工程師看）

採「**純規則引擎 + 可抽換畫面**」的設計，方便日後加大富翁外框、3D、Phaser、雲端、AI。

```
src/
  core/engine.js      ← 純規則引擎：建立遊戲/擲骰/移動/結算/回合/結束判定。
                         不 import 任何 React，可單獨測試（這是最重要的一層）。
  data/journey1.json  ← 遊戲內容（劇情/事件/題庫）。老師改這裡就好。
  state/useGame.js     ← 把引擎接上畫面 + 動畫計時的 React hook。
  components/          ← 純畫面：地圖、骰子、玩家卡、彈窗、結束畫面。
  styles.css           ← 響應式樣式（手機 / 平板 / 投影都適用）。
scripts/               ← 圖示產生、自我對戰測試、瀏覽器測試。
```

**核心原則**：遊戲規則只活在 `core/`，畫面只負責「讀狀態、送出點擊」。
所以將來要把 2D 地圖換成 Phaser/3D，或加上線上多人，都不必動到規則。

---

## 🗺️ 後續藍圖（Roadmap）

完整的「**已完成 vs 真正待做**」進度清單請見 **[`roadmap.md`](./roadmap.md)**。重點摘要：

**已完成（線上 main＝七條旅程）**：保羅第一/二/三次＋**海路到羅馬**各 20 站（宣教接力 paul1→2→3→4 完整保羅一生）、約拿 20 站（全六關嵌入）、出埃及記 22 站、但以理 20 站（手繪時間軸棋盤＋巴比倫城景）、每城多題隨機抽、機會/命運卡、嵌入式即時闖關、**純 React 卡片流程闖關 6 關**、但以理/出埃及 **RPG 道具層**、3D 骰子、輕 RPG（同工/裝備/頭銜）、手機橫式全螢幕、CI + 七旅程自我對戰（每條 1200 場）、已上線 https://hfpc-paul-game.netlify.app/ 。**總入口大廳**：https://hfpc-bible-games.netlify.app 。

**分支上、待併 main（見 `讀我-HANDOFF.txt`）**：`?journey=` 深連結（大廳卡片要它）、手機放大全白修正＋安裝鈕、首頁分類卡片選單、**大衛甩石「拋射引擎」**（`src/minigames/sling/`，可重用於未來投擲關，`?demo=sling` 預覽）、🆕 **盼望動作版「收集/恢復引擎」**（`src/minigames/elijah/`，`feat/elijah-action`，撿餅水恢復體力，`?demo=elijah-action` 預覽，可重用於嗎哪/拾穗收集關）。

**真正待做**（節選，詳見 roadmap.md）：① 把上述四分支按序併 main + 重部署（使用者點頭後）；② 題庫神學審核（含卡片關/新旅程文案，送審清單 `docs/題庫送審清單-2026-06-12.html`）；③ 收集機制換皮（嗎哪/王膳/拾穗，需約拿 spawner）；④ 下一卷書（路得記優先）；⑤ 課堂交付包（QR/計分板）；⑥ AI 輔助產題。

> 神學正確性建議由德義老師與牧者把關；AI 先用在「幫忙產生並校對題庫」會比「即時回答小孩」安全。
