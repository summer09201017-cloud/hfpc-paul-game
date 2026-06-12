# 🗺️ 保羅大富翁 — 進度藍圖（已完成 vs 真正待做）

> 對齊現況：**2026-06-11**(嵌入引擎已 sync 至最新:衝刺/曠野蛇蠍/拋約拿入海)。GitHub：`summer09201017-cloud/hfpc-paul-game`（branch `main`，CI 全綠）。
> 這份是給接手的人 / AI 看的「目前到哪了、接下來做什麼」。技術細節看 `CLAUDE.md`，玩法/編輯看 `README.md`。

---

## ✅ 已完成（並有 CI / 自我對戰護住）

**架構與品質**
- 純規則引擎 + 可抽換畫面（`core/engine.js` 不碰 React/DOM；隨機值外部注入；單一 `getGameStatus`）。
- 自我對戰護欄：**4 條旅程 × 1~4 人 × 300 種子 = 每條 1200 場**，全部正常結束。
- 內容驗證器 `npm run validate`（重複 id、選項越界、effect 拼錯、牌庫規則、座標範圍）。
- CI（GitHub Actions）：push/PR 自動跑 validate + selfplay + build + **真實瀏覽器實機玩一整局**；actions 已升 `@v5`（無 Node 20 警告）。
- 真實地理棋盤：用真經緯度投影海岸線、站點座標自動產生（`gen-map.mjs`，多旅程版）。
- PWA 可安裝 / 離線；Netlify 部署設定（Node 釘 20）。

**玩法內容**
- **四條旅程 + 旅程選單**：
  - 第一次宣教旅程（**20 站**，含 6 機會/命運卡站 + 2 必停闖關站）。
  - 第二次宣教旅程（**20 站**，福音首次進歐洲：腓立比/帖撒羅尼迦/庇哩亞/雅典/哥林多…；含 ⛰️ 翻越托魯斯山、🌊 地中海長航 2 個必停闖關站）。
  - 第三次宣教旅程（**20 站**，2026-06-11 完成且牧者過審：以弗所三年事件群/羅馬書/米利都道別…；含 ⛰️ 高原趕路、🌊 趕路的海程 2 個必停闖關站）。
  - 約拿宣教之旅（**20 站**，約拿書 1–4 章，**6 個必停闖關站＝約拿全六關**）。
- **手機體驗（2026-06-11 晚）**：強制橫式全螢幕（manifest landscape + 直向蓋版 + 手勢全螢幕，見 `force-landscape-pwa` skill）；橫向版面地圖填滿左欄約 8 成（cover 不變形、可平移）、骰子排最上；縮放白屏根治（transform scale → 實際版面放大）；闖關彈窗以視口高度反推上限不再切底。
- 每城**多題隨機抽**（`quizzes[]`，落格抽一題）。
- **機會 / 命運卡**：頂層 `decks`、`drawCard` 觸發、**點牌翻牌** UI；規則「每張卡都必須加或減點數」（validate 強制）。
- **嵌入式即時小遊戲（路線 A）— 約拿全六關都可嵌（2026-06-10）**：
  - **1/2/4 純 Canvas 關**（跑酷／暴風雨／曠野→尼尼微）：配空殼 NullUI；同一跑酷引擎被多條旅程重用（保羅＝翻山越嶺用 L4 曠野美術 / 約拿＝逃往約帕用 L1 港口美術），HUD 地名由站點 `minigame.hudLabels` 或引擎各關預設決定。
  - **3/5/6 卡片流程關**（大魚肚禱告／尼尼微傳道／蓖麻樹）：`MiniGameModal.jsx` 的 `makeEmbedUI` 把引擎的 `showFish*/showPreach*/showGourd*` 畫成 React 卡片，按鈕回呼 `game.handleXxxAction`（嵌入契約見約拿 CLAUDE.md 第 4 點）。
  - **已用 Playwright 全自動 e2e 驗證**：約拿之旅整條 20 站、6 個小遊戲全部可玩到結束、零 JS 錯誤。
