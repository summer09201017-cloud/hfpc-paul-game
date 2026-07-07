// 五餅二魚・收拾零碎(約 6:11-13)——彈珠配對⑭第二個活實作(arkmatch 換皮:動物→餅魚零碎、方舟→十二個籃子)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:約 6:11-13),牧者審核通過前不進大廳卡。
//
// 玩法:眾人吃飽了,草地上滿是零碎。門徒把撿起的零碎輕輕拋上去(瞄準+發射),
//   同樣的零碎靠在一起湊滿 3 片=「收拾起來」——一起收進籃子(不是消失!);
//   全部收完,十二個籃子都裝滿了——過關!
// ★ 神學守法:①配對成功=**收進籃子**,絕不畫成食物爆掉/消失——主耶穌說「免得有糟蹋的」,
//   遊戲裡一片也不糟蹋;②懸空的零碎=門徒順手兜住,也收進籃;③永不會輸(無射數限制、
//   堆太低=門徒先收下層);④結尾必數「十二個籃子」(約 6:13)——神蹟之後的豐盛有餘。
// 年齡三檔:幼(3 種零碎・3 排)/童(4 種・4 排・會再收來零碎)/青(5 種・5 排・更常收來+短瞄準線)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;約 6:12 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '3 種零碎・3 排', kinds: 3, rows: 3, cols: 8, grow: 0, guide: 150 },
  kid: { label: '🙂 童', desc: '4 種零碎・4 排', kinds: 4, rows: 4, cols: 9, grow: 9, guide: 130 },
  teen: { label: '🔥 青', desc: '5 種・零碎收不完?', kinds: 5, rows: 5, cols: 10, grow: 6, guide: 70 },
}

const KINDS = ['loaf', 'crust', 'grain', 'fish', 'bluefish']
const VW = 960
const VH = 540
const D = 52
const ROWSTEP = D * 0.87
const MAXROW = 8

