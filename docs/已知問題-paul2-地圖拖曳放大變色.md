# 已知問題(未解):paul2 地圖「拖曳變藍 / 放大變白」整片變單色

> 更新:2026-06-22(agape250 機,接手請續查)。狀態:**未解。** 影響:`?journey=paul2`(及可能其他旅程)桌機 Chrome。

## 症狀(使用者實測)
- 在 `https://hfpc-paul-game.netlify.app/?journey=paul2` 進旅程後:
  - **滑鼠拖曳(平移)地圖 → 整片變成「地中海的藍色」**(`.board__sea` 的填色)。
  - 早先回報「放大(~130%)→ 整頁全白」。
- **整個畫面**變單色(不只地圖區);**DOM 還在**(按鈕等元素仍在,只是畫面被單色蓋住)。
- **無痕視窗(無快取)仍會發生** → 不是 PWA service worker 舊快取。
- 目前只在**使用者那台 PC 的 Chrome** 確認;發生在**真實顯卡**上。

## 已排除 / 已確認
- ❌ 不是快取:無痕視窗(全新、無 SW)仍重現。
- ❌ 不是點陣超限(raster budget):那只會「地圖區」變白且要放很大才白;這是**整頁、且一拖/一放就變**。
  (本輪曾改 `useZoomPan.js` 的 `safeMaxScale` 下限 → 那修的是另一種、地圖才白的問題,對此 bug 無效但無害,已保留。)
- ✅ 已把 3D 骰子改成 2D(`DicePanel.jsx`,移除唯一的 `perspective`/`preserve-3d` 3D 合成層)——
  原以為是 3D 骰子讓 GPU 行程崩潰;**但使用者回報拖曳仍變藍,故 3D 骰子至多是其中一個觸發點,非全部。**
- ⚠ **Playwright 完全重現不出來**:試過 headless Chromium、`channel:'chrome'`(真 Chrome)、DPR 1/2/3、
  縮放到 250%、以及拖曳平移到 clamp 邊界 —— 在**這台機器的 GPU + Playwright 啟動的瀏覽器**全部正常渲染、不變色。
  → 強烈指向**特定顯卡驅動 + Chrome 硬體加速**下的 GPU 合成失敗(失敗時顯示該圖層底色:海藍 `<rect>` 或白)。

## 最可能的根因(待證實)
**大型、被縮放(`preserveAspectRatio="none"`)的 SVG 地圖(`.board__map`)在被平移/縮放重繪時,於該顯卡驅動上 GPU 合成失敗**,
只剩底層 `.board__sea` 的 `<rect>`(海藍)被畫出來、或整片變白。可疑點:
- `MapBackground.jsx` 的 `<path className="board__land" vectorEffect="non-scaling-stroke">` —— **`non-scaling-stroke` 在被大幅縮放的 SVG 上是已知的 Chrome GPU 點陣化問題來源。**
- `preserveAspectRatio="none"`(非等比拉伸)讓 GPU 點陣器在某些驅動上出錯。
- 平移用 `.board__scene` 的 `left/top` 行內 px 改變(理論上不該升成 GPU 圖層,但 SVG 本身可能被 GPU 點陣化)。

## 下一步(接手請依序)
1. **先確認是不是 GPU(30 秒,決定性)**:在會重現的那台 Chrome,網址列 `chrome://settings/system` →
   關掉「使用硬體加速」→ 重開 Chrome → 再拖曳/放大。
   - **關掉就正常** → 100% 是 GPU 合成失敗,往下走 code fix(目標:讓地圖不靠 GPU 圖層、或移除 non-scaling-stroke)。
   - **關掉仍變色** → 不是 GPU,改查版面/paint(例如某元素 inset:0 蓋全頁)。
2. **code fix 候選(逐一試,每次部署後在該台 Chrome 實測,因為唯一可靠重現環境就是它)**:
   a. `MapBackground.jsx`:拿掉 `.board__land`/`decor` 的 `vectorEffect="non-scaling-stroke"`(改用會縮放的 stroke,或細邊框用別的方式)。**最可疑、先試這個。**
   b. 給 `.board__map` / `.board__scene` 加 `contain: paint` 或反過來避免它被升成合成層;或試 `image-rendering`/`will-change:auto`。
   c. 把 SVG 地圖改成「**固定 viewBox 不拉伸**」:`preserveAspectRatio` 改 `xMidYMid meet`,容器用真實長寬比(已是),避免非等比縮放。
   d. 最後手段:地圖底圖改成**預先點陣化的 `<img>`(PNG/WebP)**而非即時縮放 SVG(GPU 對單張點陣圖縮放穩定得多)。站點/路線/棋子維持 DOM 疊在上面。
3. **重現工具**:`scratchpad/repro-chrome-drag.mjs` 已寫好(真 Chrome + 拖曳),本輪沒跑到 —— 接手可先在會重現的那台跑它,確認能不能在 Playwright 抓到,能抓到就能快速迭代。
   也可用 `repro-drag.mjs`(headless)、`repro-chrome.mjs`(真 Chrome 縮放)。截圖在 scratchpad/。

## 暫時的使用者解法(課堂能先用)
請使用者在那台 Chrome `chrome://settings/system` 關掉「使用硬體加速」並重開 —— GPU 合成失敗就不會發生(代價:動畫稍微吃 CPU,主日學桌遊無感)。

## 相關檔
- `src/components/useZoomPan.js`(縮放/平移邏輯、safeMaxScale)
- `src/components/Board.jsx`(`.board__scene` 以 width/height% + left/top 渲染,刻意不用 transform scale)
- `src/components/MapBackground.jsx`(SVG 地圖、`.board__sea` rect、`vectorEffect="non-scaling-stroke"`)
- `src/styles.css`(`.board` overflow:hidden + aspect-ratio;`.board__scene`)
- 跨專案 skill:`gpu-safe-rendering`(本輪新增,記錄此類 GPU 變色的診斷與防範)
