# 🚀 還能加什麼：功能 / 跨專案 Skill / Tool Calling（CP 值排序）

> 更新：**2026-06-17**。給 HFPC / agape250 的 AI 與開發者參考。
> **CP 值** = 對兒童營/教學的價值 ÷ 開發時間。⏱ 是粗估工時（單人＋AI）。
> 排序：先做 CP 值最高、工時最短的。所有點子都遵守系列鐵律：零相依、可離線、牧者把關文案、走 PR 不直推 main。
>
> 現況「已完成 vs 待做」看 `roadmap.md` 最上方 2026-06-17 段。本檔只列「**接下來可做什麼**」。

---

## 🥇 第一梯隊：高 CP、半天內（先做這些）

| # | 點子 | 類型 | ⏱ | 為什麼 CP 高 |
|---|---|---|---|---|
| 1 | **實機確認挖孔黑條**：有挖孔的手機按 ⛶ 進全螢幕，看左/上那條黑是否消失；若還在，改用 `env(safe-area-inset-*)` padding（skill `embed-fullscreen-fit` 有寫） | 驗收/修 | 0.5–2h | 已上線 `:root:fullscreen` 鋪底，但只有實機能驗；體驗硬傷 |
| 2 | **巴蘭/摩西動作版搬進 paul**（比照聖歌 `?demo=jehoshaphat-action`：新增 `BalaamActionDemo`/`MosesActionDemo` 用 MiniGameModal level 10/7 + fill，大廳改指向 paul）| 部署/搬家 | 0.5d | 脫離手動部署的 war-games → 自動上線；本機無 netlify CLI 也能改它 |
| 3 | **通關獎狀／獎章**（過關 Canvas 產一張「○○小朋友完成○○關」可存圖/列印）| 功能 | 0.5d | 兒童營儀式感爆棚、家長愛、純前端；可重用成 skill `award-certificate` |
| 4 | **離線啟動選單頁**（一個 index 把所有 `?demo=` 關列成大按鈕，老師不用記網址）| 功能 | 0.5d | 教室現場最實用；大廳的本機離線版 |
| 5 | **arkbuild 難度旋鈕**（比照 arkpairs：釘點容差/速度/星等）| 功能 | 0.5d | 引擎已在，只加參數；重玩誘因 |
| 6 | **`classroom-scoreboard` skill**：投影用大計分板（隊伍加分/計時/音效）| skill | 0.5d | 任何關都能配；兒童營分組對抗必備 |

---

## 🥈 第二梯隊：高價值、1～2 天

| # | 點子 | 類型 | ⏱ | 說明 |
|---|---|---|---|---|
| 7 | **挪亞方舟完整旅程**（大富翁棋盤：造船→動物進場→洪水→放鴿→彩虹之約，把 arkpairs/arkbuild 當闖關站）| 功能 | 1.5d | 把兩關升級成一卷書；用 `bible-journey-planner`+`bible-game-scaffold` |
| 8 | **得分寫進大廳計分板**（`gsheet-write` 已有：過關把隊名/分數 append 進 Google Sheet，投影即時排行）| 功能 | 1d | 跨關通用；用現成 skill |
| 9 | **`quiz-authoring` skill**：AI 產題→自動套「送審清單」格式→匯出 HTML 給牧者勾選 | skill | 1d | 解決最大瓶頸（題庫/文案審核）；半自動、人仍把關 |
| 10 | **下一卷書**（路得記：拾穗收集關＝`collect-recover-minigame` 換皮＋家譜配對＝`match-pairs-minigame`；或大衛拋射關 `sling` 接成旅程）| 功能 | 2–3d | 內容大坑，但系列最終目標；機制都現成 |
| 11 | **動作關「冷靜版」**：把跑酷/收集關的速度、障礙密度做成可選（慢/中/快），低齡/特殊生也能玩 | 功能 | 1d | 兒童營年齡跨度大；只加參數 |

---

## 🥉 第三梯隊：好玩但較花時間，2 天＋

