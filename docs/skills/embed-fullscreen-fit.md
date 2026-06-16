---
name: embed-fullscreen-fit
description: >-
  把「固定比例(如 16:9)的即時 Canvas 小遊戲」在手機上乾淨地全螢幕呈現——無黑邊、遊戲畫面最大、
  開場說明不被切、有 ⛶ 全螢幕鈕與暫停鈕、進全螢幕時挖孔/瀏海安全區不露黑。當使用者說
  「手機全螢幕 / 兩邊黑邊 / 遊戲不夠大 / 開場框(玩法說明+開始鈕)被切玩不了 / 沒有暫停鈕 /
  全螢幕後挖孔一條黑 / 16:9 滿版 / 動作關嵌進桌遊或單獨玩 ?demo= 」時使用。
  活範例:hfpc-paul-game 的 MiniGameModal(fill) + 福音/大光/聖歌動作關 + 5 個 Demo 元件。
  搭配 force-landscape-pwa(鎖橫向)、classroom-game-deploy(投影/離線)、embed-minigame(跨專案搬關)。
---

# embed-fullscreen-fit — 手機全螢幕嵌入固定比例 Canvas 關

把一個**內部用固定邏輯解析度(如 960×540 = 16:9)、contain-fit 置中**的 Canvas 即時小遊戲,
在手機(尤其橫向 / App 內建瀏覽器)上呈現成「遊戲最大、邊最少、能開始、能暫停、能全螢幕」。
這支 skill 把 hfpc-paul-game 反覆踩過的坑與修法固化下來。

## 為什麼會出問題(先懂根因)

幾乎所有手寫 Canvas 引擎都這樣縮放:
```js
const scale = Math.min(cssW / VIEW.W, cssH / VIEW.H)  // 「contain」：整個世界塞進容器、置中、留邊
```
這代表 **容器一旦不是遊戲比例,引擎就在內部留一圈邊**。於是:
- 把舞台拉成「滿寬但很矮」→ 引擎把 16:9 世界縮到中間一條,**兩側一大圈邊**(寬扁的 App 內建瀏覽器最慘:框中又有框)。
- 把舞台框死成置中小盒(`max-width:880px`)→ 寬螢幕只剩中間 880px + 兩側留白。

所以「讓容器滿版」**不等於**「遊戲變大」。要遊戲大,容器必須**是遊戲的比例**、且**盡可能大**。

## 五個必修點(逐一對應使用者會抱怨的症狀)

### 1) 容器要「等於遊戲比例 + 取塞得進畫面的最大框」置中
不要把舞台改成 `aspect-ratio:auto` 滿寬;要鎖成遊戲比例、用可用高度反推最大寬度:
```css
.host--game .stage {
  aspect-ratio: 16 / 9;                         /* = 引擎 VIEW 比例,引擎就零內部留邊 */
  width: 100%;
  max-height: calc(100dvh - var(--chrome, 0px));
  max-width:  calc((100dvh - var(--chrome, 0px)) * 16 / 9);
  margin: auto;                                  /* 置中 */
}
```
引擎讀的是**容器(parent)的 clientWidth/Height**——容器一變成 16:9,引擎就邊到邊填滿、不再內部 letterbox。
> 殘留事實:遊戲是 16:9、螢幕更寬時,兩側**必然有薄邊**(比例差)。要「完全無邊」只能 cover-crop,
> 但會裁掉上下的 HUD/計分列——**不建議**。把邊降到最小即可。

### 2) 開始遊玩後「隱藏標題列 / 說明列」→ 遊戲放到最大
頂部那條標題/說明列最吃高度。開場(intro)顯示、**一旦開始就隱藏**,把整個高度讓給遊戲:
```jsx
<div className={`host host--game${started ? ' host--playing' : ''}`}>
```
```css
.host--playing .head { display: none; }
.host--playing .stage { max-height: 100dvh; max-width: calc(100dvh * 16 / 9); }
```
- 直掛 Demo 元件同理:`{(!started || result) && <div class="hint">…</div>}`(遊玩時不顯示;結果時再顯示成績)。
- 順手把「開發預覽 / ?demo=…」字樣拿掉,改乾淨關名——這些一旦從大廳連進去就是正式關卡。

### 3) 開場「玩法說明 + 開始鈕」必須在矮螢幕也點得到(★最常重複犯的錯)
手機橫向 + App 內建瀏覽器,視窗又寬又矮;開場 overlay 若置中又不能捲動,文字與「開始」鈕會被切到畫面外 → **玩家根本進不去**。
```css
.intro {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center;
  justify-content: safe center;   /* 放得下置中;放不下改靠上 */
  overflow-y: auto;               /* 放不下可捲動,開始鈕永遠搆得到 */
  gap: 1rem; padding: 1.2rem; text-align: center;
}
.intro > * { flex: 0 0 auto; }
@media (orientation: landscape) and (max-height: 540px) {
  .intro { gap: .5rem; padding: .7rem 1rem; }
  .intro .how { font-size: clamp(.85rem, 3.2vw, 1.1rem); line-height: 1.45; }
}
```

