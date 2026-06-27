// 耶利哥城牆(忿怒鳥式,書 6)——所有可調數值集中在這裡。零相依、手刻簡化物理(見 blocks.js)。
// ★神學鐵則:城牆不是被武力砸倒的——百姓繞城、吹角、第七天大聲「呼喊」,耶和華使城牆塌陷(書 6:20)。
//   所以玩家的「發射」= 順服的吶喊/號角聲(不是武器);過關文案把得勝歸給神(見 SCRIPTURE.win)。
export const WORLD = { w: 960, h: 540 }
export const GROUND_Y = 472

export const PHYS = {
  gravity: 1500,
  airDrag: 0.999,
}

// 「蓄力吶喊」發射器(沿用拖曳機制:按住往後拉=深吸氣蓄力,放手=大聲呼喊,號角聲飛向城牆)。
// maxSpeed 調低一點 → 要把吶喊「拋高」才打得到城牆,弧線更明顯(忿怒鳥感)。
export const SLING = {
  x: 150,
  y: GROUND_Y - 54,
  power: 7.6,
  maxPull: 120,
  maxSpeed: 1000,
}

// 彈丸 = 號角聲/吶喊波(renderer 畫成同心聲波,非石頭)。
export const AMMO = { r: 14 }

// ★過關 = 繞城七次(書 6:15「第七日…照樣繞城七次」)。每一次「有效吶喊」(吶喊聲確實打到城牆)= 繞城一次,
//   並震掉城牆「最上面一層」。七次後城牆才全塌——一發打不過關,連青少年也得繞滿七次。
export const LAYERS = 7        // 城牆層數(像堆積木,7 層高)
export const LAPS_TO_WIN = 7   // 繞城七次才過關(書 6:15)

// 耶利哥城牆:7 層堆積木式石牆(每層 4 塊磚並排,共 28 塊),最上層是城垛(type:'target',只是外觀)。
//   每次有效吶喊震掉「目前最高的一層」(整層 4 塊一起轟然倒下),層層倒下;繞城七次 = 七層全倒 = 城牆塌陷。
export function defaultStructure() {
  const cx = 715
  const courseH = 30      // 每層高
  const brickW = 56       // 每塊磚寬
  const cols = [cx - brickW * 1.5, cx - brickW * 0.5, cx + brickW * 0.5, cx + brickW * 1.5] // 一層四塊並排
  const out = []
  for (let i = 0; i < LAYERS; i++) {
    const y = GROUND_Y - courseH / 2 - i * courseH
    const isTop = i === LAYERS - 1
    for (const x of cols) {
      out.push({ x, y, w: brickW - 2, h: courseH - 2, type: isTop ? 'target' : 'wall', course: i })
    }
  }
  return out
}

// 年齡旋鈕(沿用 agePrefs 跨關記憶):三檔都要「繞城七次」才贏,差別在「容許失誤幾次」(吶喊總數 − 7)。
//   幼=多 5 次失誤、童=多 3 次、青=多 2 次(要更準)。shoutMin=這次吶喊要多大力才算「有效繞城一次」。
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '繞城 7 次・吶喊 12 次・會語音講解', ammo: 12, shoutMin: 70, toppleAngle: 0.5, speakHowto: true },
  kids: { id: 'kids', label: '兒童', emoji: '🙂', sub: '繞城 7 次・吶喊 10 次（7–12 歲）', ammo: 10, shoutMin: 100, toppleAngle: 0.7, speakHowto: false },
  teen: { id: 'teen', label: '青少年', emoji: '🧑', sub: '繞城 7 次・吶喊只有 9 次、要更準', ammo: 9, shoutMin: 140, toppleAngle: 0.9, speakHowto: false },
}
export function getAgeCfg(id) {
  return AGE[id] || AGE.kids
}

// 經文(和合本,已用 cuv MCP 逐字查驗 2026-06-27):書 6:2 / 6:15 / 6:16 / 6:20。
export const SCRIPTURE = {
  how: '百姓要一次又一次地繞城——繞一次、再繞一次……到第七次大聲「呼喊」!按住往後拉蓄力,瞄準城牆放手吶喊;每次有效吶喊震掉一層,繞城滿七次城牆才塌陷。城牆倒下不是靠你的力氣,是耶和華使它倒下。',
  intro: { ref: '約書亞記 6:2', line: '耶和華曉諭約書亞說:「看哪,我已經把耶利哥和耶利哥的王,並大能的勇士,都交在你手中。」' },
  lap: { ref: '約書亞記 6:15', line: '第七日清早,黎明的時候,他們起來,照樣繞城七次;惟獨這日把城繞了七次。' },
  shout: { ref: '約書亞記 6:16', line: '呼喊吧,因為耶和華已經把城交給你們了!' },
  win: { ref: '約書亞記 6:20', line: '百姓聽見角聲,便大聲呼喊,城牆就塌陷,百姓便上去進城,將城奪取。' },
}