- **3D 骰子**（CSS 3D 立方體：擲骰立體翻滾、停下平滑轉到擲出面，對面相加＝7；轉 3 秒、純 CSS 不動引擎）；地圖縮放連續可調（拉桿 + 可輸入百分比，100–250%）。
- 勝負＝**福音點數最高**（不是最先到）。
- **一點點 RPG（資料驅動，兩條保羅旅程＋約拿頭銜都有）**：同工被動加成（第一次＝巴拿巴/馬可；第二次＝西拉/提摩太/路加/亞居拉百基拉）、屬靈裝備/恩賜（全副軍裝 弗 6：真理腰帶/信德盾牌/聖靈寶劍，靠機會卡 `addGift`；盾牌 `guard` 擋一次暫停）、分數頭銜（保羅：蒙召的人→門徒→傳道者→使徒；約拿：→回轉的人→順服的僕人→憐憫的使者）。只加分、不卡關。詳見 README「🎒 一點點 RPG」。
- **宣教接力（paul1 → paul2 → paul3 全接通）**：旅程走完，結束畫面可「接續下一段」——名字/福音點數/裝備帶過去、同工換新旅程起點同工（`JOURNEYS.nextKey`；journey4「海路到羅馬」完成後接 `paul3 → paul4`）。
- **步數透明**：卡片 `move` 效果真的移動棋子（「神安排大魚：前進 2 格」）；必停站/終點提前停下顯示 `moveNote` 說明條（玩家不再誤以為步數和骰子不符是 bug）。結算每筆加分標來源（事件「…」：/機會卡：/劇情：），答錯明確寫「這一題沒有加分」。

**Skill 庫（全域 `~/.claude/skills/`，可跨專案重用）**
- 大富翁三件套：`roll-and-move-game`、`game-content-validator`、`real-geography-board`。
- 闖關三件套：`embed-minigame`、`add-challenge-station`、`arcade-game-kit`。
- 系列／品質／交付：`bible-game-studio`（內容神學慣例）、`game-smoke-test`（上課前煙霧測試，約拿 `npm test` 是活範例，可補本專案離線檢查）、`classroom-game-deploy`、`web-launch`、`packer-theology`、`board-game-designer`。

---

## 🆕 2026-06-12 進度

- **測試門升級(已併入 main)**:`npm run validate` 無參數時自動驗**全部** `journey*.json`(CI 同步受惠);新增 `scripts/smoke-test.mjs`(src 語法 + 嵌入契約守門 + `--offline` 離線就緒,逐檔檢查 Workbox 預快取);`npm test` = validate+selfplay+煙霧、`npm run test:offline` 44 項全綠。
- **版本收斂**:06-11 深夜未 commit 的文件最終版已救回(8946d1c);GitHub 是唯一真相,一律在 git 工作樹工作。
- **機器註記**:HFP 那台(Node 24.14.1)實測 `vite build` 連跑 3 次全部成功——「Node 24 build 地雷」是 agape250 那台的機器特性,非 Node 24 通病。
- **`feat/rpg-items-batch1` 分支(待牧者審)**:牧師 06-12 道具設計的零引擎改動資料層——三旅程全副軍裝補齊 6 件、journey2 獄中讚美詩/製帳棚、journey3 羅馬公民證/書信羽毛筆、約拿之旅 gifts(禱告卷軸/蓖麻樹蔭)+蟲蟲卡+船票卡。設計總表見 skill `bible-rpg-items`。
- **新書卷管線 skill ×3**:`bible-journey-planner`(含但以理/出埃及記完成設計稿)、`bible-game-scaffold`、`bible-rpg-items`。

---

## 🔧 真正待做（依優先序）

0. **牧者審核兩個 feature branch**:本 repo `feat/rpg-items-batch1`(道具)與約拿 repo `feat/quiz-ch3-4`(題庫 3–4 章)——實測滿意才 merge main(main 自動部署)。
1. **神學 / 題庫審核（最重要）**：`journey2.json`（第二次旅程）與 `journey-jonah.json` 的題目、卡牌，請德義老師 / 牧者依 README 的「題庫審核清單」過目後再正式上線。第二次旅程的題目是 AI 草擬，務必人工把關。
   - **✅ 2026-06-10 部分審核通過（牧者本人）**：當日「新增」的站點題目與卡片文案——含 約拿之旅新 5 站（下約帕的路上/沉入深海/魚腹禱告·仰望/曠野趕路/三日路程的大城）、尼尼微全城悔改與蓖麻樹的功課的補題、第二次旅程新 8 站（敘利亞與基利家/托魯斯山/弗呂家加拉太/尼亞波利/暗妃波里/愛琴海航路/堅革哩/地中海長航）、全副軍裝機會卡（兩條旅程）、同工/頭銜文案。**仍待審**：journey2 與 journey-jonah「原有」的題目卡牌（2026-06-10 之前草擬的部分）。
