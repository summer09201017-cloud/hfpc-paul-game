// 大衛甩石（簡化版）——所有可調數值集中在這裡。調手感只動這個檔。
// 邏輯解析度固定 960×540，renderer 量畫布父層尺寸等比縮放置中。
export const WORLD = { w: 960, h: 540 }

export const PHYSICS = {
  gravity: 820, // px/s²（往下為正）
  power: 820, // 固定發射速度 px/s（簡化版：力道固定，玩家只調角度）
}

// 甩石「瞄準」：角度自動上下擺動，玩家點擊／空白鍵在好角度放手。
export const AIM = {
  minDeg: 16, // 擺動最低角（接近平射）
  maxDeg: 72, // 擺動最高角（高拋）
  sweepDegPerSec: 44, // 擺動速度（度/秒）（2026-06-13：再難一點——擺速加快 36→44）
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
  forehead: { x: 790, y: 170, w: 34, h: 22 }, // 命中區（左上角 x,y + 寬高）（2026-06-13：縮小+對準弧頂提高難度）
}

export const RULES = {
  stones: 5, // 「揀了五塊光滑石子」撒上 17:40
  maxFlightSec: 5, // 單顆飛行逾時保險（不會卡住）
}
