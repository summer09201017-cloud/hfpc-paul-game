// 動物公母配對（翻牌記憶）——所有可調數值集中在這裡。
// 邏輯解析度：高度固定 540，寬度「隨裝置長寬比變寬」(960~1340)，手機全螢幕才不留黑邊。
// renderer 量畫布父層尺寸算出 worldW、等比縮放（高度貼滿、寬度剛好＝無邊；超寬殘餘由場景色填掉）。
export const WORLD = { w: 960, h: 540, minW: 960, maxW: 1340 }

// 依容器長寬比算「邏輯世界寬度」。aspect 落在 16:9~maxW/540 之間時，scale=ch/540、ox=0 → 完全無黑邊。
export function worldWidth(cw, ch) {
  const aspect = cw > 0 && ch > 0 ? cw / ch : WORLD.w / WORLD.h
  return Math.round(Math.min(WORLD.maxW, Math.max(WORLD.minW, WORLD.h * aspect)))
}

export const RULES = {
  pairs: 8, // 幾種動物（每種一公一母＝兩張牌）。可被站點/Demo 用 opts.pairs 覆寫（建議 6–12）。
  flipBackSec: 0.9, // 翻錯兩張後停留多久自動蓋回（也可點畫面快轉）——預設值，難度會覆寫
  cols: 4, // 卡片網格固定 4 欄，列數依張數自動算
}

// 難度旋鈕：每個難度綁三件事——
//   ① flipBackSec＝翻錯懲罰時間（停留多久才蓋回；越長越好記＝越簡單）
//   ② missPer3 / missPer2＝星等門檻（每「對」可容忍的翻錯次數，乘以對數自動縮放）
//   ③ secPerPair＝「神速」目標秒數/對（純獎勵旗標，不影響過關）
// 可被站點/Demo 用 opts.difficulty 覆寫（'easy'|'normal'|'hard'，預設 normal）。
// ★ 三種難度都「不會失敗」：翻錯只扣星、計時只是碼錶，永遠至少 1 星、永遠能過關。
export const DIFFICULTY = {
  easy: { id: 'easy', label: '輕鬆', flipBackSec: 1.4, missPer3: 0.75, missPer2: 1.5, secPerPair: 9 },
  normal: { id: 'normal', label: '普通', flipBackSec: 0.9, missPer3: 0.5, missPer2: 1.0, secPerPair: 7 },
  hard: { id: 'hard', label: '挑戰', flipBackSec: 0.5, missPer3: 0.25, missPer2: 0.6, secPerPair: 5 },
}
export function getDifficulty(id) {
  return DIFFICULTY[id] || DIFFICULTY.normal
}
// 依「翻錯次數」給星（相對對數，自動隨對數縮放）；永遠至少 1 星（這關不會失敗）。
export function starsForMisses(misses, pairs, diff) {
  const d = typeof diff === 'object' && diff ? diff : getDifficulty(diff)
  if (misses <= Math.ceil(pairs * d.missPer3)) return 3
  if (misses <= Math.ceil(pairs * d.missPer2)) return 2
  return 1
}

// 左側卡片網格區（世界座標）——基準寬度（worldW=960）；變寬時 gridLayout 會加寬。
export const GRID = { x: 26, y: 66, w: 540, h: 452, gap: 14 }

// 右側方舟區（配對成功的動物住進房間）。roofH/hullH/pad/gap 供 renderer 畫殼與房間共用。
export const ARK = { x: 590, y: 60, w: 346, h: 458, roofH: 70, hullH: 86, pad: 16, gap: 10, cols: 2 }

// 依世界寬度排版：多出來的寬度大部分給卡片區（牌變大、好點），方舟固定大小貼右緣。
// renderer 畫、game 點擊命中都用這兩個函式（同一 worldW 來源），避免左右算法漂移。
export function gridLayout(worldW) {
  const extra = Math.max(0, worldW - WORLD.w)
  return { ...GRID, w: GRID.w + extra * 0.6 }
}
export function arkLayout(worldW) {
  return { ...ARK, x: worldW - ARK.w - 24 }
}

// 方舟內每個房間的矩形（世界座標），共用給 renderer（畫）與 game（點選命中測試），避免兩邊算法漂移。
// 回傳長度 = count 的陣列，索引 i 對應第 i 間房（col=i%2、row=floor(i/2)）。
export function arkRoomRects(count, ark = ARK) {
  const { x, y, h, w, roofH, hullH, pad, gap, cols } = ark
  const hx = x + 14
  const hw = w - 28
  const hy = y + roofH
  const hh = h - roofH - hullH
  const rows = Math.ceil(count / cols)
  const gridX = hx + pad
  const gridY = hy + 14
  const gw = hw - pad * 2
  const gh = hh - 26
  const cwd = (gw - (cols - 1) * gap) / cols
  const chd = (gh - (rows - 1) * gap) / rows
  const rects = []
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    rects.push({ x: gridX + col * (cwd + gap), y: gridY + row * (chd + gap), w: cwd, h: chd })
  }
  return rects
}

// 第 i 間房在 2 欄網格中的上下左右鄰居索引（用於猛獸鄰居規則）。
export function roomNeighbors(i, count) {
  const cols = ARK.cols
  const col = i % cols
  const ns = []
  if (i - cols >= 0) ns.push(i - cols) // 上
  if (i + cols < count) ns.push(i + cols) // 下
  if (col === 0 && i + 1 < count) ns.push(i + 1) // 右
  if (col === 1) ns.push(i - 1) // 左
  return ns
}

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
