---
name: difficulty-knob
description: >-
  幫一個聖經闖關小遊戲加「難度旋鈕」(輕鬆/普通/挑戰) + ⭐星等評價的可重用做法——資料驅動、整段可刪、
  且絕不把「不會失敗」的關卡變成會輸。當使用者說「加難度 / 難度旋鈕 / 三難度 / 輕鬆普通挑戰 /
  星等評價 / 加重玩誘因 / 限時 / 容差調整 / 讓某關可以選難度 / arkbuild(某關)也加難度像 arkpairs」時使用。
  活範例:hfpc-paul-game 的 arkpairs(src/minigames/arkpairs/config.js 的 DIFFICULTY/getDifficulty/starsForMisses)。
  搭配 arcade-game-kit、match-pairs-minigame、collect-recover-minigame、roll-and-move-game。
---

# difficulty-knob — 難度旋鈕 + 星等評價（跨專案）

給任何一個小遊戲加「輕鬆 / 普通 / 挑戰」三檔難度 + 過關 ⭐⭐⭐ 評價。
這支 skill 把 hfpc-paul-game `arkpairs` 驗證過的做法固化成可重用菜單。

## 設計心法（先守這四條，不然會做壞）

1. **難度 = 一個「具名預設」綁一小組可調數值**，不是散落各處的 if。
   一個 `DIFFICULTY` 物件,每檔(easy/normal/hard)綁住「這關的難度由哪幾個旋鈕決定」。改難度只改這張表。
2. **難度只影響「挑戰程度 + 星等門檻」,不影響「過不過得了關」。**
   這個系列很多關是「不會失敗、答錯溫柔重試」(神施行拯救、人只管信靠)。**難度絕不能把它變成會輸**——
   難只是「星星比較難拿」「容差比較小」「時間目標比較短」,玩家永遠過得了關、永遠至少 1 星。
3. **要有「公平下限」(fair floor)。** 挑戰檔可以難,但不能「不可能」。
   例:瞄準類的容差窗別小於 ~0.10 秒;翻牌懲罰別長到沒人受得了。難度往「縮小容差/縮短目標時間」調,不要往「作弊般的速度」調。
4. **星等給重玩誘因,但永遠保底。** 依「失誤次數/用時」給 1–3 星,**0 失誤一定 3 星、再差也有 1 星**;
   門檻**隨內容量縮放**(對數越多、題越多,容忍的失誤就越多),這樣同一套門檻在 6 對和 12 對都公平。

## 資料形狀（複製這段,改數值就好）

```js
// config.js —— 難度旋鈕集中在這裡。每檔綁「這關難度由哪幾個旋鈕決定」。
export const DIFFICULTY = {
  easy:   { id: 'easy',   label: '輕鬆', flipBackSec: 1.4, missPer3: 0.75, missPer2: 1.5, secPerUnit: 9 },
  normal: { id: 'normal', label: '普通', flipBackSec: 0.9, missPer3: 0.5,  missPer2: 1.0, secPerUnit: 7 },
  hard:   { id: 'hard',   label: '挑戰', flipBackSec: 0.5, missPer3: 0.25, missPer2: 0.6, secPerUnit: 5 },
}
// 取難度;未知 id 一律回 normal(永不 crash)。
export function getDifficulty(id) {
  return DIFFICULTY[id] || DIFFICULTY.normal
}
// 依「失誤次數」給星(門檻隨內容量 unit 縮放),永遠 1..3、0 失誤=3 星。
export function starsForMisses(misses, unit, diff) {
  const d = typeof diff === 'object' && diff ? diff : getDifficulty(diff)
  if (misses <= Math.ceil(unit * d.missPer3)) return 3
  if (misses <= Math.ceil(unit * d.missPer2)) return 2
  return 1
}
```
> 旋鈕欄位**因關卡而異**——換成那一關真正能調的東西:
> - 翻牌/配對(match-pairs):`flipBackSec`(翻錯停留)、星等門檻。
> - 瞄準/拋射(projectile/sling):`hitTolDeg`(命中容差,別低於公平下限)、`sweepSpeed`。
> - 收集/耐力(collect-recover):`drainPerSec`(消耗速率)、`spawnGap`(補給間距)。
> - 跑酷(arcade):`obstacleGap`(障礙間距)、`speedMax`、`hazardCost`。
> - 一律可選加 `secPerUnit`(「神速」目標秒數/單位,純獎勵旗標,不影響過關)。

## 引擎裡怎麼接（5 步）

