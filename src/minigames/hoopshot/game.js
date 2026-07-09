// 🏀 投籃大賽(hoopshot)——憫安製作休閒關(不掛經文,進大廳「休閒運動合輯」)。
// ⚠ 休閒關,刻意不掛聖經經文(同 goalkick/soccer/football 前例);無 cuv/tts/送審文案這一套。
//
// 玩法(側視角,只比投籃):輪流出手——按住(空白鍵或按住畫面)蓄力,力道環上有一段「綠色甜蜜區」,
//   在甜蜜區放開=空心入網(swish!);差一點=打框彈跳看運氣;差很多=籃外空氣球。
//   每人 8 球、出手點會換(近距 2 分/三分線外 3 分),分高者勝。
// ★ 模式:🤖 對戰阿福教練(擬人頭像+泡泡,依難度命中率;牧者拍板成套)/👥 雙人同機輪流。
// 溫柔規則:沒有失敗——輸了=「練習賽結束!」,onComplete 永遠 won:true。
// 年齡三檔:幼(甜蜜區超寬・都在近距)/童(標準)/青(甜蜜區窄・三分球多)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。

const VW = 960
const VH = 540
const FLOOR = VH - 70 // 地板線
const BR = 13 // 球半徑
const HOOP = { x: VW - 150, y: 190, r: 30 } // 籃框(圓心+半徑)
const SHOTS = 8 // 每人出手數
const GRAV = 900

const AGES = {
  young: { label: '🐣 幼', desc: '甜蜜區超寬・都在近距', sweet: 0.3, spots: [280, 330, 380, 430], aiHit: 0.35 },
  kid: { label: '🙂 童', desc: '標準・混三分', sweet: 0.18, spots: [280, 360, 460, 560], aiHit: 0.5 },
  teen: { label: '🔥 青', desc: '甜蜜區窄・三分多', sweet: 0.11, spots: [360, 460, 560, 640], aiHit: 0.62 },
}
const THREE_DIST = 450 // 離籃框水平距離超過這個=三分球

