// 穿戴全副軍裝(弗 6:11-17)——系列第一個「拖曳裝備/換裝」關(新類型⑧)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:弗 6:11、6:13-17),牧者審核通過前不進大廳卡。
//
// 玩法:畫面右側是六件軍裝(真理腰帶/公義護心鏡/平安福音鞋/信德籐牌/救恩頭盔/聖靈寶劍),
//   拖到左側士兵身上「正確的部位」就穿上(部位發光吸附);放錯部位溫柔彈回、唸出這件的名字提示。
//   六件全穿上=站立得住!青年檔穿完加一輪「意義配對」:逐件問「這件代表什麼?」(三選一)。
// ★ 神學守法:軍裝是「穿戴」不是「攻擊」——全程沒有敵人、沒有揮砍;寶劍=神的道(拿在手上,不揮)。
//   永不會輸:放錯只彈回重試;配對答錯溫柔再選。弗 6 是聖經自帶的裝備欄,拖曳=把經文穿在身上。
// 年齡三檔:幼(部位常亮提示+大吸附)/童(拖起才亮)/青(不亮+穿完意義配對)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;弗 6:11 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '部位會發光', hint: 'always', snap: 0.16, quiz: false },
  kid: { label: '🙂 童', desc: '拖起來才提示', hint: 'drag', snap: 0.12, quiz: false },
  teen: { label: '🔥 青', desc: '無提示+意義問答', hint: 'none', snap: 0.09, quiz: true },
}

// 六件軍裝:slot = 士兵身上的部位錨點(相對士兵中心的比例座標)
const PIECES = [
  { id: 'belt', name: '真理的帶子', icon: '🎗️', meaning: '真理', slot: { x: 0, y: 0.32 }, verse: '用真理當作帶子束腰' },
  { id: 'breastplate', name: '公義的護心鏡', icon: '🛡️', meaning: '公義', slot: { x: 0, y: 0.08 }, verse: '用公義當作護心鏡遮胸' },
  { id: 'shoes', name: '平安福音的鞋', icon: '👟', meaning: '平安的福音', slot: { x: 0, y: 0.78 }, verse: '用平安的福音當作預備走路的鞋穿在腳上' },
  { id: 'shield', name: '信德的籐牌', icon: '🛡', meaning: '信德', slot: { x: -0.42, y: 0.18 }, verse: '拿著信德當作籐牌,可以滅盡那惡者一切的火箭' },
  { id: 'helmet', name: '救恩的頭盔', icon: '⛑️', meaning: '救恩', slot: { x: 0, y: -0.52 }, verse: '戴上救恩的頭盔' },
  { id: 'sword', name: '聖靈的寶劍', icon: '🗡️', meaning: '神的道', slot: { x: 0.42, y: 0.18 }, verse: '拿著聖靈的寶劍,就是 神的道' },
]
const MEANINGS = ['真理', '公義', '平安的福音', '信德', '救恩', '神的道']

