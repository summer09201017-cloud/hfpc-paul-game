// 好牧人尋羊(路加福音 15:3-7)——系列第一個「迷宮尋路」關。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:路 15:4、15:5-6、15:7),牧者審核通過前不進大廳卡。
//
// 玩法:你是尋羊的牧人。九十九隻羊安穩在羊圈,一隻迷失在迷宮般的曠野裡——
//   ①「尋找」:方向鍵/WASD/滑動,循著「咩~」的聲音找到那隻迷失的羊;
//   ②「扛回」:找著了,歡歡喜喜扛在肩上,把牠帶回羊圈門口——過關,朋友鄰舍一同歡喜。
// ★ 神學守法(反向 RPG):永不會輸(won 永遠 true)——「直到找著呢?」(15:4)牧人必找到底;
//   得勝不是玩家聰明,是牧人「非找到不可」的愛。走再多冤枉路都只是「找久一點」。
// 年齡三檔:幼(小迷宮)/童(中)/青(大迷宮+夜霧視野,像夜裡提燈尋羊)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;路 15:5-6 與 15:7 已烤進 manifest,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const CFG = {
  // 迷宮尺寸(必須是奇數):幼/童/青
  sizes: { young: { cols: 9, rows: 7 }, kid: { cols: 13, rows: 9 }, teen: { cols: 17, rows: 11 } },
  fogRadius: 3.2, // 青少年檔:夜霧可見半徑(格)
  bleatEvery: 6, // 每幾秒羊自動咩一聲(方向提示)
  moveMs: 110, // 一步的滑動動畫毫秒
}

