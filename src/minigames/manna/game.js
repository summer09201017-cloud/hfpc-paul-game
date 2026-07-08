// 嗎哪收取(出 16:14-18;太 6:11)——系列第一個「交換配對(消消樂/Candy 型)」關(新類型⑰,消消樂反向化:裝罐非消滅)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:出 16:14-15、16:18、太 6:11),牧者審核通過前不進大廳卡。
//
// 玩法:野地面上滿是「如白霜的小圓物」。點一塊嗎哪、再點相鄰的一塊交換;湊成一排/一列 3 個同款
//   =「收取」——一起收進俄梅珥罐(不是消失!);上面的嗎哪落下來補位,新的嗎哪從天上降下(出 16 的
//   「每早晨降嗎哪」正是補位機制的經文!);收滿目標俄梅珥數,全營都夠吃——過關!
// ★ 神學守法(消消樂反向化):①配對成功=**收進罐子**,絕不畫成糖果爆裂/消滅——收取是管家的動作;
//   ②補位=從天而降(神天天供應);③無步數/時間限制,永不會輸;交換不成 3 連=溫柔換回去,不扣任何東西;
//   ④無可動的手時=「風把嗎哪吹勻了」溫柔重洗,進度保留;⑤信息:多收的沒有餘,少收的沒有缺(出 16:18)
//   ——夠用的恩典;教導句接主禱文「我們日用的飲食,今日賜給我們」(太 6:11)。
// 年齡三檔:幼(6×6・4 款・收 8 俄梅珥)/童(7×7・5 款・12)/青(8×8・5 款・16)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;出 16:18 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const VW = 960
const VH = 540
const OMER = 8 // 每收 8 塊=裝滿一俄梅珥

const AGES = {
  young: { label: '🐣 幼', desc: '6×6・收 8 俄梅珥', size: 6, kinds: 4, goal: 8 },
  kid: { label: '🙂 童', desc: '7×7・收 12 俄梅珥', size: 7, kinds: 5, goal: 12 },
  teen: { label: '🔥 青', desc: '8×8・收 16 俄梅珥', size: 8, kinds: 5, goal: 16 },
}

// 五款嗎哪形態(都是「如白霜的小圓物」的白色系,靠形狀+微色差分辨)
const KINDS = ['pearl', 'wafer', 'swirl', 'clump', 'crumb']

