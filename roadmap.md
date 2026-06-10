# 🗺️ 保羅大富翁 — 進度藍圖（已完成 vs 真正待做）

> 對齊現況：**2026-06-10**。GitHub：`summer09201017-cloud/hfpc-paul-game`（branch `main`，CI 全綠）。
> 這份是給接手的人 / AI 看的「目前到哪了、接下來做什麼」。技術細節看 `CLAUDE.md`，玩法/編輯看 `README.md`。

---

## ✅ 已完成（並有 CI / 自我對戰護住）

**架構與品質**
- 純規則引擎 + 可抽換畫面（`core/engine.js` 不碰 React/DOM；隨機值外部注入；單一 `getGameStatus`）。
- 自我對戰護欄：**3 條旅程 × 1~4 人 × 300 種子 = 每條 1200 場**，全部正常結束。
- 內容驗證器 `npm run validate`（重複 id、選項越界、effect 拼錯、牌庫規則、座標範圍）。
- CI（GitHub Actions）：push/PR 自動跑 validate + selfplay + build + **真實瀏覽器實機玩一整局**；actions 已升 `@v5`（無 Node 20 警告）。
- 真實地理棋盤：用真經緯度投影海岸線、站點座標自動產生（`gen-map.mjs`，多旅程版）。
- PWA 可安裝 / 離線；Netlify 部署設定（Node 釘 20）。

**玩法內容**
- **三條旅程 + 旅程選單**：
  - 第一次宣教旅程（**20 站**，含 6 機會/命運卡站 + 2 必停闖關站）。
  - 第二次宣教旅程（**12 站**，福音首次進歐洲：腓立比/帖撒羅尼迦/庇哩亞/雅典/哥林多…）。
  - 約拿宣教之旅（**15 站**，約拿書 1–4 章）。
- 每城**多題隨機抽**（`quizzes[]`，落格抽一題）。
- **機會 / 命運卡**：頂層 `decks`、`drawCard` 觸發、**點牌翻牌** UI；規則「每張卡都必須加或減點數」（validate 強制）。
- **嵌入式即時小遊戲（路線 A）**：把約拿 2D Canvas 引擎嵌進城市站當闖關，兩個**必停**關卡：
  - 🏃 跑酷關（同一引擎被多條旅程重用：保羅＝翻山越嶺 / 約拿＝逃往約帕；關內 HUD 已改**通用「起點 → 終點 ⛵」**，不再寫死某旅程地名）。
  - 🌊 海上遇風暴（平衡穩船，回程海路）。
- 骰子 **1~6 點**（點數骰、轉 3 秒）；地圖縮放連續可調（拉桿 + 可輸入百分比，100–250%）。
- 勝負＝**福音點數最高**（不是最先到）。
- **一點點 RPG（資料驅動，目前在第一次旅程）**：同工被動加成（巴拿巴答對 +1、馬可闖關 +1）、屬靈裝備/恩賜（全副軍裝 弗 6：真理腰帶/信德盾牌/聖靈寶劍，靠機會卡 `addGift` 取得）、福音點數頭銜（蒙召的人→門徒→傳道者→使徒）。只加分、不卡關；validate + 三旅程 selfplay 仍全綠。詳見 README「🎒 一點點 RPG」。

**Skill 庫（全域 `~/.claude/skills/`，已建立 6 個，可跨專案重用）**
- 大富翁三件套：`roll-and-move-game`、`game-content-validator`、`real-geography-board`。
- 闖關三件套：`embed-minigame`、`add-challenge-station`、`arcade-game-kit`。

---

## 🔧 真正待做（依優先序）

1. **神學 / 題庫審核（最重要）**：`journey2.json`（第二次旅程）與 `journey-jonah.json` 的題目、卡牌，請德義老師 / 牧者依 README 的「題庫審核清單」過目後再正式上線。第二次旅程的題目是 AI 草擬，務必人工把關。
2. **第三次宣教旅程 + 海路到羅馬**：用 `roll-and-move-game` skill 照 `journey2` 的方式新增 `journey3.json`（徒 18:23–21:17，以弗所三年…）與「到羅馬」（徒 27–28，海難）。城市座標：在 `gen-map.mjs` 加一個 region（或沿用第二次的範圍）再 `npm run gen:map`；最後把它加進 `useGame.js` 的 `JOURNEYS`。
3. ~~約拿地圖改用真實「尼尼微 → 地中海」底圖~~ **✅ 已完成（2026-06-10）**：`gen-map.mjs` 新增「約拿宣教之旅」region（框 lon 30–44.5°E、lat 29.5–37.8°N），約帕/迦特希弗/尼尼微等用真經緯度，海上途中站給地中海座標，他施以西邊海外箭頭示意；`region-map-jonah.json` 已是真實海岸線、15 站座標自動產生。視覺上看得出約拿被召去東邊的尼尼微、卻往西逃出海，魚後再往東去尼尼微。
4. **闖關美術 / 主題對齊**：跑酷關背景目前仍是約拿的「港城」美術，可換成山路 / 城門更貼「翻山越嶺」；暴風雨難度可在 `src/minigames/jonah/config.js` 的 `STORM` 微調。更多城市闖關用 `add-challenge-station`。
4. **更深的大富翁機制**：同工卡牌、植堂計分、機會/命運再擴充。
5. **雲端存檔 / 班級排行榜**（Supabase）。
6. **AI 輔助產題**：檢索式、附經文出處，由牧者審核（先用在「幫忙產題並校對」最安全）。
7. **正式部署**：Netlify（`hfpc-paul-game`）上線 + 手機安裝→關 Wi-Fi 離線煙霧測試。

### 技術債 / 注意事項
- `src/minigames/jonah/` 是約拿專案（`hfpc-jonah-game`）的**一份 fork**；上游更新後要手動重新同步並重套「嵌入模式」改動（見 `embed-minigame` skill）。
- `useGame.js` 的 `JOURNEYS` 已支援多旅程；新增旅程只要加一筆 + 對應 `journeyX.json` 與 `region-mapX.json`。
- 站點 `x`/`y` 與 `region-map*.json` 都是 `gen-map.mjs` 的**產生物**，請勿手改；要動地圖改 `CITIES` 經緯度再 `npm run gen:map`。

---

## 一次跑完所有檢查
```bash
npm install
npm run validate           # 預設驗 journey1；其他用 node scripts/validate.mjs src/data/journeyX.json
npm run test:selfplay      # 三條旅程各 1200 場，確認都會正常結束
npm run build              # 打包；CI 另會跑真實瀏覽器實機測試
npm run dev                # 本機開發（區網可連，給平板/投影）
```