const T = {
  title: '🐑 好牧人尋羊',
  ref: '路加福音 15:3-7',
  intro1: '一百隻羊,失去一隻。',
  intro2: '「你們中間誰有一百隻羊失去一隻,不把這九十九隻撇在曠野、去找那失去的羊,直到找著呢?」(路 15:4)',
  how: '方向鍵 / WASD / 滑動 = 走。循著「咩~」的聲音,在曠野裡找到那隻迷失的羊,再把牠扛回羊圈。',
  pick: '牧人出發前,選一條路:',
  ages: [
    { key: 'young', label: '🐣 幼', desc: '小小曠野' },
    { key: 'kid', label: '🙂 童', desc: '曠野' },
    { key: 'teen', label: '🔥 青', desc: '夜裡提燈尋羊' },
  ],
  findHud: '尋找迷失的羊…(聽「咩~」的方向)',
  carryHud: '找著了!扛在肩上,回羊圈 →',
  foundLine: '找著了,就歡歡喜喜的扛在肩上', // 路 15:5(逐字節錄,cuv 已核)
  winVerse: '找著了,就歡歡喜喜的扛在肩上,回到家裡,就請朋友鄰舍來,對他們說:我失去的羊已經找著了,你們和我一同歡喜罷!',
  winRef: '路加福音 15:5-6',
  teachVerse: '我告訴你們,一個罪人悔改,在天上也要這樣為他歡喜,較比為九十九個不用悔改的義人歡喜更大。',
  teachRef: '路加福音 15:7',
  teach: '迷路的羊不會自己回家——是牧人去找,直到找著。主耶穌就是那位好牧人:祂來,為要尋找拯救失喪的人。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → find → found(小節拍) → carry → win
    this.age = 'kid'
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = [] // intro 的年齡鈕點擊區
    this._onKey = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this._ptr = null
    this._audio = null
    this.steps = 0
    this.bleatT = 0
    this.toasts = [] // {text,x,y,t} 漂浮字(咩~)
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKey)
    this.cv.addEventListener('pointerdown', this._onDown)
    this.cv.addEventListener('pointerup', this._onUp)
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
    removeEventListener('keydown', this._onKey)
    this.cv.removeEventListener('pointerdown', this._onDown)
    this.cv.removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  // ── 迷宮生成(recursive backtracker;格值 1=牆 0=路)──
  _genMaze(cols, rows) {
    const g = Array.from({ length: rows }, () => Array(cols).fill(1))
    const carve = (x, y) => {
      g[y][x] = 0
      for (const [dx, dy] of shuffle([[2, 0], [-2, 0], [0, 2], [0, -2]])) {
        const nx = x + dx, ny = y + dy
        if (nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && g[ny][nx] === 1) {
          g[y + dy / 2][x + dx / 2] = 0
          carve(nx, ny)
        }
      }
    }
    carve(1, rows - 2)
    return g
  }

  _start(age) {
    this.age = age
    const { cols, rows } = CFG.sizes[age]
    this.cols = cols; this.rows = rows
    this.maze = this._genMaze(cols, rows)
    this.px = 1; this.py = rows - 2 // 牧人起點(羊圈門口)
    this.homeX = 1; this.homeY = rows - 2
    // 羊放在 BFS 最遠的路格(一定到得了)
    const far = this._farthest(this.px, this.py)
    this.sx = far.x; this.sy = far.y
    this.anim = null // {fx,fy,tx,ty,t0} 一步滑動
    this.steps = 0
    this.bleatT = 2
    this.state = 'find'
    this._beep(523, 0.08); this._beep(659, 0.08, 0.09)
  }

  _farthest(x0, y0) {
    const seen = new Set([`${x0},${y0}`])
    let q = [{ x: x0, y: y0 }], last = { x: x0, y: y0 }
    while (q.length) {
      const next = []
      for (const c of q) {
        last = c
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = c.x + dx, ny = c.y + dy, k = `${nx},${ny}`
          if (this.maze[ny]?.[nx] === 0 && !seen.has(k)) { seen.add(k); next.push({ x: nx, y: ny }) }
        }
      }
      if (next.length) q = next; else break
    }
    return last
  }

  // ── 輸入 ──
  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state === 'found' && (e.key === ' ' || e.key === 'Enter')) return this._carry()
    if (this.state === 'win') return
    const map = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] }
    const d = map[e.key]
    if (d) { e.preventDefault(); this._move(d[0], d[1]) }
  }
  _down(e) { this._ptr = { x: e.clientX, y: e.clientY } }
  _up(e) {
    if (this.state === 'intro') { this._hitIntro(e); this._ptr = null; return }
    if (this.state === 'found') { this._carry(); this._ptr = null; return }
    if (!this._ptr) return
    const dx = e.clientX - this._ptr.x, dy = e.clientY - this._ptr.y
    this._ptr = null
    if (Math.hypot(dx, dy) < 18) { this._bleat(true); return } // 點一下=請羊咩一聲(提示)
    if (Math.abs(dx) > Math.abs(dy)) this._move(Math.sign(dx), 0)
    else this._move(0, Math.sign(dy))
  }
  _hitIntro(e) {
    const r = this.cv.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * this.W
    const y = ((e.clientY - r.top) / r.height) * this.H
    for (const b of this._btns) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
    }
  }

  _move(dx, dy) {
    if (this.anim || (this.state !== 'find' && this.state !== 'carry')) return
    const nx = this.px + dx, ny = this.py + dy
    if (this.maze[ny]?.[nx] !== 0) { this._beep(180, 0.05); return } // 樹籬:輕輕擋一下,不懲罰
    this.anim = { fx: this.px, fy: this.py, tx: nx, ty: ny, t0: this._t }
    this.px = nx; this.py = ny
    this.steps++
    this._beep(340 + Math.random() * 40, 0.03)
  }

  _carry() {
    this.state = 'carry'
    this.bleatT = 4
  }

  _win() {
    this.state = 'win'
    this._beep(523, 0.12); this._beep(659, 0.12, 0.13); this._beep(784, 0.2, 0.27)
    // 朗讀鐵則:speakScripture(mp3 優先);這句已烤進 manifest
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    const score = Math.max(50, 100 - Math.max(0, this.steps - (this.cols + this.rows) * 2))
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score, level: 'shepherd' }) }, 900)
  }

  // ── 更新 ──
  _update(dt) {
    if (this.anim && this._t - this.anim.t0 > CFG.moveMs / 1000) this.anim = null
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.6)
    if (this.state === 'find') {
      this.bleatT -= dt
      if (this.bleatT <= 0) this._bleat()
      if (this.px === this.sx && this.py === this.sy && !this.anim) {
        this.state = 'found'
        this._beep(660, 0.15); this._beep(880, 0.25, 0.16)
      }
    } else if (this.state === 'carry') {
      if (this.px === this.homeX && this.py === this.homeY && !this.anim) this._win()
    }
  }

  _bleat(manual = false) {
    if (this.state !== 'find') return
    this.bleatT = CFG.bleatEvery
    this._beep(740, 0.09); this._beep(620, 0.12, 0.1) // 兩聲=咩~
    // 「咩~」漂浮字出現在「朝羊的方向」的畫面邊緣(聽聲辨位)
    const ang = Math.atan2(this.sy - this.py, this.sx - this.px)
    this.toasts.push({ text: '咩~', ang, t: this._t, manual })
  }

  // ── Web Audio 小音效(零音檔)──
  _beep(freq, dur, delay = 0) {
    try {
      if (!this._audio) this._audio = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._audio
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'triangle'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + delay + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + dur + 0.02)
    } catch {}
  }

  // ── 畫面 ──
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
    if (this.state === 'intro') return this._drawIntro()
    // 背景:白天草原;青少年檔=夜色
    const night = this.age === 'teen'
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    if (night) { sky.addColorStop(0, '#1c2447'); sky.addColorStop(1, '#2c3a2e') }
    else if (this.state === 'carry') { sky.addColorStop(0, '#f5c37a'); sky.addColorStop(1, '#8fae62') } // 黃昏扛羊回家
    else { sky.addColorStop(0, '#bfe0f2'); sky.addColorStop(1, '#9cc27a') }
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // 迷宮版面置中
    const pad = Math.min(W, H) * 0.05
    const cw = (W - pad * 2) / this.cols, ch = (H * 0.82 - pad) / this.rows
    const cell = Math.min(cw, ch)
    const ox = (W - cell * this.cols) / 2
    const oy = H * 0.1 + (H * 0.82 - cell * this.rows) / 2

    // 走道與樹籬
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const X = ox + x * cell, Y = oy + y * cell
        if (this.maze[y][x] === 1) {
          ctx.fillStyle = night ? '#17301f' : '#4c7a3d'
          rounded(ctx, X + cell * 0.04, Y + cell * 0.04, cell * 0.92, cell * 0.92, cell * 0.2)
          ctx.fill()
          ctx.fillStyle = night ? '#1e3b27' : '#5c8f49' // 樹籬亮頂
          rounded(ctx, X + cell * 0.1, Y + cell * 0.08, cell * 0.8, cell * 0.3, cell * 0.12)
          ctx.fill()
        } else {
          ctx.fillStyle = night ? 'rgba(240,230,200,0.06)' : 'rgba(255,250,235,0.25)'
          ctx.fillRect(X, Y, cell, cell)
        }
      }
    }

    // 羊圈(起點外):柵欄弧 + 一群小白點=九十九隻
    const hx = ox + this.homeX * cell + cell / 2, hy = oy + this.homeY * cell + cell / 2
    ctx.fillStyle = night ? '#d9d2b8' : '#fffdf2'
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(hx - cell * 1.1 + Math.cos(a) * cell * 0.55, hy + cell * 0.2 + Math.sin(a) * cell * 0.3, cell * 0.09, cell * 0.07, 0, 0, 7)
      ctx.fill()
    }
    ctx.fillStyle = night ? '#c9b98a' : '#7a5a2b'
    ctx.font = `${Math.max(11, cell * 0.28)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('羊圈(九十九隻)', hx - cell * 1.1, hy - cell * 0.55)

    // 迷失的羊(找到前才畫在迷宮裡)
    if (this.state === 'find') {
      const SX = ox + this.sx * cell + cell / 2, SY = oy + this.sy * cell + cell / 2
      const wob = Math.sin(this._t * 3) * cell * 0.02
      drawSheep(ctx, SX, SY + wob, cell * 0.36, night)
    }

    // 牧人(帶臉、拿杖;扛羊時羊在肩上)
    const ax = this.anim ? lerp(this.anim.fx, this.anim.tx, (this._t - this.anim.t0) / (CFG.moveMs / 1000)) : this.px
    const ay = this.anim ? lerp(this.anim.fy, this.anim.ty, (this._t - this.anim.t0) / (CFG.moveMs / 1000)) : this.py
    const PX = ox + ax * cell + cell / 2, PY = oy + ay * cell + cell / 2
    drawShepherd(ctx, PX, PY, cell * 0.42, this.state === 'carry' || this.state === 'found', night)

    // 夜霧(青少年):以牧人為中心的提燈光圈
    if (night && (this.state === 'find' || this.state === 'carry')) {
      const R = CFG.fogRadius * cell
      const fog = ctx.createRadialGradient(PX, PY, R * 0.45, PX, PY, R)
      fog.addColorStop(0, 'rgba(8,10,24,0)')
      fog.addColorStop(1, 'rgba(8,10,24,0.93)')
      ctx.fillStyle = fog
      ctx.fillRect(0, 0, W, H)
      // 提燈微光
      const lamp = ctx.createRadialGradient(PX, PY, 0, PX, PY, R * 0.5)
      lamp.addColorStop(0, 'rgba(255,214,120,0.18)')
      lamp.addColorStop(1, 'rgba(255,214,120,0)')
      ctx.fillStyle = lamp
      ctx.fillRect(0, 0, W, H)
    }

    // 「咩~」漂浮提示(朝羊方向的邊緣)
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.6
      const R = Math.min(W, H) * 0.32
      const tx = PX + Math.cos(t.ang) * R, ty = PY + Math.sin(t.ang) * R - k * 24
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fffdf2'
      ctx.strokeStyle = 'rgba(60,40,10,0.5)'
      ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(18, Math.min(W, H) * 0.045)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText('咩~', tx, ty)
      ctx.fillText('咩~', tx, ty)
      ctx.globalAlpha = 1
    }

    // HUD 頂條
    ctx.fillStyle = 'rgba(20,16,8,0.55)'
    rounded(ctx, W * 0.08, H * 0.02, W * 0.84, H * 0.062, 12)
    ctx.fill()
    ctx.fillStyle = '#ffe9b0'
    ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(this.state === 'carry' || this.state === 'found' ? T.carryHud : T.findHud, W / 2, H * 0.062)

    if (this.state === 'found') this._drawFound()
    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#bfe0f2'); sky.addColorStop(1, '#9cc27a')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    card(ctx, W * 0.08, H * 0.08, W * 0.84, H * 0.84)
    ctx.fillStyle = '#6b4a1b'
    ctx.textAlign = 'center'
    ctx.font = `bold ${Math.max(22, H * 0.075)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.21)
    ctx.font = `${Math.max(13, H * 0.034)}px "Noto Sans TC",sans-serif`
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.ref + ' ・ ' + T.intro1, W / 2, H * 0.29)
    ctx.fillStyle = '#4a3a20'
    wrapText(ctx, T.intro2, W / 2, H * 0.38, W * 0.72, H * 0.05)
    wrapText(ctx, T.how, W / 2, H * 0.55, W * 0.72, H * 0.048)
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.pick, W / 2, H * 0.68)
    // 年齡三鈕
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    T.ages.forEach((a, i) => {
      const x = x0 + i * (bw + gap), y = H * 0.72
      ctx.fillStyle = '#f0b23e'
      rounded(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key: a.key })
    })
  }

  _drawFound() {
    const { ctx, W, H } = this
    card(ctx, W * 0.14, H * 0.3, W * 0.72, H * 0.4)
    ctx.fillStyle = '#6b4a1b'
    ctx.textAlign = 'center'
    ctx.font = `bold ${Math.max(18, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 找著了!', W / 2, H * 0.42)
    ctx.fillStyle = '#4a3a20'
    wrapText(ctx, `「${T.foundLine}」(路 15:5)`, W / 2, H * 0.5, W * 0.6, H * 0.05)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(12, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText('點畫面 / 按空白鍵,扛著牠回羊圈 →', W / 2, H * 0.63)
  }

  _drawWin() {
    const { ctx, W, H } = this
    card(ctx, W * 0.1, H * 0.12, W * 0.8, H * 0.76)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 你們和我一同歡喜罷!', W / 2, H * 0.24)
    ctx.fillStyle = '#4a3a20'
    wrapText(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.32, W * 0.68, H * 0.048)
    ctx.fillStyle = '#7a5222'
    wrapText(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.56, W * 0.68, H * 0.045)
    ctx.fillStyle = '#4a3a20'
    wrapText(ctx, T.teach, W / 2, H * 0.75, W * 0.68, H * 0.045)
  }
}

// ── 小工具與向量小人(零美術檔;守 l6 鐵則:人物有臉)──
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
function lerp(a, b, k) { return a + (b - a) * Math.min(1, Math.max(0, k)) }
function rounded(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,251,238,0.95)'
  ctx.strokeStyle = '#c8a35a'
  ctx.lineWidth = 3
  rounded(ctx, x, y, w, h, 18)
  ctx.fill(); ctx.stroke()
}
function wrapText(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  const chars = String(text).split('')
  let line = '', yy = y
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
function drawSheep(ctx, x, y, r, night) {
  ctx.fillStyle = night ? '#e8e2cc' : '#fffdf2'
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.72, 0, 0, 7); ctx.fill() // 身
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - r * 0.7 + i * r * 0.35, y - r * 0.5, r * 0.22, 0, 7); ctx.fill() } // 毛
  ctx.fillStyle = '#4a3a2a'
  ctx.beginPath(); ctx.ellipse(x + r * 0.95, y - r * 0.15, r * 0.34, r * 0.28, 0, 0, 7); ctx.fill() // 頭
  ctx.fillStyle = '#fff' // 眼(有臉!)
  ctx.beginPath(); ctx.arc(x + r * 1.05, y - r * 0.22, r * 0.07, 0, 7); ctx.fill()
  ctx.fillStyle = '#222'
  ctx.beginPath(); ctx.arc(x + r * 1.06, y - r * 0.22, r * 0.035, 0, 7); ctx.fill()
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = Math.max(1.5, r * 0.12)
  for (const lx of [-0.45, -0.15, 0.2, 0.5]) { ctx.beginPath(); ctx.moveTo(x + r * lx, y + r * 0.55); ctx.lineTo(x + r * lx, y + r * 0.95); ctx.stroke() } // 腿
}
function drawShepherd(ctx, x, y, r, carrying, night) {
  const skin = '#e8b98a', robe = night ? '#7a5a9c' : '#8a5a3a'
  ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = Math.max(2, r * 0.12)
  ctx.beginPath(); ctx.moveTo(x + r * 0.72, y - r * 1.1); ctx.lineTo(x + r * 0.72, y + r * 0.9) // 杖桿(握在手側)
  ctx.stroke()
  ctx.beginPath(); ctx.arc(x + r * 0.55, y - r * 1.08, r * 0.2, Math.PI * 0.1, Math.PI * 1.1); ctx.stroke() // 杖鉤
  ctx.fillStyle = robe
  rounded(ctx, x - r * 0.5, y - r * 0.45, r, r * 1.3, r * 0.3); ctx.fill() // 袍
  ctx.fillStyle = skin
  ctx.beginPath(); ctx.arc(x, y - r * 0.75, r * 0.34, 0, 7); ctx.fill() // 頭
  ctx.fillStyle = '#fff' // 眼
  ctx.beginPath(); ctx.arc(x - r * 0.1, y - r * 0.8, r * 0.06, 0, 7); ctx.arc(x + r * 0.12, y - r * 0.8, r * 0.06, 0, 7); ctx.fill()
  ctx.fillStyle = '#222'
  ctx.beginPath(); ctx.arc(x - r * 0.09, y - r * 0.8, r * 0.03, 0, 7); ctx.arc(x + r * 0.13, y - r * 0.8, r * 0.03, 0, 7); ctx.fill()
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = Math.max(1.2, r * 0.06)
  ctx.beginPath(); ctx.arc(x + r * 0.01, y - r * 0.68, r * 0.12, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke() // 微笑
  ctx.fillStyle = night ? '#c9b98a' : '#d9c07a'
  rounded(ctx, x - r * 0.55, y - r * 0.98, r * 1.1, r * 0.22, r * 0.1); ctx.fill() // 頭巾
  if (carrying) drawSheep(ctx, x - r * 0.05, y - r * 1.28, r * 0.42, night) // 羊扛肩上(路 15:5)
  // 提燈(夜)
  if (night) {
    ctx.fillStyle = '#ffd678'
    ctx.beginPath(); ctx.arc(x - r * 0.72, y - r * 0.1, r * 0.16, 0, 7); ctx.fill()
    ctx.strokeStyle = '#8a6a33'; ctx.lineWidth = r * 0.06
    ctx.beginPath(); ctx.moveTo(x - r * 0.72, y - r * 0.35); ctx.lineTo(x - r * 0.72, y - r * 0.26); ctx.stroke()
  }
}
