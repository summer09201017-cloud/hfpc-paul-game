// 大衛甩石（簡化版）——所有可調數值集中在這裡。調手感只動這個檔。
// 邏輯解析度固定 960×540，renderer 量畫布父層尺寸等比縮放置中。
export const WORLD = { w: 960, h: 540 }

export const PHYSICS = {
  gravity: 820, // px/s²（往下為正）
  power: 820, // 固定發射速度 px/s（簡化版：力道固定，玩家只調角度）
}

// 甩石「瞄準」：角度自動上下擺動，玩家點擊／空白鍵在好角度放手。
export const AIM = {
  minDeg: 0, // 擺動最低角（全平射）（2026-06-14：牧者要求由 16→0）
  maxDeg: 90, // 擺動最高角（垂直上拋）（2026-06-14：牧者要求由 72→90）
  sweepDegPerSec: 44, // 擺動速度（度/秒）。註：別再加快——容錯窗已近 0.10s 公平下限；要更難請縮小命中區。
}

export const GROUND_Y = 472 // 地面（石頭落到這條線算落空）

// 大衛發射點（甩石脫手的位置）。
export const DAVID = { x: 168, y: 360 }

// 歌利亞與「額頭」命中區（撒上 17:49 擊中額上）。命中這個矩形＝勝。
// 寬鬆一點讓小孩 5 顆內打得到；要更難就把 w/h 改小。
export const GOLIATH = {
  x: 806, // 站立中心
  topY: 150, // 頭頂
  groundY: GROUND_Y,
  forehead: { x: 790, y: 170, w: 33, h: 22 }, // 命中區（左上角 x,y + 寬高）（2026-06-14：寬 34→33 微縮加難。命中發生在上緣 y=170，故只縮寬度、保留高度；維持 ≥0.10s 公平下限）
}

export const RULES = {
  stones: 3, // 遊戲給 3 次機會加難（撒上 17:40 大衛揀了五塊石子——經文原文不改，玩法給 3 顆）（2026-06-14：牧者要求 5→3）
  maxFlightSec: 5, // 單顆飛行逾時保險（不會卡住）
}

// 年齡旋鈕（試點：回應兒主老師「太簡單只適合幼兒、不識字孩子不會玩」的回饋）。
// 一個年齡檔綁四件事——① sweepDegPerSec＝瞄準擺速（越慢越好放手）② forehead＝命中區（越大越好打，null=用 GOLIATH 預設）
//   ③ stones＝石子數（越多越不會輸）④ speakHowto＝是否自動語音朗讀玩法（幼稚園不識字預設開）⑤ timed＝青少年計時挑戰。
// 可被站點/Demo 用 opts.age 覆寫（'kinder'|'kids'|'teen'，預設 kids）。命中區中心固定在額頭(≈806,181)，只改大小。
// motion＝歌利亞的動作（增加難度：會動的靶）。null＝站著不動。
//   sway＝左右前後移動振幅(px)/速度；jump＝週期性上下跳；crouch＝週期性蹲下(端下，頭部下沉躲開)。
//   命中區(forehead)會跟著動作一起移動，所以「越大的年齡＝靶越會動＋命中區越小」。
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '不識字也能玩｜大目標、站著不動、自動語音講解', sweepDegPerSec: 28, forehead: { x: 771, y: 156, w: 70, h: 50 }, stones: 6, speakHowto: true,  timed: false, motion: null },
  kids:   { id: 'kids',   label: '兒童',   emoji: '🙂', sub: '一般玩法（7–12 歲）｜敵人會左右移動',       sweepDegPerSec: 44, forehead: { x: 792, y: 172, w: 28, h: 18 }, stones: 3, speakHowto: false, timed: false,
            motion: { swayAmp: 26, swaySpeed: 1.1, jump: null, crouch: null } },
  teen:   { id: 'teen',   label: '青少年', emoji: '🧑', sub: '挑戰｜左右移動＋跳＋蹲、命中區最小、計時搶快', sweepDegPerSec: 64, forehead: { x: 796, y: 174, w: 20, h: 13 }, stones: 3, speakHowto: false, timed: true,
            motion: { swayAmp: 50, swaySpeed: 1.7, jump: { h: 46, everySec: 2.6, durSec: 0.7 }, crouch: { drop: 30, everySec: 3.6, durSec: 0.85 } } },
}
export function getAge(id) {
  return AGE[id] || AGE.kids
}
// 青少年計時挑戰：命中越快、星越多（純獎勵，不影響過關；非青少年回 0=不計）。
export function speedStars(sec, age) {
  const a = typeof age === 'object' && age ? age : getAge(age)
  if (!a.timed) return 0
  if (sec <= 6) return 3
  if (sec <= 12) return 2
  return 1
}
