// 米利暗擊鼓(太鼓達人型節奏關,出 15:20-21)——單軌雙打點。
// 玩法:音符由右向左滑到「鈴鼓」判定圈;紅=拍鼓面(咚)、藍=搖鈴(鈴鼓的鈴環)。
// 神學:過紅海後「得勝的讚美」——這是慶祝關,不會輸、不扣命(rhythm skill 選題表明載)。
export const NOTE_TYPES = { DON: 'don', KA: 'ka' } // 紅拍鼓 / 藍搖鈴

// 鍵盤:內側 F/J(↓↑)=拍鼓面(紅);外側 D/K(←→)=搖鈴(藍)——同太鼓達人慣例。
export const KEYS = {
  KeyF: 'don', KeyJ: 'don', ArrowDown: 'don', ArrowUp: 'don',
  KeyD: 'ka', KeyK: 'ka', ArrowLeft: 'ka', ArrowRight: 'ka',
}

export const COLORS = {
  don: '#d9483d', donHi: '#f2a099',
  ka: '#3d8ed9', kaHi: '#9fd0f2',
}

export const AGE = {
  kinder: {
    id: 'kinder', label: '幼稚園', emoji: '🐣', sub: '慢慢來,不分紅藍,打到就算',
    approach: 2.4, window: 0.26, anyKey: true, speakHowto: true,
  },
  kids: {
    id: 'kids', label: '兒童', emoji: '🙂', sub: '標準速度,紅拍鼓、藍搖鈴',
    approach: 1.7, window: 0.17, anyKey: false, speakHowto: false,
  },
  teen: {
    id: 'teen', label: '青少年', emoji: '🔥', sub: '快、判定嚴、紅藍分明,拼三星',
    approach: 1.1, window: 0.10, anyKey: false, speakHowto: false,
  },
}
export function getAge(id) { return AGE[id] || AGE.kids }

export function starsForAccuracy(acc) {
  if (acc >= 0.9) return 3
  if (acc >= 0.7) return 2
  return 1
}

// 「歡慶」(joy 0..1):打準升、漏拍小降——只影響畫面(眾婦女跳得多高),不會輸。
export const JOY = {
  start: 0.3,
  perHit: +0.02,
  perMiss: -0.012,
  min: 0.15, max: 1,
}

export const VIEW = {
  laneYFrac: 0.44,   // 音符軌道 y(佔高)
  judgeXFrac: 0.18,  // 判定圈 x(佔寬)
  noteR: 20,         // 音符半徑
  capH: 58,
}
