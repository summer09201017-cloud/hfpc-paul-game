// ⚽ 世界盃足球賽(soccer)——憫安製作休閒關第二彈(不掛經文,進大廳「憫安製作闖關合輯」)。
// ⚠ 休閒練習關,刻意不掛聖經經文(同 goalkick 前例,牧者拍板);無 cuv/tts/送審文案這一套。
//
// 玩法(回合彈射制,Soccer Stars 型——設計架構見 docs/足球全場對戰-設計.md,牧者三答已定:
//   名稱=世界盃足球賽/要雙人同機 PK/AI 出手要擬人化頭像):
//   頂視全場,兩端球門。每回合輪流:拖曳自己任一個球員圓盤瞄準蓄力,放開彈出——撞到球=踢球/傳球/射門;
//   等全部滾停換對方。先進 3 球獲勝;20 手到時比分高者勝。
// ★ 模式:🤖 對戰 AI(取樣模擬挑最佳一手+依難度加誤差;思考時亮「阿福教練」頭像,幼兒較不挫折)
//         👥 雙人同機(同一台輪流出手,課堂兩兩 PK)。
// ★ 溫柔規則:無犯規、無出界(場邊是牆=室內五人足球);輸了不叫輸——「練習賽結束!好球員都是
//   一球一球練出來的」+再來一場;平手=握手言和。onComplete 永遠 won:true(憫安守則)。
// ★ 物理:圓-圓彈性碰撞+牆反彈+摩擦漸停+子步進防穿透——整組重用 herd(趕羊入圈)已驗證引擎;
//   模擬與實玩共用同一個 _stepState 純函數(AI 快轉模擬靠它)。
// 年齡三檔:幼(3v3・門寬・AI 常踢歪)/童(4v4・標準)/青(5v5・門窄・AI 會做球)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 無朗讀(休閒關無經文,不 import speak.js)。

const VW = 960
const VH = 540
const MARGIN = 46 // 場邊留白
const DR = 20 // 球員圓盤半徑
const BR = 11 // 球半徑
const MAXSPEED = 860
const WIN_GOALS = 3
const MAX_TURNS = 20 // 雙方合計

const AGES = {
  young: { label: '🐣 幼', desc: '3v3・門寬・AI 好商量', n: 3, gate: 150, aiSamples: 8, aiErr: 0.31, drag: 1.5 },
  kid: { label: '🙂 童', desc: '4v4・標準', n: 4, gate: 120, aiSamples: 16, aiErr: 0.14, drag: 1.3 },
  teen: { label: '🔥 青', desc: '5v5・門窄・AI 會做球', n: 5, gate: 96, aiSamples: 26, aiErr: 0.05, drag: 1.15 },
}