| # | 點子 | ⏱ | 說明 |
|---|---|---|---|
| 12 | **動物叫聲／真實音效**（arkpairs 配對成功播該動物叫聲，Web Audio 合成或極小音檔）| 1.5d | 可愛、加記憶點；小心離線體積 |
| 13 | **多人同畫面對戰**（兩隊輪流玩同一關計分，或拆屏）| 2d | 對抗感強，但 UI/狀態較複雜 |
| 14 | **真圖美術升級**（`game-art-upgrade`：CC0/AI 圖換 emoji——約拿經驗：真圖不一定贏 emoji，先截圖比對再決定）| 2d+ | CP 中等 |

---

## 🧩 跨專案 Skill 候選（沉澱可重用方法論）

| Skill | 做什麼 | 現況 |
|---|---|---|
| `embed-fullscreen-fit` | 固定比例 Canvas 關在手機**全螢幕、無黑邊、最大、可暫停、挖孔安全區** | ✅ **2026-06-17 已建立**（本輪心法；活範例 MiniGameModal fill） |
| `match-pairs-minigame` | 翻牌記憶配對 + 相鄰約束安排解謎 | ✅ 已建立（活範例 arkpairs） |
| `card-canvas-scenes` | 卡片關 L6 手繪 Canvas 場景（per-beat drawer + 通用背景）| ✅ 已建立（9+ 關活範例；含聖歌/巴蘭 2026-06-16 新增） |
| `classroom-scoreboard` | 投影大計分板（分組/計時/音效）| 待做（#6）|
| `award-certificate` | 通關獎狀 Canvas 產生器（可列印）| 待做（#3）|
| `quiz-authoring` | AI 產題→送審清單→匯出 | 待做（#9）|
| `reverse-rpg-design` | 反向 RPG 設計心法（靠神得勝，不靠攻擊力）| 已建立 |

---

## 🛠️ Tool Calling（自動化 / MCP）候選

> 已驗證可用：**GitHub MCP**（開 PR、push、合併——本輪 PR #19–#28 都靠它）、`gsheet-write`、`send-email`、Playwright（手機橫向截圖驗收）、**netlify CLI**（HFP 機已裝；war-games 手動部署用）。

| # | 點子 | ⏱ | 說明 |
|---|---|---|---|
| T1 | **報名/出席寫進 Google Sheet**（`gsheet-write` 已有，接兒童營報名表）| 0.5d | 牧會行政實用 |
| T2 | **通關成績寄 email 給家長/老師**（`send-email` 已有）| 0.5d | 儀式感＋通知 |
| T3 | **PR 自動驗收機器人**：push 後自動跑 build+selfplay+**手機橫向截圖**貼回 PR | 1d | 多 session 開發的安全網 |
| T4 | **題庫審核流程**：AI 產題 → 寫進 Sheet → 牧者線上勾選 → 回寫 JSON | 1.5d | T1+#9，解審核瓶頸 |
| T5 | **WebSearch/WebFetch 查經文出處**：產題時自動核對和合本經文與章節 | 0.5d | 降低引用錯誤 |

---

## ⚠️ 開發紀律（務必遵守，踩過的坑）

1. **走 PR + `gh pr merge`，不直推 main**（classifier 會擋）；本機 git 身分設 `summer09201017-cloud <summer09201017@gmail.com>`。
2. **大廳連 paul `?demo=` 的卡片：先合併並部署 paul，再合併大廳**，否則點了 404。
3. **做完即 commit+push；多 session 一次只一個動 git**（挪亞源碼曾被另一 session `git clean` 誤刪）。
4. **零美術檔關卡改完用 Playwright 手機橫向截圖驗收**（`.jsx` 不能 `node --check`）；挖孔黑條要實機驗。
5. **卡片關一律 L6 手繪 Canvas**（不用 emoji 小劇場）；**動作關遊玩時隱藏標題列**讓遊戲最大。
6. **戰爭關永久家 = paul**（消除跨 repo sync）；`src/minigames/jonah/` 是約拿 copy，改它要對齊上游避免 `sync:jonah` 漂移。
7. **本機 vite build 地雷**：agape250 機（Node 24）`vite build` 偶發無聲 exit 127 → 先刪 `dist/` 再 build；HFP 機與 Netlify(Node 20) 不受影響。
