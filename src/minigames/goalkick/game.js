// 射門練習(goalkick)——憫安製作休閒關(不掛經文,進大廳「憫安製作闖關合輯」)。
// ⚠ 這是休閒練習關,刻意不掛聖經經文(使用者拍板);故無 cuv/tts/送審文案這一套,只是好玩的射門小遊戲。
//
// 玩法:草地球場,球在底部中央。往後拉牧童的腳(瞄準+蓄力)放開射門,把球踢進上方球門;
//   守門員左右滑動撲救,看準空檔射!踢 10 球,進越多球星等越高。踢偏/被撲都不扣血——這是練習,
//   球撿回來再踢下一顆,永不會輸。
// ★ 手感沿用 sling/herd 的「拖曳蓄力發射」;守門員移動=時機窗(sling 引擎換皮精神,會動的靶)。
// 年齡三檔:幼(門超寬・守門員慢又小)/童(標準)/青(門窄・守門員快又大,要抓空檔)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 無朗讀(休閒關無經文)。

const VW = 960
const VH = 540
const GOALY = 150 // 球門線 y
const BALLR = 15
const SHOTS = 10

const AGES = {
  young: { label: '🐣 幼', desc: '門超寬・守門員慢', goalW: 0.6, kSpeed: 130, kHalf: 42 },
  kid: { label: '🙂 童', desc: '標準', goalW: 0.46, kSpeed: 220, kHalf: 55 },
  teen: { label: '🔥 青', desc: '門窄・守門員快', goalW: 0.36, kSpeed: 320, kHalf: 66 },
}

