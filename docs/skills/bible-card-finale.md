---
name: bible-card-finale
description: >-
  做一個「L6 手繪 Canvas 五幕反思終局關」——用純 React 卡片流程 + 逐幕手繪場景(零美術檔、無 emoji 小劇場、
  不會失敗、答錯溫柔重試)收尾一卷聖經書/一條旅程。當使用者說「做反思終局關 / 五幕反思 / 卡片終局 /
  某書卷的結局關 / danielFinale exodusFinale 那種 / 把某故事做成手繪卡片關 / 彩虹之約那種五幕 /
  終點站的反思」時使用。活範例:hfpc-paul-game 的 noahCovenant(彩虹之約)、danielFinale(神掌權)、
  exodusFinale(會幕榮光)。搭配 card-canvas-scenes(場景畫法)、card-flow-minigame(卡片引擎)、
  bible-journey-planner(整卷設計)、packer-theology(神學)。
---

# bible-card-finale — L6 手繪五幕反思終局關

把一卷書/一條旅程的「結局」做成**手繪 Canvas 五幕反思關**(像約拿第 6 關蓖麻樹)。
這是系列「終點站＝教學時刻」的標準收尾;**不會失敗**(答錯溫柔重試),純資料 + 純 Canvas、可離線。

## 心法(先守)

1. **一幕一個屬靈點**,五幕走完一條神學弧線(挪亞:出方舟→敬拜→恩典之約→彩虹為記→方舟預表基督)。
2. **L6 手繪、不用 emoji 小劇場**(系列鐵律)。每幕一個 `(ctx,w,h,t)` drawer,座標 `k=h/240` 等比。
3. **不會失敗**:用 `kind:'question'` 的反思題(答錯溫柔重試、不扣命)。**不要設 `lives`**——終局關要溫柔。
4. **reveal 是教學**:`reveal:{ ref, line, explain }`——和合本原文 + 一句改革宗/巴刻式的應用(查 [[packer-theology]])。
5. **指向基督**:結局關通常要把該卷的影子收到福音(挪亞方舟→唯一的門基督;會幕→神與人同住;但以理→神掌權的人子)。

## 三步做法

### 1) 寫場景 drawer(`src/minigames/cards/scenes.js`)
每幕一個函式,共用既有 helper(`person`/`drawBackdrop`/`rays`/`dove`/`flame`/`shade`/`ridge`/`lerp`/`TAU`),
需要的道具自己加小函式(如挪亞的 `arkShape`/`rainbowArcs`/`beast` 手繪動物剪影)。**動物/物件一律手繪剪影,不要 emoji**。
分組匯出 + 在 `CardScene.jsx` 的 `DRAWERS` 註冊:
```js
export const NOAH = { noahExit, noahAltar, noahPromise, noahRainbow, noahArkDoor }
// CardScene.jsx: const DRAWERS = { ...CORNELIUS, ..., ...NOAH }
```

### 2) 寫 spec(`src/minigames/cards/specs.js`,仿 danielFinale/noahCovenant)
```js
noahCovenant: {
  title: '🌈 彩虹之約 · 五幕',
  music: 'warm',              // 終局多用 warm/tender/majestic（見 cardAudio TRACKS）
  canvas: 'noahRainbow',      // 預設場景（沒指定 scene.canvas 的步驟用）
  how: '看五幕……每幕回答一個反思題（這一關不會失敗）。',
  intro: { kicker, ref, body, btn },
  steps: [ { kind:'question', kicker:'第 1 幕 · …', scene:{ canvas:'noahExit', caption:'…' },
            q, choices:[...], answer, reveal:{ ref, line, explain } }, … 共 5 ],
  done: { kicker, ref, line, body, btn },
}
// ★ 不設 lives（不會失敗）。滿分 = steps.length × 3（5 幕 = 15）。
```

### 3) 接到終點站
- 旅程站點(roll-and-move):終點站 `type:'end'` + `minigame:{ cards:'noahCovenant', winPoints, label }`。
- 單獨玩:`?demo=noahCovenant`(CardDemo 認得任何 CARD_GAMES key)。

## 驗收(必跑)

1. `node --check scenes.js specs.js`(`.jsx` 不能 check)。
2. **mock-ctx 跑每個 drawer × 多個 t** 抓 runtime 錯(常見:用到未定義常數如 `EMOJI`、grad mock):
   ```js
   const grad={addColorStop(){}}; const ctx=new Proxy({},{get(_,p){return /Gradient$/.test(p)?()=>grad:(p==='measureText'?()=>({width:8}):()=>{})},set(){return true}})
   for (const fn of Object.values(NOAH)) for (const t of [0,0.8,2,5]) fn(ctx,480,240,t)
   ```
3. `npm run validate`(journey 引用的 `cards` key 要存在)。
4. selfplay 該旅程(終點 minigame 站會被引擎注入結果,要 1200 場全結束)。
5. **dynamic-import 渲染五幕網格** + `?demo=<key>` 實機截圖(Vite dev 可 `import('/src/minigames/cards/scenes.js')`),確認手繪、無 emoji、無 console error。

## 反面教材

- ❌ 設 `lives` → 終局關變成會輸,失了「反思」的溫柔。
- ❌ 場景用 emoji(`fillText('🐘')`)→ 違反系列「卡片關一律手繪」鐵律;用手繪剪影。
- ❌ drawer 用到 scenes.js 沒定義的常數(如 arkpairs 的 `EMOJI` 字型)→ 一定先 mock-ctx 跑過。
- ❌ 文案未經牧者審就併 main(=自動部署曝光)——終局關是教導重點,務必過目。
