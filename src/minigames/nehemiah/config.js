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
//   telegraphSec 預警秒數(越久越好躲) · speedY 槍落下速度
//   volley 一次「齊射」幾支(★真的同時出手,不是錯開):幼1/童2/青3
//   moveSpeed 大衛橫移速度(px/s) · throwsToWin 總共要面對幾支才過關 · maxHits 最多被打中幾次
//   spawnGap 兩波齊射之間的間隔(秒) · speakHowto 幼稚園自動語音 · timed 青少年計時
//   lead 預判量 0..1:鎖定時瞄「大衛將移到的位置」而非現在位置(越大越會堵你前進方向 → 純左右擺脫不掉)
//   spreadGap 同一波齊射內每支的水平間距(px):圍住一個區域、只留空檔讓你鑽
//   diagChance 斜射機率(0=全直射) · diagMax 斜射出手點離落點的水平距離(px) · aimJitter 落點抖動(px,越小越準)
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '不識字也能玩｜一次一支、槍很慢、預警久、幾乎不會輸、自動語音',
            telegraphSec: 1.4, speedY: 320, volley: 1, moveSpeed: 560, throwsToWin: 10, maxHits: 99, spawnGap: 1.15, speakHowto: true, timed: false, lead: 0, spreadGap: 0, diagChance: 0, diagMax: 0, aimJitter: 64 },
  kids:   { id: 'kids',   label: '兒童',   emoji: '🙂', sub: '一般玩法（7–12 歲）｜兩支齊射:一支瞄你、一支堵你去向',
            telegraphSec: 0.85, speedY: 560, volley: 2, moveSpeed: 470, throwsToWin: 18, maxHits: 4, spawnGap: 1.0, speakHowto: false, timed: false, lead: 0.9, spreadGap: 120, diagChance: 0.5, diagMax: 240, aimJitter: 22 },
  teen:   { id: 'teen',   label: '青少年', emoji: '🧑', sub: '挑戰｜三槍齊射:瞄你+堵去向+堵退路,大角度斜射+計時',
            telegraphSec: 0.52, speedY: 760, volley: 3, moveSpeed: 520, throwsToWin: 30, maxHits: 3, spawnGap: 0.8, speakHowto: false, timed: true, lead: 1.0, spreadGap: 105, diagChance: 0.7, diagMax: 360, aimJitter: 12 },
}
export const SPEAR_START_Y = SAUL.y + 40 // 槍離手(開始飛)的高度
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
