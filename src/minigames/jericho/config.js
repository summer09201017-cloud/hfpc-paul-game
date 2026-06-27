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
export const SLING = {
  x: 150,
  y: GROUND_Y - 54,
  power: 7.6,
  maxPull: 120,
  maxSpeed: 1100,
}

// 彈丸 = 號角聲/吶喊波(renderer 畫成同心聲波,非石頭)。
export const AMMO = { r: 14 }

// 耶利哥城牆:一段連續的石牆(寬基 + 牆身)+ 三個「城垛」(type:'target')。把城垛震塌 = 城牆塌陷 = 過關。
export function defaultStructure() {
  const wx = 745
  const top = GROUND_Y
  const B = (x, y, w, h, type = 'wall') => ({ x, y, w, h, type })
  return [
    B(wx, top - 26, 200, 52),          // 寬牆基
    B(wx, top - 68, 188, 34),          // 牆身(一整段;被震→城垛失去支撐而塌)
    B(wx - 62, top - 96, 36, 26, 'target'), // 城垛 左
    B(wx,      top - 96, 36, 26, 'target'), // 城垛 中
    B(wx + 62, top - 96, 36, 26, 'target'), // 城垛 右
  ]
}

// 年齡旋鈕(沿用 agePrefs 跨關記憶):幼=吶喊多+城垛好震倒+語音、青=吶喊少。整段可刪不傷核心。
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '吶喊多、城牆好震倒、會語音講解', ammo: 7, toppleAngle: 0.5, speakHowto: true },
  kids: { id: 'kids', label: '兒童', emoji: '🙂', sub: '一般難度（7–12 歲）', ammo: 5, toppleAngle: 0.7, speakHowto: false },
  teen: { id: 'teen', label: '青少年', emoji: '🧑', sub: '吶喊少、要更準', ammo: 3, toppleAngle: 0.9, speakHowto: false },
}
export function getAgeCfg(id) {
  return AGE[id] || AGE.kids
}

// 經文(和合本,已用 cuv MCP 逐字查驗 2026-06-27):書 6:2 / 6:16 / 6:20。
export const SCRIPTURE = {
  how: '百姓繞城、祭司吹角——到第七次,你大聲「呼喊」!按住往後拉蓄力,瞄準城牆放手吶喊。城牆塌陷不是靠你的力氣,是耶和華使它倒下。',
  intro: { ref: '約書亞記 6:2', line: '耶和華曉諭約書亞說:「看哪,我已經把耶利哥和耶利哥的王,並大能的勇士,都交在你手中。」' },
  shout: { ref: '約書亞記 6:16', line: '呼喊吧,因為耶和華已經把城交給你們了!' },
  win: { ref: '約書亞記 6:20', line: '百姓聽見角聲,便大聲呼喊,城牆就塌陷,百姓便上去進城,將城奪取。' },
}
