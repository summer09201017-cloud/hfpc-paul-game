// 雅各的斑點羊(創 30:31-33;31:9)——撞球物理⑯第二個活實作(herd 換皮)+★雙欄分類進階版。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:創 30:31-33、31:9),牧者審核通過前不進大廳卡。
//
// 玩法:頂視草場,上方「兩個」羊欄——左=拉班的欄(純白的),右=雅各的欄(有點的、有斑的,和黑色的,創 30:32)。
//   拖曳牧羊犬🐕瞄準蓄力,把每一隻羊撞進「牠該去的那一欄」;走錯欄=牧人輕輕帶回,再試就好。
// ★ 系列撞球第一次有「分對邊」的策略:同一桿要想清楚推誰、往哪推。
// ★ 神學守法:①進欄=歸位安歇(非落袋消失);②走錯欄不懲罰(牧人溫柔帶回);③無桿數/時間限制,永不會輸;
//   ④信息兩層:分得清清楚楚=雅各的誠實(「這樣便可證出我的公義來」創 30:33);
//     而羊群加增歸誰=神的賞賜(「神把你們父親的牲畜奪來賜給我了」創 31:9)——不是雅各聰明,是神眷顧。
// 年齡三檔:幼(4 隻・欄門寬・草地黏)/童(6 隻・標準)/青(8 隻・欄門窄・草地滑)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;創 31:9 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const VW = 960
const VH = 540
const MARGIN = 56
const TOPLINE = 150 // 欄杆線(以上=欄內)
const R = 19
const MAXSPEED = 900

const AGES = {
  young: { label: '🐣 幼', desc: '4 隻・欄門寬・草地黏', sheep: 4, gate: 0.3, drag: 2.0 },
  kid: { label: '🙂 童', desc: '6 隻・標準', sheep: 6, gate: 0.22, drag: 1.35 },
  teen: { label: '🔥 青', desc: '8 隻・欄門窄・草地滑', sheep: 8, gate: 0.16, drag: 0.95 },
}

