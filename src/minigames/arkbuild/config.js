// 依序放木板蓋方舟——所有可調幾何與數值集中在這裡。
// 邏輯解析度固定 960×540（與系列其他關同一套縮放/letterbox）。
export const WORLD = { w: 960, h: 540 }

// 方舟箱體幾何（世界座標）。方舟是長方形木箱（創 6:15），由下往上一排排釘起來。
export const BOX = {
  left: 300,
  right: 660,
  wallBottom: 418, // 牆最底（hull 在這條線以下）
  rows: 9, // 牆板列數（由下往上一塊一塊放）
  rowH: 26,
  hullH: 80, // 船底高
  roofApexY: 116, // 屋頂頂點 y
}
export const WALL_TOP = BOX.wallBottom - BOX.rows * BOX.rowH // 184

// 門與透光窗（創 6:16）
export const DOOR = { x: 556, y: 300, w: 64, h: BOX.wallBottom - 300 }
export const WINDOW = { x: 336, y: 206, w: 74, h: 44 }

export const RULES = {
  dropSec: 0.28, // 一塊木板從上方落到定位的動畫秒數
  totalYears: 120, // 風味用：蓋方舟「花了好多年」的年數（隨進度成長顯示）
}

export const PALETTE = {
  skyTop: '#cfe6f0',
  skyBottom: '#eaf3da',
  sea: '#4a87ad',
  seaDeep: '#315f7e',
  // 三層用三個木色（下/中/上），教「上中下三層」（創 6:16）
  deck: ['#7a4f2a', '#90602f', '#a8763c'],
  deckLine: '#4f3115',
  hull: '#5f3c1f',
  hullDark: '#43290f',
  roof: '#8a4b2f',
  roofDark: '#643318',
  doorFrame: '#4f3115',
  doorDark: '#2a1a0c',
  windowFrame: '#4f3115',
  windowGlow: '#ffe9a8',
  ghost: 'rgba(255,255,255,0.30)',
  ghostEdge: 'rgba(255,255,255,0.85)',
  ink: '#33240f',
}