const T = {
  title: '🧺 五餅二魚・收拾零碎',
  ref: '約翰福音 6:11-13',
  intro1: '「耶穌拿起餅來，祝謝了，就分給那坐著的人；分魚也是這樣，都隨著他們所要的。」(約 6:11)',
  how: '眾人吃飽了,草地上滿是餅和魚的零碎。瞄準、放開,把零碎拋到同樣的旁邊——湊滿 3 片就「收拾起來」收進籃子。主說:免得有糟蹋的!把十二個籃子都裝滿吧!',
  pick: '天色近晚。選一片草地:',
  hud: (n, b) => `🧺 草地上還有 ${n} 片 ・ 已裝 ${b}/12 籃`,
  gather: '收拾起來,收進籃子!',
  float: '門徒順手兜住,一片不糟蹋!',
  low: '門徒先把下層的零碎收起來…',
  more: '又收來一把零碎…',
  closeLine: '裝滿了十二個籃子。(約 6:13)',
  winTitle: '🎉 十二個籃子都滿了!',
  winVerse: '把剩下的零碎收拾起來，免得有糟蹋的。',
  winRef: '約翰福音 6:12',
  teachVerse: '他們便將那五個大麥餅的零碎，就是眾人吃了剩下的，收拾起來，裝滿了十二個籃子。',
  teachRef: '約翰福音 6:13',
  teach: '五個餅、兩條魚,餵飽了五千人——吃飽之後,主卻吩咐把零碎收拾起來。行神蹟的主,一點也不浪費。豐盛不是揮霍的理由;領受越多,越要做珍惜的好管家。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → close → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.grid = new Map()
    this.cur = null
    this.next = null
    this.flying = null
    this.flyers = []
    this.aim = -Math.PI / 2
    this.collected = 0
    this.total = 0
    this.shots = 0
    this.closeT = 0
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

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.grid = new Map()
    const kinds = KINDS.slice(0, this.cfg.kinds)
    for (let r = 0; r < this.cfg.rows; r++)
      for (let c = 0; c < this.cfg.cols - (r % 2); c++)
        this.grid.set(`${r},${c}`, kinds[Math.floor(Math.random() * kinds.length)])
    this.collected = 0
    this.total = this.grid.size
    this.flyers = []
    this.flying = null
    this.shots = 0
    this.toasts = []
    this.cur = this._pick()
    this.next = this._pick()
    this.aim = -Math.PI / 2
    this.state = 'play'
  }

  _pick() {
    const present = [...new Set(this.grid.values())]
    if (!present.length) return KINDS[0]
    return present[Math.floor(Math.random() * present.length)]
  }

  _ox() { return (VW - this.cfg.cols * D) / 2 + D / 2 }
  _cellXY(r, c) { return { x: this._ox() + c * D + (r % 2) * (D / 2), y: 70 + r * ROWSTEP } }
  _neighbors(r, c) {
    return r % 2 === 0
      ? [[r, c - 1], [r, c + 1], [r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]]
      : [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]]
  }

  _shoot() {
    if (this.flying || this.state !== 'play') return
    const sp = 620
    this.flying = { x: VW / 2, y: VH - 70, vx: Math.cos(this.aim) * sp, vy: Math.sin(this.aim) * sp, kind: this.cur }
    this.cur = this.next
    this.next = this._pick()
    this.shots += 1
    if (this.cfg.grow && this.shots % this.cfg.grow === 0) this._growRow()
    this._tone(440, 0.07, 0, 'sine', 0.08)
  }

  _growRow() {
    if (this.state !== 'play' || this.grid.size === 0) return
    const shifted = new Map()
    for (const [key, kind] of this.grid) {
      const [r, c] = key.split(',').map(Number)
      shifted.set(`${r + 1},${c}`, kind)
    }
    this.grid = shifted
    const kinds = [...new Set(this.grid.values())]
    for (let c = 0; c < this.cfg.cols; c++) this.grid.set(`0,${c}`, kinds[Math.floor(Math.random() * kinds.length)])
    this.total += this.cfg.cols
    this.toasts.push({ text: T.more, t: this._t })
    const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
    if (tooLow.length) {
      for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
        const [fr, fc] = key.split(',').map(Number); this._toBasket(fr, fc)
      }
      this.toasts.push({ text: T.low, t: this._t })
    }
  }

  _snap(b) {
    let r = Math.max(0, Math.round((b.y - 70) / ROWSTEP))
    let c = Math.max(0, Math.min(this.cfg.cols - 1 - (r % 2), Math.round((b.x - this._ox() - (r % 2) * (D / 2)) / D)))
    if (this.grid.has(`${r},${c}`)) {
      let best = null, bestD = 1e9
      const seen = new Set([`${r},${c}`])
      const queue = [[r, c]]
      while (queue.length) {
        const [qr, qc] = queue.shift()
        for (const [nr, nc] of this._neighbors(qr, qc)) {
          const key = `${nr},${nc}`
          if (nr < 0 || nc < 0 || nc > this.cfg.cols - 1 - (nr % 2) || seen.has(key)) continue
          seen.add(key)
          if (!this.grid.has(key)) {
            const p = this._cellXY(nr, nc)
            const d = Math.hypot(p.x - b.x, p.y - b.y)
            if (d < bestD) { bestD = d; best = [nr, nc] }
          } else if (seen.size < 60) queue.push([nr, nc])
        }
      }
      if (best) { r = best[0]; c = best[1] }
    }
    this.grid.set(`${r},${c}`, b.kind)
    this.total += 1
    this._tone(220, 0.06, 0, 'sine', 0.07)
    this._settle(r, c)
  }

  _settle(r, c) {
    const kind = this.grid.get(`${r},${c}`)
    const group = []
    const seen = new Set()
    const bfs = [[r, c]]
    while (bfs.length) {
      const [qr, qc] = bfs.shift()
      const key = `${qr},${qc}`
      if (seen.has(key) || this.grid.get(key) !== kind) continue
      seen.add(key)
      group.push([qr, qc])
      for (const [nr, nc] of this._neighbors(qr, qc)) if (!seen.has(`${nr},${nc}`)) bfs.push([nr, nc])
    }
    if (group.length >= 3) {
      for (const [gr, gc] of group) this._toBasket(gr, gc)
      this.toasts.push({ text: T.gather, t: this._t })
      this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(659, 0.18, 0.1, 'triangle', 0.11)
      const anchored = new Set()
      const q = []
      for (const key of this.grid.keys()) if (key.startsWith('0,')) { q.push(key); anchored.add(key) }
      while (q.length) {
        const [qr, qc] = q.shift().split(',').map(Number)
        for (const [nr, nc] of this._neighbors(qr, qc)) {
          const key = `${nr},${nc}`
          if (this.grid.has(key) && !anchored.has(key)) { anchored.add(key); q.push(key) }
        }
      }
      const floating = [...this.grid.keys()].filter((k) => !anchored.has(k))
      if (floating.length) {
        for (const key of floating) { const [fr, fc] = key.split(',').map(Number); this._toBasket(fr, fc) }
        this.toasts.push({ text: T.float, t: this._t })
      }
    }
    const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
    if (tooLow.length) {
      for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
        const [fr, fc] = key.split(',').map(Number); this._toBasket(fr, fc)
      }
      this.toasts.push({ text: T.low, t: this._t })
    }
    if (this.grid.size === 0) {
      this.state = 'close'
      this.closeT = 2.4
      this._tone(392, 0.2, 0, 'triangle', 0.1); this._tone(523, 0.3, 0.18, 'triangle', 0.1)
    } else {
      const present = new Set(this.grid.values())
      if (!present.has(this.cur)) this.cur = this._pick()
      if (!present.has(this.next)) this.next = this._pick()
    }
  }

  _toBasket(r, c) {
    const kind = this.grid.get(`${r},${c}`)
    if (!kind) return
    this.grid.delete(`${r},${c}`)
    const p = this._cellXY(r, c)
    this.flyers.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, kind, t: 0 })
  }

  // 已裝滿的籃數(過關時=12;過程中按收拾比例,封頂 11 留最後一籃給結局)
  _baskets() {
    if (this.state === 'close' || this.state === 'win') return 12
    if (!this.total) return 0
    return Math.min(11, Math.floor((this.collected / this.total) * 12))
  }

  _update(dt) {
    if (this.state === 'close') {
      this.closeT -= dt
      if (this.closeT <= 0) this._win()
    }
    if (this.flying) {
      const b = this.flying
      b.x += b.vx * dt
      b.y += b.vy * dt
      const wallL = this._ox() - D / 2, wallR = this._ox() + (this.cfg.cols - 0.5) * D + D / 2
      if (b.x < wallL + D / 2) { b.x = wallL + D / 2; b.vx = Math.abs(b.vx) }
      if (b.x > wallR - D / 2) { b.x = wallR - D / 2; b.vx = -Math.abs(b.vx) }
      let hit = b.y <= 70
      if (!hit) for (const key of this.grid.keys()) {
        const [r, c] = key.split(',').map(Number)
        const p = this._cellXY(r, c)
        if (Math.hypot(p.x - b.x, p.y - b.y) < D * 0.86) { hit = true; break }
      }
      if (hit) { const bb = this.flying; this.flying = null; this._snap(bb) }
      else if (b.y > VH + 40) this.flying = null
    }
    for (const f of this.flyers) f.t += dt * 1.4
    for (const f of this.flyers) {
      const k = Math.min(1, f.t)
      const ease = k * k * (3 - 2 * k)
      f.x = f.sx + (BASKETS.x - f.sx) * ease
      f.y = f.sy + (BASKETS.y - f.sy) * ease - Math.sin(k * Math.PI) * 60
    }
    const done = this.flyers.filter((f) => f.t >= 1).length
    if (done) { this.collected += done; this.flyers = this.flyers.filter((f) => f.t < 1) }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'fragments' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state !== 'play') return
    if (e.key === 'ArrowLeft' || e.key === 'a') this.aim = Math.max(-Math.PI + 0.3, this.aim - 0.09)
    else if (e.key === 'ArrowRight' || e.key === 'd') this.aim = Math.min(-0.3, this.aim + 0.09)
    else if (e.key === ' ' || e.key === 'ArrowUp') this._shoot()
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * this.W
    const py = ((e.clientY - r.top) / r.height) * this.H
    const { s, ox, oy } = this._view()
    return { x: (px - ox) / s, y: (py - oy) / s }
  }
  _aimTo(x, y) {
    const a = Math.atan2(y - (VH - 70), x - VW / 2)
    this.aim = Math.max(-Math.PI + 0.3, Math.min(-0.3, a))
  }
  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state === 'play') { this._aimTo(x, y); this._press = true }
  }
  _movePt(e) {
    if (this.state !== 'play') return
    const { x, y } = this._pt(e)
    this._aimTo(x, y)
  }
  _up() {
    if (this._press && this.state === 'play') this._shoot()
    this._press = false
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
    // 近晚的草坡
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#f0d8a8'); sky.addColorStop(0.55, '#d8cc98'); sky.addColorStop(1, '#98b078')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    this._basketPile(this._baskets())
    for (const [key, kind] of this.grid) {
      const [r, c] = key.split(',').map(Number)
      const p = this._cellXY(r, c)
      this._piece(p.x, p.y, D / 2 - 2, kind)
    }
    if (this.flying) this._piece(this.flying.x, this.flying.y, D / 2 - 2, this.flying.kind)
    for (const f of this.flyers) this._piece(f.x, f.y, (D / 2 - 2) * (1 - f.t * 0.3), f.kind)
    if (this.state === 'play') {
      const sx = VW / 2, sy = VH - 70
      ctx.strokeStyle = 'rgba(80,70,40,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10])
      ctx.beginPath(); ctx.moveTo(sx, sy)
      ctx.lineTo(sx + Math.cos(this.aim) * this.cfg.guide, sy + Math.sin(this.aim) * this.cfg.guide); ctx.stroke()
      ctx.setLineDash([])
      // 門徒(簡筆)
      ctx.fillStyle = '#5a7a9a'
      ctx.fillRect(sx - 30 - 9, sy - 8, 18, 34)
      ctx.fillStyle = '#c9a06a'
      ctx.beginPath(); ctx.arc(sx - 30, sy - 18, 10, 0, 7); ctx.fill()
      this._piece(sx, sy, D / 2 - 2, this.cur)
      ctx.fillStyle = '#4a4a2a'
      ctx.font = '13px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('下一片', sx + 74, sy + 4)
      this._piece(sx + 74, sy - 22, D / 3, this.next)
    }
    if (this.state === 'close' || this.state === 'win') {
      ctx.fillStyle = '#4a4224'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(T.closeLine, VW / 2, VH * 0.6)
    }
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#3a3418'; ctx.strokeStyle = 'rgba(255,252,240,0.9)'; ctx.lineWidth = 4
      ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.55 - k * 20)
      ctx.fillText(t.text, VW / 2, VH * 0.55 - k * 20)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = 'rgba(60,52,24,0.62)'
    rF(ctx, VW * 0.2, 8, VW * 0.6, 30, 12); ctx.fill()
    ctx.fillStyle = '#f4eed8'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.grid.size, this._baskets())} ・ ←→瞄準 空白鍵發射`, VW / 2, 29)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 右側籃子堆(n=已滿籃數,滿的畫盛滿零碎;結局 12 籃發光)
  _basketPile(n) {
    const { ctx } = this
    for (let i = 0; i < 12; i++) {
      const bx = BASKETS.x - 54 + (i % 3) * 42
      const by = BASKETS.y - Math.floor(i / 3) * 34
      const full = i < n
      ctx.fillStyle = full ? '#b08a4a' : 'rgba(176,138,74,0.35)'
      ctx.beginPath(); ctx.moveTo(bx - 17, by - 12); ctx.lineTo(bx + 17, by - 12); ctx.lineTo(bx + 12, by + 8); ctx.lineTo(bx - 12, by + 8); ctx.fill()
      if (full) {
        ctx.fillStyle = '#e0c070'
        ctx.beginPath(); ctx.ellipse(bx, by - 13, 14, 5, 0, 0, 7); ctx.fill()
      }
    }
    if (this.state === 'close' || this.state === 'win') {
      const glow = ctx.createRadialGradient(BASKETS.x - 10, BASKETS.y - 40, 8, BASKETS.x - 10, BASKETS.y - 40, 120)
      glow.addColorStop(0, 'rgba(255,235,160,0.5)'); glow.addColorStop(1, 'rgba(255,235,160,0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(BASKETS.x - 10, BASKETS.y - 40, 120, 0, 7); ctx.fill()
    }
    ctx.fillStyle = '#4a4224'
    ctx.font = '13px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('十二個籃子', BASKETS.x - 10, BASKETS.y + 28)
  }

  // 一片零碎(五種:金黃圓餅/深烤角餅/麥紋方餅/銀灰小魚/青藍小魚)
  _piece(x, y, r, kind) {
    const { ctx } = this
    if (kind === 'loaf') {
      ctx.fillStyle = '#dfb268'
      ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, 7); ctx.fill()
      ctx.fillStyle = '#c99a4e'
      ctx.beginPath(); ctx.arc(x, y, r * 0.82, -0.6, 1.2); ctx.lineTo(x, y); ctx.fill()
      ctx.strokeStyle = '#a87c34'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.4, 0.3, Math.PI - 0.3); ctx.stroke()
    } else if (kind === 'crust') {
      ctx.fillStyle = '#a8763a'
      ctx.beginPath(); ctx.moveTo(x, y - r * 0.85); ctx.lineTo(x + r * 0.8, y + r * 0.6); ctx.lineTo(x - r * 0.8, y + r * 0.6); ctx.fill()
      ctx.fillStyle = '#8a5c26'
      ctx.beginPath(); ctx.moveTo(x, y - r * 0.85); ctx.lineTo(x + r * 0.3, y - r * 0.2); ctx.lineTo(x - r * 0.3, y - r * 0.2); ctx.fill()
    } else if (kind === 'grain') {
      ctx.fillStyle = '#e8ca8a'
      rF(ctx, x - r * 0.7, y - r * 0.65, r * 1.4, r * 1.3, r * 0.25); ctx.fill()
      ctx.strokeStyle = '#b89a52'; ctx.lineWidth = 2
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + i * r * 0.32); ctx.lineTo(x + r * 0.45, y + i * r * 0.32); ctx.stroke() }
    } else if (kind === 'fish') {
      ctx.fillStyle = '#a8b4bc'
      ctx.beginPath(); ctx.ellipse(x - r * 0.1, y, r * 0.72, r * 0.42, 0, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x + r * 0.95, y - r * 0.4); ctx.lineTo(x + r * 0.95, y + r * 0.4); ctx.fill()
      ctx.fillStyle = '#3a4650'
      ctx.beginPath(); ctx.arc(x - r * 0.5, y - r * 0.08, r * 0.08, 0, 7); ctx.fill()
    } else { // bluefish
      ctx.fillStyle = '#6a9ab8'
      ctx.beginPath(); ctx.ellipse(x - r * 0.1, y, r * 0.72, r * 0.42, 0, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x + r * 0.95, y - r * 0.4); ctx.lineTo(x + r * 0.95, y + r * 0.4); ctx.fill()
      ctx.fillStyle = '#e8f0f4'
      ctx.beginPath(); ctx.arc(x - r * 0.5, y - r * 0.08, r * 0.1, 0, 7); ctx.fill()
      ctx.fillStyle = '#22303a'
      ctx.beginPath(); ctx.arc(x - r * 0.5, y - r * 0.08, r * 0.05, 0, 7); ctx.fill()
    }
  }

  _drawIntro() {
    const { ctx } = this
    cardF(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a4416'
    ctx.font = 'bold 34px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#8a7a4a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 免得有糟蹋的', VW / 2, VH * 0.24)
    ctx.fillStyle = '#3e3418'
    wrapF(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapF(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#8a7a4a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.67)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.72
      ctx.fillStyle = '#c8a858'
      rF(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#3a2a06'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = '14px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWinCard() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.1, y = H * 0.07, w = W * 0.8, h = H * 0.86
    ctx.fillStyle = '#fcf8ee' // 全不透明
    ctx.strokeStyle = '#b09050'; ctx.lineWidth = 3
    rF(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a4416'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.17)
    ctx.fillStyle = '#8a7a4a'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`收拾了 ${this.collected} 片零碎——一片也沒糟蹋`, W / 2, H * 0.26)
    ctx.fillStyle = '#3e3418'
    wrapF(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.34, W * 0.66, H * 0.045)
    ctx.fillStyle = '#6a5a1a'
    wrapF(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.48, W * 0.66, H * 0.043)
    ctx.fillStyle = '#3e3418'
    wrapF(ctx, T.teach, W / 2, H * 0.66, W * 0.66, H * 0.042)
    ctx.restore()
  }
}

const BASKETS = { x: 880, y: 470 }

function rF(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardF(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(252,248,238,0.96)'
  ctx.strokeStyle = '#b09050'; ctx.lineWidth = 3
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