const T = {
  title: '🐏 雅各的斑點羊',
  ref: '創世記 30:31-33',
  intro1: '「今天我要走遍你的羊群，把綿羊中凡有點的、有斑的，和黑色的，並山羊中凡有斑的、有點的，都挑出來…這樣便可證出我的公義來。」(創 30:32-33)',
  how: '草場上純白的羊和有點有斑的羊混在一起!拖曳牧羊犬🐕瞄準放開,把羊撞進「牠該去的那一欄」——純白的進左邊拉班的欄,有點、有斑、黑色的進右邊雅各的欄。撞錯欄沒關係,牧人會輕輕帶回來;分得清清楚楚,才顯出雅各的誠實!',
  pick: '查點羊群的日子到了。選一片草場:',
  hud: (inn, total) => `🐏 已歸欄 ${inn}/${total} ・ 純白→左欄・斑點→右欄`,
  dogBack: '牧羊犬汪汪跑回來了…',
  toLaban: '純白的——歸拉班的欄!',
  toJacob: '有點有斑的——歸雅各的欄!',
  wrongPen: '這隻該去另一邊——牧人輕輕帶回',
  winTitle: '🎉 分得清清楚楚,一隻不差!',
  winVerse: '這樣，　神把你們父親的牲畜奪來賜給我了。',
  winRef: '創世記 31:9',
  closeQuote: '這樣便可證出我的公義來。(創 30:33)',
  teach: '雅各把有點的、有斑的分得清清楚楚——查點的時候,誰也說不出他有半點不誠實(創 30:33)。但羊群後來大大加增,不是因為雅各聰明,是神眷顧被虧待的人:「神把你們父親的牲畜奪來賜給我了」。做誠實人,福分是神給的。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play(aim⇄rolling) → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.balls = [] // {x,y,vx,vy,kind:'sheep',spotted,black,color,gathered,penX,penY}
    this.dog = null
    this.aim = null
    this.moving = false
    this.strokes = 0
    this.toasts = []
    this._audio = null
  }

  boot() {
    initSpeech()
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
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  // 兩個欄門:左=拉班(純白),右=雅各(斑點/黑)
  _gates() {
    const fw = VW - MARGIN * 2
    const gw = fw * this.cfg.gate
    const lc = MARGIN + fw * 0.25, rc = MARGIN + fw * 0.75
    return {
      laban: { x0: lc - gw / 2, x1: lc + gw / 2 },
      jacob: { x0: rc - gw / 2, x1: rc + gw / 2 },
    }
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.strokes = 0
    this.toasts = []
    this.moving = false
    this.aim = null
    this.balls = []
    const n = this.cfg.sheep
    for (let i = 0; i < n; i++) {
      let x, y, ok, tries = 0
      do {
        x = MARGIN + R + Math.random() * (VW - MARGIN * 2 - R * 2)
        y = TOPLINE + 90 + Math.random() * (VH - MARGIN - TOPLINE - 120)
        ok = this.balls.every((b) => Math.hypot(b.x - x, b.y - y) > R * 2.4)
      } while (!ok && ++tries < 200)
      const spotted = i % 2 === 1 // 一半純白、一半雅各的(斑點或黑)
      const black = spotted && i % 4 === 3 // 斑點群裡摻黑羊(創 30:32 和黑色的)
      this.balls.push({
        x, y, vx: 0, vy: 0, kind: 'sheep',
        spotted, black,
        color: black ? '#4a4038' : spotted ? '#efe8d6' : '#f4f0e4',
        gathered: false,
      })
    }
    this.dog = { x: VW / 2, y: VH - MARGIN - 60, vx: 0, vy: 0, kind: 'dog' }
    this.state = 'play'
  }

  _allRest() {
    if (this.dog && (Math.abs(this.dog.vx) > 4 || Math.abs(this.dog.vy) > 4)) return false
    return this.balls.every((b) => b.gathered || (Math.abs(b.vx) < 4 && Math.abs(b.vy) < 4))
  }

  _shoot() {
    if (this.moving || !this.aim || this.aim.power < 0.06) { this.aim = null; return }
    const sp = this.aim.power * MAXSPEED
    this.dog.vx = this.aim.dx * sp
    this.dog.vy = this.aim.dy * sp
    this.aim = null
    this.moving = true
    this.strokes += 1
    this._tone(300, 0.08, 0, 'sine', 0.08)
  }

  _update(dt) {
    if (this.state !== 'play') return
    if (this.moving) {
      const active = [this.dog, ...this.balls.filter((b) => !b.gathered)]
      const maxV = Math.max(...active.map((b) => Math.hypot(b.vx, b.vy)), 1)
      const steps = Math.max(1, Math.ceil((maxV * dt) / (R * 0.5)))
      const h = dt / steps
      for (let s = 0; s < steps; s++) this._physics(h)
      const decay = Math.exp(-this.cfg.drag * dt)
      for (const b of active) { b.vx *= decay; b.vy *= decay; if (Math.hypot(b.vx, b.vy) < 4) { b.vx = 0; b.vy = 0 } }
      if (this._allRest()) { this.moving = false; if (this.balls.every((b) => b.gathered)) this._win() }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _physics(h) {
    const gates = this._gates()
    const active = [this.dog, ...this.balls.filter((b) => !b.gathered)]
    for (const b of active) { b.x += b.vx * h; b.y += b.vy * h }
    for (const b of active) {
      if (b.x < MARGIN + R) { b.x = MARGIN + R; b.vx = Math.abs(b.vx) }
      if (b.x > VW - MARGIN - R) { b.x = VW - MARGIN - R; b.vx = -Math.abs(b.vx) }
      if (b.y > VH - MARGIN - R) { b.y = VH - MARGIN - R; b.vy = -Math.abs(b.vy) }
      if (b.y < TOPLINE + R) {
        const inLaban = b.x > gates.laban.x0 && b.x < gates.laban.x1
        const inJacob = b.x > gates.jacob.x0 && b.x < gates.jacob.x1
        if (b.kind === 'dog' && (inLaban || inJacob)) {
          // 牧羊犬跑進欄門=汪汪跑回起點(不扣桿)
          b.x = VW / 2; b.y = VH - MARGIN - 60; b.vx = 0; b.vy = 0
          this.toasts.push({ text: T.dogBack, t: this._t })
          this._tone(360, 0.12, 0, 'square', 0.06)
          continue
        }
        if (b.kind === 'sheep' && (inLaban || inJacob)) {
          const correct = (inLaban && !b.spotted) || (inJacob && b.spotted)
          if (correct) {
            // 歸對欄=歸位安歇(非落袋消失)
            const g = inLaban ? gates.laban : gates.jacob
            b.gathered = true
            b.vx = 0; b.vy = 0
            b.penX = g.x0 + Math.random() * (g.x1 - g.x0)
            b.penY = TOPLINE - 34 - Math.random() * 44
            this.toasts.push({ text: b.spotted ? T.toJacob : T.toLaban, t: this._t })
            this._tone(523, 0.1, 0, 'triangle', 0.1); this._tone(659, 0.14, 0.08, 'triangle', 0.1)
          } else {
            // 走錯欄=牧人輕輕帶回(不懲罰,溫柔彈回草場)
            b.y = TOPLINE + R
            b.vy = Math.max(60, Math.abs(b.vy) * 0.5)
            b.vx *= 0.5
            this.toasts.push({ text: T.wrongPen, t: this._t })
            this._tone(240, 0.14, 0, 'sine', 0.06)
          }
          continue
        }
        // 撞欄杆反彈
        b.y = TOPLINE + R; b.vy = Math.abs(b.vy)
      }
    }
    // 圓-圓彈性碰撞(等質量)
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j]
        if (a.gathered || b.gathered) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        if (d > 0 && d < R * 2) {
          const nx = dx / d, ny = dy / d
          const overlap = R * 2 - d
          a.x -= nx * overlap / 2; a.y -= ny * overlap / 2
          b.x += nx * overlap / 2; b.y += ny * overlap / 2
          const va = a.vx * nx + a.vy * ny
          const vb = b.vx * nx + b.vy * ny
          if (vb - va < 0) {
            const diff = vb - va
            a.vx += nx * diff; a.vy += ny * diff
            b.vx -= nx * diff; b.vy -= ny * diff
            if (Math.abs(diff) > 60) this._tone(200, 0.05, 0, 'sine', 0.05)
          }
        }
      }
    }
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    this.stars = this.strokes <= this.cfg.sheep + 2 ? 3 : this.strokes <= this.cfg.sheep * 2 ? 2 : 1
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.stars === 3 ? 100 : this.stars === 2 ? 70 : 40, level: 'flock' }) }, 900)
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
    if (this.state !== 'play' || this.moving) return
    if (Math.hypot(x - this.dog.x, y - this.dog.y) < R * 4) this.aim = { dx: 0, dy: -1, power: 0 }
  }
  _movePt(e) {
    if (!this.aim || this.moving) return
    const { x, y } = this._pt(e)
    const dx = this.dog.x - x, dy = this.dog.y - y
    const d = Math.hypot(dx, dy)
    if (d < 4) { this.aim.power = 0; return }
    this.aim.dx = dx / d; this.aim.dy = dy / d
    this.aim.power = Math.min(1, d / 240)
  }
  _up() {
    if (this.state === 'play' && this.aim) this._shoot()
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
    ctx.fillStyle = '#6a8a4a'
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    const gates = this._gates()
    // 草地
    const gr = ctx.createLinearGradient(0, TOPLINE, 0, VH - MARGIN)
    gr.addColorStop(0, '#8ab060'); gr.addColorStop(1, '#7aa050')
    ctx.fillStyle = gr
    ctx.fillRect(MARGIN, TOPLINE, VW - MARGIN * 2, VH - MARGIN - TOPLINE)
    ctx.strokeStyle = 'rgba(90,130,60,0.4)'; ctx.lineWidth = 2
    for (let i = 0; i < 40; i++) {
      const gx = MARGIN + 10 + ((i * 137) % (VW - MARGIN * 2 - 20))
      const gy = TOPLINE + 20 + ((i * 91) % (VH - MARGIN - TOPLINE - 30))
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 7); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 7); ctx.stroke()
    }
    // 兩個羊欄(上方):左拉班・右雅各,中間隔一道籬
    ctx.fillStyle = '#c8b48a'
    ctx.fillRect(MARGIN, MARGIN, VW / 2 - MARGIN, TOPLINE - MARGIN)
    ctx.fillStyle = '#c0aa7e'
    ctx.fillRect(VW / 2, MARGIN, VW / 2 - MARGIN, TOPLINE - MARGIN)
    ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 6
    // 欄杆橫桿(兩個門各留缺口)
    ctx.beginPath()
    ctx.moveTo(MARGIN, TOPLINE); ctx.lineTo(gates.laban.x0, TOPLINE)
    ctx.moveTo(gates.laban.x1, TOPLINE); ctx.lineTo(gates.jacob.x0, TOPLINE)
    ctx.moveTo(gates.jacob.x1, TOPLINE); ctx.lineTo(VW - MARGIN, TOPLINE)
    ctx.stroke()
    // 中央分隔籬(直到欄頂)
    ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(VW / 2, MARGIN + 4); ctx.lineTo(VW / 2, TOPLINE); ctx.stroke()
    // 立柱
    for (let x = MARGIN; x <= VW - MARGIN + 1; x += 46) {
      if ((x > gates.laban.x0 - 20 && x < gates.laban.x1 + 20) || (x > gates.jacob.x0 - 20 && x < gates.jacob.x1 + 20)) continue
      ctx.beginPath(); ctx.moveTo(x, MARGIN + 6); ctx.lineTo(x, TOPLINE); ctx.stroke()
    }
    // 門柱標色:左白右棕斑
    ctx.strokeStyle = '#e8e4d4'; ctx.lineWidth = 7
    ctx.beginPath(); ctx.moveTo(gates.laban.x0, TOPLINE - 4); ctx.lineTo(gates.laban.x0, TOPLINE + 14); ctx.moveTo(gates.laban.x1, TOPLINE - 4); ctx.lineTo(gates.laban.x1, TOPLINE + 14); ctx.stroke()
    ctx.strokeStyle = '#8a5a30'
    ctx.beginPath(); ctx.moveTo(gates.jacob.x0, TOPLINE - 4); ctx.lineTo(gates.jacob.x0, TOPLINE + 14); ctx.moveTo(gates.jacob.x1, TOPLINE - 4); ctx.lineTo(gates.jacob.x1, TOPLINE + 14); ctx.stroke()
    ctx.fillStyle = '#3a3020'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🤍 拉班的欄・純白', MARGIN + (VW / 2 - MARGIN) / 2, MARGIN + 26)
    ctx.fillText('🟤 雅各的欄・有點有斑', VW / 2 + (VW / 2 - MARGIN) / 2, MARGIN + 26)
    // 已歸欄的羊
    for (const b of this.balls) if (b.gathered) this._sheep(b.penX, b.penY, b, true)
    // 場上的羊與犬
    for (const b of this.balls) if (!b.gathered) this._sheep(b.x, b.y, b, false)
    this._dog(this.dog.x, this.dog.y)
    // 瞄準線
    if (this.aim && this.aim.power > 0.02) {
      const len = 60 + this.aim.power * 180
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([9, 9])
      ctx.beginPath(); ctx.moveTo(this.dog.x, this.dog.y)
      ctx.lineTo(this.dog.x + this.aim.dx * len, this.dog.y + this.aim.dy * len); ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = this.aim.power > 0.85 ? '#e06040' : '#ffe090'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(this.dog.x, this.dog.y, R + 8, -Math.PI / 2, -Math.PI / 2 + this.aim.power * Math.PI * 2); ctx.stroke()
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#2a3a1a'; ctx.strokeStyle = 'rgba(250,255,245,0.9)'; ctx.lineWidth = 4
      ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.5 - k * 20)
      ctx.fillText(t.text, VW / 2, VH * 0.5 - k * 20)
      ctx.globalAlpha = 1
    }
    // HUD
    const inn = this.balls.filter((b) => b.gathered).length
    ctx.fillStyle = 'rgba(30,44,20,0.6)'
    rF(ctx, VW * 0.1, VH - MARGIN + 8, VW * 0.8, 30, 12); ctx.fill()
    ctx.fillStyle = '#eef4e2'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(inn, this.balls.length)} ・ 已揮 ${this.strokes} 桿`, VW / 2, VH - MARGIN + 29)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 一隻羊(毛球+頭;spotted=褐斑,black=黑羊;penned=安臥)
  _sheep(x, y, b, penned) {
    const { ctx } = this
    if (penned) {
      ctx.fillStyle = b.color
      ctx.beginPath(); ctx.ellipse(x, y, R * 0.9, R * 0.7, 0, 0, 7); ctx.fill()
      if (b.spotted && !b.black) this._spots(x, y, R * 0.75, 3)
      ctx.fillStyle = b.black ? '#2a241e' : '#4a3a2a'
      ctx.beginPath(); ctx.arc(x + R * 0.7, y, R * 0.36, 0, 7); ctx.fill()
      return
    }
    ctx.fillStyle = b.color
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(a) * R * 0.62, y + Math.sin(a) * R * 0.62, R * 0.4, 0, 7); ctx.fill() }
    ctx.beginPath(); ctx.arc(x, y, R * 0.68, 0, 7); ctx.fill()
    if (b.spotted && !b.black) this._spots(x, y, R * 0.85, 4)
    ctx.fillStyle = b.black ? '#2a241e' : '#4a3a2a'
    ctx.beginPath(); ctx.arc(x, y - R * 0.55, R * 0.34, 0, 7); ctx.fill()
    ctx.fillStyle = '#f4f0e8'
    ctx.beginPath(); ctx.arc(x - R * 0.1, y - R * 0.6, R * 0.06, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + R * 0.1, y - R * 0.6, R * 0.06, 0, 7); ctx.fill()
  }

  // 褐色斑點(位置以座標定值,不閃爍)
  _spots(x, y, rr, n) {
    const { ctx } = this
    ctx.fillStyle = '#8a6034'
    for (let i = 0; i < n; i++) {
      const a = ((x + y) * 0.13 + i * 2.4) % 6.28
      const d = rr * (0.3 + ((i * 53) % 40) / 100)
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr * 0.22, 0, 7); ctx.fill()
    }
  }

  _dog(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#8a6a44'
    ctx.beginPath(); ctx.ellipse(x, y, R * 0.95, R * 0.78, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#6a4e30'
    ctx.beginPath(); ctx.arc(x, y - R * 0.5, R * 0.5, 0, 7); ctx.fill()
    ctx.fillStyle = '#4a3620'
    ctx.beginPath(); ctx.ellipse(x - R * 0.42, y - R * 0.7, R * 0.2, R * 0.32, -0.4, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(x + R * 0.42, y - R * 0.7, R * 0.2, R * 0.32, 0.4, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2018'
    ctx.beginPath(); ctx.arc(x - R * 0.16, y - R * 0.55, R * 0.08, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + R * 0.16, y - R * 0.55, R * 0.08, 0, 7); ctx.fill()
    ctx.fillStyle = '#1a140e'
    ctx.beginPath(); ctx.arc(x, y - R * 0.36, R * 0.1, 0, 7); ctx.fill()
  }

  _drawIntro() {
    const { ctx } = this
    cardF(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a24'
    ctx.font = 'bold 34px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.16)
    ctx.fillStyle = '#5a7a52'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 證出我的公義來', VW / 2, VH * 0.23)
    ctx.fillStyle = '#2e3c26'
    wrapF(ctx, T.intro1, VW / 2, VH * 0.3, VW * 0.68, 23)
    wrapF(ctx, T.how, VW / 2, VH * 0.49, VW * 0.68, 23)
    ctx.fillStyle = '#5a7a52'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.7)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.75
      ctx.fillStyle = '#7ab060'
      rF(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#12280c'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.42)
      ctx.font = '13px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.78)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWinCard() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.1, y = H * 0.07, w = W * 0.8, h = H * 0.86
    ctx.fillStyle = '#f4faf0' // 全不透明
    ctx.strokeStyle = '#7aa060'; ctx.lineWidth = 3
    rF(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a24'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.16)
    ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.27)
    ctx.fillStyle = '#5a7a52'
    ctx.font = `${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`${this.balls.length} 隻羊各歸各欄 ・ 共揮 ${this.strokes} 桿 ・ ${T.closeQuote}`, W / 2, H * 0.34)
    ctx.fillStyle = '#2e3c26'
    wrapF(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.43, W * 0.66, H * 0.045)
    ctx.fillStyle = '#2e3c26'
    wrapF(ctx, T.teach, W / 2, H * 0.58, W * 0.66, H * 0.042)
    ctx.restore()
  }
}

function rF(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardF(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,252,240,0.96)'
  ctx.strokeStyle = '#7aa060'; ctx.lineWidth = 3
  rF(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapF(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
