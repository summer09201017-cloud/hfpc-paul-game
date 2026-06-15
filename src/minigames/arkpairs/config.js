// 動物公母配對（翻牌記憶）——所有可調數值集中在這裡。
// 邏輯解析度固定 960×540，renderer 量畫布父層尺寸等比縮放置中（與 sling/elijah 同一套）。
export const WORLD = { w: 960, h: 540 }

export const RULES = {
  pairs: 6, // 幾種動物（每種一公一母＝兩張牌）。可被站點/Demo 用 opts.pairs 覆寫（建議 4–8）。
  flipBackSec: 0.9, // 翻錯兩張後停留多久自動蓋回（也可點畫面快轉）
  cols: 4, // 卡片網格固定 4 欄，列數依張數自動算
}

// 左側卡片網格區（世界座標）
export const GRID = { x: 26, y: 66, w: 540, h: 452, gap: 14 }

// 右側方舟區（配對成功的動物住進房間）
export const ARK = { x: 590, y: 60, w: 346, h: 458 }

// 配色（木造方舟 + 海）
export const PALETTE = {
  skyTop: '#bfe0ef',
  skyBottom: '#e9f4dc',
  sea: '#3f7ea8',
  seaDeep: '#2e5f80',
  cardBack: '#9c6b3b', // 蓋著的牌＝方舟木板背面
  cardBackDark: '#7d5530',
  cardFace: '#fff7e8',
  cardEdge: '#b9863f',
  arkHull: '#7a4f2a',
  arkHullDark: '#5f3c1f',
  arkHouse: '#c89b5a',
  arkRoof: '#8a4b2f',
  male: '#3f7fd0', // ♂ 公（藍）
  female: '#d85f9c', // ♀ 母（粉）
  ink: '#3a2c1a',
}
