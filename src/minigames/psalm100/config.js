// 詩篇 100 讚美琴鍵(4K 下落式節奏關)——版面/難度旋鈕。
// 神學鐵則:判定線畫成「聖殿的門」——音符落到門口按對=「當稱謝進入他的門」(詩 100:4)。
export const LANES = 4

// 鍵盤:DFJK 或 方向鍵(左下上右) → 0..3;觸控:點/按住該欄。
export const KEYS = {
  KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3,
  ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3,
}

export const LANE_COLORS = ['#e8a33d', '#d94f4f', '#3b8ec4', '#57a05a']
export const LANE_KEYCAP = ['D／←', 'F／↓', 'J／↑', 'K／→']

// 年齡三檔(kid-age-modes 慣例):approach=音符從出現到判定線的秒數(越小越快)、
// window=判定窗(±秒)、holds=要不要長條音符(幼稚園把長條當單點)、speakHowto=自動唸玩法。
export const AGE = {
  kinder: {
    id: 'kinder', label: '幼稚園', emoji: '🐣', sub: '慢慢掉、按到就好,長音不用按住',
    approach: 2.4, window: 0.26, holds: false, speakHowto: true,
  },
  kids: {
    id: 'kids', label: '兒童', emoji: '🙂', sub: '標準速度,長音要按住撐到底',
    approach: 1.7, window: 0.17, holds: true, speakHowto: false,
  },
  teen: {
    id: 'teen', label: '青少年', emoji: '🔥', sub: '掉得快、判定嚴、放太早算斷,拼三星',
    approach: 1.1, window: 0.10, holds: true, speakHowto: false,
  },
}
export function getAge(id) { return AGE[id] || AGE.kids }

// 星等:依命中率(過關永遠會過——兒童營守則「不會輸」;星星是重玩誘因)
export function starsForAccuracy(acc) {
  if (acc >= 0.9) return 3
  if (acc >= 0.7) return 2
  return 1
}

// 版面(邏輯座標以 css px 計;renderer 處理 DPR)
export const LAYOUT = {
  laneMaxW: 132,      // 單欄最大寬
  lanesMaxW: 560,     // 四欄總寬上限(手機直向會再縮)
  judgeFromBottom: 0.16, // 判定線(聖殿門)離底部的比例
  noteH: 22,          // 單點音符厚度
  capH: 64,           // 上方經文字幕帶高度
}
