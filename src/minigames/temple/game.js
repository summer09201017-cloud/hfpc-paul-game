// 活石蓋聖殿(王上 6:7;彼前 2:5)——系列第一個「落石砌合」關(新類型⑩,俄羅斯方塊反向化:砌合非消除)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:王上 6:7、彼前 2:5),牧者審核通過前不進大廳卡。
//
// 玩法:石頭在山中已經鑿好(方塊形狀預先定型),一塊一塊安靜地落下;左右移動、旋轉,
//   把石塊安放整齊——湊滿一整排=「砌合完工」,那一層發出金光、砌進聖殿的牆(不是爆炸消失!);
//   砌滿目標層數,聖殿完工、榮光充滿。
// ★ 神學守法:①「建殿的時候,鎚子、斧子…響聲都沒有聽見」(王上 6:7)——全程沒有敲打音效,
//   石塊安放只有輕輕的落定聲;②消行=砌合完工發光,絕不畫成爆炸/破碎;③堆到頂不是輸——
//   「歇口氣,把石頭先安放一旁,再來」(場地輕輕沉降幾層,進度保留,永不會輸)。
// 年齡三檔:幼(慢・簡單石形・預覽2)/童(標準・預覽1)/青(快・全部石形・無預覽)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;王上 6:7 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '慢・簡單石形', drop: 1.05, kinds: ['I', 'O', 'L'], goal: 3, preview: 2 },
  kid: { label: '🙂 童', desc: '標準', drop: 0.74, kinds: ['I', 'O', 'T', 'L', 'J'], goal: 5, preview: 1 },
  teen: { label: '🔥 青', desc: '快・全部石形', drop: 0.5, kinds: ['I', 'O', 'T', 'L', 'J', 'S', 'Z'], goal: 7, preview: 0 },
}

// 七種「山中鑿成的石塊」(每種一個暖色石調;rot 0-3 由 _cells 旋轉)
const SHAPES = {
  I: { c: '#d8b98a', m: [[0, 1], [1, 1], [2, 1], [3, 1]], w: 4 },
  O: { c: '#cfae7e', m: [[1, 0], [2, 0], [1, 1], [2, 1]], w: 4 },
  T: { c: '#c9a878', m: [[0, 1], [1, 1], [2, 1], [1, 0]], w: 3 },
  L: { c: '#d6b184', m: [[0, 1], [1, 1], [2, 1], [2, 0]], w: 3 },
  J: { c: '#c2a070', m: [[0, 0], [0, 1], [1, 1], [2, 1]], w: 3 },
  S: { c: '#ddbf92', m: [[1, 0], [2, 0], [0, 1], [1, 1]], w: 3 },
  Z: { c: '#c8a26a', m: [[0, 0], [1, 0], [1, 1], [2, 1]], w: 3 },
}
const COLS = 9
const ROWS = 13

