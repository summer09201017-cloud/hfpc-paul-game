// 掃羅擲槍・大衛閃避（撒上 18–19）——所有可調數值集中在這裡。調手感只動這個檔。
// 機制 = 閃避(dodge):大衛在下方彈琴、可左右移動;掃羅在上方擲槍,槍落下前有「預警」,
//        躲開撐過 N 支槍就過關。反向 RPG:大衛全程不還手(撒上 24/26)。
// 邏輯解析度固定 960×540,renderer 量畫布父層尺寸等比縮放置中(同甩石)。
export const WORLD = { w: 960, h: 540 }

export const SAUL = { x: 480, y: 132 } // 擲槍者(在上方寶座前)
export const HARP_Y = 446 // 大衛彈琴的水平線(命中判定發生在這條線附近)
export const LANE = { minX: 132, maxX: 828 } // 大衛可左右移動的範圍
export const DAVID = { y: HARP_Y, halfW: 26, startX: 480 } // halfW=命中區半寬(越大越難躲)
export const SPEAR = { halfW: 7, len: 76, hitBandY: 30 } // 槍身半寬 / 長度 / 命中判定帶(在 HARP_Y 上下)

export const RULES = { maxSec: 120 } // 單局逾時保險

// 年齡旋鈕(幼稚園/兒童/青少年),同甩石的 kid-age-modes 精神。一個年齡檔綁:
//   telegraphSec 預警秒數(越久越好躲) · speedY 槍落下速度 · simultaneous 同時最多幾支在空中
//   moveSpeed 大衛橫移速度(px/s) · throwsToWin 要躲過幾支才過關 · maxHits 最多被打中幾次(超過=溫柔結束)
//   speakHowto 幼稚園自動語音講玩法 · timed 青少年計時 · feint 假動作(預警處與真正落點不同,逼你看到最後)
//   spawnGap 兩支槍之間的最短間隔(秒)
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '不識字也能玩｜槍很慢、預警久、幾乎不會輸、自動語音',
            telegraphSec: 1.5, speedY: 280, simultaneous: 1, moveSpeed: 540, throwsToWin: 5, maxHits: 99, spawnGap: 1.5, speakHowto: true, timed: false, feint: false },
  kids:   { id: 'kids',   label: '兒童',   emoji: '🙂', sub: '一般玩法（7–12 歲）｜槍變快、預警短一點',
            telegraphSec: 0.9, speedY: 440, simultaneous: 1, moveSpeed: 580, throwsToWin: 7, maxHits: 3, spawnGap: 1.0, speakHowto: false, timed: false, feint: false },
  teen:   { id: 'teen',   label: '青少年', emoji: '🧑', sub: '挑戰｜雙槍齊發＋假動作＋計時,預警最短',
            telegraphSec: 0.55, speedY: 620, simultaneous: 2, moveSpeed: 640, throwsToWin: 9, maxHits: 2, spawnGap: 0.75, speakHowto: false, timed: true, feint: true },
}
export function getAge(id) {
  return AGE[id] || AGE.kids
}
// 青少年計時挑戰:撐完越快、星越多(純獎勵,不影響過關;非青少年回 0)。
export function survivalStars(sec, age) {
  const a = typeof age === 'object' && age ? age : getAge(age)
  if (!a.timed) return 0
  if (sec <= 14) return 3
  if (sec <= 22) return 2
  return 1
}
