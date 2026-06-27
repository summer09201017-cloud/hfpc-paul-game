// 下網得魚(收集類,路加福音 5:1-11)——所有可調數值集中在這裡。零相依、可離線、守嵌入契約。
// ★主題:整夜勞力空手 → 「依從你的話」開到水深之處下網 → 網滿魚(神使豐收)→「得人如得魚,撇下所有跟從」。
//   收集動作 = 點水面「下網」,網圈內的魚一網打盡。兩階段:phase1 淺處魚少(整夜勞力)、phase2 深處魚滿。
export const WORLD = { w: 960, h: 540 }
export const WATER_Y = 250          // 水面線(上面是天/岸、下面是水)
export const DEEP_X = 520           // 「水深之處」分界:phase2 的魚多在這條線右邊

// 網:點下去 = 下網,半徑內的魚全收。半徑隨年齡。
export const NET = { sinkMs: 260, holdMs: 220, reelMs: 320 } // 下沉/停住收魚/收網 動畫時間

// 魚:水裡左右悠游 + 上下小擺。phase1 少、phase2 滿。
export const FISH = {
  minY: WATER_Y + 40,
  maxY: WORLD.h - 36,
  speedBase: 46,
  bob: 10,
}

// 年齡旋鈕(沿用 agePrefs 跨關記憶):幼=網大+目標低+網次多+魚慢、青=網小+目標高+網次少+魚更快。
//   target 是「漁獲分數」(大魚 3 分/中 2/小 1),不是尾數;魚速另乘 speedMul(青少年魚游更快)。
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '大網・魚慢・好抓・會語音講解', netR: 96, target: 18, casts: 11, capDeep: 26, speedMul: 0.8, speakHowto: true },
  kids: { id: 'kids', label: '兒童', emoji: '🙂', sub: '一般難度（7–12 歲）', netR: 76, target: 24, casts: 9, capDeep: 26, speedMul: 1.05, speakHowto: false },
  teen: { id: 'teen', label: '青少年', emoji: '🧑', sub: '小網・魚更快・網次更少・漁獲要更多', netR: 60, target: 30, casts: 7, capDeep: 26, speedMul: 1.5, speakHowto: false },
}
export function getAgeCfg(id) {
  return AGE[id] || AGE.kids
}

export const PHASE = {
  shallowCasts: 2,    // 前幾網是「整夜勞力」(淺處、魚很少),之後耶穌叫開到水深之處
  capShallow: 3,      // phase1 水裡最多幾條魚
}

// 經文(和合本,已用 cuv MCP 逐字查驗 2026-06-27):路 5:4 / 5:5 / 5:6 / 5:10 / 5:11。
export const SCRIPTURE = {
  how: '整夜勞力卻沒打著魚。耶穌說:把船開到水深之處下網!點水面就「下網」,網圈裡的魚一網打盡。魚有大有小——大魚(金色)算的漁獲更多!依從祂的話,在水深之處撒網,把魚裝滿船。',
  intro: { ref: '路加福音 5:4', line: '「把船開到水深之處,下網打魚。」' },
  obey: { ref: '路加福音 5:5', line: '「夫子,我們整夜勞力,並沒有打著甚麼。但依從你的話,我就下網。」' },
  deep: { ref: '路加福音 5:6', line: '他們下了網,就圈住許多魚,網險些裂開。' },
  win: { ref: '路加福音 5:10', line: '耶穌對西門說:「不要怕!從今以後,你要得人了。」' },
  follow: { ref: '路加福音 5:11', line: '他們把兩隻船攏了岸,就撇下所有的,跟從了耶穌。' },
}
