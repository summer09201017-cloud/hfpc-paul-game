// 動物公母配對的內容（創世記 6–7）。非程式者可改這裡的文字與動物。
// 規則：每種動物一公一母兩張牌；翻到「同一種」即配對成功，住進方舟房間。
// 配對成功＝同種（系統保證同種剛好一公一母），藉此教「一公一母」（創 7:9）。

// 動物池：每局從中隨機抽 RULES.pairs 種。emoji = 零美術、可離線、跨專案可重用。
// 池子夠大（>20 種）才能支援 10、12 對以上又每局換不同動物。
export const ANIMALS = [
  { id: 'lion', emoji: '🦁', name: '獅子' },
  { id: 'elephant', emoji: '🐘', name: '大象' },
  { id: 'giraffe', emoji: '🦒', name: '長頸鹿' },
  { id: 'zebra', emoji: '🦓', name: '斑馬' },
  { id: 'sheep', emoji: '🐑', name: '綿羊' },
  { id: 'rabbit', emoji: '🐰', name: '兔子' },
  { id: 'penguin', emoji: '🐧', name: '企鵝' },
  { id: 'turtle', emoji: '🐢', name: '烏龜' },
  { id: 'owl', emoji: '🦉', name: '貓頭鷹' },
  { id: 'cow', emoji: '🐄', name: '牛' },
  { id: 'dog', emoji: '🐶', name: '狗' },
  { id: 'cat', emoji: '🐱', name: '貓' },
  { id: 'pig', emoji: '🐷', name: '豬' },
  { id: 'chicken', emoji: '🐔', name: '雞' },
  { id: 'fox', emoji: '🦊', name: '狐狸' },
  { id: 'bear', emoji: '🐻', name: '熊' },
  { id: 'panda', emoji: '🐼', name: '貓熊' },
  { id: 'deer', emoji: '🦌', name: '鹿' },
  { id: 'monkey', emoji: '🐵', name: '猴子' },
  { id: 'frog', emoji: '🐸', name: '青蛙' },
  { id: 'horse', emoji: '🐴', name: '馬' },
  { id: 'tiger', emoji: '🐯', name: '老虎' },
  { id: 'mouse', emoji: '🐭', name: '老鼠' },
  { id: 'chick', emoji: '🐥', name: '小雞' },
]

export const CONTENT = {
  title: '🐘 一公一母進方舟',
  how: '神叫動物自己成對來到方舟。翻開兩張牌，找出「同一種」的一公♂一母♀，牠們就手牽手住進方舟的房間。把所有動物都送進方舟就過關！',
  intro: {
    kicker: '🌧️ 洪水要來了，動物快上方舟',
    ref: '創世記 6:19–20',
    line: '凡有血肉的活物，每樣兩個，一公一母，你要帶進方舟……每樣兩個，要到你那裡，好保全生命。',
    teach: '注意：是神「叫」動物自己來，不是挪亞滿山去抓。我們的本分是順服、預備好方舟；保全生命的是神。',
    cont: '點畫面　開始配對',
  },
  // 每配對成功一對，輪流給一句鼓勵（正向、不責備）
  matchLines: [
    '一公一母，手牽手住進房間了 🏠',
    '神看顧每一種活物，一個都不少。',
    '又一對平安上船——方舟裡愈來愈熱鬧了。',
    '牠們自己來的，因為神吩咐了。',
    '保全生命的是神，挪亞只管照著行。',
    '方舟一間一間，正好住下每一對。',
  ],
  // 翻錯（不是同一種）：鼓勵再試，不失敗
  miss: [
    '這兩張不是同一種動物，再記一記位置，翻翻看別張。',
    '差一點～記住剛剛翻到什麼，再試一次。',
    '沒關係，慢慢找，神不急，方舟還在等。',
  ],
  win: {
    kicker: '🌈 全部動物都進方舟了',
    ref: '創世記 7:9',
    line: '都是一對一對地，有公有母，到挪亞那裡，進入方舟，正如神所吩咐挪亞的。',
    teach: '「正如神所吩咐挪亞的」——挪亞的功課不是力氣，是順服。動物是神領來的，得救也是神的恩典。',
    cont: '點畫面　完成挑戰',
  },
}
