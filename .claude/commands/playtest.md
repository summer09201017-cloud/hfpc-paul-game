---
description: 啟動 dev、用 Playwright 在手機橫向視口截一個關卡/旅程的圖並回報 console 錯誤（零美術檔關卡的標準驗收）
argument-hint: <demo-或-journey-key，如 elijah / cornelius-action / noahCovenant / ?journey=noah>
allowed-tools: Bash, Read
---

把 `$ARGUMENTS` 當成要驗收的目標，做這個專案「零美術檔關卡改完一定截圖驗收」的標準流程：

1. 解析目標：
   - 含 `journey=` 或就是旅程 key（paul/jonah/exodus/daniel/noah…）→ 用 `?journey=<key>`（會自動預選該旅程）。
   - 否則當成 `?demo=<key>`（卡片關如 cornelius/elijah/saul/jehoshaphat/balaam/noahCovenant…；動作關如 cornelius-action/saul-action/jehoshaphat-action/sling/redsea/arkpairs/arkbuild/elijah-action）。
2. 啟動 dev（背景）：`npm run dev`，從輸出抓 `localhost:<port>`（5173 被占用會自動往後）。
3. 用 Playwright（專案已裝）在**手機橫向視口 ~900×420、deviceScaleFactor 2** 開該網址，攔截 `pageerror` 與 console error：
   - 卡片關：點「開始 →」進 CardGame，截圖 intro；若想看更多幕，直接 `await import('/src/minigames/cards/scenes.js')` 在 page.evaluate 裡把該書卷的 drawer 畫成網格截圖（最可靠，不必通關）。
   - 動作關（fill）：點「開始挑戰」後截圖，量 `.minigame__canvas` 是否貼合容器（ratio≈1.78）、佔高 ≥85%。
   - 旅程：在 SetupScreen 點該旅程卡（或靠 ?journey= 預選）→ 開始 → 截棋盤。
4. 把截圖用 Read 看過，回報：**目標、截到的畫面、canvas 比例/佔比、console 錯誤數**。
5. 收尾：停掉 dev server（釋放 port）、刪掉 `screenshots/` 下這次產生的暫存圖。

注意（本機/本專案地雷）：
- Playwright 腳本要放在**專案目錄內**執行才解析得到 `node_modules`（放 /tmp 會 ERR_MODULE_NOT_FOUND）。
- `page.setViewportSize` 在全螢幕視窗會被擋；要不同尺寸就**開新 context**。
- 挖孔黑條 / 真實旋轉時序 Playwright 模擬不出，需實機；截圖只驗版面/比例/錯誤。
- `.jsx` 不能 `node --check`；場景 drawer 請另用 mock-ctx 跑過多個 t 抓 runtime 錯。
