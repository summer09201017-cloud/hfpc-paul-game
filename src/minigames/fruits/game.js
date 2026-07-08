// 聖靈果子・結果子(加 5:22-23;約 15:5)——彈珠配對⑭第三個活實作(arkmatch 換皮:動物→帶字的果子、方舟→生命樹)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:加 5:22-23、約 15:5),牧者審核通過前不進大廳卡。
//
// 玩法:果子上寫著字——仁愛、喜樂、和平、忍耐、恩慈。瞄準發射,同款聚滿 3 顆=「結出果子」,
//   一起結到旁邊的樹上(不是消失!);全部結上,樹就滿了——過關!
// ★ 神學守法:①「聖靈所結的果子」是**聖靈結的**,不是人拚出來的——所以配對動詞是「結到樹上」,
//   教導句用約 15:5「常在我裡面的…就多結果子;離了我,你們就不能做甚麼」把功勞還給主;
//   ②配對=歸聚到樹上,絕不畫成果子爆掉;③永不會輸(同 arkmatch 全部保底);
//   ④果子上直接寫字=邊玩邊背九果子的前五種(青檔五種都出)。
// 年齡三檔:幼(3 果・3 排)/童(4 果・4 排)/青(5 果・5 排・果子越聚越多+短瞄準線)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;加 5:22-23 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '3 種果子・3 排', kinds: 3, rows: 3, cols: 8, grow: 0, guide: 150 },
  kid: { label: '🙂 童', desc: '4 種果子・4 排', kinds: 4, rows: 4, cols: 9, grow: 9, guide: 130 },
  teen: { label: '🔥 青', desc: '5 種・結不完的果子', kinds: 5, rows: 5, cols: 10, grow: 6, guide: 70 },
}

// 五種果子(字+色):九果子的前五種(加 5:22)
const KINDS = ['love', 'joy', 'peace', 'patience', 'kindness']
const FRUIT = {
  love: { label: '仁愛', c: '#d05a5a', leaf: '#4a8a3a' },
  joy: { label: '喜樂', c: '#e09a3a', leaf: '#5a9a3a' },
  peace: { label: '和平', c: '#5a9a7a', leaf: '#3a7a4a' },
  patience: { label: '忍耐', c: '#8a6ab0', leaf: '#4a8a3a' },
  kindness: { label: '恩慈', c: '#d887a5', leaf: '#5a9a4a' },
}
const VW = 960
const VH = 540
const D = 52
const ROWSTEP = D * 0.87
const MAXROW = 8

