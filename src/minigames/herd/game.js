// 趕羊入圈(約 10:16;詩 23:1-3)——系列第一個「撞球物理」關(新類型⑯,撞球反向化:歸聚非落袋)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:約 10:16、詩 23:1-3),牧者審核通過前不進大廳卡。
//
// 玩法:頂視青草地(撞球檯換皮)。拖曳牧羊犬🐕瞄準+蓄力放開,撞球式把羊推向上方的羊圈閘門;
//   羊從閘門進圈=「歸聚」(不是落袋消失!牠在圈裡安歇);把所有羊都趕進圈=過關。
// ★ 撞球物理:圓-圓彈性碰撞(等質量,沿法線交換分量)+ 桌邊反彈 + 摩擦漸停;子步進防穿透。
// ★ 神學守法:①羊進圈=歸聚安歇(圈裡畫出安臥的羊,不是黑洞);②牧羊犬自己進了閘門=汪汪跑回來
//   (回到起點,不扣桿);③無桿數/時間限制,永不會輸——星等只看效率;④信息:牧人領羊、合成一群
//   (約 10:16),領到青草地可安歇的水邊(詩 23)。
// 年齡三檔:幼(3 隻・圈門寬・草地黏 羊很快停)/童(5 隻・標準)/青(7 隻・圈門窄・草地滑 要算反彈)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;約 10:16 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const VW = 960
const VH = 540
const MARGIN = 56 // 草地離畫布邊
const TOPLINE = 150 // 羊圈閘門那條線(此線以上=圈內)
const R = 19 // 羊/犬半徑
const MAXSPEED = 900 // 滿力發射速度(px/s)

const AGES = {
  young: { label: '🐣 幼', desc: '3 隻・圈門寬・草地黏', sheep: 3, gate: 0.5, drag: 2.0 },
  kid: { label: '🙂 童', desc: '5 隻・標準', sheep: 5, gate: 0.38, drag: 1.35 },
  teen: { label: '🔥 青', desc: '7 隻・圈門窄・草地滑', sheep: 7, gate: 0.28, drag: 0.95 },
}