const T = {
  title: '🍞 嗎哪收取',
  ref: '出埃及記 16:14-18',
  intro1: '「露水上升之後，不料，野地面上有如白霜的小圓物。以色列人看見，不知道是甚麼，就彼此對問說：「這是甚麼呢？」」(出 16:14-15)',
  how: '野地上滿是嗎哪!點一塊、再點旁邊的一塊交換位置;排成一排 3 個同款就「收取」進俄梅珥罐,新的嗎哪會從天上降下來補。收滿目標罐數,全營都夠吃!放心慢慢收——沒有步數限制。',
  pick: '天亮了,露水上升。選一片野地:',
  hud: (o, goal) => `🍞 已收 ${o}/${goal} 俄梅珥`,
  gather: '收取!裝進俄梅珥罐',
  cascade: '嗎哪又降下來了…',
  shuffle: '風把嗎哪吹勻了…',
  noswap: '這樣換不成一排——輕輕放回去',
  closeLine: '多收的也沒有餘，少收的也沒有缺。(出 16:18)',
  winTitle: '🎉 全營都夠吃了!',
  winVerse: '及至用俄梅珥量一量，多收的也沒有餘，少收的也沒有缺；各人按著自己的飯量收取。',
  winRef: '出埃及記 16:18',
  teachVerse: '我們日用的飲食，今日賜給我們。',
  teachRef: '馬太福音 6:11',
  teach: '嗎哪天天降、天天收,多收的沒有餘、少收的沒有缺——神給的永遠剛剛好。主耶穌教我們禱告「日用的飲食,今日賜給我們」:不求囤一輩子,只求今天夠用,因為明天早晨,恩典又是新的。',
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
    this._onResize = () => this._resize()
    this.grid = [] // [r][c] = { kind, dy(下落視覺位移), swapX/swapY(交換視覺位移) }
    this.sel = null // {r,c} 已選中的嗎哪
    this.lock = 0 // 動畫鎖(秒):落下/換回期間不吃輸入
    this.collected = 0 // 已收塊數
    this.flyers = [] // 收進罐的動畫
    this.shakeBack = null // 換不成的回彈 {a:{r,c},b:{r,c},t}
    this.toasts = []
    this.closeT = 0
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKeyDown)
    this.cv.addEventListener('pointerdown', this._onDown)
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
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _kindsPool() { return KINDS.slice(0, this.cfg.kinds) }
  _rand() { const p = this._kindsPool(); return p[Math.floor(Math.random() * p.length)] }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    const n = this.cfg.size
    // 起手盤:保證無現成 3 連(逐格放,避開左二/上二同款)
    this.grid = []
    for (let r = 0; r < n; r++) {
      this.grid.push([])
      for (let c = 0; c < n; c++) {
        let k
        do { k = this._rand() } while (
          (c >= 2 && this.grid[r][c - 1].kind === k && this.grid[r][c - 2].kind === k) ||
          (r >= 2 && this.grid[r - 1][c].kind === k && this.grid[r - 2][c].kind === k)
        )
        this.grid[r].push({ kind: k, dy: -(n - r) * 40 - 60 }) // 開場從天而降
      }
    }
    this.sel = null
    this.lock = 0.5
    this.collected = 0
    this.flyers = []
    this.toasts = []
    this.state = 'play'
    if (!this._hasMove()) this._shuffle(false)
  }

  _omers() { return Math.floor(this.collected / OMER) }

  // 盤面幾何(棋盤置中偏左,右側留給俄梅珥罐)
  _geo() {
    const n = this.cfg.size
    const D = Math.min(420 / n, 58)
    const bw = D * n
    return { n, D, x0: VW * 0.40 - bw / 2, y0: (VH - bw) / 2 + 14 }
  }
  _cellXY(r, c, g) { return { x: g.x0 + c * g.D + g.D / 2, y: g.y0 + r * g.D + g.D / 2 } }

  // —— 配對邏輯 ——
  _findMatches(grid) {
    const n = this.cfg.size
    const hit = new Set()
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const k = grid[r][c].kind
      if (!k) continue
      if (c + 2 < n && grid[r][c + 1].kind === k && grid[r][c + 2].kind === k) { hit.add(r + ',' + c); hit.add(r + ',' + (c + 1)); hit.add(r + ',' + (c + 2)) }
      if (r + 2 < n && grid[r + 1][c].kind === k && grid[r + 2][c].kind === k) { hit.add(r + ',' + c); hit.add((r + 1) + ',' + c); hit.add((r + 2) + ',' + c) }
    }
    return hit
  }

  _hasMove() {
    const n = this.cfg.size
    const g = this.grid
    const trySwap = (r1, c1, r2, c2) => {
      const a = g[r1][c1].kind, b = g[r2][c2].kind
      g[r1][c1].kind = b; g[r2][c2].kind = a
      const ok = this._findMatches(g).size > 0
      g[r1][c1].kind = a; g[r2][c2].kind = b
      return ok
    }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (c + 1 < n && trySwap(r, c, r, c + 1)) return true
      if (r + 1 < n && trySwap(r, c, r + 1, c)) return true
    }
    return false
  }

  _shuffle(toast = true) {
    // 溫柔重洗:同一批嗎哪重新排(進度保留),直到有解且無現成 3 連
    const n = this.cfg.size
    const flat = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) flat.push(this.grid[r][c].kind)
    let tries = 0
    do {
      for (let i = flat.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [flat[i], flat[j]] = [flat[j], flat[i]] }
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { this.grid[r][c].kind = flat[r * n + c]; this.grid[r][c].dy = -40 }
    } while ((this._findMatches(this.grid).size > 0 || !this._hasMove()) && ++tries < 60)
    this.lock = 0.4
    if (toast) { this.toasts.push({ text: T.shuffle, t: this._t }); this._tone(320, 0.15, 0, 'sine', 0.07) }
  }

  // 收取所有現成 3 連 → 重力補位(天降);回傳這次收了幾塊
  _resolve() {
    const g = this._geo()
    const hit = this._findMatches(this.grid)
    if (!hit.size) return 0
    for (const key of hit) {
      const [r, c] = key.split(',').map(Number)
      const p = this._cellXY(r, c, g)
      this.flyers.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, kind: this.grid[r][c].kind, t: 0 })
      this.grid[r][c].kind = null
    }
    // 重力:每欄非空往下沉,頂上補新的(從天而降)
    const n = this.cfg.size
    for (let c = 0; c < n; c++) {
      let write = n - 1
      for (let r = n - 1; r >= 0; r--) {
        if (this.grid[r][c].kind) {
          if (write !== r) {
            this.grid[write][c].kind = this.grid[r][c].kind
            this.grid[write][c].dy = -(write - r) * g.D
            this.grid[r][c].kind = null
          }
          write--
        }
      }
      for (let r = write; r >= 0; r--) {
        this.grid[r][c].kind = this._rand()
        this.grid[r][c].dy = -(write + 1) * g.D - 60
      }
    }
    this._tone(523, 0.1, 0, 'triangle', 0.1); this._tone(659, 0.14, 0.08, 'triangle', 0.1)
    return hit.size
  }

  _update(dt) {
    if (this.state === 'close') {
      this.closeT -= dt
      if (this.closeT <= 0) this._win()
    }
    // 下落視覺位移收斂
    if (this.grid.length) {
      for (const row of this.grid) for (const cell of row) {
        if (cell.dy) { cell.dy += (0 - cell.dy) * Math.min(1, dt * 9); if (Math.abs(cell.dy) < 1) cell.dy = 0 }
      }
    }
    if (this.lock > 0) {
      this.lock -= dt
      if (this.lock <= 0 && this.state === 'play') {
        // 動畫鎖結束:連鎖收取(cascade)
        const got = this._resolve()
        if (got) {
          this.collected += got
          this.toasts.push({ text: this.collected % OMER === 0 ? T.gather : T.cascade, t: this._t })
          this.lock = 0.45
        } else if (this._omers() >= this.cfg.goal) {
          this.state = 'close'
          this.closeT = 2.2
          this._tone(392, 0.2, 0, 'triangle', 0.1); this._tone(523, 0.3, 0.18, 'triangle', 0.1)
        } else if (!this._hasMove()) this._shuffle()
      }
    }
    if (this.shakeBack) { this.shakeBack.t -= dt; if (this.shakeBack.t <= 0) this.shakeBack = null }
    for (const f of this.flyers) {
      f.t += dt * 1.5
      const k = Math.min(1, f.t)
      const ease = k * k * (3 - 2 * k)
      f.x = f.sx + (JAR.x - f.sx) * ease
      f.y = f.sy + (JAR.y - f.sy) * ease - Math.sin(k * Math.PI) * 60
    }
    this.flyers = this.flyers.filter((f) => f.t < 1)
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'manna' }) }, 900)
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
    if (this.state !== 'play' || this.lock > 0) return
    const g = this._geo()
    const c = Math.floor((x - g.x0) / g.D)
    const r = Math.floor((y - g.y0) / g.D)
    if (r < 0 || c < 0 || r >= g.n || c >= g.n) { this.sel = null; return }
    if (!this.sel) { this.sel = { r, c }; this._tone(500, 0.05, 0, 'sine', 0.05); return }
    const { r: r0, c: c0 } = this.sel
    if (r0 === r && c0 === c) { this.sel = null; return }
    const adjacent = Math.abs(r0 - r) + Math.abs(c0 - c) === 1
    if (!adjacent) { this.sel = { r, c }; this._tone(500, 0.05, 0, 'sine', 0.05); return }
    // 交換相鄰:成 3 連才成立,否則溫柔換回
    const a = this.grid[r0][c0], b = this.grid[r][c]
    ;[a.kind, b.kind] = [b.kind, a.kind]
    if (this._findMatches(this.grid).size > 0) {
      this.sel = null
      this.lock = 0.05 // 下一幀觸發 _resolve
      this._tone(440, 0.06, 0, 'sine', 0.07)
    } else {
      ;[a.kind, b.kind] = [b.kind, a.kind] // 換回
      this.shakeBack = { a: { r: r0, c: c0 }, b: { r, c }, t: 0.35 }
      this.toasts.push({ text: T.noswap, t: this._t })
      this.sel = null
      this._tone(220, 0.1, 0, 'sine', 0.06)
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

  _view() {
    const s = Math.min(this.W / VW, this.H / VH)
    return { s, ox: (this.W - VW * s) / 2, oy: (this.H - VH * s) / 2 }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 清晨曠野(露水上升)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#d8e2e8'); sky.addColorStop(0.55, '#d8d4be'); sky.addColorStop(1, '#c0aa84')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    const g = this._geo()
    // 野地盤面底
    ctx.fillStyle = 'rgba(150,124,84,0.25)'
    rM(ctx, g.x0 - 10, g.y0 - 10, g.D * g.n + 20, g.D * g.n + 20, 14); ctx.fill()
    // 格線(淡)
    ctx.strokeStyle = 'rgba(120,100,64,0.18)'; ctx.lineWidth = 1
    for (let i = 1; i < g.n; i++) {
      ctx.beginPath(); ctx.moveTo(g.x0 + i * g.D, g.y0); ctx.lineTo(g.x0 + i * g.D, g.y0 + g.n * g.D); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(g.x0, g.y0 + i * g.D); ctx.lineTo(g.x0 + g.n * g.D, g.y0 + i * g.D); ctx.stroke()
    }
    // 嗎哪
    for (let r = 0; r < g.n; r++) for (let c = 0; c < g.n; c++) {
      const cell = this.grid[r][c]
      if (!cell.kind) continue
      const p = this._cellXY(r, c, g)
      let dx = 0
      if (this.shakeBack) {
        const sb = this.shakeBack
        if ((sb.a.r === r && sb.a.c === c) || (sb.b.r === r && sb.b.c === c)) dx = Math.sin(this._t * 40) * 3
      }
      const selHere = this.sel && this.sel.r === r && this.sel.c === c
      if (selHere) {
        ctx.strokeStyle = '#e8a030'; ctx.lineWidth = 3
        rM(ctx, g.x0 + c * g.D + 3, g.y0 + r * g.D + 3, g.D - 6, g.D - 6, 10); ctx.stroke()
      }
      this._manna(p.x + dx, p.y + cell.dy, g.D * 0.38, cell.kind, selHere)
    }
    // 收進罐的飛行嗎哪
    for (const f of this.flyers) this._manna(f.x, f.y, 16 * (1 - f.t * 0.3), f.kind)
    // 右側:俄梅珥罐牆(goal 個,已滿的發亮)
    this._jars()
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#4a3c1c'; ctx.strokeStyle = 'rgba(255,252,240,0.9)'; ctx.lineWidth = 4
      ctx.font = 'bold 19px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW * 0.40, 40 - k * 14)
      ctx.fillText(t.text, VW * 0.40, 40 - k * 14)
      ctx.globalAlpha = 1
    }
    // 關門句
    if (this.state === 'close' || this.state === 'win') {
      ctx.fillStyle = '#4a3c1c'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(T.closeLine, VW / 2, VH - 26)
    }
    // HUD
    ctx.fillStyle = 'rgba(74,60,28,0.62)'
    rM(ctx, VW * 0.20, VH - 44, VW * 0.4, 30, 12); ctx.fill()
    ctx.fillStyle = '#faf4dc'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this._omers(), this.cfg.goal)} ・ 點兩塊相鄰的交換`, VW * 0.40, VH - 24)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 右側俄梅珥罐(陶罐直欄,滿一罐亮一罐;進度=collected)
  _jars() {
    const { ctx } = this
    const goal = this.cfg.goal
    const cols = goal > 10 ? 2 : 1
    const rows = Math.ceil(goal / cols)
    const jw = 44, jh = Math.min(46, 380 / rows)
    const x0 = JAR.x - (cols === 2 ? jw + 6 : jw / 2)
    const done = this._omers()
    const frac = (this.collected % OMER) / OMER
    for (let i = 0; i < goal; i++) {
      const col = cols === 2 ? i % 2 : 0
      const row = cols === 2 ? Math.floor(i / 2) : i
      const jx = x0 + col * (jw + 12)
      const jy = 80 + row * (jh + 6)
      const full = i < done
      const filling = i === done ? frac : 0
      // 陶罐形
      ctx.fillStyle = full ? '#b0824a' : 'rgba(176,130,74,0.3)'
      rM(ctx, jx, jy + jh * 0.18, jw, jh * 0.82, 10); ctx.fill()
      ctx.fillStyle = full ? '#8a6234' : 'rgba(138,98,52,0.3)'
      rM(ctx, jx + jw * 0.2, jy, jw * 0.6, jh * 0.24, 5); ctx.fill()
      if (!full && filling > 0) { // 正在裝的一罐:白色嗎哪面升高
        ctx.fillStyle = '#f4efe0'
        const fh = (jh * 0.7) * filling
        rM(ctx, jx + 5, jy + jh - fh - 4, jw - 10, fh, 6); ctx.fill()
      }
      if (full) {
        ctx.fillStyle = '#f8f4e6'
        ctx.beginPath(); ctx.ellipse(jx + jw / 2, jy + jh * 0.24, jw * 0.26, 5, 0, 0, 7); ctx.fill()
      }
    }
    ctx.fillStyle = '#4a3c1c'
    ctx.font = '13px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('俄梅珥罐', JAR.x, 66)
  }

  // 一塊嗎哪(五款:珠/片/捲/團/屑——都是白霜色系,形狀分辨)
  _manna(x, y, r, kind, glow = false) {
    const { ctx } = this
    if (glow) {
      ctx.fillStyle = 'rgba(255,240,190,0.35)'
      ctx.beginPath(); ctx.arc(x, y, r * 1.4, 0, 7); ctx.fill()
    }
    if (kind === 'pearl') { // 珠:純白圓珠+高光
      ctx.fillStyle = '#f7f5ee'
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, 7); ctx.fill()
      ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke()
    } else if (kind === 'wafer') { // 片:扁薄餅(蜜色)
      ctx.fillStyle = '#efe3c2'
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.05, r * 0.62, 0, 0, 7); ctx.fill()
      ctx.strokeStyle = '#cdbb90'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.05, r * 0.62, 0, 0, 7); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(x, y - r * 0.12, r * 0.62, r * 0.3, 0, 0, 7); ctx.stroke()
    } else if (kind === 'swirl') { // 捲:奶油色螺旋
      ctx.fillStyle = '#f2ecd8'
      ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, 7); ctx.fill()
      ctx.strokeStyle = '#c8ba92'; ctx.lineWidth = 2
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 4; a += 0.3) {
        const rr = (a / (Math.PI * 4)) * r * 0.75
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()
    } else if (kind === 'clump') { // 團:三小球相連(象牙白)
      ctx.fillStyle = '#f0ead6'
      ctx.beginPath(); ctx.arc(x - r * 0.4, y + r * 0.2, r * 0.55, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.4, y + r * 0.2, r * 0.55, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.55, 0, 7); ctx.fill()
      ctx.strokeStyle = '#cec29a'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.55, 0, 7); ctx.stroke()
    } else { // crumb 屑:一撮小碎粒(米白)
      ctx.fillStyle = '#f5f0e2'
      const pts = [[-0.5, -0.2], [0.1, -0.5], [0.55, 0.05], [0.15, 0.45], [-0.35, 0.4]]
      for (const [ux, uy] of pts) {
        ctx.beginPath(); ctx.arc(x + ux * r, y + uy * r, r * 0.26, 0, 7); ctx.fill()
      }
      ctx.strokeStyle = '#d2c69e'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(x + 0.15 * r, y + 0.45 * r, r * 0.26, 0, 7); ctx.stroke()
    }
  }

  _drawIntro() {
    const { ctx } = this
    cardM(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a4416'
    ctx.font = 'bold 36px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#8a7a4a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 日用的飲食', VW / 2, VH * 0.24)
    ctx.fillStyle = '#3e3418'
    wrapM(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapM(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#8a7a4a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.68)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.73
      ctx.fillStyle = '#d8c078'
      rM(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#3a2c06'
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
    ctx.fillStyle = '#fcf8ec' // 全不透明
    ctx.strokeStyle = '#b09a50'; ctx.lineWidth = 3
    rM(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a4416'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.16)
    ctx.fillStyle = '#8a7a4a'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`收滿 ${this.cfg.goal} 俄梅珥——不多也不少,剛剛好`, W / 2, H * 0.24)
    ctx.fillStyle = '#3e3418'
    wrapM(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.32, W * 0.66, H * 0.045)
    ctx.fillStyle = '#6a5a1a'
    wrapM(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.5, W * 0.66, H * 0.043)
    ctx.fillStyle = '#3e3418'
    wrapM(ctx, T.teach, W / 2, H * 0.6, W * 0.66, H * 0.042)
    ctx.restore()
  }
}

const JAR = { x: 828, y: 90 }

function rM(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardM(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(252,248,236,0.96)'
  ctx.strokeStyle = '#b09a50'; ctx.lineWidth = 3
  rM(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapM(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