const T = {
  title: '⚽ 射門練習',
  sub: '憫安製作・休閒小遊戲',
  how: '球在草地上。從球往後拉、瞄準,放開就射門!守門員會左右滑動撲救——看準空檔,把球踢進門。踢 10 球,進越多越好;踢偏或被撲都沒關係,再踢一顆就是了!',
  pick: '哨聲響起,準備射門。選一種難度:',
  goal: '⚽ 進球!',
  save: '🧤 被撲救了!',
  miss: '球偏了…',
  hud: (left, goals) => `⚽ 剩 ${left} 球 ・ 已進 ${goals} 球`,
  winTitle: (g) => g >= SHOTS ? '🏆 全進!神射手!' : g >= SHOTS * 0.6 ? '🎉 好球員!' : '⚽ 練習完成!',
  teach: '一次踢不進沒關係,再來一顆——好球員都是一球一球練出來的。玩得開心最重要!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → aim ⇄ flying/result → done
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.ball = null
    this.keeper = null
    this.aim = null
    this.shotsLeft = SHOTS
    this.goals = 0
    this.resultT = 0
    this.result = ''
    this.toasts = []
    this._audio = null
  }

  boot() {
    addEventListener('keydown', this._onKeyDown)
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
    removeEventListener('keydown', this._onKeyDown)
    this.cv.removeEventListener('pointerdown', this._onDown)
    removeEventListener('pointermove', this._onMove)
    removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    try { this._audio && this._audio.close() } catch {}
  }

  _goalRange() {
    const gw = (VW - 200) * this.cfg.goalW
    return { x0: VW / 2 - gw / 2, x1: VW / 2 + gw / 2 }
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.shotsLeft = SHOTS
    this.goals = 0
    this.toasts = []
    this.result = ''
    this.keeper = { x: VW / 2, dir: 1 }
    this._resetBall()
    this.state = 'aim'
  }

  _resetBall() {
    this.ball = { x: VW / 2, y: VH - 80, vx: 0, vy: 0, flying: false }
    this.aim = null
    this.state = 'aim'
  }

  _shoot() {
    if (this.state !== 'aim' || !this.aim || this.aim.power < 0.08) { this.aim = null; return }
    const sp = 360 + this.aim.power * 640
    this.ball.vx = this.aim.dx * sp
    this.ball.vy = this.aim.dy * sp
    this.ball.flying = true
    this.aim = null
    this.state = 'flying'
    this.shotsLeft -= 1
    this._tone(280, 0.08, 0, 'sine', 0.09)
  }

  _update(dt) {
    if (this.state === 'done' || this.state === 'intro') return
    // 守門員巡邏(球門線上左右滑)
    if (this.keeper) {
      const g = this._goalRange()
      this.keeper.x += this.keeper.dir * this.cfg.kSpeed * dt
      if (this.keeper.x > g.x1 - this.cfg.kHalf) { this.keeper.x = g.x1 - this.cfg.kHalf; this.keeper.dir = -1 }
      if (this.keeper.x < g.x0 + this.cfg.kHalf) { this.keeper.x = g.x0 + this.cfg.kHalf; this.keeper.dir = 1 }
    }
    if (this.state === 'result') {
      this.resultT -= dt
      if (this.resultT <= 0) {
        if (this.shotsLeft <= 0) this._done()
        else this._resetBall()
      }
    }
    if (this.state === 'flying') {
      const b = this.ball
      b.x += b.vx * dt; b.y += b.vy * dt
      // 左右牆輕彈(草地邊)
      if (b.x < BALLR + 40) { b.x = BALLR + 40; b.vx = Math.abs(b.vx) }
      if (b.x > VW - BALLR - 40) { b.x = VW - BALLR - 40; b.vx = -Math.abs(b.vx) }
      // 到達球門線:判定
      if (b.y <= GOALY + BALLR) {
        const g = this._goalRange()
        const inGoal = b.x > g.x0 && b.x < g.x1
        const saved = inGoal && Math.abs(b.x - this.keeper.x) < this.cfg.kHalf + BALLR
        if (inGoal && !saved) { this.goals += 1; this.result = T.goal; this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(784, 0.2, 0.1, 'triangle', 0.11) }
        else if (saved) { this.result = T.save; this._tone(200, 0.16, 0, 'square', 0.07); b.vy = Math.abs(b.vy) * 0.4 }
        else { this.result = T.miss; this._tone(180, 0.12, 0, 'sine', 0.06) }
        this.toasts.push({ text: this.result, t: this._t })
        this.state = 'result'
        this.resultT = 1.1
        b.flying = false
      }
      // 保險:飛出頂端沒判到也收尾
      if (b.y < -40) { this.result = T.miss; this.state = 'result'; this.resultT = 1.1; b.flying = false }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.6)
  }

  _done() {
    this.state = 'done'
    this.stars = this.goals >= SHOTS * 0.8 ? 3 : this.goals >= SHOTS * 0.5 ? 2 : 1
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: Math.round((this.goals / SHOTS) * 100), level: 'goalkick' }) }, 800)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
    }
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * this.W
    const py = ((e.clientY - r.top) / r.height) * this.H
    const { s, ox, oy } = this._view()
    return { x: (px - ox) / s, y: (py - oy) / s }
  }
  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state === 'aim' && Math.hypot(x - this.ball.x, y - this.ball.y) < BALLR * 5) this.aim = { dx: 0, dy: -1, power: 0 }
  }
  _movePt(e) {
    if (!this.aim || this.state !== 'aim') return
    const { x, y } = this._pt(e)
    const dx = this.ball.x - x, dy = this.ball.y - y
    const d = Math.hypot(dx, dy)
    if (d < 4) { this.aim.power = 0; return }
    // 只能往上半場射(dy 需為負=往球門方向)
    this.aim.dx = dx / d; this.aim.dy = Math.min(-0.25, dy / d)
    const n = Math.hypot(this.aim.dx, this.aim.dy)
    this.aim.dx /= n; this.aim.dy /= n
    this.aim.power = Math.min(1, d / 230)
  }
  _up() {
    if (this.state === 'aim' && this.aim) this._shoot()
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

  _view() {
    const s = Math.min(this.W / VW, this.H / VH)
    return { s, ox: (this.W - VW * s) / 2, oy: (this.H - VH * s) / 2 }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    ctx.fillStyle = '#5a8a3a'
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    // 草地條紋
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#6a9a44' : '#628e3e'
      ctx.fillRect(0, GOALY + i * (VH - GOALY) / 8, VW, (VH - GOALY) / 8)
    }
    // 罰球弧
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(VW / 2, GOALY + 90, 90, 0.15, Math.PI - 0.15); ctx.stroke()
    // 球門(門柱+橫樑+網)
    const g = this._goalRange()
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.fillRect(g.x0, GOALY - 60, g.x1 - g.x0, 60) // 網面
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
    for (let x = g.x0; x <= g.x1; x += 16) { ctx.beginPath(); ctx.moveTo(x, GOALY - 60); ctx.lineTo(x, GOALY); ctx.stroke() }
    for (let y = GOALY - 60; y <= GOALY; y += 16) { ctx.beginPath(); ctx.moveTo(g.x0, y); ctx.lineTo(g.x1, y); ctx.stroke() }
    ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 7; ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(g.x0, GOALY); ctx.lineTo(g.x0, GOALY - 60); ctx.lineTo(g.x1, GOALY - 60); ctx.lineTo(g.x1, GOALY)
    ctx.stroke()
    // 守門員
    if (this.keeper) this._keeper(this.keeper.x, GOALY)
    // 球
    this._soccer(this.ball.x, this.ball.y)
    // 牧童的腳(球後,提示從這拉)
    if (this.state === 'aim') {
      ctx.fillStyle = '#c98a5a'
      ctx.beginPath(); ctx.ellipse(this.ball.x, this.ball.y + BALLR + 12, 14, 9, 0, 0, 7); ctx.fill()
    }
    // 瞄準線+力道環
    if (this.aim && this.aim.power > 0.02) {
      const len = 50 + this.aim.power * 170
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.setLineDash([9, 9])
      ctx.beginPath(); ctx.moveTo(this.ball.x, this.ball.y)
      ctx.lineTo(this.ball.x + this.aim.dx * len, this.ball.y + this.aim.dy * len); ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = this.aim.power > 0.85 ? '#e05040' : '#ffe070'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, BALLR + 8, -Math.PI / 2, -Math.PI / 2 + this.aim.power * Math.PI * 2); ctx.stroke()
    }
    // 漂浮字(進球/撲救/偏)
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.6
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,40,10,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${28 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.42 - k * 24)
      ctx.fillText(t.text, VW / 2, VH * 0.42 - k * 24)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(20,40,10,0.6)'
    rG(ctx, VW * 0.2, VH - 44, VW * 0.6, 30, 12); ctx.fill()
    ctx.fillStyle = '#eef8e2'
    ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.shotsLeft, this.goals)} ・ 拖球瞄準,放開射門`, VW / 2, VH - 24)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  _soccer(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x, y, BALLR, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath(); ctx.arc(x, y, BALLR * 0.32, 0, 7); ctx.fill()
    for (let i = 0; i < 5; i++) {
      const a = this._t * 0.5 + (i / 5) * 6.28
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * BALLR * 0.62, y + Math.sin(a) * BALLR * 0.62, BALLR * 0.16, 0, 7); ctx.fill()
    }
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x, y, BALLR, 0, 7); ctx.stroke()
  }

  _keeper(x, y) {
    const { ctx } = this
    // 身體(彩色球衣)+ 張開的手
    ctx.fillStyle = '#e0a030'
    ctx.fillRect(x - 13, y - 34, 26, 30)
    ctx.strokeStyle = '#e0a030'; ctx.lineWidth = 8; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x - 13, y - 28); ctx.lineTo(x - 30, y - 40); ctx.moveTo(x + 13, y - 28); ctx.lineTo(x + 30, y - 40); ctx.stroke() // 手臂張開
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, y - 42, 9, 0, 7); ctx.fill() // 頭
    ctx.fillStyle = '#3a6a3a'
    ctx.fillRect(x - 11, y - 6, 22, 8) // 短褲
    // 手套
    ctx.fillStyle = '#3050a0'
    ctx.beginPath(); ctx.arc(x - 31, y - 41, 5, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 31, y - 41, 5, 0, 7); ctx.fill()
  }

  _drawIntro() {
    const { ctx } = this
    cardG(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88, 18)
    ctx.fillStyle = 'rgba(246,252,240,0.96)'; ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 3
    rG(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c5a1c'
    ctx.font = 'bold 38px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.19)
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.26)
    ctx.fillStyle = '#2e3c22'
    wrapG(ctx, T.how, VW / 2, VH * 0.36, VW * 0.66, 25)
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.63)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.14, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.7
      ctx.fillStyle = '#6aa040'
      rG(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#12280c'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.42)
      ctx.font = '13px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.78)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawDone() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.12, y = H * 0.1, w = W * 0.76, h = H * 0.8
    ctx.fillStyle = '#f4faf0'
    ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 3
    rG(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c5a1c'
    ctx.font = `bold ${Math.max(22, H * 0.06)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle(this.goals), W / 2, H * 0.3)
    ctx.font = `${Math.max(26, H * 0.08)}px "Noto Sans TC",sans-serif`
    ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.45)
    ctx.fillStyle = '#3a5a2a'
    ctx.font = `bold ${Math.max(18, H * 0.05)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`10 球進了 ${this.goals} 球!`, W / 2, H * 0.58)
    ctx.fillStyle = '#2e3c22'
    ctx.font = `${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    wrapG(ctx, T.teach, W / 2, H * 0.66, w * 0.82, H * 0.045)
    ctx.restore()
  }
}

function rG(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardG(ctx, x, y, w, h, r) { ctx.fillStyle = 'rgba(246,252,240,0.96)'; ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 3; rG(ctx, x, y, w, h, r) }
function wrapG(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