const T = {
  title: '🐑 趕羊入圈',
  ref: '約翰福音 10:16',
  intro1: '「我另外有羊，不是這圈裡的；我必須領他們來，他們也要聽我的聲音，並且要合成一群，歸一個牧人了。」(約 10:16)',
  how: '青草地上有走散的羊。從牧羊犬🐕往後拉、瞄準,放開就衝出去,像撞球一樣把羊撞向上面的羊圈閘門——羊進了圈就安歇下來。別怕撞歪:沒有次數限制,慢慢把每一隻都領回圈裡!',
  pick: '日頭西斜,該把羊領回圈了。選一片草場:',
  hud: (inn, total) => `🐑 已歸圈 ${inn}/${total} ・ 拖曳牧羊犬瞄準,放開發射`,
  dogBack: '牧羊犬汪汪跑回來了…',
  gathered: '一隻羊回圈了!',
  winTitle: '🎉 合成一群,歸一個牧人!',
  winVerse: '我另外有羊，不是這圈裡的；我必須領他們來，他們也要聽我的聲音，並且要合成一群，歸一個牧人了。',
  winRef: '約翰福音 10:16',
  teachVerse: '耶和華是我的牧者，我必不致缺乏。他使我躺臥在青草地上，領我在可安歇的水邊。',
  teachRef: '詩篇 23:1-2',
  teach: '走散的羊自己找不到回家的路——是牧人去領牠、召牠、把牠合進羊群。你也曾像走迷的羊,好牧人卻尋見了你,領你到青草地、可安歇的水邊。歸一個牧人,真好。',
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
    this.balls = [] // {x,y,vx,vy,kind:'sheep'|'dog',color,gathered,penX,penY}
    this.dog = null
    this.aim = null // {dx,dy,power} 拖曳中
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

  _gateRange() {
    const gw = (VW - MARGIN * 2) * this.cfg.gate
    return { x0: VW / 2 - gw / 2, x1: VW / 2 + gw / 2 }
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.strokes = 0
    this.toasts = []
    this.moving = false
    this.aim = null
    // 羊:散在草場下半區(避開圈門附近,別一開始就在圈裡)
    const woolColors = ['#f2eee0', '#e8dcc8', '#f0e8d8', '#e4d8c4', '#f4ece0', '#ece0cc', '#f0e4d4']
    this.balls = []
    for (let i = 0; i < this.cfg.sheep; i++) {
      let x, y, ok, tries = 0
      do {
        x = MARGIN + R + Math.random() * (VW - MARGIN * 2 - R * 2)
        y = TOPLINE + 90 + Math.random() * (VH - MARGIN - TOPLINE - 120)
        ok = this.balls.every((b) => Math.hypot(b.x - x, b.y - y) > R * 2.4)
      } while (!ok && ++tries < 200)
      this.balls.push({ x, y, vx: 0, vy: 0, kind: 'sheep', color: woolColors[i % woolColors.length], gathered: false })
    }
    // 牧羊犬:草場底部中央
    this.dog = { x: VW / 2, y: VH - MARGIN - 60, vx: 0, vy: 0, kind: 'dog', color: '#8a6a44' }
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
      // 子步進(防高速穿透):每步不超過 R/2
      const active = [this.dog, ...this.balls.filter((b) => !b.gathered)]
      const maxV = Math.max(...active.map((b) => Math.hypot(b.vx, b.vy)), 1)
      const steps = Math.max(1, Math.ceil((maxV * dt) / (R * 0.5)))
      const h = dt / steps
      for (let s = 0; s < steps; s++) this._physics(h)
      // 摩擦(草地阻力)
      const decay = Math.exp(-this.cfg.drag * dt)
      for (const b of active) { b.vx *= decay; b.vy *= decay; if (Math.hypot(b.vx, b.vy) < 4) { b.vx = 0; b.vy = 0 } }
      if (this._allRest()) { this.moving = false; if (this.balls.every((b) => b.gathered)) this._win() }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _physics(h) {
    const gate = this._gateRange()
    const active = [this.dog, ...this.balls.filter((b) => !b.gathered)]
    // 移動
    for (const b of active) { b.x += b.vx * h; b.y += b.vy * h }
    // 牆/柵欄
    for (const b of active) {
      if (b.x < MARGIN + R) { b.x = MARGIN + R; b.vx = Math.abs(b.vx) }
      if (b.x > VW - MARGIN - R) { b.x = VW - MARGIN - R; b.vx = -Math.abs(b.vx) }
      if (b.y > VH - MARGIN - R) { b.y = VH - MARGIN - R; b.vy = -Math.abs(b.vy) }
      // 上方=羊圈柵欄,中間有閘門
      if (b.y < TOPLINE + R) {
        const inGate = b.x > gate.x0 && b.x < gate.x1
        if (inGate && b.kind === 'sheep') {
          // 羊穿過閘門進圈=歸聚(不反彈,不消失——安歇在圈裡)
          b.gathered = true
          b.vx = 0; b.vy = 0
          b.penX = gate.x0 + Math.random() * (gate.x1 - gate.x0)
          b.penY = TOPLINE - 34 - Math.random() * 44
          this.toasts.push({ text: T.gathered, t: this._t })
          this._tone(523, 0.1, 0, 'triangle', 0.1); this._tone(659, 0.14, 0.08, 'triangle', 0.1)
          continue
        }
        if (inGate && b.kind === 'dog') {
          // 牧羊犬跑進閘門=汪汪跑回起點(不扣桿)
          b.x = VW / 2; b.y = VH - MARGIN - 60; b.vx = 0; b.vy = 0
          this.toasts.push({ text: T.dogBack, t: this._t })
          this._tone(360, 0.12, 0, 'square', 0.06)
          continue
        }
        // 撞柵欄反彈
        b.y = TOPLINE + R; b.vy = Math.abs(b.vy)
      }
    }
    // 圓-圓彈性碰撞(等質量:沿法線交換速度分量)
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j]
        if (a.gathered || b.gathered) continue // 本步中途已歸圈的羊不再參與碰撞
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        if (d > 0 && d < R * 2) {
          const nx = dx / d, ny = dy / d
          const overlap = R * 2 - d
          a.x -= nx * overlap / 2; a.y -= ny * overlap / 2
          b.x += nx * overlap / 2; b.y += ny * overlap / 2
          const va = a.vx * nx + a.vy * ny
          const vb = b.vx * nx + b.vy * ny
          if (vb - va < 0) { // 相互靠近才交換
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
    this.stars = this.strokes <= this.cfg.sheep + 1 ? 3 : this.strokes <= this.cfg.sheep * 2 ? 2 : 1
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.stars === 3 ? 100 : this.stars === 2 ? 70 : 40, level: 'herd' }) }, 900)
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
    // 拖曳牧羊犬(點犬附近即可起拉)
    if (Math.hypot(x - this.dog.x, y - this.dog.y) < R * 4) this.aim = { dx: 0, dy: -1, power: 0, gx: x, gy: y }
  }
  _movePt(e) {
    if (!this.aim || this.moving) return
    const { x, y } = this._pt(e)
    // 往後拉:拉的方向的反向=發射方向;拉距→力道
    const dx = this.dog.x - x, dy = this.dog.y - y
    const d = Math.hypot(dx, dy)
    if (d < 4) { this.aim.power = 0; return }
    this.aim.dx = dx / d; this.aim.dy = dy / d
    this.aim.power = Math.min(1, d / 240)
    this.aim.gx = x; this.aim.gy = y
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
    const gate = this._gateRange()
    // 草地
    const gr = ctx.createLinearGradient(0, TOPLINE, 0, VH - MARGIN)
    gr.addColorStop(0, '#8ab060'); gr.addColorStop(1, '#7aa050')
    ctx.fillStyle = gr
    ctx.fillRect(MARGIN, TOPLINE, VW - MARGIN * 2, VH - MARGIN - TOPLINE)
    // 草紋
    ctx.strokeStyle = 'rgba(90,130,60,0.4)'; ctx.lineWidth = 2
    for (let i = 0; i < 40; i++) {
      const gx = MARGIN + 10 + ((i * 137) % (VW - MARGIN * 2 - 20))
      const gy = TOPLINE + 20 + ((i * 91) % (VH - MARGIN - TOPLINE - 30))
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 7); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 7); ctx.stroke()
    }
    // 羊圈(上方):圈內淺土色 + 柵欄 + 閘門缺口
    ctx.fillStyle = '#c8b48a'
    ctx.fillRect(MARGIN, MARGIN, VW - MARGIN * 2, TOPLINE - MARGIN)
    ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 6
    // 柵欄橫桿(閘門左右兩段)
    ctx.beginPath(); ctx.moveTo(MARGIN, TOPLINE); ctx.lineTo(gate.x0, TOPLINE); ctx.moveTo(gate.x1, TOPLINE); ctx.lineTo(VW - MARGIN, TOPLINE); ctx.stroke()
    // 柵欄立柱
    ctx.lineWidth = 5
    for (let x = MARGIN; x <= VW - MARGIN + 1; x += 46) {
      if (x > gate.x0 - 20 && x < gate.x1 + 20) continue
      ctx.beginPath(); ctx.moveTo(x, MARGIN + 6); ctx.lineTo(x, TOPLINE); ctx.stroke()
    }
    // 閘門柱(綠標,提示這裡是入口)
    ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 7
    ctx.beginPath(); ctx.moveTo(gate.x0, TOPLINE - 4); ctx.lineTo(gate.x0, TOPLINE + 14); ctx.moveTo(gate.x1, TOPLINE - 4); ctx.lineTo(gate.x1, TOPLINE + 14); ctx.stroke()
    ctx.fillStyle = '#3a6a2a'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⛩ 羊圈入口', VW / 2, MARGIN + 26)
    // 已歸圈的羊(安臥圈中)
    for (const b of this.balls) if (b.gathered) this._sheep(b.penX, b.penY, b.color, true)
    // 場上的羊
    for (const b of this.balls) if (!b.gathered) this._sheep(b.x, b.y, b.color, false)
    // 牧羊犬
    this._dog(this.dog.x, this.dog.y)
    // 瞄準線(拉弓)
    if (this.aim && this.aim.power > 0.02) {
      const len = 60 + this.aim.power * 180
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([9, 9])
      ctx.beginPath(); ctx.moveTo(this.dog.x, this.dog.y)
      ctx.lineTo(this.dog.x + this.aim.dx * len, this.dog.y + this.aim.dy * len); ctx.stroke()
      ctx.setLineDash([])
      // 力道環
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
    rH(ctx, VW * 0.14, VH - MARGIN + 8, VW * 0.72, 30, 12); ctx.fill()
    ctx.fillStyle = '#eef4e2'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(inn, this.balls.length)} ・ 已揮 ${this.strokes} 桿`, VW / 2, VH - MARGIN + 29)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 一隻羊(毛球+頭+腳;penned=安臥)
  _sheep(x, y, color, penned) {
    const { ctx } = this
    if (penned) {
      ctx.fillStyle = color
      ctx.beginPath(); ctx.ellipse(x, y, R * 0.9, R * 0.7, 0, 0, 7); ctx.fill()
      ctx.fillStyle = '#4a3a2a'
      ctx.beginPath(); ctx.arc(x + R * 0.7, y, R * 0.36, 0, 7); ctx.fill()
      return
    }
    // 毛球輪廓(幾個圓)
    ctx.fillStyle = color
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(a) * R * 0.62, y + Math.sin(a) * R * 0.62, R * 0.4, 0, 7); ctx.fill() }
    ctx.beginPath(); ctx.arc(x, y, R * 0.68, 0, 7); ctx.fill()
    // 頭
    ctx.fillStyle = '#4a3a2a'
    ctx.beginPath(); ctx.arc(x, y - R * 0.55, R * 0.34, 0, 7); ctx.fill()
    ctx.fillStyle = '#f4f0e8'
    ctx.beginPath(); ctx.arc(x - R * 0.1, y - R * 0.6, R * 0.06, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + R * 0.1, y - R * 0.6, R * 0.06, 0, 7); ctx.fill()
  }

  // 牧羊犬(俯視:身體+頭+耳)
  _dog(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#8a6a44'
    ctx.beginPath(); ctx.ellipse(x, y, R * 0.95, R * 0.78, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#6a4e30'
    ctx.beginPath(); ctx.arc(x, y - R * 0.5, R * 0.5, 0, 7); ctx.fill() // 頭
    ctx.fillStyle = '#4a3620'
    ctx.beginPath(); ctx.ellipse(x - R * 0.42, y - R * 0.7, R * 0.2, R * 0.32, -0.4, 0, 7); ctx.fill() // 耳
    ctx.beginPath(); ctx.ellipse(x + R * 0.42, y - R * 0.7, R * 0.2, R * 0.32, 0.4, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2018'
    ctx.beginPath(); ctx.arc(x - R * 0.16, y - R * 0.55, R * 0.08, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + R * 0.16, y - R * 0.55, R * 0.08, 0, 7); ctx.fill()
    ctx.fillStyle = '#1a140e'
    ctx.beginPath(); ctx.arc(x, y - R * 0.36, R * 0.1, 0, 7); ctx.fill() // 鼻
  }

  _drawIntro() {
    const { ctx } = this
    cardH(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a24'
    ctx.font = 'bold 36px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#5a7a52'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 合成一群', VW / 2, VH * 0.24)
    ctx.fillStyle = '#2e3c26'
    wrapH(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapH(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#5a7a52'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.67)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.72
      ctx.fillStyle = '#7ab060'
      rH(ctx, x, y, bw, bh, 14); ctx.fill()
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
    ctx.fillStyle = '#f4faf0'
    ctx.strokeStyle = '#7aa060'; ctx.lineWidth = 3
    rH(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a24'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.16)
    ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.27)
    ctx.fillStyle = '#5a7a52'
    ctx.font = `${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`${this.balls.length} 隻羊都歸圈了 ・ 共揮 ${this.strokes} 桿`, W / 2, H * 0.34)
    ctx.fillStyle = '#2e3c26'
    wrapH(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.41, W * 0.66, H * 0.043)
    ctx.fillStyle = '#4a6a2a'
    wrapH(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.62, W * 0.66, H * 0.041)
    ctx.fillStyle = '#2e3c26'
    wrapH(ctx, T.teach, W / 2, H * 0.75, W * 0.66, H * 0.04)
    ctx.restore()
  }
}

function rH(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardH(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,252,240,0.96)'
  ctx.strokeStyle = '#7aa060'; ctx.lineWidth = 3
  rH(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapH(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