### 4) ⛶ 全螢幕鈕 + 開始時自動進全螢幕鎖橫向
單獨玩的動作關**一定要有 ⛶ 鈕**(否則在 App 內建瀏覽器,16:9 永遠有邊、無法真正滿版)。
在**使用者手勢中**呼叫才會成功:
```js
const enterFullscreenLandscape = () => {
  try {
    const el = document.documentElement
    if (!document.fullscreenElement && el.requestFullscreen) {
      const p = el.requestFullscreen()
      if (p?.then) p.then(() => { try { screen.orientation?.lock?.('landscape') } catch {} }).catch(() => {})
      else { try { screen.orientation?.lock?.('landscape') } catch {} }
    }
  } catch {}
}
// 「開始挑戰」的 onClick 裡就呼叫一次(手勢中最容易成功);另放一顆 ⛶ 可隨時切換。
```
⚠ **App 內建瀏覽器(LINE / Messenger 等 webview)常封鎖 Fullscreen API** → ⛶ 可能沒反應。
這不是程式能繞過的瀏覽器政策;請引導使用者「用系統瀏覽器(Chrome/Safari)開」或「加到主畫面」。

### 5) 全螢幕後挖孔/瀏海安全區不要露黑
`viewport-fit=cover`(viewport meta)是必要前提,但還要讓**全螢幕根元素 + backdrop 鋪底色**,否則挖孔那條會黑:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
```css
:root:fullscreen { background: #f1e6cb; }            /* 換成你的場景底色 */
:root:fullscreen::backdrop { background: #f1e6cb; }
```
> 這條 Playwright 模擬不出鏡頭挖孔——**一定要有挖孔的實機按 ⛶ 進全螢幕**再確認;若還有黑邊,改用
> `padding: env(safe-area-inset-*)` 把內容推離安全區。

### 6) 暫停鈕(嵌入時引擎自己的暫停鈕被藏掉)
嵌入模式通常注入空殼 UI(NullUI),引擎的 DOM 暫停鈕不會出現。在宿主補一顆,直接呼叫引擎的 pause/resume:
```jsx
const togglePause = () => {
  const g = gameRef.current
  if (!g?.pause) return
  paused ? (g.resume(), setPaused(false)) : (g.pause(), setPaused(true))
}
// 只在 started 後顯示;引擎的 pause()/resume() 內部呼叫 this.ui.* 在嵌入下是 no-op,安全。
```

## 一頁套用順序

1. 宿主(React 彈窗 / 單獨玩入口)滿版用 `position:fixed; inset:0`、淺底(不要 modal 的半透明黑遮罩當動作關背景)。
2. 舞台鎖遊戲比例 + 取最大框(#1);Canvas 引擎讀 parent 尺寸就零內部留邊。
3. 開始後隱藏標題列(#2),開場 overlay 可捲動(#3)。
4. 加 ⛶(#4)+ 暫停鈕(#6);開始手勢中進全螢幕鎖橫向。
5. viewport-fit=cover + `:fullscreen` 底色(#5)。
6. **驗收**:Playwright 在 ~900×400(手機橫向)截圖——量 `canvas` 的 `width/height ≈ 遊戲比例`、佔高 ≥ ~85%、開始鈕在視口內、無 console error;**挖孔黑邊用實機再確認**(Playwright 無法模擬)。

## 活範例(hfpc-paul-game)

- `src/components/MiniGameModal.jsx`:`fill` 參數 → root 用 `.carddemo carddemo--game`(動作關)/`.carddemo`(卡片關);`started` 時加 `carddemo--playing` 隱藏標題;⛶ + 暫停鈕;`enterFullscreenLandscape`。
- `src/styles.css`:`.carddemo--game .minigame__stage`(16:9 取最大框)、`.carddemo--playing`(隱藏標題、滿版高度)、`.carddemo__fs`/`.carddemo__pause`、`:root:fullscreen` 底色、`.minigame__intro` 可捲動。
- 直掛 Demo:`SlingDemo / ElijahDemo / RedSeaDemo / ArkPairsDemo / ArkBuildDemo` —— `{(!started || result) && <hint>}` 遊玩時隱藏、乾淨關名。
- 引擎契約:約拿引擎 `renderer.js` 的 `scale = Math.min(cssW/VIEW.W, cssH/VIEW.H)` 就是 contain-fit 的根因;`VIEW = {W:960,H:540}`。

## 反面教材(別再犯)

- ❌ 把舞台改 `aspect-ratio:auto; width:100%` 想「滿版」→ 引擎在寬扁容器內部 letterbox,變「框中框」。
- ❌ 開場 overlay 置中又不可捲動 → 矮螢幕切掉開始鈕,玩家進不去(這個在 paul 重複發生過多次)。
- ❌ 以為 `viewport-fit=cover` 就不會黑 → 還要 `:fullscreen` / `::backdrop` 底色才蓋掉挖孔黑條。
- ❌ 用 cover-fit 強行填滿寬度 → 裁掉頂部 HUD(計分/血量)與底部地面,得不償失。
