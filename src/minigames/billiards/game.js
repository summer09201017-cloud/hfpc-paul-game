// 🎱 花式撞球(billiards)——憫安製作休閒關(不掛經文,進大廳「休閒運動合輯」)。
// ⚠ 休閒關,刻意不掛聖經經文(同 goalkick/soccer/football/baseball 前例);無 cuv/tts/送審這一套。
//
// 「真正的撞球」(07-10 使用者點名):頂視球桌+六個袋口+真物理入袋——
//   herd(趕羊入圈)是撞球物理的「反向化」(歸聚不落袋);這關把它轉正:圓-圓彈性碰撞+
//   顆星反彈+摩擦漸停+子步進防穿透,球進袋就真的掉進去。
// 規則(簡化雙色制,溫柔版):你=藍組、對手=紅組,各 N 顆(N 玩家輸入 2~7);
//   把自己組的球全部打進袋=獲勝。打進自己的球=繼續打;沒進或打進對方的=換人
//   (打進對方的就算對方的進帳,不罰);白球洗袋=擺回開球點、換人,不多罰。
// 操作:輪到你時「按住拖曳」瞄準(拉桿式:往後拉=蓄力,放開=出桿);瞄準線+假想球提示
//   (年齡檔越小提示越長)。🤖 對戰阿福教練/👥 雙人同機輪流。
// 溫柔規則:沒有犯規連環罰;輸了=「練習賽結束!」,onComplete 永遠 won:true。
// 年齡三檔:幼(袋口大・全程瞄準提示)/童(標準)/青(袋口小・提示只剩短線)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。

const VW = 960
const VH = 540
// 球桌(呢面=球可活動範圍)
const TB = { x: 90, y: 84, w: 780, h: 380 }
const BR = 13 // 球半徑
const CUE_START = { x: TB.x + 160, y: TB.y + TB.h / 2 } // 白球開球點
const SIZE_MIN = 2, SIZE_MAX = 7 // 每組幾球(玩家輸入)
const FRICTION = 0.38 // 摩擦(每秒速度保留比;指數衰減)——大力一桿約 4~5 秒內全停,課堂節奏
const STOP_V = 8 // 低於這個速度=停
const CUSHION = 0.88 // 顆星反彈保留

// guide:'full'=瞄準線+假想球+目標球走向(長) / 'mid'=假想球+短走向 / 'short'=只有到第一顆的短線
// aiErr=阿福出桿角度誤差(弧度,越小越準)
const AGES = {
  young: { label: '🐣 幼', desc: '袋口大・全程提示', pocketR: 27, guide: 'full', aiErr: 0.11 },
  kid: { label: '🙂 童', desc: '標準', pocketR: 23, guide: 'mid', aiErr: 0.055 },
  teen: { label: '🔥 青', desc: '袋口小・提示短', pocketR: 20, guide: 'short', aiErr: 0.025 },
}