const T = {
  title: '🏀 投籃大賽',
  sub: '憫安製作・只比投籃',
  how: '輪流出手!**按住空白鍵(或按住畫面)蓄力、在「綠色甜蜜區」放開**=空心入網;差一點會打框彈跳、看運氣進不進。出手點會越換越遠——三分線外進球算 3 分!每人 8 球,分高的贏。放輕鬆,這是練習賽!',
  pickMode: '選賽制:',
  pickAge: '選難度:',
  modeAI: '🤖 對戰阿福教練',
  modeAIDesc: '阿福也會下場投!',
  mode2P: '👥 雙人同機',
  mode2PDesc: '輪流出手 PK',
  swish: '🌟 空心入網!',
  rimIn: '🏀 彈框進了!',
  rimOut: '😅 打框彈出…',
  air: '💨 空氣球…',
  endWin: '🏆 你贏了!神射手!',
  endLose: '🏀 練習賽結束!',
  endDraw: '🤝 平手,好比賽!',
  end2p: (w) => (w === 0 ? '🤝 平手,好比賽!' : `🏆 ${w === 1 ? 'P1' : 'P2'} 贏了!`),
  teach: '投籃跟練琴一樣——手感是一球一球養出來的。進了要開心,沒進也要開心,再來一顆就是了!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → charge ⇄ flying/result → done
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this.mode = 'ai'
    this._onKeyDown = (e) => this._key(e)
    this._onKeyUp = (e) => this._keyUp(e)
    this._onDown = (e) => this._down(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.turn = 1 // 1=玩家/P1,2=阿福或 P2
    this.shots = { 1: 0, 2: 0 } // 已出手數
    this.score = { 1: 0, 2: 0 }
    this.charging = false
    this.charge = 0
    this.ball = null // {x,y,vx,vy}
    this.spotIdx = 0
    this.resultT = 0
    this.aiT = 0 // 阿福思考倒數
    this.bubble = ''
    this.toasts = []
    this._audio = null
  }

  boot() {
    addEventListener('keydown', this._onKeyDown)
    addEventListener('keyup', this._onKeyUp)
    this.cv.addEventListener('pointerdown', this._onDown)
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
    removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.turn = 1
    this.shots = { 1: 0, 2: 0 }
    this.score = { 1: 0, 2: 0 }
    this.toasts = []
    this.bubble = ''
    this._nextSpot()
    this.state = 'charge'
  }

  // 出手點:雙方同一輪投同一個點(公平);spots=離籃框的水平距離
  _spotX() { return HOOP.x - this.cfg.spots[this.spotIdx % this.cfg.spots.length] }
  _isThree() { return this.cfg.spots[this.spotIdx % this.cfg.spots.length] >= THREE_DIST }

  _nextSpot() {
    this.spotIdx = Math.floor((this.shots[1] + this.shots[2]) / 2) % this.cfg.spots.length
    this.charging = false
    this.charge = 0
    this.ball = null
    // 阿福回合:思考 0.9~1.5 秒再出手
    if (this.mode === 'ai' && this.turn === 2) {
      this.aiT = 0.9 + Math.random() * 0.6
      this.bubble = '看我的!'
    } else this.bubble = ''
  }

  // 這個出手點的「甜蜜力道」:離籃越遠要越大力(0.35~0.9),甜蜜區寬=cfg.sweet
  _sweetPower() {
    const d = this.cfg.spots[this.spotIdx % this.cfg.spots.length]
    const dMin = 260, dMax = 660
    return 0.35 + ((d - dMin) / (dMax - dMin)) * 0.5
  }

  // 出手:power 與甜蜜力道的差距決定命運(swish / 打框看運氣 / 空氣球)
  _shoot(power) {
    const sx = this._spotX(), sy = FLOOR - 78 // 出手高度(舉手位置)
    const diff = Math.abs(power - this._sweetPower())
    const half = this.cfg.sweet / 2
    let fate // 'swish' | 'rim' | 'air'
    if (diff <= half) fate = 'swish'
    else if (diff <= half * 2.6) fate = 'rim'
    else fate = 'air'
    // 拋物線:先算命運,再反推軌跡終點(飛行時間固定 ~1.05s,視覺穩定)
    const tf = 1.05
    let tx = HOOP.x, ty = HOOP.y
    if (fate === 'rim') tx = HOOP.x + (power > this._sweetPower() ? 1 : -1) * (HOOP.r * 0.9)
    if (fate === 'air') {
      const over = power > this._sweetPower()
      tx = HOOP.x + (over ? 70 + Math.random() * 40 : -(80 + Math.random() * 50))
      ty = HOOP.y + (over ? -10 : 26)
    }
    const vx = (tx - sx) / tf
    const vy = (ty - sy - 0.5 * GRAV * tf * tf) / tf
    this.ball = { x: sx, y: sy, vx, vy }
    this.fate = fate
    this.shots[this.turn] += 1
    this.state = 'flying'
    this.charging = false
    this._tone(300, 0.07, 0, 'sine', 0.08)
  }

  _resolve() {
    const three = this._isThree()
    let pts = 0, msg = T.air, good = false
    if (this.fate === 'swish') { pts = three ? 3 : 2; msg = T.swish; good = true }
    else if (this.fate === 'rim') {
      // 打框:40% 彈進(幼 60%)
      const luck = this.age === 'young' ? 0.6 : 0.4
      if (Math.random() < luck) { pts = three ? 3 : 2; msg = T.rimIn; good = true }
      else msg = T.rimOut
    }
    this.score[this.turn] += pts
    this.lastPts = pts
    this.toasts.push({ text: msg + (pts ? `+${pts}` : ''), t: this._t })
    if (good) { this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(784, 0.2, 0.1, 'triangle', 0.11) }
    else this._tone(190, 0.14, 0, 'sine', 0.06)
    if (this.mode === 'ai') this.bubble = this.turn === 2 ? (good ? '進啦!' : '哎呀…') : good ? '好球!' : '再來,穩住!'
    this.state = 'result'
    this.resultT = 1.15
  }

  _update(dt) {
    if (this.state === 'intro' || this.state === 'done') return
    if (this.state === 'charge') {
      if (this.charging) this.charge = Math.min(1, this.charge + dt / 1.1)
      // 阿福出手:命中率決定 power 落點(命中=甜蜜區內,失手=區外一點點)
      if (this.mode === 'ai' && this.turn === 2) {
        this.aiT -= dt
        if (this.aiT <= 0) {
          const sweet = this._sweetPower()
          const hit = Math.random() < this.cfg.aiHit
          const off = hit ? (Math.random() - 0.5) * this.cfg.sweet * 0.8
            : (Math.random() < 0.5 ? 1 : -1) * (this.cfg.sweet * (0.7 + Math.random() * 1.2))
          this._shoot(Math.max(0.1, Math.min(1, sweet + off)))
        }
      }
    }
    if (this.state === 'flying') {
      const b = this.ball
      b.vy += GRAV * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      // 到籃框高度(下落中)= 判定
      if (b.vy > 0 && b.y >= HOOP.y - 4) this._resolve()
    }
    if (this.state === 'result') {
      const b = this.ball
      if (b) {
        if (this.lastPts > 0) {
          // 進球:順著網子落下
          b.x += (HOOP.x - b.x) * Math.min(1, dt * 10)
          b.y = Math.min(b.y + 260 * dt, HOOP.y + 46)
        } else {
          // 沒進:自然彈落地板
          b.vy += GRAV * dt
          b.x += b.vx * dt * 0.4
          b.y += b.vy * dt
          if (b.y > FLOOR - BR) { b.y = FLOOR - BR; b.vy = -Math.abs(b.vy) * 0.45; b.vx *= 0.7 }
        }
      }
      this.resultT -= dt
      if (this.resultT <= 0) {
        if (this.shots[1] >= SHOTS && this.shots[2] >= SHOTS) return this._done()
        this.turn = this.turn === 1 ? 2 : 1
        if (this.shots[this.turn] >= SHOTS) this.turn = this.turn === 1 ? 2 : 1
        this._nextSpot()
        this.state = 'charge'
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.7)
  }

  _done() {
    this.state = 'done'
    const w = this.score[1] > this.score[2] ? 1 : this.score[2] > this.score[1] ? 2 : 0
    this.result = w
    this.stars = this.mode === '2p' ? 3 : w === 1 ? 3 : w === 0 ? 2 : 1
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.score[1] * 5 + 10, level: 'hoopshot' }) }, 800)
  }

  _humanTurn() { return this.state === 'charge' && !(this.mode === 'ai' && this.turn === 2) }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
      if (e.key === '1') return this._start('young')
      if (e.key === '2') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (e.key === ' ' && this._humanTurn()) { e.preventDefault && e.preventDefault(); if (!this.charging) { this.charging = true; this.charge = 0.1 } }
  }

  _keyUp(e) {
    if (e.key === ' ' && this.charging && this._humanTurn()) this._shoot(this.charge)
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
    if (this._humanTurn() && !this.charging) { this.charging = true; this.charge = 0.1 }
  }

  _up() {
    if (this.charging && this._humanTurn()) this._shoot(this.charge)
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
    // 體育館底色
    ctx.fillStyle = '#2c3242'
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    // 觀眾席(色點)
    for (let i = 0; i < 40; i++) {
      const cx = 30 + ((i * 97) % (VW - 60)), cy = 30 + ((i * 53) % 90)
      ctx.fillStyle = ['#c8b060', '#a06a6a', '#6a90a0', '#8a7ab0'][i % 4]
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill()
    }
    // 木地板
    ctx.fillStyle = '#c89858'
    ctx.fillRect(0, FLOOR, VW, VH - FLOOR)
    for (let x = 0; x < VW; x += 60) {
      ctx.strokeStyle = 'rgba(120,80,30,0.35)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, VH); ctx.stroke()
    }
    // 三分線(地板上一道弧線記號)
    const threeX = HOOP.x - THREE_DIST
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(threeX, FLOOR); ctx.lineTo(threeX - 16, VH); ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('3 分線', threeX - 8, VH - 14)
    // 籃架:柱+籃板+框+網
    ctx.fillStyle = '#8a8f9a'
    ctx.fillRect(VW - 46, HOOP.y - 90, 14, FLOOR - HOOP.y + 90) // 柱
    ctx.fillStyle = '#e8ecf2'
    ctx.fillRect(HOOP.x + HOOP.r + 4, HOOP.y - 78, 12, 92) // 籃板
    ctx.strokeStyle = '#c04030'; ctx.lineWidth = 3
    ctx.strokeRect(HOOP.x + HOOP.r + 6, HOOP.y - 44, 8, 34) // 籃板小框
    ctx.strokeStyle = '#e05030'; ctx.lineWidth = 5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(HOOP.x - HOOP.r, HOOP.y); ctx.lineTo(HOOP.x + HOOP.r, HOOP.y); ctx.stroke() // 框
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5
    for (let i = 0; i <= 6; i++) { // 網
      const nx = HOOP.x - HOOP.r + (i / 6) * HOOP.r * 2
      ctx.beginPath(); ctx.moveTo(nx, HOOP.y)
      ctx.lineTo(HOOP.x - HOOP.r * 0.55 + (i / 6) * HOOP.r * 1.1, HOOP.y + 42); ctx.stroke()
    }
    // 出手的人(輪到誰畫誰的顏色;阿福=紅隊色)
    const sx = this._spotX()
    const isAfu = this.mode === 'ai' && this.turn === 2
    this._player(sx, FLOOR, isAfu ? '#c83a3a' : this.turn === 1 ? '#2a5ac8' : '#c83a3a', this.state === 'charge')
    // 球(蓄力時在手上;飛行/結果照座標)
    if (this.ball) this._basketball(this.ball.x, this.ball.y)
    else this._basketball(sx + 16, FLOOR - 82)
    // 力道環+甜蜜區(人類回合蓄力時)
    if (this.state === 'charge' && !isAfu) {
      const cx = sx, cy = FLOOR - 120
      const sweet = this._sweetPower(), half = this.cfg.sweet / 2
      const a0 = -Math.PI / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 9
      ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 7); ctx.stroke()
      // 綠色甜蜜區
      ctx.strokeStyle = '#58c860'
      ctx.beginPath(); ctx.arc(cx, cy, 34, a0 + (sweet - half) * Math.PI * 2, a0 + (sweet + half) * Math.PI * 2); ctx.stroke()
      // 目前力道
      if (this.charging) {
        ctx.strokeStyle = '#ffe070'; ctx.lineWidth = 5
        ctx.beginPath(); ctx.arc(cx, cy, 34, a0, a0 + this.charge * Math.PI * 2); ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'bold 12px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(this.charging ? '在綠區放開!' : '按住蓄力', cx, cy - 46)
    }
    // 阿福教練頭像(AI 模式,右上)
    if (this.mode === 'ai') this._coach(VW - 74, 64, this.turn === 2 && this.state === 'charge')
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.7
      if (k >= 1) continue
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,20,40,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${28 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.fillText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.globalAlpha = 1
    }
    // HUD:比分+剩餘球數+這球幾分
    const p2name = this.mode === 'ai' ? '阿福' : 'P2'
    const three = this._isThree() ? '(三分球!)' : '(兩分)'
    ctx.fillStyle = 'rgba(16,20,36,0.7)'
    rHs(ctx, VW * 0.22, 6, VW * 0.56, 32, 12); ctx.fill()
    ctx.fillStyle = '#eef2f8'
    ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🔵 你 ${this.score[1]} : ${this.score[2]} ${p2name} 🔴 ・ 第 ${Math.min(SHOTS, this.shots[this.turn] + 1)}/${SHOTS} 球 ${three}`, VW / 2, 28)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  // 側視小球員:舉手投籃姿勢
  _player(x, floorY, color, armsUp) {
    const { ctx } = this
    ctx.fillStyle = color
    ctx.fillRect(x - 12, floorY - 64, 24, 34) // 球衣
    ctx.fillStyle = '#3a3f52'
    ctx.fillRect(x - 11, floorY - 30, 9, 30); ctx.fillRect(x + 2, floorY - 30, 9, 30) // 腿
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, floorY - 74, 10, 0, 7); ctx.fill() // 頭
    ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round'
    if (armsUp) { // 舉手瞄籃
      ctx.beginPath(); ctx.moveTo(x + 8, floorY - 58); ctx.lineTo(x + 17, floorY - 80); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x - 8, floorY - 58); ctx.lineTo(x - 2, floorY - 78); ctx.stroke()
    } else {
      ctx.beginPath(); ctx.moveTo(x + 8, floorY - 58); ctx.lineTo(x + 20, floorY - 44); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x - 8, floorY - 58); ctx.lineTo(x - 20, floorY - 44); ctx.stroke()
    }
  }

  _basketball(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#e08030'
    ctx.beginPath(); ctx.arc(x, y, BR, 0, 7); ctx.fill()
    ctx.strokeStyle = '#7a3a10'; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(x, y, BR, 0, 7); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - BR, y); ctx.lineTo(x + BR, y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, y - BR); ctx.lineTo(x, y + BR); ctx.stroke()
    ctx.beginPath(); ctx.arc(x - BR, y, BR * 0.85, -0.9, 0.9); ctx.stroke()
    ctx.beginPath(); ctx.arc(x + BR, y, BR * 0.85, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke()
  }

  // 阿福教練(擬人化頭像,成套沿用 soccer/football;思考=眼睛掃視)
  _coach(x, y, thinking) {
    const { ctx } = this
    ctx.fillStyle = 'rgba(16,20,36,0.6)'
    ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill()
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, y + 3, 20, 0, 7); ctx.fill()
    ctx.fillStyle = '#c83a3a'
    ctx.beginPath(); ctx.arc(x, y - 4, 20, Math.PI, 0); ctx.fill()
    ctx.fillRect(x - 22, y - 6, 44, 5)
    ctx.fillStyle = '#2a2018'
    const look = thinking ? -3 + Math.sin(this._t * 3) * 2 : 0
    ctx.beginPath(); ctx.arc(x - 7 + look, y + 3, 2.6, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 7 + look, y + 3, 2.6, 0, 7); ctx.fill()
    ctx.fillStyle = '#8a5a30'
    ctx.beginPath(); ctx.arc(x, y + 12, thinking ? 2.5 : 4, 0, 7); ctx.fill()
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(x + 6, y + 10, 9, 5)
    if (this.bubble) {
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      const w = ctx.measureText(this.bubble).width + 20
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rHs(ctx, x - w, y + 40, w, 26, 10); ctx.fill()
      ctx.fillStyle = '#3a2c14'
      ctx.textAlign = 'center'
      ctx.fillText(this.bubble, x - w / 2, y + 58)
    }
    ctx.fillStyle = '#eef2f8'
    ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('阿福教練', x, y + 32)
  }

  _drawIntro() {
    const { ctx } = this
    ctx.fillStyle = 'rgba(246,248,252,0.96)'
    ctx.strokeStyle = '#e08030'; ctx.lineWidth = 3
    rHs(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#7a3a10'
    ctx.font = 'bold 32px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.15)
    ctx.fillStyle = '#a06a3a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.215)
    ctx.fillStyle = '#3a2c1c'
    wrapHs(ctx, T.how, VW / 2, VH * 0.28, VW * 0.7, 22)
    ctx.fillStyle = '#a06a3a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.52)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.26, mh = VH * 0.1, mgap = VW * 0.04
    mDefs.forEach((m, i) => {
      const x = VW / 2 - mw - mgap / 2 + i * (mw + mgap), y = VH * 0.55
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(224,128,48,0.2)'
      rHs(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rHs(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#5a3c20'
      ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.44)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    ctx.fillStyle = '#a06a3a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.72)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.12, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.75
      ctx.fillStyle = '#e08030'
      rHs(ctx, x, y, bw, bh, 14); ctx.fill()
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
    rHs(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#7a3a10'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p' ? T.end2p(this.result)
      : this.result === 1 ? T.endWin : this.result === 0 ? T.endDraw : T.endLose
    ctx.fillText(title, W / 2, H * 0.22)
    ctx.font = `bold ${Math.max(26, H * 0.09)}px "Noto Sans TC",sans-serif`
    ctx.fillStyle = '#3a2c1c'
    const p2name = this.mode === 'ai' ? '阿福' : 'P2'
    ctx.fillText(`🔵 ${this.score[1]} : ${this.score[2]} 🔴`, W / 2, H * 0.38)
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`(你 vs ${p2name})`, W / 2, H * 0.46)
    if (this.mode === 'ai') {
      ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.56)
    }
    ctx.fillStyle = '#4a3a28'
    wrapHs(ctx, T.teach, W / 2, H * 0.66, w * 0.66, H * 0.05)
    ctx.restore()
  }
}

function rHs(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function wrapHs(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
