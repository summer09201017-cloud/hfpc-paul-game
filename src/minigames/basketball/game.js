// 🏀 世界盃籃球賽(basketball)——憫安製作休閒關(不掛經文,進大廳「休閒運動合輯」)。
// ⚠ 休閒關,刻意不掛聖經經文(同 goalkick/soccer/football 前例);無 cuv/tts/送審文案這一套。
//
// football(世界盃足球賽・實況版)的姊妹作:同一套「即時操作」骨架,換成籃球規則——
//   你直接操控藍隊 10 號:跑位、貼身自動運球(球黏在手前)、**按住空白鍵蓄力、放開出手**。
//   ★ 出手分兩種:輕點(蓄力淺)=傳球(平傳,會被抄);蓄滿一點=投籃——球「飛上天」拋物線奔籃框
//     (空中不會被抄),力道在甜蜜區=空心入網;差一點=打框彈出變**籃板球**,大家搶!
//   三分線外出手進球算 3 分;先到 15 分或時間到比分高者勝。
// 操作:
//   鍵盤=WASD 或 ←→↑↓ 移動;按住空白鍵蓄力、放開出手(淺=傳球/深=投籃)。
//   觸控=按住畫面往那裡跑;帶球時「點一下」=往點的方向傳球,「點籃框附近」=投籃。
//   👥 雙人同機(鍵盤限定):P1 藍=WASD+空白鍵;P2 紅=←→↑↓+Enter。
// 溫柔規則:無犯規無出界(場邊是牆);輸了=「練習賽結束!」;onComplete 永遠 won:true。
// 年齡三檔:幼 2v2(AI 慢・甜蜜區寬・75 秒)/童 3v3/青 3v3(AI 快・甜蜜區窄)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。

const VW = 960
const VH = 540
const MARGIN = 46
const PR2 = 16 // 球員半徑
const BR2 = 9 // 球半徑
const WIN_CAP = 15 // 先到 15 分提前結束
const HOOP_R = 15 // 籃框半徑(頂視圓環)
const THREE_R = 235 // 三分線(離籃框距離)
const PASS_TH = 0.28 // 蓄力低於這個=傳球,高於=投籃

const AGES = {
  young: { label: '🐣 幼', desc: '2v2・AI 慢・75 秒', n: 2, aiSpd: 88, pSpd: 175, sweet: 0.3, aiHit: 0.35, time: 75 },
  kid: { label: '🙂 童', desc: '3v3・標準・90 秒', n: 3, aiSpd: 124, pSpd: 178, sweet: 0.18, aiHit: 0.5, time: 90 },
  teen: { label: '🔥 青', desc: '3v3・AI 快・甜蜜區窄', n: 3, aiSpd: 155, pSpd: 182, sweet: 0.12, aiHit: 0.6, time: 90 },
}