const T = {
  title: '🏆 世界盃足球賽',
  sub: '憫安製作・回合彈射足球',
  how: '輪到你時,拖你的藍色球員往後拉、瞄準,放開就彈出去踢球!把球打進右邊球門。等大家都滾停,就換對方出手。先進 3 球贏;踢滿 20 手看比分。放輕鬆——這是練習賽,輸了再來一場就是了!',
  how2p: '雙人同機:藍隊先手,輪流用同一隻滑鼠/手指出手。藍隊攻右門、紅隊攻左門。',
  pickMode: '選賽制:',
  pickAge: '選場地:',
  modeAI: '🤖 對戰 AI',
  modeAIDesc: '阿福教練帶紅隊',
  mode2P: '👥 雙人同機',
  mode2PDesc: '課堂兩兩 PK',
  turnBlue: '🔵 藍隊出手——拖你的球員瞄準',
  turnRed2P: '🔴 紅隊出手——拖你的球員瞄準',
  thinking: '阿福教練看著場上…',
  aiKick: '阿福教練出手!',
  goalBlue: '⚽ 藍隊進球!',
  goalRed: '⚽ 紅隊進球!',
  hud: (b, r, t) => `🔵 ${b} : ${r} 🔴 ・ 第 ${t} 手`,
  endWin: '🏆 藍隊奪冠!',
  endLose: '⚽ 練習賽結束!',
  endDraw: '🤝 握手言和,好比賽!',
  end2pBlue: '🏆 藍隊奪冠!',
  end2pRed: '🏆 紅隊奪冠!',
  teach: '好球員都是一球一球練出來的——進了要開心,沒進也要開心,再來一場就是了!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play(aim/rolling/think) → goal → done
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this.mode = 'ai' // 'ai' | '2p'
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.blue = [] // 玩家隊(攻右門) {x,y,vx,vy}
    this.red = [] // AI/紅隊(攻左門)
    this.ball = null
    this.turn = 'blue' // 'blue' | 'red'
    this.phase = 'aim' // aim | rolling | think
    this.turnCount = 0
    this.scoreB = 0
    this.scoreR = 0
    this.aim = null // {di(藍/紅盤 index), dx,dy,power}
    this.thinkT = 0
    this.goalT = 0
    this.goalFor = null
    this.bubble = '' // 阿福教練泡泡字
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

  // 球門口(左右兩端,y 範圍)
  _gate() {
    const g = this.cfg.gate
    return { y0: VH / 2 - g / 2, y1: VH / 2 + g / 2 }
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.scoreB = 0
    this.scoreR = 0
    this.turnCount = 0
    this.turn = 'blue'
    this.phase = 'aim'
    this.aim = null
    this.toasts = []
    this.bubble = ''
    this._formation()
    this.state = 'play'
  }

  // 開球陣型:守門員在門前,其餘排前場;球在中圈
  _formation() {
    const n = this.cfg.n
    const mk = (side) => {
      const arr = []
      const gx = side === 'blue' ? MARGIN + 52 : VW - MARGIN - 52 // 守門員
      arr.push({ x: gx, y: VH / 2, vx: 0, vy: 0 })
      const fx = side === 'blue' ? VW * 0.32 : VW * 0.68
      for (let i = 1; i < n; i++) {
        const k = i / n
        arr.push({ x: fx + (side === 'blue' ? 1 : -1) * (i % 2) * 56, y: VH * (0.22 + 0.56 * k), vx: 0, vy: 0 })
      }
      return arr
    }
    this.blue = mk('blue')
    this.red = mk('red')
    this.ball = { x: VW / 2, y: VH / 2, vx: 0, vy: 0 }
  }

  _allRest() {
    const all = [...this.blue, ...this.red, this.ball]
    return all.every((b) => Math.abs(b.vx) < 4 && Math.abs(b.vy) < 4)
  }

  // —— 共用物理(實玩與 AI 模擬同一份):state={blue,red,ball},走一步 h 秒。回 'blue'|'red'|null=這步有無進球 ——
  _stepState(st, h) {
    const gate = this._gate()
    const discs = [...st.blue, ...st.red]
    const all = [...discs, st.ball]
    for (const b of all) { b.x += b.vx * h; b.y += b.vy * h }
    // 牆(上下所有物、左右:圓盤全反彈;球在門口範圍可穿=進球)
    let goal = null
    for (const b of all) {
      const r = b === st.ball ? BR : DR
      if (b.y < MARGIN + r) { b.y = MARGIN + r; b.vy = Math.abs(b.vy) }
      if (b.y > VH - MARGIN - r) { b.y = VH - MARGIN - r; b.vy = -Math.abs(b.vy) }
      const inMouth = b.y > gate.y0 && b.y < gate.y1
      if (b === st.ball && inMouth) {
        if (b.x < MARGIN - 2) goal = 'red' // 球進左門=紅隊得分
        if (b.x > VW - MARGIN + 2) goal = 'blue' // 球進右門=藍隊得分
        // 球在門口不反彈(讓它衝進網內深處——goalkick 前例)
        if (b.x < MARGIN - 34) { b.x = MARGIN - 34; b.vx = 0; b.vy = 0 }
        if (b.x > VW - MARGIN + 34) { b.x = VW - MARGIN + 34; b.vx = 0; b.vy = 0 }
      } else {
        if (b.x < MARGIN + r) { b.x = MARGIN + r; b.vx = Math.abs(b.vx) }
        if (b.x > VW - MARGIN - r) { b.x = VW - MARGIN - r; b.vx = -Math.abs(b.vx) }
      }
    }
    // 圓-圓彈性碰撞(等質量;球更輕=撞出去更快,乘 1.35)
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j]
        const ra = a === st.ball ? BR : DR, rb = b === st.ball ? BR : DR
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        if (d > 0 && d < ra + rb) {
          const nx = dx / d, ny = dy / d
          const overlap = ra + rb - d
          a.x -= nx * overlap / 2; a.y -= ny * overlap / 2
          b.x += nx * overlap / 2; b.y += ny * overlap / 2
          const va = a.vx * nx + a.vy * ny
          const vb = b.vx * nx + b.vy * ny
          if (vb - va < 0) {
            const diff = vb - va
            const boostA = a === st.ball ? 1.35 : 1
            const boostB = b === st.ball ? 1.35 : 1
            a.vx += nx * diff * boostA; a.vy += ny * diff * boostA
            b.vx -= nx * diff * boostB; b.vy -= ny * diff * boostB
          }
        }
      }
    }
    return goal
  }

  _update(dt) {
    if (this.state === 'goal') {
      this.goalT -= dt
      if (this.goalT <= 0) {
        if (this.scoreB >= WIN_GOALS || this.scoreR >= WIN_GOALS || this.turnCount >= MAX_TURNS) return this._done()
        this._formation()
        // 進球後由失分方開球
        this.turn = this.goalFor === 'blue' ? 'red' : 'blue'
        this.goalFor = null
        this.state = 'play'
        this._beginTurn()
      }
      return
    }
    if (this.state !== 'play') return
    if (this.phase === 'think') {
      this.thinkT -= dt
      if (this.thinkT <= 0) this._aiShoot()
      return
    }
    if (this.phase === 'rolling') {
      const st = { blue: this.blue, red: this.red, ball: this.ball }
      const all = [...this.blue, ...this.red, this.ball]
      const maxV = Math.max(...all.map((b) => Math.hypot(b.vx, b.vy)), 1)
      const steps = Math.max(1, Math.ceil((maxV * dt) / (BR * 0.6)))
      const h = dt / steps
      let goal = null
      for (let s = 0; s < steps && !goal; s++) goal = this._stepState(st, h)
      const decay = Math.exp(-this.cfg.drag * dt)
      for (const b of all) { b.vx *= decay; b.vy *= decay; if (Math.hypot(b.vx, b.vy) < 4) { b.vx = 0; b.vy = 0 } }
      if (goal) return this._goal(goal)
      if (this._allRest()) {
        // 換手
        if (this.turnCount >= MAX_TURNS) return this._done()
        this.turn = this.turn === 'blue' ? 'red' : 'blue'
        this._beginTurn()
      }
      return
    }
  }

  _beginTurn() {
    this.aim = null
    if (this.mode === 'ai' && this.turn === 'red') {
      this.phase = 'think'
      this.thinkT = 0.9 + Math.random() * 0.5
      this.bubble = T.thinking
    } else {
      this.phase = 'aim'
      this.bubble = ''
    }
  }

  _goal(who) {
    if (who === 'blue') { this.scoreB += 1; this.toasts.push({ text: T.goalBlue, t: this._t }) }
    else { this.scoreR += 1; this.toasts.push({ text: T.goalRed, t: this._t }) }
    this.goalFor = who
    this.state = 'goal'
    this.goalT = 1.8
    if (this.mode === 'ai') this.bubble = who === 'red' ? '進啦!' : '好球,下一顆看我的!'
    this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(784, 0.22, 0.1, 'triangle', 0.11)
  }

  // —— AI(阿福教練):對每個紅盤取樣角度×力道,拿 _stepState 快轉 1.6 秒模擬,挑最高分再加誤差 ——
  _aiShoot() {
    const gate = this._gate()
    const targetX = MARGIN, targetY = VH / 2 // 紅隊攻左門
    let best = null
    const clone = () => ({
      blue: this.blue.map((d) => ({ ...d })),
      red: this.red.map((d) => ({ ...d })),
      ball: { ...this.ball },
    })
    for (let di = 0; di < this.red.length; di++) {
      const disc = this.red[di]
      // 以「盤→球」方向為中心取樣角度
      const baseA = Math.atan2(this.ball.y - disc.y, this.ball.x - disc.x)
      for (let s = 0; s < this.cfg.aiSamples; s++) {
        const a = baseA + (s / (this.cfg.aiSamples - 1) - 0.5) * 1.7
        for (const pow of [0.55, 0.95]) {
          const st = clone()
          const d2 = st.red[di]
          d2.vx = Math.cos(a) * pow * MAXSPEED
          d2.vy = Math.sin(a) * pow * MAXSPEED
          let goal = null
          const h = 1 / 90
          for (let step = 0; step < 145 && !goal; step++) {
            goal = this._stepState(st, h)
            const decay = Math.exp(-this.cfg.drag * h)
            for (const b of [...st.blue, ...st.red, st.ball]) { b.vx *= decay; b.vy *= decay }
          }
          // 打分:紅進球=大獎;球離左門越近越好;把球送回自家半場=扣分
          let score = -Math.hypot(st.ball.x - targetX, st.ball.y - targetY)
          if (goal === 'red') score = 100000
          if (goal === 'blue') score = -100000 // 千萬別烏龍
          if (st.ball.x > VW * 0.7 && goal !== 'red') score -= 260
          if (!best || score > best.score) best = { di, a, pow, score }
        }
      }
    }
    // 依難度加高斯誤差(幼常踢歪)
    const err = (Math.random() + Math.random() + Math.random() - 1.5) * this.cfg.aiErr * 2
    const a = best.a + err
    const disc = this.red[best.di]
    disc.vx = Math.cos(a) * best.pow * MAXSPEED
    disc.vy = Math.sin(a) * best.pow * MAXSPEED
    this.turnCount += 1
    this.phase = 'rolling'
    this.bubble = T.aiKick
    this._tone(300, 0.08, 0, 'sine', 0.08)
  }

  _done() {
    this.state = 'done'
    const win = this.scoreB > this.scoreR ? 'blue' : this.scoreR > this.scoreB ? 'red' : 'draw'
    this.result = win
    // 星等(藍隊視角;雙人模式純展示):贏 3/平 2/輸 1——但文字永遠溫柔
    this.stars = win === 'blue' ? 3 : win === 'draw' ? 2 : 1
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.scoreB * 30 + 10, level: 'soccer' }) }, 800)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
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
      for (const b of this._modeBtns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.mode = b.key
        this._tone(500, 0.05, 0, 'sine', 0.06)
        return
      }
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state !== 'play' || this.phase !== 'aim') return
    // 只能拖「輪到的那隊」的盤(AI 模式=永遠藍隊)
    const team = this.turn === 'blue' ? this.blue : this.red
    for (let i = 0; i < team.length; i++) {
      if (Math.hypot(x - team[i].x, y - team[i].y) < DR * 2.2) {
        this.aim = { di: i, dx: 0, dy: 0, power: 0 }
        this._tone(480, 0.05, 0, 'sine', 0.06)
        return
      }
    }
  }

  _movePt(e) {
    if (!this.aim || this.phase !== 'aim') return
    const { x, y } = this._pt(e)
    const team = this.turn === 'blue' ? this.blue : this.red
    const d0 = team[this.aim.di]
    const dx = d0.x - x, dy = d0.y - y
    const d = Math.hypot(dx, dy)
    if (d < 5) { this.aim.power = 0; return }
    this.aim.dx = dx / d
    this.aim.dy = dy / d
    this.aim.power = Math.min(1, d / 200)
  }

  _up() {
    if (this.state !== 'play' || this.phase !== 'aim' || !this.aim) return
    if (this.aim.power < 0.07) { this.aim = null; return }
    const team = this.turn === 'blue' ? this.blue : this.red
    const d0 = team[this.aim.di]
    const sp = 240 + this.aim.power * (MAXSPEED - 240)
    d0.vx = this.aim.dx * sp
    d0.vy = this.aim.dy * sp
    this.aim = null
    this.turnCount += 1
    this.phase = 'rolling'
    this._tone(300, 0.08, 0, 'sine', 0.08)
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
    ctx.fillStyle = '#3f7a34'
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    const gate = this._gate()
    // 草皮條紋
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#4a8a3e' : '#458238'
      ctx.fillRect(MARGIN + ((VW - MARGIN * 2) / 8) * i, MARGIN, (VW - MARGIN * 2) / 8, VH - MARGIN * 2)
    }
    // 白線:邊線/中線/中圈/禁區
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3
    ctx.strokeRect(MARGIN, MARGIN, VW - MARGIN * 2, VH - MARGIN * 2)
    ctx.beginPath(); ctx.moveTo(VW / 2, MARGIN); ctx.lineTo(VW / 2, VH - MARGIN); ctx.stroke()
    ctx.beginPath(); ctx.arc(VW / 2, VH / 2, 64, 0, 7); ctx.stroke()
    for (const side of [MARGIN, VW - MARGIN]) {
      const dir = side === MARGIN ? 1 : -1
      ctx.strokeRect(Math.min(side, side + dir * 86), VH / 2 - 110, 86, 220) // 禁區
    }
    // 球門(門口缺口+網)
    for (const side of ['L', 'R']) {
      const x0 = side === 'L' ? MARGIN - 34 : VW - MARGIN
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.fillRect(x0, gate.y0, 34, gate.y1 - gate.y0)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5
      for (let gx = x0; gx <= x0 + 34; gx += 8) { ctx.beginPath(); ctx.moveTo(gx, gate.y0); ctx.lineTo(gx, gate.y1); ctx.stroke() }
      for (let gy = gate.y0; gy <= gate.y1; gy += 8) { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + 34, gy); ctx.stroke() }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.moveTo(side === 'L' ? MARGIN : VW - MARGIN, gate.y0); ctx.lineTo(x0 + (side === 'L' ? 0 : 34), gate.y0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(side === 'L' ? MARGIN : VW - MARGIN, gate.y1); ctx.lineTo(x0 + (side === 'L' ? 0 : 34), gate.y1); ctx.stroke()
    }
    // 球員圓盤
    this.blue.forEach((d, i) => this._disc(d.x, d.y, '#2a5ac8', '#183a86', i === 0))
    this.red.forEach((d, i) => this._disc(d.x, d.y, '#c83a3a', '#7a2020', i === 0))
    // 球
    this._soccerBall(this.ball.x, this.ball.y)
    // 瞄準線+力道環
    if (this.aim && this.aim.power > 0.02 && this.phase === 'aim') {
      const team = this.turn === 'blue' ? this.blue : this.red
      const d0 = team[this.aim.di]
      const len = 46 + this.aim.power * 150
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.setLineDash([9, 9])
      ctx.beginPath(); ctx.moveTo(d0.x, d0.y)
      ctx.lineTo(d0.x + this.aim.dx * len, d0.y + this.aim.dy * len); ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = this.aim.power > 0.85 ? '#e05040' : '#ffe070'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(d0.x, d0.y, DR + 8, -Math.PI / 2, -Math.PI / 2 + this.aim.power * Math.PI * 2); ctx.stroke()
    }
    // 阿福教練頭像(AI 模式,右上;思考/講話時亮泡泡)
    if (this.mode === 'ai') this._coach(VW - 74, 64, this.phase === 'think')
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      if (k >= 1) continue
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,40,10,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${30 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.fillText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.globalAlpha = 1
    }
    this.toasts = this.toasts.filter((t) => (this._t - t.t) < 1.8)
    // HUD:比分+回合+誰出手
    ctx.fillStyle = 'rgba(16,36,10,0.66)'
    rS(ctx, VW * 0.24, 6, VW * 0.52, 32, 12); ctx.fill()
    ctx.fillStyle = '#eef8e2'
    ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(T.hud(this.scoreB, this.scoreR, Math.min(this.turnCount + 1, MAX_TURNS)), VW / 2, 29)
    if (this.state === 'play' && this.phase === 'aim') {
      ctx.fillStyle = this.turn === 'blue' ? '#bcd4ff' : '#ffc4c4'
      ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
      ctx.fillText(this.turn === 'blue' ? T.turnBlue : T.turnRed2P, VW / 2, VH - 16)
    }
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  // 球員圓盤(球衣色+號碼圈;keeper=守門員戴帽)
  _disc(x, y, c1, c2, keeper) {
    const { ctx } = this
    ctx.fillStyle = c2
    ctx.beginPath(); ctx.arc(x, y + 2, DR, 0, 7); ctx.fill()
    ctx.fillStyle = c1
    ctx.beginPath(); ctx.arc(x, y, DR - 2, 0, 7); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath(); ctx.arc(x, y, DR * 0.5, 0, 7); ctx.fill()
    ctx.fillStyle = c2
    ctx.beginPath(); ctx.arc(x, y, DR * 0.32, 0, 7); ctx.fill()
    if (keeper) { // 守門員小帽沿
      ctx.fillStyle = '#ffe070'
      ctx.fillRect(x - DR * 0.7, y - DR - 4, DR * 1.4, 5)
    }
  }

  _soccerBall(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x, y, BR, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath(); ctx.arc(x, y, BR * 0.34, 0, 7); ctx.fill()
    for (let i = 0; i < 5; i++) {
      const a = this._t * 0.6 + (i / 5) * 6.28
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * BR * 0.66, y + Math.sin(a) * BR * 0.66, BR * 0.17, 0, 7); ctx.fill()
    }
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(x, y, BR, 0, 7); ctx.stroke()
  }

  // 阿福教練(AI 擬人化頭像,牧者拍板要加):紅帽+口哨小教練,思考時亮泡泡
  _coach(x, y, thinking) {
    const { ctx } = this
    // 底圈
    ctx.fillStyle = 'rgba(16,36,10,0.6)'
    ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill()
    // 臉
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, y + 3, 20, 0, 7); ctx.fill()
    // 紅帽
    ctx.fillStyle = '#c83a3a'
    ctx.beginPath(); ctx.arc(x, y - 4, 20, Math.PI, 0); ctx.fill()
    ctx.fillRect(x - 22, y - 6, 44, 5)
    // 眼睛(思考時看向場中)
    ctx.fillStyle = '#2a2018'
    const look = thinking ? -3 + Math.sin(this._t * 3) * 2 : 0
    ctx.beginPath(); ctx.arc(x - 7 + look, y + 3, 2.6, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 7 + look, y + 3, 2.6, 0, 7); ctx.fill()
    // 嘴/口哨
    ctx.fillStyle = '#8a5a30'
    ctx.beginPath(); ctx.arc(x, y + 12, thinking ? 2.5 : 4, 0, 7); ctx.fill()
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(x + 6, y + 10, 9, 5) // 口哨
    // 泡泡字
    if (this.bubble) {
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      const w = ctx.measureText(this.bubble).width + 20
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rS(ctx, x - w, y + 40, w, 26, 10); ctx.fill()
      ctx.fillStyle = '#3a2c14'
      ctx.textAlign = 'center'
      ctx.fillText(this.bubble, x - w / 2, y + 58)
    }
    ctx.fillStyle = '#eef8e2'
    ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('阿福教練', x, y + 32)
  }

  _drawIntro() {
    const { ctx } = this
    cardS(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1e4a16'
    ctx.font = 'bold 36px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.16)
    ctx.fillStyle = '#5a7a48'
    ctx.font = '16px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.23)
    ctx.fillStyle = '#243a1c'
    wrapS(ctx, T.how, VW / 2, VH * 0.3, VW * 0.68, 23)
    wrapS(ctx, T.how2p, VW / 2, VH * 0.47, VW * 0.68, 22)
    // 模式二選一
    ctx.fillStyle = '#5a7a48'
    ctx.font = '16px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.56)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.26, mh = VH * 0.1, mgap = VW * 0.04
    mDefs.forEach((m, i) => {
      const x = VW / 2 - mw - mgap / 2 + i * (mw + mgap), y = VH * 0.585
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(90,140,70,0.35)'
      rS(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rS(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#2c4424'
      ctx.font = 'bold 18px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.44)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    ctx.fillStyle = '#5a7a48'
    ctx.font = '16px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.74)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.12, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.77
      ctx.fillStyle = '#6ab04c'
      rS(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#10280a'
      ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
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
    ctx.fillStyle = '#f4faf0' // 全不透明
    ctx.strokeStyle = '#6ab04c'; ctx.lineWidth = 3
    rS(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1e4a16'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p'
      ? (this.result === 'blue' ? T.end2pBlue : this.result === 'red' ? T.end2pRed : T.endDraw)
      : (this.result === 'blue' ? T.endWin : this.result === 'draw' ? T.endDraw : T.endLose)
    ctx.fillText(title, W / 2, H * 0.22)
    ctx.font = `bold ${Math.max(26, H * 0.09)}px "Noto Sans TC",sans-serif`
    ctx.fillStyle = '#243a1c'
    ctx.fillText(`🔵 ${this.scoreB} : ${this.scoreR} 🔴`, W / 2, H * 0.38)
    if (this.mode === 'ai') {
      ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.5)
    }
    ctx.fillStyle = '#2c4424'
    wrapS(ctx, T.teach, W / 2, H * 0.6, W * 0.6, H * 0.05)
    ctx.restore()
  }
}

function rS(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardS(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,252,240,0.96)'
  ctx.strokeStyle = '#6ab04c'; ctx.lineWidth = 3
  rS(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapS(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