const T = {
  title: '🍇 聖靈果子・結果子',
  ref: '加拉太書 5:22-23',
  intro1: '「聖靈所結的果子，就是仁愛、喜樂、和平、忍耐、恩慈、良善、信實、溫柔、節制。」(加 5:22-23)',
  how: '果子上寫著字——仁愛、喜樂、和平……瞄準、放開,把果子送到同款旁邊;聚滿 3 顆就「結出果子」,結到旁邊的樹上!記住:果子是聖靈結的——我們只管常在主裡面。',
  pick: '樹已經栽在溪水旁。選一片園子:',
  hud: (n, tr) => `🍇 待結 ${n} 顆 ・ 樹上 ${tr} 顆`,
  gather: '結出果子了!',
  float: '連在一起的,一起結上去!',
  low: '園丁先把下層的果子結上樹…',
  more: '又長出好些果子…',
  closeLine: '常在我裡面的……這人就多結果子。(約 15:5)',
  winTitle: '🎉 樹上結滿了果子!',
  winVerse: '聖靈所結的果子，就是仁愛、喜樂、和平、忍耐、恩慈、良善、信實、溫柔、節制。這樣的事沒有律法禁止。',
  winRef: '加拉太書 5:22-23',
  teachVerse: '我是葡萄樹，你們是枝子。常在我裡面的，我也常在他裡面，這人就多結果子；因為離了我，你們就不能做甚麼。',
  teachRef: '約翰福音 15:5',
  teach: '注意看——經文說「聖靈所結的果子」,不是「我們拚出來的果子」。仁愛、喜樂、和平……都是住在主裡面自然長出來的。所以這一關你不是在「製造」果子,是把果子「結到樹上」——常在主裡面,果子就多起來。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro'
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
    this.treeCount = 0
    this.treeFruits = [] // 結在樹上的 {dx,dy,kind}(樹冠內隨機位)
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
    this.treeCount = 0
    this.treeFruits = []
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
    this.toasts.push({ text: T.more, t: this._t })
    const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
    if (tooLow.length) {
      for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
        const [fr, fc] = key.split(',').map(Number); this._toTree(fr, fc)
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
      for (const [gr, gc] of group) this._toTree(gr, gc)
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
        for (const key of floating) { const [fr, fc] = key.split(',').map(Number); this._toTree(fr, fc) }
        this.toasts.push({ text: T.float, t: this._t })
      }
    }
    const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
    if (tooLow.length) {
      for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
        const [fr, fc] = key.split(',').map(Number); this._toTree(fr, fc)
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

  _toTree(r, c) {
    const kind = this.grid.get(`${r},${c}`)
    if (!kind) return
    this.grid.delete(`${r},${c}`)
    const p = this._cellXY(r, c)
    // 目的地:樹冠內的一個隨機點(之後常駐畫在樹上)
    const a = Math.random() * Math.PI * 2, rr = Math.random() * 52
    const spot = { dx: Math.cos(a) * rr, dy: Math.sin(a) * rr * 0.72 }
    this.flyers.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, kind, t: 0, spot })
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
      const tx = TREE.x + f.spot.dx, ty = TREE.y + f.spot.dy
      f.x = f.sx + (tx - f.sx) * ease
      f.y = f.sy + (ty - f.sy) * ease - Math.sin(k * Math.PI) * 60
    }
    const arrived = this.flyers.filter((f) => f.t >= 1)
    if (arrived.length) {
      this.treeCount += arrived.length
      for (const f of arrived) this.treeFruits.push({ dx: f.spot.dx, dy: f.spot.dy, kind: f.kind })
      this.flyers = this.flyers.filter((f) => f.t < 1)
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'fruits' }) }, 900)
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
    // 清晨的園子
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#cfe4d8'); sky.addColorStop(0.6, '#c0d8b8'); sky.addColorStop(1, '#98b880')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    this._tree()
    for (const [key, kind] of this.grid) {
      const [r, c] = key.split(',').map(Number)
      const p = this._cellXY(r, c)
      this._fruit(p.x, p.y, D / 2 - 2, kind)
    }
    if (this.flying) this._fruit(this.flying.x, this.flying.y, D / 2 - 2, this.flying.kind)
    for (const f of this.flyers) this._fruit(f.x, f.y, (D / 2 - 2) * (1 - f.t * 0.35), f.kind)
    if (this.state === 'play') {
      const sx = VW / 2, sy = VH - 70
      ctx.strokeStyle = 'rgba(50,80,50,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10])
      ctx.beginPath(); ctx.moveTo(sx, sy)
      ctx.lineTo(sx + Math.cos(this.aim) * this.cfg.guide, sy + Math.sin(this.aim) * this.cfg.guide); ctx.stroke()
      ctx.setLineDash([])
      this._fruit(sx, sy, D / 2 - 2, this.cur)
      ctx.fillStyle = '#3a4a2a'
      ctx.font = '13px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('下一顆', sx + 74, sy + 4)
      this._fruit(sx + 74, sy - 22, D / 3, this.next)
    }
    if (this.state === 'close' || this.state === 'win') {
      ctx.fillStyle = '#2c4224'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(T.closeLine, VW / 2, VH * 0.62)
    }
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#243a1c'; ctx.strokeStyle = 'rgba(250,255,245,0.9)'; ctx.lineWidth = 4
      ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.55 - k * 20)
      ctx.fillText(t.text, VW / 2, VH * 0.55 - k * 20)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = 'rgba(36,56,28,0.62)'
    rP(ctx, VW * 0.2, 8, VW * 0.6, 30, 12); ctx.fill()
    ctx.fillStyle = '#eef4e4'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.grid.size, this.treeCount)} ・ ←→瞄準 空白鍵發射`, VW / 2, 29)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 右側的葡萄樹(樹冠+結上去的果子常駐;結局發光)
  _tree() {
    const { ctx } = this
    ctx.fillStyle = '#7a5a36'
    ctx.fillRect(TREE.x - 8, TREE.y + 40, 16, 60)
    ctx.fillStyle = '#5a8a4a'
    ctx.beginPath(); ctx.ellipse(TREE.x, TREE.y, 78, 62, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#6a9a58'
    ctx.beginPath(); ctx.ellipse(TREE.x - 30, TREE.y - 20, 40, 32, 0, 0, 7); ctx.fill()
    for (const f of this.treeFruits) this._fruit(TREE.x + f.dx, TREE.y + f.dy, 13, f.kind, true)
    if (this.state === 'close' || this.state === 'win') {
      const glow = ctx.createRadialGradient(TREE.x, TREE.y, 10, TREE.x, TREE.y, 140)
      glow.addColorStop(0, 'rgba(255,245,180,0.45)'); glow.addColorStop(1, 'rgba(255,245,180,0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(TREE.x, TREE.y, 140, 0, 7); ctx.fill()
    }
    ctx.fillStyle = '#2c4224'
    ctx.font = '13px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('常在主裡面', TREE.x, TREE.y + 118)
  }

  // 一顆果子(圓果+葉+兩字;small=樹上的常駐果不寫字)
  _fruit(x, y, r, kind, small = false) {
    const { ctx } = this
    const f = FRUIT[kind]
    ctx.fillStyle = f.c
    ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 7); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.26, 0, 7); ctx.fill()
    ctx.fillStyle = f.leaf
    ctx.beginPath(); ctx.ellipse(x + r * 0.3, y - r * 0.85, r * 0.32, r * 0.15, -0.6, 0, 7); ctx.fill()
    if (!small) {
      ctx.fillStyle = '#fffdf4'
      ctx.font = `bold ${r * 0.62}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(f.label, x, y + r * 0.24)
    }
  }

  _drawIntro() {
    const { ctx } = this
    cardP(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a24'
    ctx.font = 'bold 34px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#5a7a52'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 果子是聖靈結的', VW / 2, VH * 0.24)
    ctx.fillStyle = '#2e3c26'
    wrapP(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapP(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#5a7a52'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.67)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.72
      ctx.fillStyle = '#8ab070'
      rP(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#122a0c'
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
    ctx.fillStyle = '#f6faf0' // 全不透明
    ctx.strokeStyle = '#7aa060'; ctx.lineWidth = 3
    rP(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a24'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.16)
    ctx.fillStyle = '#5a7a52'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`樹上結了 ${this.treeCount} 顆——都是聖靈結的`, W / 2, H * 0.24)
    ctx.fillStyle = '#2e3c26'
    wrapP(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.32, W * 0.66, H * 0.044)
    ctx.fillStyle = '#4a6a2a'
    wrapP(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.5, W * 0.66, H * 0.042)
    ctx.fillStyle = '#2e3c26'
    wrapP(ctx, T.teach, W / 2, H * 0.68, W * 0.66, H * 0.042)
    ctx.restore()
  }
}

const TREE = { x: 862, y: 400 }

function rP(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardP(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,250,240,0.96)'
  ctx.strokeStyle = '#7aa060'; ctx.lineWidth = 3
  rP(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapP(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