const T = {
  title: '🏀 世界盃籃球賽',
  sub: '憫安製作・真運球真投籃',
  how: '你就是藍隊 10 號!WASD/方向鍵跑位,靠近球自動運球;**按住空白鍵蓄力、放開出手**——蓄力淺=傳球、蓄力深=投籃(在「綠色甜蜜區」放開=空心入網)!三分線外進球算 3 分;打框彈出就搶籃板。放輕鬆,這是練習賽!',
  how2p: '雙人同機(鍵盤):P1 藍隊=WASD+空白鍵;P2 紅隊=←→↑↓+Enter。',
  pickMode: '選賽制:',
  pickAge: '選場地:',
  modeAI: '🤖 對戰 AI',
  modeAIDesc: '阿福教練帶紅隊',
  mode2P: '👥 雙人同機',
  mode2PDesc: '兩人一台鍵盤 PK',
  swish: '🌟 空心入網',
  board: '🏀 籃板球!搶!',
  half: '⏱ 比賽進行中',
  endWin: '🏆 藍隊奪冠!',
  endLose: '🏀 練習賽結束!',
  endDraw: '🤝 握手言和,好比賽!',
  end2pBlue: '🏆 藍隊(P1)奪冠!',
  end2pRed: '🏆 紅隊(P2)奪冠!',
  teach: '好球員都是一球一球練出來的——進了要開心,沒進也要開心,搶下籃板再來就是了!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → goal → done
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this.mode = 'ai'
    this._keys = {}
    this._onKeyDown = (e) => { this._keys[e.key] = true; this._key(e) }
    this._onKeyUp = (e) => { this._keys[e.key] = false; this._keyUp(e) }
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.players = [] // {team, human:0|1|2|null, x,y, fx,fy, homeX,homeY, kickCd}
    this.ball = null // {x,y,vx,vy, owner, protectT, air:null|{t,tf,x0,y0,tx,ty,fate,three,team}}
    this.scoreB = 0
    this.scoreR = 0
    this.clock = 0
    this.charge = { 1: 0, 2: 0 }
    this.holding = { 1: false, 2: false }
    this.touch = null
    this.goalT = 0
    this.goalFor = null
    this.bubble = ''
    this.toasts = []
    this._audio = null
  }

  boot() {
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
    try { this._audio && this._audio.close() } catch {}
  }

  // 兩端籃框(頂視):藍隊往右攻、紅隊往左攻
  _hoop(team) { return team === 'blue' ? { x: VW - MARGIN - 34, y: VH / 2 } : { x: MARGIN + 34, y: VH / 2 } }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.scoreB = 0
    this.scoreR = 0
    this.clock = this.cfg.time
    this.toasts = []
    this.bubble = ''
    this._kickoff('blue')
    this.state = 'play'
  }

  _kickoff(withTeam) {
    const n = this.cfg.n
    this.players = []
    const mk = (team) => {
      const sign = team === 'blue' ? 1 : -1
      for (let i = 0; i < n; i++) {
        const hx = VW / 2 - sign * (100 + i * 140)
        const hy = VH * (i % 2 ? 0.34 : 0.66)
        this.players.push({ team, human: null, x: hx, y: hy, vx: 0, vy: 0, fx: sign, fy: 0, homeX: hx, homeY: hy, kickCd: 0 })
      }
    }
    mk('blue'); mk('red')
    const blueStar = this.players.find((p) => p.team === 'blue')
    blueStar.human = 1
    blueStar.x = VW / 2 - 60; blueStar.y = VH / 2
    if (this.mode === '2p') {
      const redStar = this.players.find((p) => p.team === 'red')
      redStar.human = 2
      redStar.x = VW / 2 + 60; redStar.y = VH / 2
    }
    this.ball = { x: VW / 2, y: VH / 2, vx: 0, vy: 0, owner: null, protectT: 0, air: null }
    // 開球方持球
    const starter = this.players.find((p) => p.team === withTeam)
    starter.x = VW / 2 + (withTeam === 'blue' ? -34 : 34); starter.y = VH / 2
    this.ball.owner = starter
  }

  _update(dt) {
    if (this.state === 'goal') {
      this.goalT -= dt
      if (this.goalT <= 0) {
        if (this.scoreB >= WIN_CAP || this.scoreR >= WIN_CAP) return this._done()
        this._kickoff(this.goalFor === 'blue' ? 'red' : 'blue')
        this.goalFor = null
        this.state = 'play'
      }
      return
    }
    if (this.state !== 'play') return
    this.clock -= dt
    if (this.clock <= 0) return this._done()
    // —— 人控移動 ——
    for (const p of this.players) {
      if (!p.human) continue
      let mx = 0, my = 0
      if (p.human === 1) {
        mx = (this._keys.a || this._keys.A ? -1 : 0) + (this._keys.d || this._keys.D ? 1 : 0)
        my = (this._keys.w || this._keys.W ? -1 : 0) + (this._keys.s || this._keys.S ? 1 : 0)
        if (this.mode !== '2p') {
          mx += (this._keys.ArrowLeft ? -1 : 0) + (this._keys.ArrowRight ? 1 : 0)
          my += (this._keys.ArrowUp ? -1 : 0) + (this._keys.ArrowDown ? 1 : 0)
        }
        if (this.touch) {
          const dx = this.touch.x - p.x, dy = this.touch.y - p.y
          const d = Math.hypot(dx, dy)
          if (d > 10) { mx = dx / d; my = dy / d }
        }
      } else {
        mx = (this._keys.ArrowLeft ? -1 : 0) + (this._keys.ArrowRight ? 1 : 0)
        my = (this._keys.ArrowUp ? -1 : 0) + (this._keys.ArrowDown ? 1 : 0)
      }
      const ml = Math.hypot(mx, my)
      if (ml > 0.01) {
        mx /= ml; my /= ml
        const spd = this.cfg.pSpd * (this.holding[p.human] ? 0.6 : 1)
        p.x += mx * spd * dt
        p.y += my * spd * dt
        p.fx = mx; p.fy = my
      }
      if (this.holding[p.human]) this.charge[p.human] = Math.min(1, this.charge[p.human] + dt / 0.85)
    }
    // —— AI 移動 ——
    this._ai(dt)
    // —— 邊界 ——
    for (const p of this.players) {
      p.x = Math.max(MARGIN + PR2, Math.min(VW - MARGIN - PR2, p.x))
      p.y = Math.max(MARGIN + PR2, Math.min(VH - MARGIN - PR2, p.y))
      p.kickCd = Math.max(0, p.kickCd - dt)
    }
    // —— 球 ——
    const b = this.ball
    b.protectT = Math.max(0, b.protectT - dt)
    if (b.air) {
      // 投籃飛行(空中,不可抄):螢幕座標線性走 + 假高度
      const a = b.air
      a.t += dt
      const k = Math.min(1, a.t / a.tf)
      b.x = a.x0 + (a.tx - a.x0) * k
      b.y = a.y0 + (a.ty - a.y0) * k
      if (k >= 1) this._resolveShot()
    } else if (b.owner) {
      const o = b.owner
      const tx = o.x + o.fx * (PR2 + 8), ty = o.y + o.fy * (PR2 + 8)
      b.x += (tx - b.x) * Math.min(1, dt * 14)
      b.y += (ty - b.y) * Math.min(1, dt * 14)
      b.vx = 0; b.vy = 0
    } else {
      b.x += b.vx * dt
      b.y += b.vy * dt
      const decay = Math.exp(-1.4 * dt)
      b.vx *= decay; b.vy *= decay
      if (b.y < MARGIN + BR2) { b.y = MARGIN + BR2; b.vy = Math.abs(b.vy) }
      if (b.y > VH - MARGIN - BR2) { b.y = VH - MARGIN - BR2; b.vy = -Math.abs(b.vy) }
      if (b.x < MARGIN + BR2) { b.x = MARGIN + BR2; b.vx = Math.abs(b.vx) }
      if (b.x > VW - MARGIN - BR2) { b.x = VW - MARGIN - BR2; b.vx = -Math.abs(b.vx) }
    }
    // —— 搶球/得球(空中的球搶不到) ——
    if (!b.air) {
      for (const p of this.players) {
        const d = Math.hypot(p.x - b.x, p.y - b.y)
        if (b.owner === p) continue
        const reach = PR2 + BR2 + 4
        if (d < reach && p.kickCd <= 0) {
          if (!b.owner) { this._takeBall(p) }
          else if (b.owner.team !== p.team && b.protectT <= 0) { this._takeBall(p) }
        }
      }
    }
    // 球員之間輕推開
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j]
        const dx = c.x - a.x, dy = c.y - a.y
        const d = Math.hypot(dx, dy)
        if (d > 0 && d < PR2 * 2) {
          const nx = dx / d, ny = dy / d, ov = (PR2 * 2 - d) / 2
          a.x -= nx * ov; a.y -= ny * ov
          c.x += nx * ov; c.y += ny * ov
        }
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
  }

  _takeBall(p) {
    this.ball.owner = p
    this.ball.protectT = 0.5
    this._tone(360, 0.05, 0, 'sine', 0.05)
  }

  // 傳球(平傳,可被抄)
  _pass(p, dirX, dirY, power) {
    const b = this.ball
    if (b.owner !== p) return
    const l = Math.hypot(dirX, dirY) || 1
    const sp = 320 + power * 420
    b.owner = null
    b.vx = (dirX / l) * sp
    b.vy = (dirY / l) * sp
    b.x = p.x + (dirX / l) * (PR2 + BR2 + 4)
    b.y = p.y + (dirY / l) * (PR2 + BR2 + 4)
    p.kickCd = 0.35
    this._tone(280, 0.06, 0, 'sine', 0.08)
  }

  // 投籃(拋物線奔籃框;力道 vs 甜蜜力道決定命運)
  _shootHoop(p, power) {
    const b = this.ball
    if (b.owner !== p) return
    const hoop = this._hoop(p.team)
    const dist = Math.hypot(hoop.x - p.x, hoop.y - p.y)
    // 甜蜜力道:越遠要越大力(PASS_TH+0.07 ~ 0.95)
    const sweet = this._sweetFor(dist)
    const diff = Math.abs(power - sweet)
    const half = this.cfg.sweet / 2
    let fate = diff <= half ? 'swish' : diff <= half * 2.6 ? 'rim' : 'air'
    // 人控之外,AI 出手由 aiHit 決定 fate(呼叫端已把 power 弄好,這裡照力道判)
    let tx = hoop.x, ty = hoop.y
    if (fate === 'rim') { tx = hoop.x + (Math.random() - 0.5) * HOOP_R * 1.6; ty = hoop.y + (Math.random() - 0.5) * HOOP_R * 1.6 }
    if (fate === 'air') {
      const over = power > sweet
      tx = hoop.x + (over ? 34 + Math.random() * 30 : -(38 + Math.random() * 30)) * (p.team === 'blue' ? 1 : -1)
      ty = hoop.y + (Math.random() - 0.5) * 60
    }
    b.owner = null
    b.air = { t: 0, tf: 0.55 + dist / 700, x0: b.x, y0: b.y, tx, ty, fate, three: dist > THREE_R, team: p.team }
    p.kickCd = 0.4
    this._tone(300, 0.07, 0, 'sine', 0.08)
  }

  _sweetFor(dist) { return Math.min(0.95, PASS_TH + 0.07 + (dist / 560) * 0.5) }

  _resolveShot() {
    const b = this.ball
    const a = b.air
    b.air = null
    const hoop = this._hoop(a.team)
    if (a.fate === 'swish' || (a.fate === 'rim' && Math.random() < (this.age === 'young' ? 0.55 : 0.35))) {
      const pts = a.three ? 3 : 2
      if (a.team === 'blue') this.scoreB += pts
      else this.scoreR += pts
      this.toasts.push({ text: `${T.swish} +${pts}!`, t: this._t })
      this.goalFor = a.team
      this.state = 'goal'
      this.goalT = 1.5
      b.x = hoop.x; b.y = hoop.y; b.vx = 0; b.vy = 0
      if (this.mode === 'ai') this.bubble = a.team === 'red' ? '進啦!' : '好球!'
      this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(784, 0.22, 0.1, 'triangle', 0.11)
    } else {
      // 打框/籃外:彈出來變籃板球,大家搶
      const ang = Math.random() * Math.PI * 2
      const sp = 160 + Math.random() * 160
      b.x = a.tx; b.y = a.ty
      b.vx = Math.cos(ang) * sp
      b.vy = Math.sin(ang) * sp
      this.toasts.push({ text: T.board, t: this._t })
      this._tone(220, 0.1, 0, 'square', 0.06)
    }
  }

  // —— AI:最近者追球/持球者推進投籃/其他人回站位 ——
  _ai(dt) {
    const b = this.ball
    for (const team of ['blue', 'red']) {
      const hoop = this._hoop(team)
      const aiPlayers = this.players.filter((p) => p.team === team && !p.human)
      let chaser = null
      if (!b.air && (!b.owner || b.owner.team !== team)) {
        chaser = aiPlayers.reduce((best, p) => {
          const d = Math.hypot(p.x - b.x, p.y - b.y)
          return !best || d < best.d ? { p, d } : best
        }, null)
      }
      for (const p of aiPlayers) {
        let tx = p.homeX, ty = p.homeY
        const spd = this.cfg.aiSpd
        if (b.owner === p) {
          tx = hoop.x; ty = hoop.y
          const dist = Math.hypot(hoop.x - p.x, hoop.y - p.y)
          if (dist < 210 + (this.age === 'teen' ? 60 : 0)) {
            // 出手:命中率決定力道落在甜蜜區內外
            const sweet = this._sweetFor(dist)
            const hit = Math.random() < this.cfg.aiHit
            const off = hit ? (Math.random() - 0.5) * this.cfg.sweet * 0.8
              : (Math.random() < 0.5 ? 1 : -1) * (this.cfg.sweet * (0.7 + Math.random() * 1.1))
            this._shootHoop(p, Math.max(PASS_TH + 0.02, Math.min(1, sweet + off)))
            if (this.mode === 'ai' && team === 'red') this.bubble = '出手!'
            continue
          }
          const blocker = this.players.find((q) => q.team !== team && Math.abs(q.x - p.x) < 70 && Math.abs(q.y - p.y) < 46)
          if (blocker) ty = p.y + (p.y < VH / 2 ? 90 : -90)
        } else if (chaser && chaser.p === p) {
          tx = b.x; ty = b.y
        } else {
          tx = p.homeX + (b.x - p.homeX) * 0.2
          ty = p.homeY + (b.y - p.homeY) * 0.28
        }
        const dx = tx - p.x, dy = ty - p.y
        const d = Math.hypot(dx, dy)
        if (d > 4) {
          p.x += (dx / d) * spd * dt
          p.y += (dy / d) * spd * dt
          p.fx = dx / d; p.fy = dy / d
        }
      }
    }
  }

  _done() {
    this.state = 'done'
    const win = this.scoreB > this.scoreR ? 'blue' : this.scoreR > this.scoreB ? 'red' : 'draw'
    this.result = win
    this.stars = win === 'blue' ? 3 : win === 'draw' ? 2 : 1
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.scoreB * 5 + 10, level: 'basketball' }) }, 800)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
      if (e.key === '1') return this._start('young')
      if (e.key === '2') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state !== 'play') return
    if (e.key === ' ') { e.preventDefault && e.preventDefault(); if (!this.holding[1]) { this.holding[1] = true; this.charge[1] = 0.12 } }
    if (e.key === 'Enter' && this.mode === '2p') { if (!this.holding[2]) { this.holding[2] = true; this.charge[2] = 0.12 } }
  }

  _keyUp(e) {
    if (this.state !== 'play') return
    if (e.key === ' ' && this.holding[1]) {
      this.holding[1] = false
      const p = this.players.find((q) => q.human === 1)
      if (p) this._release(p, this.charge[1])
      this.charge[1] = 0
    }
    if (e.key === 'Enter' && this.holding[2]) {
      this.holding[2] = false
      const p = this.players.find((q) => q.human === 2)
      if (p) this._release(p, this.charge[2])
      this.charge[2] = 0
    }
  }

  // 放開出手:淺=傳球(往面向),深=投籃(奔籃框)
  _release(p, power) {
    if (this.ball.owner !== p) return
    if (power < PASS_TH) this._pass(p, p.fx, p.fy, power / PASS_TH)
    else this._shootHoop(p, power)
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
    if (this.state !== 'play') return
    const p = this.players.find((q) => q.human === 1)
    if (!p) return
    if (this.ball.owner === p) {
      // 帶球點一下:點籃框附近=投籃;其他=往那裡傳
      const hoop = this._hoop(p.team)
      if (Math.hypot(x - hoop.x, y - hoop.y) < 90) {
        const dist = Math.hypot(hoop.x - p.x, hoop.y - p.y)
        this._shootHoop(p, this._sweetFor(dist) + (Math.random() - 0.5) * this.cfg.sweet * 0.9)
      } else {
        const dx = x - p.x, dy = y - p.y
        this._pass(p, dx, dy, Math.min(1, Math.hypot(dx, dy) / 320))
        p.fx = dx / (Math.hypot(dx, dy) || 1); p.fy = dy / (Math.hypot(dx, dy) || 1)
      }
    }
    this.touch = { x, y }
  }

  _movePt(e) {
    if (this.touch) { const { x, y } = this._pt(e); this.touch = { x, y } }
  }

  _up() { this.touch = null }

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
    ctx.fillStyle = '#7a5a30'
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    // 木地板
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? '#c89858' : '#c09050'
      ctx.fillRect(MARGIN + ((VW - MARGIN * 2) / 10) * i, MARGIN, (VW - MARGIN * 2) / 10, VH - MARGIN * 2)
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3
    ctx.strokeRect(MARGIN, MARGIN, VW - MARGIN * 2, VH - MARGIN * 2)
    ctx.beginPath(); ctx.moveTo(VW / 2, MARGIN); ctx.lineTo(VW / 2, VH - MARGIN); ctx.stroke()
    ctx.beginPath(); ctx.arc(VW / 2, VH / 2, 56, 0, 7); ctx.stroke()
    // 兩端:三分弧+籃框
    for (const team of ['blue', 'red']) {
      const hoop = this._hoop(team)
      const sign = team === 'blue' ? -1 : 1 // 弧開口方向
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(hoop.x, hoop.y, THREE_R, sign === -1 ? Math.PI / 2 : -Math.PI / 2, sign === -1 ? -Math.PI / 2 : Math.PI / 2, sign === -1)
      ctx.stroke()
      // 籃板(貼底線的短線)+框(橙圈)
      ctx.strokeStyle = '#e8ecf2'; ctx.lineWidth = 5
      const bx = team === 'blue' ? hoop.x + 22 : hoop.x - 22
      ctx.beginPath(); ctx.moveTo(bx, hoop.y - 30); ctx.lineTo(bx, hoop.y + 30); ctx.stroke()
      ctx.strokeStyle = '#e05030'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(hoop.x, hoop.y, HOOP_R, 0, 7); ctx.stroke()
      ctx.fillStyle = 'rgba(224,80,48,0.18)'
      ctx.beginPath(); ctx.arc(hoop.x, hoop.y, HOOP_R, 0, 7); ctx.fill()
    }
    // 球員
    for (const p of this.players) this._player(p)
    // 球(空中=假高度:影子留地上、球放大)
    const b = this.ball
    if (b.air) {
      const k = Math.min(1, b.air.t / b.air.tf)
      const h = Math.sin(Math.PI * k) * (36 + Math.min(1, b.air.tf) * 40)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath(); ctx.ellipse(b.x, b.y, BR2 * 0.9, BR2 * 0.5, 0, 0, 7); ctx.fill()
      this._basketball(b.x, b.y - h, BR2 * (1 + h / 90))
    } else {
      this._basketball(b.x, b.y, BR2)
    }
    // 蓄力環+甜蜜區(人控)
    for (const pid of [1, 2]) {
      if (!this.holding[pid]) continue
      const p = this.players.find((q) => q.human === pid)
      if (!p || this.ball.owner !== p) continue
      const hoop = this._hoop(p.team)
      const dist = Math.hypot(hoop.x - p.x, hoop.y - p.y)
      const sweet = this._sweetFor(dist), half = this.cfg.sweet / 2
      const a0 = -Math.PI / 2
      // 甜蜜區(綠)+傳球區(白)標在環上
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 7
      ctx.beginPath(); ctx.arc(p.x, p.y, PR2 + 10, a0, a0 + PASS_TH * Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = '#58c860'
      ctx.beginPath(); ctx.arc(p.x, p.y, PR2 + 10, a0 + (sweet - half) * Math.PI * 2, a0 + (sweet + half) * Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = this.charge[pid] > 0.85 ? '#e05040' : '#ffe070'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(p.x, p.y, PR2 + 10, a0, a0 + this.charge[pid] * Math.PI * 2); ctx.stroke()
      // 出手方向提示(往籃框)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 8])
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(hoop.x, hoop.y); ctx.stroke()
      ctx.setLineDash([])
    }
    // 阿福教練(AI 模式)
    if (this.mode === 'ai' && this.bubble) {
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      const w = ctx.measureText(this.bubble).width + 20
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rBk(ctx, VW - 60 - w, 52, w, 26, 10); ctx.fill()
      ctx.fillStyle = '#3a2c14'
      ctx.textAlign = 'center'
      ctx.fillText(this.bubble, VW - 60 - w / 2, 70)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      if (k >= 1) continue
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(40,24,8,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${30 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.fillText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.globalAlpha = 1
    }
    // HUD
    const mm = Math.max(0, Math.floor(this.clock))
    ctx.fillStyle = 'rgba(40,24,8,0.66)'
    rBk(ctx, VW * 0.3, 6, VW * 0.4, 32, 12); ctx.fill()
    ctx.fillStyle = '#f8f2e2'
    ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🔵 ${this.scoreB} : ${this.scoreR} 🔴 ・ ⏱ ${mm}s`, VW / 2, 29)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  _player(p) {
    const { ctx } = this
    const c1 = p.team === 'blue' ? '#2a5ac8' : '#c83a3a'
    const c2 = p.team === 'blue' ? '#183a86' : '#7a2020'
    if (p.human) {
      ctx.strokeStyle = p.human === 1 ? '#ffe070' : '#ffb0e0'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(p.x, p.y, PR2 + 5, 0, 7); ctx.stroke()
    }
    ctx.fillStyle = c2
    ctx.beginPath(); ctx.arc(p.x, p.y + 2, PR2, 0, 7); ctx.fill()
    ctx.fillStyle = c1
    ctx.beginPath(); ctx.arc(p.x, p.y, PR2 - 2, 0, 7); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath(); ctx.arc(p.x + p.fx * (PR2 - 5), p.y + p.fy * (PR2 - 5), 4, 0, 7); ctx.fill()
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(p.x, p.y - 4, 6, 0, 7); ctx.fill()
    if (p.human) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.human === 1 ? '10' : '9', p.x, p.y + PR2 + 13)
    }
  }

  _basketball(x, y, r) {
    const { ctx } = this
    ctx.fillStyle = '#e08030'
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
    ctx.strokeStyle = '#7a3a10'; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke()
  }

  _drawIntro() {
    const { ctx } = this
    cardBk(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#7a3a10'
    ctx.font = 'bold 32px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.15)
    ctx.fillStyle = '#a06a3a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.215)
    ctx.fillStyle = '#3a2c1c'
    wrapBk(ctx, T.how, VW / 2, VH * 0.28, VW * 0.7, 22)
    wrapBk(ctx, T.how2p, VW / 2, VH * 0.5, VW * 0.7, 21)
    ctx.fillStyle = '#a06a3a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.575)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.26, mh = VH * 0.09, mgap = VW * 0.04
    mDefs.forEach((m, i) => {
      const x = VW / 2 - mw - mgap / 2 + i * (mw + mgap), y = VH * 0.6
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(200,140,60,0.25)'
      rBk(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rBk(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#5a3c20'
      ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.44)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    ctx.fillStyle = '#a06a3a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.745)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.11, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.77
      ctx.fillStyle = '#e08030'
      rBk(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#2c1608'
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
    ctx.fillStyle = '#faf6f0'
    ctx.strokeStyle = '#e08030'; ctx.lineWidth = 3
    rBk(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#7a3a10'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p'
      ? (this.result === 'blue' ? T.end2pBlue : this.result === 'red' ? T.end2pRed : T.endDraw)
      : (this.result === 'blue' ? T.endWin : this.result === 'draw' ? T.endDraw : T.endLose)
    ctx.fillText(title, W / 2, H * 0.22)
    ctx.font = `bold ${Math.max(26, H * 0.09)}px "Noto Sans TC",sans-serif`
    ctx.fillStyle = '#3a2c1c'
    ctx.fillText(`🔵 ${this.scoreB} : ${this.scoreR} 🔴`, W / 2, H * 0.38)
    if (this.mode === 'ai') {
      ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.5)
    }
    ctx.fillStyle = '#4a3a28'
    wrapBk(ctx, T.teach, W / 2, H * 0.6, W * 0.6, H * 0.05)
    ctx.restore()
  }
}

function rBk(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardBk(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(250,246,238,0.96)'
  ctx.strokeStyle = '#e08030'; ctx.lineWidth = 3
  rBk(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapBk(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
