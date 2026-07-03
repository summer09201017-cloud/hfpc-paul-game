// 大衛彈琴趕憂——經文(和合本,2026-07-03 已用 cuv MCP lookup 撒上 16:14-23 逐字核對)與譜面。
// 原創旋律:D 小調起(愁煩)→ 漸轉 F/C 大調色彩(舒暢)→ 尾句安穩落在 D 大調感,76 BPM。
// 非任何版權詩歌。how/win/字幕文案標:待牧者審核(字幕為敘事句,非經文;經文僅 win 朗讀逐字引用)。

export const SCRIPTURE = {
  title: '大衛彈琴 · 惡魔離了他',
  ref: '撒母耳記上 16:14-23',
  how: '琴弦上的音符會從遠處滑過來。滑到琴橋的時候,按下同一條弦的按鍵——長長的音要按住不放,撐到尾端。你彈得越穩,掃羅王的愁煩就越散開。',
  intro: '惡魔擾亂掃羅,臣僕找來了善於彈琴的大衛。',
  introRef: '撒上 16:14-18',
  winRef: '撒上 16:23',
  winText: '從　神那裡來的惡魔臨到掃羅身上的時候，大衛就拿琴，用手而彈，掃羅便舒暢爽快，惡魔離了他。',
  winHead: '掃羅便舒暢爽快!',
  winBody: '大衛沒有拿刀,只拿了琴。安慰人心、驅散黑暗的,不是武力,是從神而來的平安——琴聲所指向的,是那位真正掌權的神。',
}

// 五段敘事字幕(待牧者審核;呼應愁煩→舒暢的弧線)
export const PHRASES = [
  '王宮裡,掃羅王被愁煩壓住了……',
  '大衛拿起琴,用手輕輕地彈。',
  '琴聲一句一句,穩穩地響起。',
  '黑影漸漸退去,王的眉頭鬆開了。',
  '掃羅便舒暢爽快,惡魔離了他!',
]

const FREQ = {
  D3: 146.83, A3: 220.0,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33,
}

export const BPM = 76
const BEAT = 60 / BPM
const LEAD = 4

// 每句:[拍、時值(>=2 為長條)、音名、弦(欄)]
// P1 D小調愁煩(低回) → P2/P3 琴聲穩定(級進) → P4 轉亮(F/A/C5) → P5 安穩收尾(D 大調感)
const MELODY = [
  { gapAfter: 2, notes: [ // P1 愁煩низ低回
    [0, 1, 'D4', 1], [1, 1, 'F4', 1], [2, 1, 'E4', 0], [3, 2, 'D4', 0],
    [5, 1, 'F4', 1], [6, 1, 'G4', 2], [7, 1, 'F4', 1], [8, 2, 'E4', 0],
  ] },
  { gapAfter: 2, notes: [ // P2 琴聲響起(級進上行)
    [0, 1, 'D4', 0], [1, 1, 'E4', 1], [2, 1, 'F4', 1], [3, 1, 'G4', 2],
    [4, 1, 'A4', 3], [5, 1, 'G4', 2], [6, 1, 'F4', 1], [7, 2, 'A4', 3],
    [9, 1, 'G4', 2], [10, 2, 'F4', 1],
  ] },
  { gapAfter: 2, notes: [ // P3 穩穩地響(重複的安定音型)
    [0, 1, 'A4', 3], [1, 1, 'F4', 1], [2, 1, 'G4', 2], [3, 1, 'A4', 2],
    [4, 1, 'A4', 3], [5, 1, 'F4', 1], [6, 1, 'G4', 2], [7, 1, 'A4', 3],
    [8, 1, 'C5', 3], [9, 2, 'A4', 2],
  ] },
  { gapAfter: 2, notes: [ // P4 轉亮(高音區,黑影退去)
    [0, 1, 'C5', 3], [1, 1, 'D5', 3], [2, 1, 'C5', 2], [3, 1, 'A4', 2],
    [4, 1, 'C5', 3], [5, 1, 'A4', 2], [6, 1, 'G4', 1], [7, 2, 'A4', 2],
    [9, 1, 'G4', 1], [10, 1, 'F4', 0], [11, 2, 'G4', 1],
  ] },
  { gapAfter: 0, notes: [ // P5 安穩收尾(落回 D,如釋重負)
    [0, 1, 'A4', 3], [1, 1, 'G4', 2], [2, 1, 'F4', 1], [3, 1, 'E4', 1],
    [4, 1, 'F4', 2], [5, 1, 'E4', 1], [6, 1, 'D4', 0], [7, 1, 'A3', 0],
    [8, 3, 'D4', 1],
  ] },
]

export function buildChart(age) {
  const out = []
  let base = LEAD * BEAT
  MELODY.forEach((ph, pi) => {
    let phraseEnd = 0
    for (const [b, durB, name, lane] of ph.notes) {
      const isHold = durB >= 2 && age.holds
      out.push({
        t: base + b * BEAT,
        dur: isHold ? durB * BEAT : 0,
        durMusic: durB * BEAT,
        lane, freq: FREQ[name], phrase: pi,
      })
      phraseEnd = Math.max(phraseEnd, (b + durB) * BEAT)
    }
    base += phraseEnd + ph.gapAfter * BEAT
  })
  return out
}

export const BASS_FREQ = FREQ.D3
export const BEAT_SEC = BEAT
