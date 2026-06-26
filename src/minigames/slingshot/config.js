// 忿怒鳥式「拖曳彈弓 + 會倒的疊磚」技術原型——所有可調數值集中在這裡。
// 零相依、可離線;手刻「簡化剛體」物理(夠像、給主日學孩子玩;非真物理引擎,見 blocks.js 說明)。
// 之後重用:① 升級大衛甩石(拖曳拉弓) ② 耶利哥城牆(發射→崩塌,框架=順服、神拆牆)。
export const WORLD = { w: 960, h: 540 }
export const GROUND_Y = 472

export const PHYS = {
  gravity: 1500, // px/s²(往下為正)
  airDrag: 0.999, // 飛行物每步輕微空氣阻力
}

// 拖曳彈弓:在彈弓附近按下→往後拉→放開發射。發射速度 = 拉的向量 × power,夾在 min/max。
export const SLING = {
  x: 150, // 彈弓 Y 形支架的 x
  y: GROUND_Y - 54, // 搭彈丸的位置(支架頂)
  power: 9.6, // 拉的距離換算成速度的倍率(滿拉約 maxPull×power≈1150,夠射到塔)
  maxPull: 120, // 最大拉距(px);超過夾住,避免太誇張
  maxSpeed: 1200, // 發射速度上限
}

// 彈丸(石頭/號角聲;耶利哥換皮時改外觀)
export const AMMO = { r: 13 }

// 疊磚世界(目標結構)。type:'wood' 一般磚、'target' 要擊倒的目標(像忿怒鳥的豬)。
// 一塊磚 = { x, y(中心), w, h, type }。預設疊一座塔(原型驗證用;耶利哥換成城牆排佈)。
export function defaultStructure() {
  const baseX = 720
  const top = GROUND_Y
  const B = (x, y, w, h, type = 'wood') => ({ x, y, w, h, type })
  return [
    // 兩根柱 + 一根橫樑 + 上面站一個目標(經典忿怒鳥起手式)
    B(baseX - 40, top - 30, 22, 60),
    B(baseX + 40, top - 30, 22, 60),
    B(baseX, top - 72, 130, 22), // 橫樑
    B(baseX, top - 96, 34, 26, 'target'), // 目標(站在樑上)
    // 旁邊再疊一小堆
    B(baseX + 120, top - 22, 40, 44),
    B(baseX + 120, top - 60, 30, 30, 'target'),
  ]
}

// 年齡旋鈕(沿用 agePrefs 跨關記憶):幼=彈丸多+目標好倒、青=彈丸少。整段可刪不傷核心。
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '彈丸多、好打倒、會語音講解', ammo: 6, toppleAngle: 0.5, speakHowto: true },
  kids: { id: 'kids', label: '兒童', emoji: '🙂', sub: '一般難度（7–12 歲）', ammo: 4, toppleAngle: 0.7, speakHowto: false },
  teen: { id: 'teen', label: '青少年', emoji: '🧑', sub: '彈丸少、要更準', ammo: 3, toppleAngle: 0.9, speakHowto: false },
}
export function getAgeCfg(id) {
  return AGE[id] || AGE.kids
}
