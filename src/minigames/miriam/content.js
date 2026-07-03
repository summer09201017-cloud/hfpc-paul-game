// 米利暗擊鼓——經文(和合本,2026-07-04 已用 cuv MCP lookup 出 15:20-21 逐字核對)與譜面。
// 原創節奏型(104 BPM 進行曲/慶典感),非任何版權詩歌。how/win/敘事字幕標:待牧者審核。

export const SCRIPTURE = {
  title: '米利暗擊鼓 · 得勝的讚美',
  ref: '出埃及記 15:20-21',
  how: '鼓點會從右邊滑過來。滑到鈴鼓圈的時候——紅色的,拍鼓面(F 或 J);藍色的,搖鈴(D 或 K)。用手機就直接拍畫面上的鈴鼓:拍中間=鼓、拍旁邊=鈴。跟著米利暗一起,用鼓聲歌頌耶和華!',
  intro: '過了紅海!女先知米利暗手裡拿著鼓,眾婦女也跟她出去拿鼓跳舞。',
  introRef: '出 15:20',
  winRef: '出 15:20-21',
  winText: '亞倫的姊姊，女先知米利暗，手裡拿著鼓；眾婦女也跟她出去拿鼓跳舞。米利暗應聲說：你們要歌頌耶和華，因他大大戰勝，將馬和騎馬的投在海中。',
  winHead: '你們要歌頌耶和華!',
  winBody: '得勝是耶和華的——海是他分開的,仇敵是他勝過的。米利暗和眾婦女做的,是拿起鼓來回應:把讚美歸給那位真正爭戰得勝的神。',
}

// 六段字幕:1-2 敘事(待牧者審核)、3-6 為出 15:21 逐字子句
export const PHRASES = [
  '過了紅海,眾婦女拿鼓跳舞!',
  '米利暗應聲領唱——',
  '你們要歌頌耶和華，',
  '因他大大戰勝，',
  '將馬和騎馬的投在海中。',
  '歌頌耶和華!歌頌耶和華!',
]

export const BPM = 104
const BEAT = 60 / BPM
const LEAD = 4

// 每句:[拍、型('d'=don 拍鼓 / 'k'=ka 搖鈴 / 'r'=連打段,第三欄=拍長)]
// 'r' 連打(太鼓達人的 drumroll,2026-07-04 牧師提議):藍色長條滑過判定圈的期間,
// 隨便敲(鼓或鈴都行)、敲越多次分越多——放在句與句的空檔,像隊伍間的自由歡呼。
const RHYTHM = [
  { gapAfter: 2, notes: [ // P1 起步行進
    [0, 'd'], [1, 'd'], [2, 'd'], [3, 'k'], [4, 'd'], [5, 'd'], [6, 'd'], [7, 'k'],
  ] },
  { gapAfter: 2, notes: [ // P2 加入八分音 → 句尾連打
    [0, 'd'], [0.5, 'd'], [1, 'd'], [2, 'k'], [3, 'd'], [3.5, 'd'], [4, 'd'], [5, 'k'], [6, 'd'], [7, 'k'],
    [8, 'r', 1.5],
  ] },
  { gapAfter: 2, notes: [ // P3 你們要歌頌耶和華(紅藍交錯)
    [0, 'd'], [1, 'k'], [2, 'd'], [3, 'k'], [4, 'd'], [4.5, 'd'], [5, 'd'], [6, 'k'], [7, 'k'],
  ] },
  { gapAfter: 2, notes: [ // P4 因他大大戰勝(密集鼓點)→ 句尾連打
    [0, 'd'], [0.5, 'd'], [1, 'd'], [1.5, 'd'], [2, 'k'], [3, 'd'], [3.5, 'd'], [4, 'd'], [4.5, 'd'], [5, 'k'], [6, 'd'], [7, 'k'],
    [8, 'r', 1.5],
  ] },
  { gapAfter: 2, notes: [ // P5 將馬和騎馬的投在海中
    [0, 'd'], [1, 'd'], [2, 'k'], [3, 'k'], [4, 'd'], [4.5, 'd'], [5, 'd'], [5.5, 'd'], [6, 'd'], [7, 'k'], [8, 'd'],
  ] },
  { gapAfter: 0, notes: [ // P6 大結尾(鼓聲滾奏+三連鈴+最終大連打)
    [0, 'd'], [0.5, 'd'], [1, 'd'], [1.5, 'd'], [2, 'd'], [3, 'k'],
    [4, 'd'], [4.5, 'd'], [5, 'd'], [5.5, 'd'], [6, 'd'], [6.5, 'd'], [7, 'd'],
    [8, 'k'], [8.5, 'k'], [9, 'k'],
    [10, 'r', 2.5],
  ] },
]

// 輕快旋律墊底(每 2 拍一音;C 大調五聲,慶典感)——歌照譜面播,漏打不斷
export const MELODY_LOOP = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 523.25]

export function buildChart() {
  const out = []
  let base = LEAD * BEAT
  RHYTHM.forEach((ph, pi) => {
    let phraseEnd = 0
    for (const [b, kind, durB] of ph.notes) {
      if (kind === 'r') {
        out.push({ t: base + b * BEAT, dur: (durB || 1.5) * BEAT, type: 'roll', phrase: pi })
        phraseEnd = Math.max(phraseEnd, b + (durB || 1.5))
      } else {
        out.push({ t: base + b * BEAT, type: kind === 'd' ? 'don' : 'ka', phrase: pi })
        phraseEnd = Math.max(phraseEnd, b + 1)
      }
    }
    base += phraseEnd * BEAT + ph.gapAfter * BEAT
  })
  return out
}

export const BEAT_SEC = BEAT
