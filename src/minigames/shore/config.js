// 海邊的復興(約翰福音 21:1-19)——所有可調數值集中在這裡。零相依、可離線、守嵌入契約。
// ★主題:彼得曾在炭火旁三次「不認主」(約18:18,25-27);復活的主在炭火旁(約21:9)三次問他「你愛我嗎?」,
//   三次託付「餵養/牧養我的羊」——三次跌倒、三次接納與託付。最後「你跟從我吧!」(21:19)。
//   ⛔ 不渲染彼得殉道(21:18 只在經文,遊戲聚焦恢復與跟從)。
// 玩法:每一回合,主問「你愛我嗎?」→ 點畫面回應「我愛你」→ 一隻一隻「餵養祂的羊」(點羊餵餅);三回合完成 → 跟從主。
export const WORLD = { w: 960, h: 540 }
export const SEA_Y = 196        // 海面下緣(上面是天/海,下面是沙岸)

// 三次託付(和合本,已用 cuv MCP 逐字查驗 2026-06-28):約 21:15 / 21:16 / 21:17。
export const ROUNDS = [
  { n: 1, ref: '約翰福音 21:15', ask: '約翰的兒子西門,你愛我比這些更深嗎?', ans: '主啊,是的,你知道我愛你。', commission: '你餵養我的小羊。', flock: '小羊', lamb: true },
  { n: 2, ref: '約翰福音 21:16', ask: '約翰的兒子西門,你愛我嗎?', ans: '主啊,是的,你知道我愛你。', commission: '你牧養我的羊。', flock: '羊', lamb: false },
  { n: 3, ref: '約翰福音 21:17', ask: '西門,你愛我嗎?', ans: '主啊,你是無所不知的;你知道我愛你。', commission: '你餵養我的羊。', flock: '羊', lamb: false },
]

// 年齡旋鈕(沿用 agePrefs 跨關記憶):幼=每回合羊少+語音、青=羊多。整段可刪不傷核心。
export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '每回合羊少、會語音講解', sheep: [3, 3, 4], speakHowto: true },
  kids: { id: 'kids', label: '兒童', emoji: '🙂', sub: '一般難度（7–12 歲）', sheep: [4, 5, 6], speakHowto: false },
  teen: { id: 'teen', label: '青少年', emoji: '🧑', sub: '羊更多、要餵得更勤', sheep: [6, 7, 8], speakHowto: false },
}
export function getAgeCfg(id) {
  return AGE[id] || AGE.kids
}

export const SCRIPTURE = {
  how: '復活的主在提比哩亞海邊生了炭火,烤好了餅和魚。祂三次問彼得「你愛我嗎?」——彼得曾在炭火旁三次不認主,如今主在炭火旁三次接納、託付他。點畫面回應「我愛你」,再一隻一隻餵養祂的羊。',
  intro: { ref: '約翰福音 21:9', line: '他們上了岸,就看見那裡有炭火,上面有魚,又有餅。' },
  win: { ref: '約翰福音 21:19', line: '說了這話,就對他說:「你跟從我吧!」' },
}