const T = {
  title: '🎱 花式撞球',
  sub: '憫安製作・真物理入袋',
  how: '真正的撞球!輪到你時,在畫面上「按住往後拉」瞄準白球(像拉球桿:拉越遠力越大),放開=出桿。把你的藍球全部打進袋就獲勝——打進自己的球可以繼續打;白球掉進袋也沒關係,擺回來換人就好。每組幾顆球由你決定!',
  how2p: '👥 雙人同機:同一支滑鼠/手指輪流出桿——P1 藍組、P2 紅組,先清光自己顏色的贏。',
  pickMode: '選賽制:',
  pickSize: '每組幾球:',
  pickAge: '選難度:',
  modeAI: '🤖 對戰阿福教練',
  modeAIDesc: '阿福拿紅組',
  mode2P: '👥 雙人同機',
  mode2PDesc: '輪流出桿 PK',
  potOwn: '🎱 進袋!再來一桿',
  potFoe: '😯 幫對面進了一顆…',
  potCue: '⚪ 白球洗袋,擺回來',
  miss: '換對面出桿',
  yourTurn: '輪到你!按住拖曳瞄準',
  p1Turn: 'P1(藍)出桿',
  p2Turn: 'P2(紅)出桿',
  afuTurn: '阿福瞄準中…',
  endWin: '🏆 清台!你贏了!',
  endLose: '🎱 練習賽結束!',
  end2p: (w) => `🏆 ${w === 1 ? 'P1(藍)' : 'P2(紅)'} 清台獲勝!`,
  teach: '撞球是安靜的功夫——看好角度、輕輕出桿,比大力亂打更會進。沒進也沒關係,下一桿永遠是新的機會!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → aim ⇄ rolling → done
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this._sizeBtns = []
    this.mode = 'ai'
    this.teamSize = 4 // 每組幾球(玩家開場輸入)
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._move(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.balls = [] // {x,y,vx,vy,team:'cue'|1|2,in:false,sinkT,px,py(袋位)}
    this.turn = 1 // 1=藍(玩家/P1)、2=紅(阿福/P2)
    this.aim = null // {x,y} 目前拖曳點(拉桿)
    this.aiT = 0
    this.pottedThisShot = [] // 這一桿進袋的球
    this.shotBy = 1
    this.bubble = ''
    this.toasts = []
    this._clickCd = 0 // 碰撞音效節流
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

  // 六個袋口(四角+上下邊中點)
  _pockets() {
    const r = this.cfg.pocketR
    return [
      { x: TB.x, y: TB.y, r },
      { x: TB.x + TB.w / 2, y: TB.y - 4, r: r * 0.92 },
      { x: TB.x + TB.w, y: TB.y, r },
      { x: TB.x, y: TB.y + TB.h, r },
      { x: TB.x + TB.w / 2, y: TB.y + TB.h + 4, r: r * 0.92 },
      { x: TB.x + TB.w, y: TB.y + TB.h, r },
    ]
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.turn = 1
    this.toasts = []
    this.bubble = this.mode === 'ai' ? '先請!' : ''
    this._rack()
    this.state = 'aim'
    this.aim = null
  }

  // 排球:白球在左;兩組球在右側排三角(交錯藍紅),彼此留空隙
  _rack() {
    this.balls = [{ x: CUE_START.x, y: CUE_START.y, vx: 0, vy: 0, team: 'cue', in: false, sinkT: 0 }]
    const n = this.teamSize
    const order = []
    for (let i = 0; i < n * 2; i++) order.push(i % 2 === 0 ? 1 : 2) // 交錯藍紅
    const apex = { x: TB.x + TB.w - 200, y: TB.y + TB.h / 2 }
    const gap = BR * 2 + 3
    let idx = 0
    for (let row = 0; idx < order.length; row++) {
      for (let k = 0; k <= row && idx < order.length; k++) {
        this.balls.push({
          x: apex.x + row * gap * 0.9,
          y: apex.y + (k - row / 2) * gap,
          vx: 0, vy: 0,
          team: order[idx],
          in: false, sinkT: 0,
        })
        idx++
      }
    }
  }

  _cue() { return this.balls.find((b) => b.team === 'cue') }
  _left(team) { return this.balls.filter((b) => b.team === team && !b.in).length }
  _moving() { return this.balls.some((b) => !b.in && (Math.abs(b.vx) > 0.01 || Math.abs(b.vy) > 0.01)) }
  _isAiTurn() { return this.mode === 'ai' && this.turn === 2 }

  // 出桿
  _shoot(dirX, dirY, power) {
    const cue = this._cue()
    if (!cue || cue.in) return
    const l = Math.hypot(dirX, dirY) || 1
    const sp = 260 + power * 940
    cue.vx = (dirX / l) * sp
    cue.vy = (dirY / l) * sp
    this.shotBy = this.turn
    this.pottedThisShot = []
    this.state = 'rolling'
    this.aim = null
    this._tone(200, 0.06, 0, 'square', 0.1)
  }

  _update(dt) {
    if (this.state === 'intro' || this.state === 'done') return
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8) // aim 狀態也要清,不累積
    this._clickCd = Math.max(0, this._clickCd - dt)
    if (this.state === 'aim') {
      // 阿福回合:思考後自動出桿
      if (this._isAiTurn()) {
        this.aiT -= dt
        if (this.aiT <= 0) this._aiShoot()
      }
      return
    }
    if (this.state !== 'rolling') return
    // —— 物理:子步進(防高速穿透) ——
    const SUB = 4
    const h = dt / SUB
    const pockets = this._pockets()
    for (let s = 0; s < SUB; s++) {
      for (const b of this.balls) {
        if (b.in) continue
        b.x += b.vx * h
        b.y += b.vy * h
        // 顆星(袋口附近不反彈,讓球掉得進去)
        const nearPocket = pockets.some((p) => Math.hypot(b.x - p.x, b.y - p.y) < p.r + BR * 0.6)
        if (!nearPocket) {
          if (b.x < TB.x + BR) { b.x = TB.x + BR; b.vx = Math.abs(b.vx) * CUSHION; this._thud(b) }
          if (b.x > TB.x + TB.w - BR) { b.x = TB.x + TB.w - BR; b.vx = -Math.abs(b.vx) * CUSHION; this._thud(b) }
          if (b.y < TB.y + BR) { b.y = TB.y + BR; b.vy = Math.abs(b.vy) * CUSHION; this._thud(b) }
          if (b.y > TB.y + TB.h - BR) { b.y = TB.y + TB.h - BR; b.vy = -Math.abs(b.vy) * CUSHION; this._thud(b) }
        }
        // 進袋
        for (const p of pockets) {
          if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) { this._pot(b, p); break }
        }
      }
      // 球-球彈性碰撞(等質量)
      for (let i = 0; i < this.balls.length; i++) {
        for (let j = i + 1; j < this.balls.length; j++) {
          const a = this.balls[i], c = this.balls[j]
          if (a.in || c.in) continue
          const dx = c.x - a.x, dy = c.y - a.y
          const d = Math.hypot(dx, dy)
          if (d > 0 && d < BR * 2) {
            const nx = dx / d, ny = dy / d
            const ov = (BR * 2 - d) / 2
            a.x -= nx * ov; a.y -= ny * ov
            c.x += nx * ov; c.y += ny * ov
            // 沿法線交換速度分量
            const va = a.vx * nx + a.vy * ny
            const vc = c.vx * nx + c.vy * ny
            const impact = Math.abs(va - vc)
            a.vx += (vc - va) * nx; a.vy += (vc - va) * ny
            c.vx += (va - vc) * nx; c.vy += (va - vc) * ny
            if (impact > 60 && this._clickCd <= 0) {
              this._tone(900 + Math.random() * 300, 0.03, 0, 'square', Math.min(0.12, impact / 4000))
              this._clickCd = 0.03
            }
          }
        }
      }
    }
    // 摩擦+停球
    const decay = Math.pow(FRICTION, dt)
    for (const b of this.balls) {
      if (b.in) { b.sinkT = Math.min(1, b.sinkT + dt * 3); continue }
      b.vx *= decay; b.vy *= decay
      if (Math.hypot(b.vx, b.vy) < STOP_V) { b.vx = 0; b.vy = 0 }
    }
    if (!this._moving()) this._resolveShot()
  }

  _thud(b) {
    const sp = Math.hypot(b.vx, b.vy)
    if (sp > 120 && this._clickCd <= 0) { this._tone(160, 0.04, 0, 'sine', Math.min(0.08, sp / 8000)); this._clickCd = 0.03 }
  }

  // 一顆球進袋
  _pot(b, p) {
    b.in = true
    b.sinkT = 0
    b.px = p.x; b.py = p.y
    b.vx = 0; b.vy = 0
    this.pottedThisShot.push(b)
    this._tone(320, 0.08, 0, 'sine', 0.12); this._tone(180, 0.12, 0.05, 'sine', 0.1)
  }

  // 這一桿塵埃落定:白球擺回/換人/續桿/勝負
  _resolveShot() {
    const potted = this.pottedThisShot
    this.pottedThisShot = []
    const cue = this._cue()
    const cuePotted = potted.some((b) => b.team === 'cue')
    if (cuePotted) {
      // 白球洗袋:擺回開球點(被佔就往旁邊挪),換人,不多罰
      cue.in = false; cue.sinkT = 0
      let x = CUE_START.x, y = CUE_START.y
      let tries = 0
      while (this.balls.some((b) => b !== cue && !b.in && Math.hypot(b.x - x, b.y - y) < BR * 2 + 2) && tries < 40) {
        x += (tries % 2 ? 1 : -1) * (BR * 2 + 4) * Math.ceil(tries / 2) * 0.5
        y += (tries % 3 === 0 ? BR : 0)
        tries++
      }
      cue.x = x; cue.y = y; cue.vx = 0; cue.vy = 0
      this.toasts.push({ text: T.potCue, t: this._t })
    }
    // 勝負(清台)
    if (this._left(1) === 0 || this._left(2) === 0) return this._done()
    // 續桿 or 換人
    const ownPotted = potted.some((b) => b.team === this.shotBy)
    const foePotted = potted.some((b) => b.team !== 'cue' && b.team !== this.shotBy)
    if (foePotted) this.toasts.push({ text: T.potFoe, t: this._t })
    if (ownPotted && !cuePotted) {
      this.toasts.push({ text: T.potOwn, t: this._t })
      if (this.mode === 'ai') this.bubble = this.shotBy === 2 ? '進啦,再一顆!' : '好球!'
    } else {
      this.turn = this.turn === 1 ? 2 : 1
      if (!cuePotted && !ownPotted) this.toasts.push({ text: T.miss, t: this._t })
      if (this.mode === 'ai') this.bubble = this.turn === 2 ? '換我了!' : '換你囉!'
    }
    if (this._isAiTurn()) this.aiT = 0.9 + Math.random() * 0.7
    this.state = 'aim'
  }

  _done() {
    this.state = 'done'
    const win = this._left(1) === 0 ? 1 : 2
    this.result = win
    if (this.mode === 'ai') {
      // 星等:贏=3;輸看自己清了幾顆
      const cleared = this.teamSize - this._left(1)
      this.stars = win === 1 ? 3 : cleared >= this.teamSize * 0.6 ? 2 : 1
    } else this.stars = 3
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    const score = (this.teamSize - this._left(1)) * 6 + (this.result === 1 ? 20 : 8)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score, level: 'billiards' }) }, 800)
  }

  // —— 阿福 AI:對每顆紅球×每個袋算「假想球點」,挑路徑乾淨、角度順的一桿,加年齡誤差 ——
  _aiShoot() {
    const cue = this._cue()
    const pockets = this._pockets()
    let best = null
    for (const b of this.balls) {
      if (b.in || b.team !== 2) continue
      for (const p of pockets) {
        const bpX = p.x - b.x, bpY = p.y - b.y
        const bpL = Math.hypot(bpX, bpY) || 1
        // 假想球點:目標球後方 2r(白球要打到這裡)
        const gx = b.x - (bpX / bpL) * BR * 2
        const gy = b.y - (bpY / bpL) * BR * 2
        const cgX = gx - cue.x, cgY = gy - cue.y
        const cgL = Math.hypot(cgX, cgY) || 1
        // 角度可行性:白球行進方向與目標球進袋方向要同向(cos>0.25 才打得順)
        const cosA = (cgX * bpX + cgY * bpY) / (cgL * bpL)
        if (cosA < 0.25) continue
        // 路徑遮擋:白球→假想球點,線段離其他球要夠遠
        let blocked = false
        for (const o of this.balls) {
          if (o === cue || o === b || o.in) continue
          const t = Math.max(0, Math.min(1, ((o.x - cue.x) * cgX + (o.y - cue.y) * cgY) / (cgL * cgL)))
          const dd = Math.hypot(cue.x + cgX * t - o.x, cue.y + cgY * t - o.y)
          if (dd < BR * 2 - 2) { blocked = true; break }
        }
        if (blocked) continue
        const score = cosA * 2 - cgL / 900 - bpL / 1200
        if (!best || score > best.score) best = { score, gx, gy, cgL, bpL }
      }
    }
    let dirX, dirY, power
    if (best) {
      dirX = best.gx - cue.x; dirY = best.gy - cue.y
      power = Math.min(1, 0.3 + (best.cgL + best.bpL) / 900)
    } else {
      // 沒有好球路:朝最近的自家球輕推(解球)
      const near = this.balls.filter((b) => !b.in && b.team === 2)
        .reduce((m, b) => { const d = Math.hypot(b.x - cue.x, b.y - cue.y); return !m || d < m.d ? { b, d } : m }, null)
      dirX = near ? near.b.x - cue.x : 1; dirY = near ? near.b.y - cue.y : 0
      power = 0.42
    }
    // 年齡誤差
    const err = (Math.random() * 2 - 1) * this.cfg.aiErr
    const cos = Math.cos(err), sin = Math.sin(err)
    const rx = dirX * cos - dirY * sin, ry = dirX * sin + dirY * cos
    this.bubble = ['看我的!', '這顆有角度…', '輕輕的就好'][Math.floor(Math.random() * 3)]
    this._shoot(rx, ry, power)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
      if (e.key === '1') return this._start('young')
      if (e.key === '2') return this._start('kid')
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
      for (const b of this._modeBtns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.mode = b.key
        this._tone(500, 0.05, 0, 'sine', 0.06)
        return
      }
      for (const b of this._sizeBtns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.act === 'dec') this.teamSize = Math.max(SIZE_MIN, this.teamSize - 1)
        else if (b.act === 'inc') this.teamSize = Math.min(SIZE_MAX, this.teamSize + 1)
        else { // 點數字=直接輸入(超出範圍溫柔夾回)
          const v = parseInt(prompt(`每組幾球?(${SIZE_MIN}~${SIZE_MAX})`, this.teamSize), 10)
          if (v >= 1) this.teamSize = Math.max(SIZE_MIN, Math.min(SIZE_MAX, v))
        }
        this._tone(520, 0.05, 0, 'sine', 0.06)
        return
      }
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    // 拉桿瞄準(輪到人類、球全停時)
    if (this.state === 'aim' && !this._isAiTurn()) this.aim = { x, y }
  }

  _move(e) {
    if (this.aim) { const { x, y } = this._pt(e); this.aim = { x, y } }
  }

  _up() {
    if (!this.aim || this.state !== 'aim' || this._isAiTurn()) { this.aim = null; return }
    const cue = this._cue()
    // 拉桿式:從白球「往後拉」,放開=朝反方向出桿
    const dx = cue.x - this.aim.x, dy = cue.y - this.aim.y
    const pull = Math.hypot(dx, dy)
    this.aim = null
    if (pull < 14) return // 拉太短=取消
    this._shoot(dx, dy, Math.min(1, pull / 240))
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
    ctx.fillStyle = '#2a2033' // 撞球間的暗底
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    this._drawTable()
    // 瞄準提示(輪到人類+拖曳中)
    if (this.state === 'aim' && !this._isAiTurn() && this.aim) this._drawGuide()
    // 球(進袋的縮小消失)
    for (const b of this.balls) {
      if (b.in) {
        if (b.sinkT < 1) this._ball(b.px, b.py, BR * (1 - b.sinkT), b.team, 0.9 - b.sinkT * 0.9)
        continue
      }
      this._ball(b.x, b.y, BR, b.team, 1)
    }
    // 球桿(拖曳中畫在白球後方)
    if (this.state === 'aim' && !this._isAiTurn() && this.aim) this._drawCueStick()
    // 阿福教練(AI 模式,右上)
    if (this.mode === 'ai') this._coach(VW - 70, 46, this._isAiTurn())
    // 漂浮字
    this.toasts.forEach((t, i) => {
      const k = (this._t - t.t) / 1.8
      if (k >= 1) return
      const yy = VH * 0.3 - k * 24 + i * 38
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,14,30,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${28 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, yy)
      ctx.fillText(t.text, VW / 2, yy)
      ctx.globalAlpha = 1
    })
    // HUD:剩球數+輪到誰
    const turnTxt = this.state === 'rolling' ? '⋯球還在跑' :
      this._isAiTurn() ? T.afuTurn : this.mode === '2p' ? (this.turn === 1 ? T.p1Turn : T.p2Turn) : T.yourTurn
    ctx.fillStyle = 'rgba(16,10,26,0.72)'
    rPl(ctx, VW * 0.14, 8, VW * 0.72, 34, 12); ctx.fill()
    ctx.fillStyle = '#eee8f8'
    ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    const p2name = this.mode === 'ai' ? '阿福' : 'P2'
    ctx.fillText(`🔵 你剩 ${this._left(1)} 顆 ・ ${p2name} 剩 ${this._left(2)} 顆 🔴 ・ ${turnTxt}`, VW / 2, 31)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  // 球桌:木框+呢面+袋口+開球線
  _drawTable() {
    const { ctx } = this
    // 木框
    ctx.fillStyle = '#6a4326'
    rPl(ctx, TB.x - 34, TB.y - 34, TB.w + 68, TB.h + 68, 22); ctx.fill()
    ctx.fillStyle = '#54331c'
    rPl(ctx, TB.x - 22, TB.y - 22, TB.w + 44, TB.h + 44, 16); ctx.fill()
    // 呢面
    ctx.fillStyle = '#2e7d4f'
    ctx.fillRect(TB.x, TB.y, TB.w, TB.h)
    // 呢面亮暗(打光)
    const g = ctx.createRadialGradient(TB.x + TB.w / 2, TB.y + TB.h / 2, 60, TB.x + TB.w / 2, TB.y + TB.h / 2, 520)
    g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0.16)')
    ctx.fillStyle = g
    ctx.fillRect(TB.x, TB.y, TB.w, TB.h)
    // 開球線
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(TB.x + 190, TB.y); ctx.lineTo(TB.x + 190, TB.y + TB.h); ctx.stroke()
    // 袋口
    for (const p of this._pockets()) {
      ctx.fillStyle = '#12080a'
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill()
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke()
    }
  }

  // 一顆球(白/藍/紅),帶高光與淡影
  _ball(x, y, r, team, alpha) {
    const { ctx } = this
    ctx.globalAlpha = alpha
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.beginPath(); ctx.ellipse(x + 2, y + 3.5, r * 0.95, r * 0.55, 0, 0, 7); ctx.fill()
    ctx.fillStyle = team === 'cue' ? '#f4f1e8' : team === 1 ? '#2a5ac8' : '#c83a3a'
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.3, r * 0.2, -0.6, 0, 7); ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke()
    ctx.globalAlpha = 1
  }

  // 瞄準提示:白球行進線→假想球;命中球的走向(依年齡檔給多少)
  _drawGuide() {
    const { ctx } = this
    const cue = this._cue()
    const dx = cue.x - this.aim.x, dy = cue.y - this.aim.y
    const l = Math.hypot(dx, dy)
    if (l < 8) return
    const nx = dx / l, ny = dy / l
    // 找白球沿 n 方向第一顆會撞到的球(圓半徑 2BR 的射線相交)
    let hit = null
    for (const b of this.balls) {
      if (b.in || b === cue) continue
      const rx = b.x - cue.x, ry = b.y - cue.y
      const proj = rx * nx + ry * ny
      if (proj <= 0) continue
      const perp = Math.hypot(rx - nx * proj, ry - ny * proj)
      if (perp >= BR * 2) continue
      const t = proj - Math.sqrt(BR * 2 * BR * 2 - perp * perp)
      if (t > 0 && (!hit || t < hit.t)) hit = { t, b }
    }
    const guide = this.cfg.guide
    const endT = hit ? hit.t : 640
    const lineLen = guide === 'short' ? Math.min(endT, 150) : endT
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 7])
    ctx.beginPath(); ctx.moveTo(cue.x, cue.y); ctx.lineTo(cue.x + nx * lineLen, cue.y + ny * lineLen); ctx.stroke()
    ctx.setLineDash([])
    if (hit && guide !== 'short') {
      // 假想球
      const gx = cue.x + nx * hit.t, gy = cue.y + ny * hit.t
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(gx, gy, BR, 0, 7); ctx.stroke()
      // 目標球走向(幼=長,童=短)
      const tx = hit.b.x - gx, ty = hit.b.y - gy
      const tl = Math.hypot(tx, ty) || 1
      const len = guide === 'full' ? 170 : 70
      ctx.strokeStyle = hit.b.team === 1 ? 'rgba(120,170,255,0.85)' : hit.b.team === 2 ? 'rgba(255,130,120,0.85)' : 'rgba(255,255,255,0.7)'
      ctx.setLineDash([5, 6])
      ctx.beginPath(); ctx.moveTo(hit.b.x, hit.b.y); ctx.lineTo(hit.b.x + (tx / tl) * len, hit.b.y + (ty / tl) * len); ctx.stroke()
      ctx.setLineDash([])
    }
    // 力道弧(白球外圈)
    const power = Math.min(1, l / 240)
    ctx.strokeStyle = power > 0.85 ? '#e05040' : '#ffe070'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(cue.x, cue.y, BR + 8, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2); ctx.stroke()
  }

  // 球桿:畫在白球後方,拉越遠退越多
  _drawCueStick() {
    const { ctx } = this
    const cue = this._cue()
    const dx = cue.x - this.aim.x, dy = cue.y - this.aim.y
    const l = Math.hypot(dx, dy)
    if (l < 8) return
    const nx = dx / l, ny = dy / l
    const pull = Math.min(1, l / 240) * 34 + 10
    const x0 = cue.x - nx * (BR + pull), y0 = cue.y - ny * (BR + pull)
    const x1 = cue.x - nx * (BR + pull + 210), y1 = cue.y - ny * (BR + pull + 210)
    ctx.strokeStyle = '#caa262'; ctx.lineWidth = 7; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 7
    ctx.beginPath(); ctx.moveTo(x0 - nx * 0.1, y0 - ny * 0.1); ctx.lineTo(x0 - nx * 60, y0 - ny * 60); ctx.stroke()
  }

  // 阿福教練(擬人化頭像,成套沿用;★人物臉部鐵則)
  _coach(x, y, thinking) {
    const { ctx } = this
    ctx.fillStyle = 'rgba(16,10,26,0.6)'
    ctx.beginPath(); ctx.arc(x, y, 32, 0, 7); ctx.fill()
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, y + 3, 19, 0, 7); ctx.fill()
    ctx.fillStyle = '#c83a3a'
    ctx.beginPath(); ctx.arc(x, y - 4, 19, Math.PI, 0); ctx.fill()
    ctx.fillRect(x - 21, y - 6, 42, 5)
    ctx.fillStyle = '#2a2018'
    const look = thinking ? -3 + Math.sin(this._t * 3) * 2 : 0
    ctx.beginPath(); ctx.arc(x - 7 + look, y + 3, 2.5, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 7 + look, y + 3, 2.5, 0, 7); ctx.fill()
    ctx.fillStyle = '#8a5a30'
    ctx.beginPath(); ctx.arc(x, y + 11, thinking ? 2.4 : 3.8, 0, 7); ctx.fill()
    if (this.bubble) {
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      const w = ctx.measureText(this.bubble).width + 20
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rPl(ctx, x - w, y + 38, w, 26, 10); ctx.fill()
      ctx.fillStyle = '#3a2c14'
      ctx.textAlign = 'center'
      ctx.fillText(this.bubble, x - w / 2, y + 56)
    }
    ctx.fillStyle = '#eee8f8'
    ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('阿福教練', x, y + 30)
  }

  _drawIntro() {
    const { ctx } = this
    ctx.fillStyle = 'rgba(246,248,252,0.96)'
    ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 3
    rPl(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1c4a30'
    ctx.font = 'bold 30px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.13)
    ctx.fillStyle = '#4a7a5c'
    ctx.font = '14px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.185)
    ctx.fillStyle = '#243a2c'
    wrapPl(ctx, T.how, VW / 2, VH * 0.235, VW * 0.72, 20)
    wrapPl(ctx, T.how2p, VW / 2, VH * 0.43, VW * 0.72, 19)
    ctx.fillStyle = '#4a7a5c'
    ctx.font = '14px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.525)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.26, mh = VH * 0.085, mgap = VW * 0.04
    mDefs.forEach((m, i) => {
      const x = VW / 2 - mw - mgap / 2 + i * (mw + mgap), y = VH * 0.545
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(46,125,79,0.18)'
      rPl(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rPl(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#2c4434'
      ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.44)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    // 每組幾球(玩家自由輸入)
    this._sizeBtns = []
    ctx.fillStyle = '#4a7a5c'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(T.pickSize, VW / 2 - VW * 0.08, VH * 0.705)
    ctx.textAlign = 'center'
    drawStepperPl(ctx, this._sizeBtns, VW / 2 - VW * 0.07, VH * 0.665, this.teamSize)
    ctx.fillStyle = '#4a7a5c'
    ctx.font = '12px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('(點數字可直接輸入 2~7)', VW / 2 + VW * 0.13, VH * 0.705)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4a7a5c'
    ctx.font = '14px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.75)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.105, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.765
      ctx.fillStyle = '#3f8f5f'
      rPl(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#0c2416'
      ctx.font = 'bold 19px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.42)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.78)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawDone() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.12, y = H * 0.1, w = W * 0.76, h = H * 0.8
    ctx.fillStyle = '#f2f8f0'
    ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 3
    rPl(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1c4a30'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p' ? T.end2p(this.result) : this.result === 1 ? T.endWin : T.endLose
    ctx.fillText(title, W / 2, H * 0.24)
    ctx.font = `bold ${Math.max(24, H * 0.08)}px "Noto Sans TC",sans-serif`
    ctx.fillStyle = '#243a2c'
    const p2name = this.mode === 'ai' ? '阿福' : 'P2'
    ctx.fillText(`🔵 剩 ${this._left(1)} : 剩 ${this._left(2)} 🔴(${p2name})`, W / 2, H * 0.4)
    if (this.mode === 'ai') {
      ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.52)
    }
    ctx.fillStyle = '#2c4434'
    wrapPl(ctx, T.teach, W / 2, H * 0.62, w * 0.62, H * 0.05)
    ctx.restore()
  }
}

function rPl(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
// 「− 數字 +」步進器(數字可點=直接輸入);把三顆熱區推進 btns
function drawStepperPl(ctx, btns, x, y, val) {
  const bw = 40, bh = 34, nw = 66, gap = 8
  const defs = [
    { act: 'dec', w: bw, label: '−' },
    { act: 'edit', w: nw, label: String(val) },
    { act: 'inc', w: bw, label: '+' },
  ]
  let xx = x
  for (const d of defs) {
    ctx.fillStyle = d.act === 'edit' ? '#ffe070' : 'rgba(46,125,79,0.22)'
    rPl(ctx, xx, y, d.w, bh, 9); ctx.fill()
    if (d.act === 'edit') { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2; rPl(ctx, xx, y, d.w, bh, 9); ctx.stroke() }
    ctx.fillStyle = d.act === 'edit' ? '#3a2c06' : '#2c4434'
    ctx.font = `bold ${d.act === 'edit' ? 18 : 20}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(d.label, xx + d.w / 2, y + bh * 0.68)
    btns.push({ x: xx, y, w: d.w, h: bh, act: d.act })
    xx += d.w + gap
  }
}
function wrapPl(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