2. ~~第三次宣教旅程~~ **✅ 已完成並上線（2026-06-11）**：`journey3.json` 20 站（以弗所三年事件群/推喇奴/士基瓦/焚書/底米丟/羅馬書/猶推古/米利都道別/亞迦布/耶路撒冷）+ 2 闖關站（高原 L4、海程 L2）+ RPG 層；`gen-map.mjs` region3 真實愛琴海地圖；宣教接力 `paul2 → paul3` 已接通；四旅程 selfplay 全綠。**✅ journey3 題目與文案 牧者審核通過（2026-06-11）。**
   **仍待做：「海路到羅馬」**（徒 27–28：被押解/狂風友拉革羅/船難馬耳他/抵達羅馬）——照同模式新增 `journey4.json`（暴風雨 L2 是天然的必停闖關站！），完成後把 `paul3` 的 `nextKey` 接上。
3. ~~約拿地圖改用真實「尼尼微 → 地中海」底圖~~ **✅ 已完成（2026-06-10）**：`gen-map.mjs` 新增「約拿宣教之旅」region（框 lon 30–44.5°E、lat 29.5–37.8°N），約帕/迦特希弗/尼尼微等用真經緯度，海上途中站給地中海座標，他施以西邊海外箭頭示意；`region-map-jonah.json` 已是真實海岸線、站點座標自動產生。視覺上看得出約拿被召去東邊的尼尼微、卻往西逃出海，魚後再往東去尼尼微。
4. ~~闖關美術 / 主題對齊~~ **✅ 已完成（2026-06-10）**：兩條保羅旅程的「翻山」闖關站改用第四關曠野美術（`level: 4`，旱路+城門），L1 港口美術留給約拿「逃往約帕」；暴風雨難度仍可在 `src/minigames/jonah/config.js` 的 `STORM` 微調。更多城市闖關用 `add-challenge-station`。
4. **更深的大富翁機制**：同工卡牌、植堂計分、機會/命運再擴充。
5. **雲端存檔 / 班級排行榜**（Supabase）。
6. **AI 輔助產題**：檢索式、附經文出處，由牧者審核（先用在「幫忙產題並校對」最安全）。
7. ~~正式部署~~ **✅ 已上線（2026-06-11）：https://hfpc-paul-game.netlify.app/**（連 GitHub `main` 自動部署，Netlify 雲端用 Node 20 建置——本機 Node 24 的 vite build 地雷不影響雲端；首次部署一次全綠，Playwright 已實機驗證線上版可開局/擲骰/進闖關站）。**剩**：手機「加入主畫面」安裝 → 關 Wi-Fi 離線煙霧測試。

### 技術債 / 注意事項
- `src/minigames/jonah/` 是約拿專案（`hfpc-jonah-game`）的**純複製 copy**；上游更新後跑 **`npm run sync:jonah`** 一鍵同步（約拿端守住其 CLAUDE.md「嵌入契約」，這裡就不必重套改動）。
- 🚀 **未來功能點子（跨兩專案，按 CP 值排序）見 `讀我-HANDOFF.txt` 的「未來功能點子」**。
- `useGame.js` 的 `JOURNEYS` 已支援多旅程；新增旅程只要加一筆 + 對應 `journeyX.json` 與 `region-mapX.json`。
- 站點 `x`/`y` 與 `region-map*.json` 都是 `gen-map.mjs` 的**產生物**，請勿手改；要動地圖改 `CITIES` 經緯度再 `npm run gen:map`。

---

## 一次跑完所有檢查
```bash
npm install
npm test                   # validate(全部 journey*.json)+ selfplay(各 1200 場)+ 煙霧測試
npm run test:offline       # build + dist 離線就緒(Workbox 預快取逐檔檢查)
npm run build              # 打包；CI 另會跑真實瀏覽器實機測試
npm run dev                # 本機開發（區網可連，給平板/投影）
```