```js
// 1) 建構式吃 opts.difficulty
this.diff = getDifficulty(opts.difficulty)   // 預設 normal
this.misses = 0          // 失誤次數(決定星等;不會失敗)
this.elapsed = 0         // 碼錶(秒),只在實際解題的狀態累加
this.stars = 0

// 2) 用難度旋鈕取代寫死的常數
this.flipBackTimer = this.diff.flipBackSec   // ← 原本寫死的 0.9 改成讀難度

// 3) 失誤 +1（注意:失誤只扣星,不扣命、不結束）
this.misses++

// 4) 過關時算星、寫進結算卡 + onComplete
this.stars = starsForMisses(this.misses, this.unitCount, this.diff)
this.beat.stats = { stars: this.stars, secs: Math.round(this.elapsed), misses: this.misses,
                    fast: this.elapsed <= this.unitCount * this.diff.secPerUnit }
// onComplete 多帶回 { stars, secs, misses }，外層/大廳計分板可用。

// 5) HUD:遊玩時顯示「難度・⏱計時・失誤」;過關卡顯示 ⭐⭐⭐ + 用時 + 失誤(+⚡神速)。
```

## UI:難度選鈕 + 結算星等

- **單獨玩入口(Demo)**:開始前給三顆鈕(輕鬆/普通/挑戰),選好再 `new Game(canvas, { difficulty })`;
  狀態存 React `useState('normal')`。(arkpairs 的 `ArkPairsDemo` 就是這樣,和「幾對」選鈕並排。)
- **桌遊站點**:站點資料 `minigame: { engine:'xxx', difficulty:'hard', ... }`,宿主把它傳進引擎。
- **結算**:過關卡畫 `'⭐'.repeat(stars) + '☆'.repeat(3-stars)` + 「用時 N 秒・失誤 M 次」(+ 神速旗標)。

## 驗收（必跑）

純函式單測(零相依)跑星等邏輯,確認**邊界**:
```
for 每個難度 × 每個內容量 × 0..N 失誤:
  star ∈ [1,3]          // 永遠不爆界
  0 失誤 ⇒ 3 星          // 保底上限
  未知難度 ⇒ 回 normal   // 不 crash
```
零美術檔關卡再用 Playwright 手機橫向截圖看 HUD/結算卡(`.jsx` 不能 `node --check`)。

## 活範例（hfpc-paul-game · arkpairs）

`src/minigames/arkpairs/config.js`:
```js
export const DIFFICULTY = {
  easy:   { id:'easy',   label:'輕鬆', flipBackSec:1.4, missPer3:0.75, missPer2:1.5, secPerPair:9 },
  normal: { id:'normal', label:'普通', flipBackSec:0.9, missPer3:0.5,  missPer2:1.0, secPerPair:7 },
  hard:   { id:'hard',   label:'挑戰', flipBackSec:0.5, missPer3:0.25, missPer2:0.6, secPerPair:5 },
}
export const getDifficulty = (id) => DIFFICULTY[id] || DIFFICULTY.normal
export function starsForMisses(misses, pairs, diff){
  const d = typeof diff==='object'&&diff ? diff : getDifficulty(diff)
  if (misses <= Math.ceil(pairs*d.missPer3)) return 3
  if (misses <= Math.ceil(pairs*d.missPer2)) return 2
  return 1
}
```
`game.js`:翻錯 `this.misses++` + `flipBackTimer = this.diff.flipBackSec`;`_win()` 算 `stars`、塞進 `beat.stats`;
`onComplete({ won:true, score, stars, secs, misses })`。`renderer.js`:HUD「難度・⏱・翻錯」+ 過關卡 ⭐ 列。
`ArkPairsDemo.jsx`:`difficulty` 選鈕(輕鬆/普通/挑戰),傳 `new ArkPairsGame(canvas,{ pairs, difficulty })`。
> **下一個要套的**:`arkbuild`(把釘點容差 `AIM.tol`/速度 `AIM.speed` 接成 easy/normal/hard,星等改用「歪掉重來次數」當 misses)。

## 反面教材（別犯）

- ❌ 讓挑戰檔「會輸」一個原本不會失敗的關 → 破壞系列「神施行拯救、玩家只管信靠」的精神。
- ❌ 星等門檻寫死絕對值(如「≤3 次失誤=3星」)→ 6 對和 12 對不公平;要 `Math.ceil(unit * ratio)` 隨量縮放。
- ❌ 難度往「作弊速度」調而非「縮小容差」→ 變成不可能;留公平下限(瞄準窗 ≥ ~0.10s)。
- ❌ 把難度散在引擎各處 if → 改一次要追十個地方;集中成 `DIFFICULTY` 一張表。
- ❌ 未知/沒傳難度就 crash → `getDifficulty` 一律 fallback `normal`。