const T = {
  title: '🧱 活石蓋聖殿',
  ref: '列王紀上 6:7',
  intro1: '「建殿是用山中鑿成的石頭。建殿的時候，鎚子、斧子，和別樣鐵器的響聲都沒有聽見。」(王上 6:7)',
  how: '石頭在山裡已經鑿好才運來。←→ 移動、↑ 旋轉、↓ 輕放(或手指拖・點一下旋轉)。把石塊安放整齊,湊滿一排就「砌合」進聖殿的牆;砌滿目標層數,聖殿完工!',
  pick: '工地安安靜靜。選一段工程:',
  hud: (n, goal) => `🧱 聖殿砌合 ${n}/${goal} 層`,
  fit: '砌合!這一層安放好了',
  rest: '歇口氣——石頭先安放一旁,再來!',
  winTitle: '🎉 聖殿完工,靜靜發光!',
  winVerse: '建殿是用山中鑿成的石頭。建殿的時候，鎚子、斧子，和別樣鐵器的響聲都沒有聽見。',
  winRef: '列王紀上 6:7',
  teachVerse: '你們來到主面前，也就像活石，被建造成為靈宮，作聖潔的祭司，藉著耶穌基督奉獻　神所悅納的靈祭。',
  teachRef: '彼得前書 2:5',
  teach: '每塊石頭都在山裡鑿好了,工地上安安靜靜,一層一層砌合起來。你也是一塊「活石」——神正親手把你安放在祂的靈宮裡,合式又寶貴。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play ⇄ clear/rest → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._keys = {}
    this._onKeyDown = (e) => this._key(e)
    this._onKeyUp = (e) => { this._keys[e.key] = false }
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.grid = [] // ROWS×COLS,null 或 色碼
    this.piece = null
    this.queue = []
    this.courses = 0 // 已砌合層數
    this.dropT = 0
    this.flash = null // {rows:[y..], t} 砌合發光中
    this.restT = 0
    this.toasts = []
    this._ptr = null
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKeyDown)
    addEventListener('keyup', this._onKeyUp)
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
    removeEventListener('keyup', this._onKeyUp)
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
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    this.courses = 0
    this.queue = []
    this.flash = null
    this.restT = 0
    this.toasts = []
    this.state = 'play'
    this._spawn()
  }

  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

  _spawn() {
    while (this.queue.length < 3) this.queue.push(this._rand(this.cfg.kinds))
    const kind = this.queue.shift()
    this.piece = { kind, rot: 0, col: Math.floor(COLS / 2) - 2, row: -1, fast: false }
    this.dropT = this.cfg.drop
    if (this._collide(this.piece, 0, 0)) {
      // 堆到頂=歇口氣(不是輸):場地輕輕沉降 4 層,進度保留
      this.piece = null
      this.restT = 1.7
      this.state = 'rest'
      this.toasts.push({ text: T.rest, t: this._t })
      this._tone(330, 0.3, 0, 'sine', 0.08)
    }
  }

  _cells(p) {
    // 方塊在 4×4 內旋轉(rot 0-3),回傳棋盤座標
    const s = SHAPES[p.kind]
    return s.m.map(([x, y]) => {
      let cx = x, cy = y
      for (let r = 0; r < p.rot % 4; r++) { const t = cx; cx = (s.w === 4 ? 3 : 2) - cy; cy = t }
      return [p.col + cx, Math.floor(p.row) + cy]
    })
  }

  _collide(p, dc, dr) {
    const q = { ...p, col: p.col + dc, row: p.row + dr }
    for (const [x, y] of this._cells(q)) {
      if (x < 0 || x >= COLS || y >= ROWS) return true
      if (y >= 0 && this.grid[y][x]) return true
    }
    return false
  }

  _tryRotate() {
    const p = this.piece
    if (!p) return
    const q = { ...p, rot: p.rot + 1 }
    for (const kick of [0, -1, 1, -2, 2]) {
      q.col = p.col + kick
      let ok = true
      for (const [x, y] of this._cells(q)) {
        if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.grid[y]?.[x])) { ok = false; break }
      }
      if (ok) { p.rot = q.rot; p.col = q.col; this._tone(500, 0.05, 0, 'sine', 0.05); return }
    }
  }

  _lock() {
    const p = this.piece
    for (const [x, y] of this._cells(p)) {
      if (y >= 0 && y < ROWS) this.grid[y][x] = SHAPES[p.kind].c
    }
    this.piece = null
    this._tone(150, 0.12, 0, 'sine', 0.1) // 輕輕落定(沒有鎚斧聲)
    const full = []
    for (let y = 0; y < ROWS; y++) if (this.grid[y].every(Boolean)) full.push(y)
    if (full.length) {
      this.flash = { rows: full, t: 0.62 }
      this.state = 'clear'
      this.toasts.push({ text: T.fit, t: this._t })
      this._tone(523, 0.18, 0, 'triangle', 0.12); this._tone(659, 0.25, 0.12, 'triangle', 0.12)
    } else this._spawn()
  }

  _update(dt) {
    if (this.state === 'clear') {
      this.flash.t -= dt
      if (this.flash.t <= 0) {
        // 砌合:發光層「砌進」聖殿的牆(從場上移走=已安放到牆上,非爆炸)
        const rows = this.flash.rows
        this.courses += rows.length
        this.grid = this.grid.filter((_, y) => !rows.includes(y))
        while (this.grid.length < ROWS) this.grid.unshift(Array(COLS).fill(null))
        this.flash = null
        if (this.courses >= this.cfg.goal) return this._win()
        this.state = 'play'
        this._spawn()
      }
      return
    }
    if (this.state === 'rest') {
      this.restT -= dt
      if (this.restT <= 0) {
        // 沉降:移走最底 4 層(石頭安放一旁),上方下移
        for (let i = 0; i < 4; i++) { this.grid.pop(); this.grid.unshift(Array(COLS).fill(null)) }
        this.state = 'play'
        this._spawn()
      }
      return
    }
    if (this.state !== 'play' || !this.piece) return
    const p = this.piece
    const soft = this._keys.ArrowDown || this._keys.s || p.fast
    this.dropT -= dt * (soft ? 7 : 1)
    if (this.dropT <= 0) {
      this.dropT = this.cfg.drop
      if (this._collide(p, 0, 1)) this._lock()
      else p.row += 1
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'temple' }) }, 900)
  }

  _key(e) {
    this._keys[e.key] = true
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state !== 'play' || !this.piece) return
    if (e.key === 'ArrowLeft' || e.key === 'a') { if (!this._collide(this.piece, -1, 0)) this.piece.col -= 1 }
    else if (e.key === 'ArrowRight' || e.key === 'd') { if (!this._collide(this.piece, 1, 0)) this.piece.col += 1 }
    else if (e.key === 'ArrowUp' || e.key === 'w') this._tryRotate()
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
    if (this.state === 'play') this._ptr = { x, y, t: this._t, moved: false }
  }
  _movePt(e) {
    if (!this._ptr || this.state !== 'play' || !this.piece) return
    const { x } = this._pt(e)
    const g = this._layout()
    const col = Math.floor((x - g.bx) / g.cell) - 1
    if (Math.abs(x - this._ptr.x) > g.cell * 0.5) this._ptr.moved = true
    const dc = col - this.piece.col
    const step = dc > 0 ? 1 : -1
    for (let i = 0; i !== dc && !this._collide(this.piece, step, 0); i += step) this.piece.col += step
  }
  _up(e) {
    if (!this._ptr || this.state !== 'play') { this._ptr = null; return }
    const { y } = this._pt(e)
    const dy = y - this._ptr.y
    if (dy > 46) { if (this.piece) this.piece.fast = true } // 下滑=輕放到底
    else if (!this._ptr.moved && this._t - this._ptr.t < 0.35) this._tryRotate() // 點一下=旋轉
    this._ptr = null
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

  _layout() {
    const { W, H } = this
    const cell = Math.min((H * 0.88) / ROWS, (W * 0.5) / COLS)
    const bw = cell * COLS, bh = cell * ROWS
    return { cell, bx: (W - bw) / 2, by: (H - bh) / 2, bw, bh }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 清晨的摩利亞山工地
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#f2e2c4'); sky.addColorStop(0.6, '#e8d6b4'); sky.addColorStop(1, '#cdb890')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()
    // 遠山
    ctx.fillStyle = 'rgba(160,140,100,0.35)'
    ctx.beginPath(); ctx.moveTo(0, H * 0.32)
    ctx.quadraticCurveTo(W * 0.25, H * 0.2, W * 0.5, H * 0.3)
    ctx.quadraticCurveTo(W * 0.75, H * 0.38, W, H * 0.26)
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill()
    const g = this._layout()
    // 工地框(石場)
    ctx.fillStyle = 'rgba(90,70,40,0.16)'
    rT(ctx, g.bx - 8, g.by - 8, g.bw + 16, g.bh + 16, 10); ctx.fill()
    ctx.fillStyle = '#efe6d2'
    ctx.fillRect(g.bx, g.by, g.bw, g.bh)
    ctx.strokeStyle = 'rgba(120,100,60,0.25)'; ctx.lineWidth = 1
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(g.bx + x * g.cell, g.by); ctx.lineTo(g.bx + x * g.cell, g.by + g.bh); ctx.stroke() }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(g.bx, g.by + y * g.cell); ctx.lineTo(g.bx + g.bw, g.by + y * g.cell); ctx.stroke() }
    // 已安放的石塊
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = this.grid[y][x]
      if (c) this._stone(g.bx + x * g.cell, g.by + y * g.cell, g.cell, c)
    }
    // 砌合發光層(金光,非爆炸)
    if (this.flash) {
      const k = 1 - this.flash.t / 0.62
      for (const y of this.flash.rows) {
        const glow = ctx.createLinearGradient(g.bx, 0, g.bx + g.bw, 0)
        glow.addColorStop(0, 'rgba(255,220,120,0.15)')
        glow.addColorStop(0.5, `rgba(255,230,150,${0.75 - k * 0.3})`)
        glow.addColorStop(1, 'rgba(255,220,120,0.15)')
        ctx.fillStyle = glow
        ctx.fillRect(g.bx - 6, g.by + y * g.cell - 3, g.bw + 12, g.cell + 6)
      }
    }
    // 下落中的石塊
    if (this.piece) {
      for (const [x, y] of this._cells(this.piece)) {
        if (y >= 0) this._stone(g.bx + x * g.cell, g.by + y * g.cell, g.cell, SHAPES[this.piece.kind].c, true)
      }
    }
    // 左側:聖殿的牆(砌合進度)
    this._temple(ctx, g.bx * 0.5, H * 0.72, Math.min(g.bx * 0.7, H * 0.3))
    // 右側:下一塊預覽
    if (this.cfg.preview > 0 && this.state === 'play') {
      const px = g.bx + g.bw + (W - g.bx - g.bw) * 0.5
      ctx.fillStyle = '#6a5636'
      ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('鑿好的下一塊', px, g.by + H * 0.03)
      this.queue.slice(0, this.cfg.preview).forEach((kind, i) => {
        const s = SHAPES[kind], pc = g.cell * 0.6
        for (const [x, y] of s.m) this._stone(px - pc * 2 + x * pc, g.by + H * 0.05 + i * pc * 3 + y * pc, pc, s.c)
      })
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#4a3a18'; ctx.strokeStyle = 'rgba(255,252,240,0.9)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, W / 2, H * 0.16 - k * 20)
      ctx.fillText(t.text, W / 2, H * 0.16 - k * 20)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(74,58,24,0.6)'
    rT(ctx, W * 0.18, H * 0.015, W * 0.64, H * 0.055, 12); ctx.fill()
    ctx.fillStyle = '#fdf6e0'
    ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.courses, this.cfg.goal)} ・ ←→移動 ↑轉 ↓輕放`, W / 2, H * 0.052)

    if (this.state === 'win') this._drawWin()
  }

  // 一塊石頭(圓角+亮邊,安安靜靜)
  _stone(x, y, size, color, active = false) {
    const { ctx } = this
    const pad = size * 0.06
    ctx.fillStyle = color
    rT(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.16); ctx.fill()
    ctx.fillStyle = 'rgba(255,250,235,0.35)'
    rT(ctx, x + pad, y + pad, size - pad * 2, (size - pad * 2) * 0.32, size * 0.16); ctx.fill()
    if (active) { ctx.strokeStyle = 'rgba(120,90,40,0.55)'; ctx.lineWidth = 1.5; rT(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.16); ctx.stroke() }
  }

  // 左側聖殿小圖:底座+已砌合的金層,完工加頂與光
  _temple(ctx, cx, baseY, size) {
    const { cfg, courses } = this
    const w = size, layerH = (size * 0.9) / cfg.goal
    ctx.fillStyle = '#b09a6e'
    rT(ctx, cx - w / 2, baseY, w, size * 0.08, 4); ctx.fill()
    for (let i = 0; i < courses; i++) {
      const y = baseY - (i + 1) * layerH
      const glow = 0.55 + 0.15 * Math.sin(this._t * 2 + i)
      ctx.fillStyle = `rgba(235,205,130,${glow})`
      rT(ctx, cx - w * 0.42, y, w * 0.84, layerH * 0.86, 3); ctx.fill()
    }
    if (this.state === 'win') {
      const topY = baseY - cfg.goal * layerH
      ctx.fillStyle = '#d8bc86'
      ctx.beginPath(); ctx.moveTo(cx - w * 0.5, topY); ctx.lineTo(cx, topY - w * 0.3); ctx.lineTo(cx + w * 0.5, topY); ctx.fill()
      const light = ctx.createRadialGradient(cx, topY - w * 0.2, 2, cx, topY - w * 0.2, w)
      light.addColorStop(0, 'rgba(255,240,180,0.8)'); light.addColorStop(1, 'rgba(255,240,180,0)')
      ctx.fillStyle = light
      ctx.beginPath(); ctx.arc(cx, topY - w * 0.2, w, 0, 7); ctx.fill()
    }
    ctx.fillStyle = '#6a5636'
    ctx.font = `${Math.max(10, size * 0.13)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('聖殿的牆', cx, baseY + size * 0.2)
  }

  _drawIntro() {
    const { ctx, W, H } = this
    cardT(ctx, W * 0.08, H * 0.05, W * 0.84, H * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6a4e1e'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.15)
    ctx.fillStyle = '#93794a'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 彼得前書 2:5', W / 2, H * 0.22)
    ctx.fillStyle = '#4a3c26'
    wrapT(ctx, T.intro1, W / 2, H * 0.3, W * 0.72, H * 0.045)
    wrapT(ctx, T.how, W / 2, H * 0.47, W * 0.72, H * 0.045)
    ctx.fillStyle = '#93794a'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#d8b46e'
      rT(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#432f10'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    cardT(ctx, W * 0.1, H * 0.07, W * 0.8, H * 0.86)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6a4e1e'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.18)
    ctx.fillStyle = '#4a3c26'
    wrapT(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.26, W * 0.66, H * 0.044)
    ctx.fillStyle = '#7a6220'
    wrapT(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.48, W * 0.66, H * 0.042)
    ctx.fillStyle = '#4a3c26'
    wrapT(ctx, T.teach, W / 2, H * 0.72, W * 0.66, H * 0.042)
  }
}

function rT(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardT(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(253,248,236,0.96)'
  ctx.strokeStyle = '#c0a060'; ctx.lineWidth = 3
  rT(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapT(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
