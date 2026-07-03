// 大衛彈琴趕憂(Guitar Hero 型節奏關,撒上 16:14-23)——版面/難度旋鈕。
// 玩法視角:琴頸由遠而近(透視琴弦高速公路),音符=琴弦上的撥點,判定線=琴橋。
// 神學:得勝不靠武力——大衛用手彈琴,掃羅便舒暢爽快,惡魔離了他(反向 RPG)。
export const LANES = 4

export const KEYS = {
  KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3,
  ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3,
}

// 四弦的顏色(暖金琴弦系,弦越低音越粗)
export const LANE_COLORS = ['#d98a3d', '#c4a24a', '#8fb05a', '#5f9ec4']
export const LANE_KEYCAP = ['D／←', 'F／↓', 'J／↑', 'K／→']

export const AGE = {
  kinder: {
    id: 'kinder', label: '幼稚園', emoji: '🐣', sub: '慢慢來、按到就好,長音不用按住',
    approach: 2.4, window: 0.26, holds: false, speakHowto: true,
  },
  kids: {
    id: 'kids', label: '兒童', emoji: '🙂', sub: '標準速度,長音要按住撐到底',
    approach: 1.7, window: 0.17, holds: true, speakHowto: false,
  },
  teen: {
    id: 'teen', label: '青少年', emoji: '🔥', sub: '快、判定嚴、放太早算斷,拼三星',
    approach: 1.1, window: 0.10, holds: true, speakHowto: false,
  },
}
export function getAge(id) { return AGE[id] || AGE.kids }

export function starsForAccuracy(acc) {
  if (acc >= 0.9) return 3
  if (acc >= 0.7) return 2
  return 1
}

// 掃羅的「愁煩」(gloom 0..1):開場 0.85(惡魔擾亂);彈準降、漏拍/斷弦升。
// ★不會輸:愁煩只影響畫面(掃羅上方的陰影濃淡),歌走完必過關——星等看命中率。
export const GLOOM = {
  start: 0.85,
  perHit: -0.022,
  perMiss: +0.05,
  perBreak: +0.05,
  min: 0, max: 1,
}

// 透視版面:琴弦高速公路(近寬遠窄的梯形)
export const VIEW = {
  nearWFrac: 0.62,  // 近端(琴橋)佔畫面寬比例
  farWFrac: 0.20,   // 遠端(琴頭)佔比
  nearYFrac: 0.80,  // 琴橋 y(佔高)
  farYFrac: 0.30,   // 琴頭 y
  ease: 1.6,        // 透視加速指數(越大越有「衝過來」感)
  noteNearR: 15,    // 撥點近端半徑
  noteFarR: 4,
  capH: 58,         // 上方字幕帶
}