const T = {
  title: '⚔️ 穿戴全副軍裝',
  ref: '以弗所書 6:11-17',
  intro1: '「要穿戴 神所賜的全副軍裝,就能抵擋魔鬼的詭計。」(弗 6:11)',
  how: '把右邊的六件軍裝,一件一件拖到士兵身上正確的部位。放錯了沒關係,它會回去,再試一次。六件都穿上,就站立得住!',
  pick: '磨難的日子要來。選一個裝備場:',
  hud: (done) => `⚔️ 已穿戴 ${done}/6`,
  wrong: (name) => `這是${name},想想該放哪裡…`,
  worn: (name) => `${name},穿上了!`,
  quizTitle: '穿上了,還要明白——這件代表什麼?',
  quizWrong: '再想想,經文怎麼說?',
  winVerse: '要穿戴 神所賜的全副軍裝,就能抵擋魔鬼的詭計。',
  winRef: '以弗所書 6:11',
  teach: '這套軍裝沒有一件是用來追打人的——每一件都是神所賜、讓你「站立得住」的。真理、公義、福音、信德、救恩、神的道:天天穿上,就能抵擋那惡者。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → quiz(青) → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._move(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.pieces = [] // {def, worn, homeX, homeY, x, y, dragging, backT}
    this.drag = null
    this.toasts = []
    this.quizIdx = 0
    this.quizOpts = []
    this.quizFlash = 0
    this._audio = null
  }

  boot() {
    initSpeech()
    this.cv.addEventListener('pointerdown', this._onDown)
    addEventListener('pointermove', this._onMove)
    addEventListener('pointerup', this._onUp)
    addEventListener('resize', this._onResize)
    this._resize()
    let last = performance.now()
    const loop = (now) => {
      if (this.stopped) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      this._t += dt
      this._update(dt)
      this._draw()
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  destroy() {
    this.stopped = true
    cancelAnimationFrame(this._raf)
    this.cv.removeEventListener('pointerdown', this._onDown)
    removeEventListener('pointermove', this._onMove)
    removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    // 裝備架(右側直列,順序打亂)
    const order = [...PIECES].sort(() => Math.random() - 0.5)
    this.pieces = order.map((def, i) => ({ def, worn: false, rack: i, x: 0, y: 0, dragging: false, backT: 0 }))
    this._placeRack()
    this.toasts = []
    this.quizIdx = 0
    this.state = 'play'
  }

  _placeRack() {
    const g = this._layout()
    for (const p of this.pieces) {
      if (p.worn || p.dragging) continue
      p.x = g.rackX
      p.y = g.rackY0 + p.rack * g.rackGap
    }
  }

  _layout() {
    const { W, H } = this
    return {
      soldierX: W * 0.32, soldierY: H * 0.52, soldierR: Math.min(W, H) * 0.3, // 士兵中心與比例基準
      rackX: W * 0.8, rackY0: H * 0.18, rackGap: H * 0.13,
      itemR: Math.min(W, H) * 0.055,
    }
  }
  _slotPos(def, g) {
    return { x: g.soldierX + def.slot.x * g.soldierR, y: g.soldierY + def.slot.y * g.soldierR }
  }

  _update() {
    if (this.state !== 'play') return
    this._placeRack()
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
    if (this.pieces.every((p) => p.worn)) {
      if (this.cfg.quiz) { this._startQuiz() } else { this._win() }
    }
  }

  _startQuiz() {
    this.state = 'quiz'
    this.quizIdx = 0
    this._makeQuizOpts()
  }
  _makeQuizOpts() {
    const right = PIECES[this.quizIdx].meaning
    const wrongs = MEANINGS.filter((m) => m !== right).sort(() => Math.random() - 0.5).slice(0, 2)
    this.quizOpts = [right, ...wrongs].sort(() => Math.random() - 0.5)
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25, 0.15)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'armor' }) }, 900)
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * this.W, y: ((e.clientY - r.top) / r.height) * this.H }
  }

  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state === 'quiz') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._answer(b.key)
      return
    }
    if (this.state !== 'play') return
    const g = this._layout()
    for (const p of this.pieces) {
      if (p.worn) continue
      if (Math.hypot(x - p.x, y - p.y) <= g.itemR * 1.4) {
        p.dragging = true
        this.drag = p
        this._tone(520, 0.06)
        return
      }
    }
  }

  _move(e) {
    if (!this.drag) return
    const { x, y } = this._pt(e)
    this.drag.x = x
    this.drag.y = y
  }

  _up() {
    if (this.state !== 'play' || !this.drag) { this.drag = null; return }
    const p = this.drag
    this.drag = null
    p.dragging = false
    const g = this._layout()
    const slot = this._slotPos(p.def, g)
    if (Math.hypot(p.x - slot.x, p.y - slot.y) <= g.soldierR * this.cfg.snap * 2.2) {
      p.worn = true
      p.x = slot.x; p.y = slot.y
      this._tone(620, 0.12); this._tone(840, 0.16, 0.1)
      this.toasts.push({ text: T.worn(p.def.name), x: slot.x, y: slot.y, t: this._t })
    } else {
      // 溫柔彈回(直接回架上;提示名字)
      this._tone(300, 0.12)
      this.toasts.push({ text: T.wrong(p.def.name), x: p.x, y: p.y, t: this._t })
    }
  }

  _answer(opt) {
    const right = PIECES[this.quizIdx].meaning
    if (opt === right) {
      this._tone(620, 0.12); this._tone(840, 0.16, 0.1)
      this.quizIdx++
      if (this.quizIdx >= PIECES.length) return this._win()
      this._makeQuizOpts()
    } else {
      this._tone(300, 0.15)
      this.quizFlash = this._t
    }
  }

  _tone(freq, dur, delay = 0, type = 'triangle', vol = 0.14) {
    try {
      if (!this._audio) this._audio = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._audio
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = type; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
      g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + delay + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + dur + 0.03)
    } catch {}
  }

  _resize() {
    const r = this.cv.getBoundingClientRect()
    const s = Math.min(devicePixelRatio || 1, 2)
    this.cv.width = Math.round(r.width * s)
    this.cv.height = Math.round(r.height * s)
    this.W = this.cv.width; this.H = this.cv.height
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 裝備室(晨光)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#e8e2d0'); sky.addColorStop(0.6, '#d8ceb4'); sky.addColorStop(1, '#b0a284')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()
    if (this.state === 'quiz') return this._drawQuiz()

    const g = this._layout()
    // 士兵(素體,穿上的件畫在身上)
    this._drawSoldier(g)
    // 部位提示光圈
    for (const p of this.pieces) {
      if (p.worn) continue
      const show = this.cfg.hint === 'always' || (this.cfg.hint === 'drag' && p.dragging)
      if (!show) continue
      const slot = this._slotPos(p.def, g)
      const pulse = 0.5 + Math.sin(this._t * 4) * 0.25
      ctx.strokeStyle = `rgba(240,178,62,${pulse})`
      ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(slot.x, slot.y, g.soldierR * this.cfg.snap * 1.6, 0, 7); ctx.stroke()
    }
    // 裝備架
    ctx.fillStyle = 'rgba(90,70,40,0.25)'
    r8(ctx, W * 0.68, H * 0.1, W * 0.26, H * 0.82, 16); ctx.fill()
    ctx.fillStyle = '#5a4626'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('軍裝架(拖到士兵身上)', W * 0.81, H * 0.15)
    // 未穿的件(架上或拖曳中)
    for (const p of this.pieces) {
      if (p.worn) continue
      this._drawPiece(p, g, p.dragging)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#3a2e16'; ctx.strokeStyle = 'rgba(255,252,235,0.85)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, t.x, t.y - H * 0.06 - k * 22)
      ctx.fillText(t.text, t.x, t.y - H * 0.06 - k * 22)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(58,42,18,0.62)'
    r8(ctx, W * 0.2, H * 0.02, W * 0.6, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#ffeec2'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    const done = this.pieces.filter((p) => p.worn).length
    ctx.fillText(`${T.hud(done)} ・ 拖一件到正確部位`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawSoldier(g) {
    const { ctx } = this
    const cx = g.soldierX, cy = g.soldierY, R = g.soldierR
    ctx.lineCap = 'round'
    // 腿
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = R * 0.11
    ctx.beginPath(); ctx.moveTo(cx - R * 0.12, cy + R * 0.42); ctx.lineTo(cx - R * 0.16, cy + R * 0.78); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx + R * 0.12, cy + R * 0.42); ctx.lineTo(cx + R * 0.16, cy + R * 0.78); ctx.stroke()
    // 身(束腰短袍)
    ctx.fillStyle = '#a08258'
    r8(ctx, cx - R * 0.24, cy - R * 0.3, R * 0.48, R * 0.74, R * 0.1); ctx.fill()
    // 手臂(兩側微張,預備拿盾與劍)
    ctx.strokeStyle = '#a08258'; ctx.lineWidth = R * 0.1
    ctx.beginPath(); ctx.moveTo(cx - R * 0.22, cy - R * 0.18); ctx.lineTo(cx - R * 0.42, cy + R * 0.16); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx + R * 0.22, cy - R * 0.18); ctx.lineTo(cx + R * 0.42, cy + R * 0.16); ctx.stroke()
    // 手掌
    ctx.fillStyle = '#c9a06a'
    ctx.beginPath(); ctx.arc(cx - R * 0.42, cy + R * 0.18, R * 0.07, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + R * 0.42, cy + R * 0.18, R * 0.07, 0, 7); ctx.fill()
    // 頭+臉(l6 鐵則:一定要有臉)
    ctx.fillStyle = '#c9a06a'
    ctx.beginPath(); ctx.arc(cx, cy - R * 0.5, R * 0.17, 0, 7); ctx.fill()
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath(); ctx.arc(cx - R * 0.06, cy - R * 0.52, R * 0.02, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + R * 0.06, cy - R * 0.52, R * 0.02, 0, 7); ctx.fill()
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy - R * 0.46, R * 0.05, 0.2, Math.PI - 0.2); ctx.stroke() // 微笑
    // 已穿上的件畫在部位上
    for (const p of this.pieces) {
      if (!p.worn) continue
      this._drawWornPiece(p.def, g)
    }
  }

  _drawWornPiece(def, g) {
    const { ctx } = this
    const s = this._slotPos(def, g)
    const R = g.soldierR
    ctx.lineCap = 'round'
    if (def.id === 'helmet') { // 頭盔:頭上的弧盔+盔脊
      ctx.fillStyle = '#b8b0a0'
      ctx.beginPath(); ctx.arc(g.soldierX, g.soldierY - R * 0.52, R * 0.19, Math.PI, 0); ctx.fill()
      ctx.strokeStyle = '#8a8274'; ctx.lineWidth = R * 0.04
      ctx.beginPath(); ctx.moveTo(g.soldierX, g.soldierY - R * 0.71); ctx.lineTo(g.soldierX, g.soldierY - R * 0.6); ctx.stroke()
    } else if (def.id === 'breastplate') { // 護心鏡:胸前圓甲
      ctx.fillStyle = '#c0b8a4'
      r8(ctx, g.soldierX - R * 0.2, g.soldierY - R * 0.24, R * 0.4, R * 0.34, R * 0.08); ctx.fill()
      ctx.strokeStyle = '#8a8274'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(g.soldierX, g.soldierY - R * 0.07, R * 0.08, 0, 7); ctx.stroke()
    } else if (def.id === 'belt') { // 帶子:腰帶
      ctx.fillStyle = '#7a4a1b'
      r8(ctx, g.soldierX - R * 0.25, g.soldierY + R * 0.26, R * 0.5, R * 0.1, R * 0.04); ctx.fill()
      ctx.fillStyle = '#d8b04a'
      r8(ctx, g.soldierX - R * 0.05, g.soldierY + R * 0.26, R * 0.1, R * 0.1, R * 0.02); ctx.fill()
    } else if (def.id === 'shoes') { // 鞋:兩腳的鞋
      ctx.fillStyle = '#6a4626'
      r8(ctx, g.soldierX - R * 0.26, g.soldierY + R * 0.74, R * 0.2, R * 0.1, R * 0.04); ctx.fill()
      r8(ctx, g.soldierX + R * 0.06, g.soldierY + R * 0.74, R * 0.2, R * 0.1, R * 0.04); ctx.fill()
    } else if (def.id === 'shield') { // 籐牌:左手大盾
      ctx.fillStyle = '#9a7a3e'
      ctx.beginPath(); ctx.ellipse(s.x, s.y, R * 0.16, R * 0.22, 0, 0, 7); ctx.fill()
      ctx.strokeStyle = '#6a4e1e'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.ellipse(s.x, s.y, R * 0.16, R * 0.22, 0, 0, 7); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(s.x, s.y, R * 0.09, R * 0.13, 0, 0, 7); ctx.stroke()
    } else if (def.id === 'sword') { // 寶劍:右手持劍(劍尖向上,握住不揮)
      ctx.strokeStyle = '#c8c4b8'; ctx.lineWidth = R * 0.045
      ctx.beginPath(); ctx.moveTo(s.x, s.y + R * 0.05); ctx.lineTo(s.x, s.y - R * 0.3); ctx.stroke()
      ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = R * 0.05
      ctx.beginPath(); ctx.moveTo(s.x - R * 0.07, s.y + R * 0.02); ctx.lineTo(s.x + R * 0.07, s.y + R * 0.02); ctx.stroke()
    }
  }

  _drawPiece(p, g, lifted) {
    const { ctx } = this
    const r = g.itemR * (lifted ? 1.15 : 1)
    ctx.fillStyle = lifted ? '#fff6dc' : 'rgba(255,250,235,0.92)'
    ctx.strokeStyle = '#b8965a'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); ctx.stroke()
    ctx.font = `${r * 1.0}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(p.def.icon, p.x, p.y - r * 0.15)
    ctx.fillStyle = '#5a4626'
    ctx.font = `bold ${Math.max(10, r * 0.32)}px "Noto Sans TC",sans-serif`
    ctx.fillText(p.def.name, p.x, p.y + r * 0.62)
    ctx.textBaseline = 'alphabetic'
  }

  _drawQuiz() {
    const { ctx, W, H } = this
    const def = PIECES[this.quizIdx]
    card8(ctx, W * 0.1, H * 0.08, W * 0.8, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(18, H * 0.05)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.quizTitle, W / 2, H * 0.2)
    ctx.font = `${Math.max(40, H * 0.12)}px sans-serif`
    ctx.fillText(def.icon, W / 2, H * 0.38)
    ctx.fillStyle = '#4a3a20'
    ctx.font = `bold ${Math.max(16, H * 0.045)}px "Noto Sans TC",sans-serif`
    ctx.fillText(def.name, W / 2, H * 0.47)
    if (this._t - this.quizFlash < 1.2 && this.quizFlash > 0) {
      ctx.fillStyle = '#a04a2a'
      ctx.font = `${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
      ctx.fillText(T.quizWrong, W / 2, H * 0.54)
    }
    this._btns = []
    const bw = W * 0.22, bh = H * 0.11, gap = W * 0.03
    const x0 = W / 2 - bw * 1.5 - gap
    this.quizOpts.forEach((opt, i) => {
      const x = x0 + i * (bw + gap), y = H * 0.62
      ctx.fillStyle = '#f0b23e'
      r8(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(14, H * 0.035)}px "Noto Sans TC",sans-serif`
      ctx.fillText(opt, x + bw / 2, y + bh * 0.6)
      this._btns.push({ x, y, w: bw, h: bh, key: opt })
    })
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`第 ${this.quizIdx + 1} / 6 件 ・「${def.verse}」`, W / 2, H * 0.84)
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card8(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.18)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 站立得住', W / 2, H * 0.25)
    ctx.fillStyle = '#4a3a20'
    wrap8(ctx, T.intro1, W / 2, H * 0.33, W * 0.72, H * 0.046)
    wrap8(ctx, T.how, W / 2, H * 0.44, W * 0.72, H * 0.046)
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#f0b23e'
      r8(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    card8(ctx, W * 0.1, H * 0.08, W * 0.8, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 全副軍裝,站立得住!', W / 2, H * 0.2)
    ctx.fillStyle = '#4a3a20'
    wrap8(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.3, W * 0.66, H * 0.046)
    ctx.fillStyle = '#4a3a20'
    wrap8(ctx, T.teach, W / 2, H * 0.52, W * 0.66, H * 0.045)
  }
}

function r8(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card8(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,251,238,0.96)'
  ctx.strokeStyle = '#c8a35a'; ctx.lineWidth = 3
  r8(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrap8(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
