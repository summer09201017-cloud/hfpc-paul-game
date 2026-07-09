// ⚾ 棒球打擊王(baseball)——憫安製作休閒關(不掛經文,進大廳「休閒運動合輯」)。
// ⚠ 休閒關,刻意不掛聖經經文(同 goalkick/soccer/football 前例);無 cuv/tts/送審文案這一套。
//
// 兩種模式(使用者拍板 A+B 都要):
//   A. 🤖 打擊練習:阿福教練站投手丘投 10 球(快速球/慢速球/變化球),你抓時機揮棒——
//      時機完美=🎆 全壘打(飛越全壘打牆+距離)、不錯=安打、差一點=界外、太早太晚=揮空;看總分拿星。
//   B. 👥 投打對決(雙人同機):P1 當投手(W/S 選高低、A/D 選球種、空白鍵投球)、P2 打擊(Enter 揮棒);
//      6 球後攻守交換,打擊得分高者勝。沒有守備模擬——打擊結果直接按時機品質判定,複雜度可控、PK 樂趣十足。
// 操作:打者=空白鍵/Enter/點畫面 揮棒;投手(對決)=W/S 高低、A/D 球種、空白鍵投出。
// 溫柔規則:揮空/界外不扣分、沒有三振出局——每一球都是新的機會;onComplete 永遠 won:true。
// 年齡三檔:幼(全慢速球・時機窗超寬)/童(快慢混・標準)/青(含變化球・時機窗窄)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。

const VW = 960
const VH = 540
const GROUND = VH - 90
const MOUND_X = 250 // 投手丘
const PLATE_X = 720 // 本壘板(球到這裡=揮棒時機)
const BR = 10
const PITCHES_A = 10 // 練習模式球數
const PITCHES_B = 6 // 對決模式每人打擊球數
const WALL_X = 70 // 全壘打牆(打出去往左飛)

const AGES = {
  young: { label: '🐣 幼', desc: '全慢速球・時機窗超寬', kinds: ['slow'], win: { perfect: 22, good: 46 } },
  kid: { label: '🙂 童', desc: '快慢混・標準', kinds: ['fast', 'slow'], win: { perfect: 13, good: 30 } },
  teen: { label: '🔥 青', desc: '含變化球・時機窗窄', kinds: ['fast', 'slow', 'curve'], win: { perfect: 9, good: 22 } },
}
const PITCH_KINDS = {
  fast: { label: '🔥 快速球', speed: 470 },
  slow: { label: '🐢 慢速球', speed: 300 },
  curve: { label: '🌀 變化球', speed: 390 },
}

const T = {
  title: '⚾ 棒球打擊王',
  sub: '憫安製作・抓準時機揮棒',
  how: '投手投球,**球到本壘板正上方時揮棒**(空白鍵/Enter/點畫面)!時機完美=🎆 全壘打、不錯=安打、差一點=界外。揮空也沒關係,下一球再來——沒有三振,每一球都是新的機會!',
  how2p: '👥 投打對決:P1 投手=W/S 選高低、A/D 選球種、空白鍵投球;P2 打者=Enter 揮棒;6 球後攻守交換,打擊分高的贏。',
  pickMode: '選模式:',
  pickAge: '選難度:',
  modeAI: '🤖 打擊練習',
  modeAIDesc: '阿福教練投 10 球',
  mode2P: '👥 投打對決',
  mode2PDesc: '投打輪流 PK',
  homer: '🎆 全壘打!',
  hit: '⚾ 安打!',
  foul: '😅 界外…',
  whiff: '💨 揮空…',
  take: '👀 看過去了',
  pitcherHint: 'P1 投手:W/S 高低 ・ A/D 球種 ・ 空白鍵投球',
  batterHint: '球到本壘上方時揮棒!',
  swapMsg: '⇄ 攻守交換!',
  endWin: (s) => `🏆 打擊王!${s} 分!`,
  endGood: (s) => `🎉 好打者!${s} 分!`,
  endOk: (s) => `⚾ 練習完成!${s} 分!`,
  end2p: (w) => (w === 0 ? '🤝 平手,好比賽!' : `🏆 ${w === 1 ? 'P1' : 'P2'} 打擊獲勝!`),
  teach: '打擊率三成就是好打者——十次有七次沒打中也沒關係。抓好時機、揮出去,下一球永遠是新的機會!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → ready → pitching → result → done(對決多 half 交換)
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this.mode = 'ai'
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onResize = () => this._resize()
    this.ball = null // {x,y,vx, kind, y0, swung}
    this.pitchCount = 0
    this.score = { 1: 0, 2: 0 } // 對決=兩人打擊分;練習只用 [1]
    this.half = 1 // 對決:1=P1投/P2打,2=交換
    this.pitchSel = { loc: 'mid', kind: 'fast' } // 對決投手選球
    this.aiT = 0
    this.swing = 0 // 揮棒動畫計時
    this.hitFly = null // 打出去的球 {x,y,vx,vy,dist}
    this.resultT = 0
    this.bubble = ''
    this.toasts = []
    this._audio = null
  }

  boot() {
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
    try { this._audio && this._audio.close() } catch {}
  }

  _total() { return this.mode === 'ai' ? PITCHES_A : PITCHES_B }
  _batter() { return this.mode === 'ai' ? 1 : this.half === 1 ? 2 : 1 } // 對決:上半 P2 打

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.pitchCount = 0
    this.score = { 1: 0, 2: 0 }
    this.half = 1
    this.toasts = []
    this.bubble = ''
    this._ready()
    this.state = 'ready'
  }

  _ready() {
    this.ball = null
    this.hitFly = null
    this.swing = 0
    this.pitchSel = { loc: 'mid', kind: this.cfg.kinds[0] }
    if (this.mode === 'ai') {
      this.aiT = 1.0 + Math.random() * 0.9 // 阿福醞釀
      this.bubble = ['接好囉!', '這球有點刁!', '看仔細!'][Math.floor(Math.random() * 3)]
    }
  }

  // 投球:kind=球種,loc=高低(high/mid/low)
  _pitch(kind, loc) {
    const y0 = GROUND - 96 + (loc === 'high' ? -26 : loc === 'low' ? 24 : 0)
    this.ball = { x: MOUND_X + 24, y: y0, y0, vx: PITCH_KINDS[kind].speed, kind, swung: false, loc }
    this.state = 'pitching'
    this._tone(240, 0.06, 0, 'sine', 0.07)
  }

  // 揮棒:按「球離本壘板的距離」判品質
  _swing() {
    if (this.state !== 'pitching' || !this.ball || this.ball.swung) return
    this.ball.swung = true
    this.swing = 0.28 // 揮棒動畫
    const d = Math.abs(this.ball.x - PLATE_X)
    const batter = this._batter()
    let pts = 0, msg
    if (d <= this.cfg.win.perfect) { pts = 3; msg = T.homer }
    else if (d <= this.cfg.win.good) { pts = 1; msg = T.hit }
    else if (d <= this.cfg.win.good * 1.8) { msg = T.foul }
    else { msg = T.whiff }
    this.score[batter] += pts
    this.lastPts = pts
    this.toasts.push({ text: msg + (pts ? ` +${pts}` : ''), t: this._t })
    if (pts >= 3) {
      // 全壘打:球高飛越牆,距離跟著時機準度
      const dist = 96 + Math.round((1 - d / Math.max(1, this.cfg.win.perfect)) * 30)
      this.hitFly = { x: this.ball.x, y: this.ball.y, vx: -(560 + dist * 3), vy: -430, dist }
      this.ball = null
      this._tone(523, 0.1, 0, 'triangle', 0.12); this._tone(659, 0.12, 0.09, 'triangle', 0.12); this._tone(784, 0.24, 0.18, 'triangle', 0.12)
      if (this.mode === 'ai') this.bubble = '哇——飛出去了!'
    } else if (pts > 0) {
      this.hitFly = { x: this.ball.x, y: this.ball.y, vx: -(360 + Math.random() * 80), vy: -300, dist: 0 }
      this.ball = null
      this._tone(494, 0.1, 0, 'triangle', 0.11); this._tone(659, 0.16, 0.09, 'triangle', 0.1)
      if (this.mode === 'ai') this.bubble = '好球!'
    } else {
      // 界外/揮空:球繼續飛過(或斜飛出界)
      if (msg === T.foul && this.ball) { this.ball.vx *= 0.6; this.ball.foul = true }
      this._tone(190, 0.1, 0, 'sine', 0.06)
      if (this.mode === 'ai') this.bubble = '穩住,下一球!'
    }
    this._endPitch()
  }

  _endPitch() {
    this.pitchCount += 1
    this.state = 'result'
    this.resultT = 1.35
  }

  _update(dt) {
    if (this.state === 'intro' || this.state === 'done') return
    this.swing = Math.max(0, this.swing - dt)
    if (this.state === 'ready') {
      // 阿福自動投球(練習);對決由 P1 按空白鍵投
      if (this.mode === 'ai') {
        this.aiT -= dt
        if (this.aiT <= 0) {
          const kind = this.cfg.kinds[Math.floor(Math.random() * this.cfg.kinds.length)]
          const loc = ['high', 'mid', 'low'][Math.floor(Math.random() * 3)]
          this._pitch(kind, loc)
        }
      }
    }
    if (this.state === 'pitching') {
      const b = this.ball
      b.x += b.vx * dt
      // 變化球:途中上下飄
      if (b.kind === 'curve') b.y = b.y0 + Math.sin((b.x - MOUND_X) / 60) * 22
      // 沒揮棒,球過了本壘=「看過去了」
      if (!b.swung && b.x > PLATE_X + this.cfg.win.good * 1.8 + 10) {
        b.swung = true
        this.toasts.push({ text: T.take, t: this._t })
        if (this.mode === 'ai') this.bubble = '要出棒喔!'
        this._tone(210, 0.08, 0, 'sine', 0.05)
        this._endPitch()
      }
      if (b.x > VW + 30) this.ball = null
    }
    if (this.state === 'result') {
      // 打飛的球
      if (this.hitFly) {
        const f = this.hitFly
        f.vy += 620 * dt
        f.x += f.vx * dt
        f.y += f.vy * dt
      }
      // 沒打中的球繼續滑出畫面
      if (this.ball) {
        this.ball.x += this.ball.vx * dt
        if (this.ball.x > VW + 30) this.ball = null
      }
      this.resultT -= dt
      if (this.resultT <= 0) {
        const total = this._total()
        if (this.mode === 'ai') {
          if (this.pitchCount >= total) return this._done()
        } else {
          if (this.half === 1 && this.pitchCount >= total) {
            this.half = 2
            this.pitchCount = 0
            this.toasts.push({ text: T.swapMsg, t: this._t })
            this._tone(440, 0.1, 0, 'triangle', 0.1); this._tone(554, 0.14, 0.1, 'triangle', 0.1)
          } else if (this.half === 2 && this.pitchCount >= total) return this._done()
        }
        this._ready()
        this.state = 'ready'
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
  }

  _done() {
    this.state = 'done'
    if (this.mode === 'ai') {
      const s = this.score[1]
      this.stars = s >= 16 ? 3 : s >= 8 ? 2 : 1
      this.result = s
    } else {
      // 對決:上半 P2 打、下半 P1 打——比打擊分
      this.result = this.score[1] > this.score[2] ? 1 : this.score[2] > this.score[1] ? 2 : 0
      this.stars = 3
    }
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: (this.mode === 'ai' ? this.score[1] : Math.max(this.score[1], this.score[2])) * 4 + 10, level: 'baseball' }) }, 800)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
      if (e.key === '1') return this._start('young')
      if (e.key === '2') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    // 打者揮棒:練習=空白鍵或 Enter;對決=Enter(投手用空白鍵投球)
    if (e.key === ' ') {
      e.preventDefault && e.preventDefault()
      if (this.mode === 'ai') this._swing()
      else if (this.state === 'ready') { // 對決:投手投球
        this._pitch(this.pitchSel.kind, this.pitchSel.loc)
      }
    }
    if (e.key === 'Enter') {
      if (this.mode === 'ai') this._swing()
      else this._swing()
    }
    // 對決投手選球(ready 階段)
    if (this.mode === '2p' && this.state === 'ready') {
      if (e.key === 'w' || e.key === 'W') this.pitchSel.loc = this.pitchSel.loc === 'low' ? 'mid' : 'high'
      if (e.key === 's' || e.key === 'S') this.pitchSel.loc = this.pitchSel.loc === 'high' ? 'mid' : 'low'
      if (e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D') {
        const ks = this.cfg.kinds
        const i = ks.indexOf(this.pitchSel.kind)
        this.pitchSel.kind = ks[(i + (e.key === 'a' || e.key === 'A' ? ks.length - 1 : 1)) % ks.length]
        this._tone(460, 0.04, 0, 'sine', 0.05)
      }
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
    // 觸控:練習模式點畫面=揮棒(對決用鍵盤)
    if (this.mode === 'ai') this._swing()
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
    // 傍晚天空
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#3a4a7a'); grad.addColorStop(1, '#7a6a9a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    // 球場燈
    for (const lx of [140, 820]) {
      ctx.fillStyle = '#5a5f72'
      ctx.fillRect(lx - 4, 40, 8, 90)
      ctx.fillStyle = '#ffe9a0'
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(lx - 16 + i * 16, 36, 7, 0, 7); ctx.fill() }
    }
    // 草地+內野土
    ctx.fillStyle = '#4a7a3e'
    ctx.fillRect(0, GROUND, VW, VH - GROUND)
    ctx.fillStyle = '#b08050'
    ctx.beginPath(); ctx.ellipse(MOUND_X, GROUND + 26, 90, 26, 0, 0, 7); ctx.fill() // 投手丘
    ctx.beginPath(); ctx.ellipse(PLATE_X + 20, GROUND + 30, 100, 30, 0, 0, 7); ctx.fill() // 打擊區
    // 全壘打牆(左端)
    ctx.fillStyle = '#2c4a2c'
    ctx.fillRect(WALL_X - 26, GROUND - 120, 26, 120)
    ctx.fillStyle = '#ffe070'
    ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.save()
    ctx.translate(WALL_X - 13, GROUND - 60); ctx.rotate(-Math.PI / 2)
    ctx.fillText('全壘打牆', 0, 5)
    ctx.restore()
    // 本壘板+好球帶提示(球到這上方揮棒)
    ctx.fillStyle = '#f0f0e8'
    ctx.beginPath()
    ctx.moveTo(PLATE_X - 13, GROUND + 6); ctx.lineTo(PLATE_X + 13, GROUND + 6)
    ctx.lineTo(PLATE_X + 13, GROUND + 14); ctx.lineTo(PLATE_X, GROUND + 20); ctx.lineTo(PLATE_X - 13, GROUND + 14)
    ctx.closePath(); ctx.fill()
    if (this.state === 'pitching' && !this.ball?.swung) {
      ctx.strokeStyle = 'rgba(255,224,112,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6])
      ctx.strokeRect(PLATE_X - this.cfg.win.good, GROUND - 150, this.cfg.win.good * 2, 130)
      ctx.setLineDash([])
    }
    // 投手(對決=藍衣 P1;練習=阿福紅衣)
    this._pitcher(MOUND_X, GROUND, this.mode === 'ai' ? '#c83a3a' : '#2a5ac8', this.state === 'pitching')
    // 打者(揮棒動畫)
    this._batterFig(PLATE_X + 42, GROUND, this.mode === 'ai' ? '#2a5ac8' : this.half === 1 ? '#c83a3a' : '#2a5ac8', this.swing > 0)
    // 投來的球
    if (this.ball) this._ballDraw(this.ball.x, this.ball.y)
    // 打飛的球+距離
    if (this.hitFly) {
      this._ballDraw(this.hitFly.x, this.hitFly.y)
      if (this.hitFly.dist) {
        ctx.fillStyle = '#ffe070'
        ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${this.hitFly.dist} 公尺!`, Math.max(120, this.hitFly.x), Math.max(70, this.hitFly.y - 24))
      }
    }
    // 對決:投手選球面板(ready 時)
    if (this.mode === '2p' && this.state === 'ready') {
      ctx.fillStyle = 'rgba(20,24,48,0.78)'
      rBb(ctx, 24, 60, 300, 96, 12); ctx.fill()
      ctx.fillStyle = '#eef2f8'
      ctx.font = 'bold 14px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(T.pitcherHint, 38, 84)
      ctx.font = '15px "Noto Sans TC",sans-serif'
      const locLabel = this.pitchSel.loc === 'high' ? '⬆ 高球' : this.pitchSel.loc === 'low' ? '⬇ 低球' : '➡ 紅中'
      ctx.fillText(`高低:${locLabel}`, 38, 110)
      ctx.fillText(`球種:${PITCH_KINDS[this.pitchSel.kind].label}`, 38, 136)
    }
    // 阿福教練頭像(練習模式,右上)
    if (this.mode === 'ai') this._coach(VW - 74, 64, this.state === 'ready')
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      if (k >= 1) continue
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,20,50,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${30 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.34 - k * 24)
      ctx.fillText(t.text, VW / 2, VH * 0.34 - k * 24)
      ctx.globalAlpha = 1
    }
    // HUD
    const total = this._total()
    const hudTxt = this.mode === 'ai'
      ? `⚾ 第 ${Math.min(total, this.pitchCount + 1)}/${total} 球 ・ 得分 ${this.score[1]}`
      : `${this.half === 1 ? '上半' : '下半'} ・ 第 ${Math.min(total, this.pitchCount + 1)}/${total} 球 ・ P1 ${this.score[1]} : ${this.score[2]} P2(打者=${this._batter() === 1 ? 'P1' : 'P2'})`
    ctx.fillStyle = 'rgba(20,24,48,0.7)'
    rBb(ctx, VW * 0.18, 6, VW * 0.64, 32, 12); ctx.fill()
    ctx.fillStyle = '#eef2f8'
    ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(hudTxt, VW / 2, 28)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  _pitcher(x, groundY, color, throwing) {
    const { ctx } = this
    ctx.fillStyle = color
    ctx.fillRect(x - 11, groundY - 58, 22, 30)
    ctx.fillStyle = '#3a3f52'
    ctx.fillRect(x - 10, groundY - 28, 8, 28); ctx.fillRect(x + 2, groundY - 28, 8, 28)
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, groundY - 68, 9, 0, 7); ctx.fill()
    ctx.fillStyle = color === '#c83a3a' ? '#c83a3a' : '#183a86' // 帽
    ctx.beginPath(); ctx.arc(x, groundY - 72, 9, Math.PI, 0); ctx.fill()
    ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'
    if (throwing) { ctx.beginPath(); ctx.moveTo(x + 8, groundY - 52); ctx.lineTo(x + 22, groundY - 66); ctx.stroke() }
    else { ctx.beginPath(); ctx.moveTo(x + 8, groundY - 52); ctx.lineTo(x + 16, groundY - 38); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(x - 8, groundY - 52); ctx.lineTo(x - 16, groundY - 40); ctx.stroke()
  }

  _batterFig(x, groundY, color, swinging) {
    const { ctx } = this
    ctx.fillStyle = color
    ctx.fillRect(x - 11, groundY - 58, 22, 30)
    ctx.fillStyle = '#3a3f52'
    ctx.fillRect(x - 10, groundY - 28, 8, 28); ctx.fillRect(x + 2, groundY - 28, 8, 28)
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, groundY - 68, 9, 0, 7); ctx.fill()
    ctx.fillStyle = '#2c3242'
    ctx.beginPath(); ctx.arc(x, groundY - 72, 9, Math.PI, 0); ctx.fill() // 頭盔
    // 球棒:待機=舉在肩後;揮棒=橫掃向投手
    ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 7; ctx.lineCap = 'round'
    ctx.beginPath()
    if (swinging) { ctx.moveTo(x - 4, groundY - 52); ctx.lineTo(x - 46, groundY - 66) }
    else { ctx.moveTo(x + 2, groundY - 52); ctx.lineTo(x + 22, groundY - 86) }
    ctx.stroke()
    ctx.strokeStyle = color; ctx.lineWidth = 6
    ctx.beginPath(); ctx.moveTo(x - 8, groundY - 52); ctx.lineTo(x - 4, groundY - 56); ctx.stroke()
  }

  _ballDraw(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x, y, BR, 0, 7); ctx.fill()
    ctx.strokeStyle = '#c04040'; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(x - 3, y, BR * 0.75, -1.2, 1.2); ctx.stroke()
    ctx.beginPath(); ctx.arc(x + 3, y, BR * 0.75, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke()
  }

  // 阿福教練(擬人化頭像,成套沿用 soccer/football/hoopshot)
  _coach(x, y, thinking) {
    const { ctx } = this
    ctx.fillStyle = 'rgba(20,24,48,0.6)'
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
      rBb(ctx, x - w, y + 40, w, 26, 10); ctx.fill()
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
    ctx.strokeStyle = '#4a7a3e'; ctx.lineWidth = 3
    rBb(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c5a1c'
    ctx.font = 'bold 32px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.15)
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.215)
    ctx.fillStyle = '#2e3c22'
    wrapBb(ctx, T.how, VW / 2, VH * 0.28, VW * 0.7, 22)
    wrapBb(ctx, T.how2p, VW / 2, VH * 0.46, VW * 0.7, 21)
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.565)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.26, mh = VH * 0.09, mgap = VW * 0.04
    mDefs.forEach((m, i) => {
      const x = VW / 2 - mw - mgap / 2 + i * (mw + mgap), y = VH * 0.59
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(90,140,70,0.3)'
      rBb(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rBb(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#2c4424'
      ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.44)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.735)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.11, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.76
      ctx.fillStyle = '#6aa040'
      rBb(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#12280c'
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
    ctx.fillStyle = '#f4faf0'
    ctx.strokeStyle = '#4a7a3e'; ctx.lineWidth = 3
    rBb(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c5a1c'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p' ? T.end2p(this.result)
      : this.stars === 3 ? T.endWin(this.result) : this.stars === 2 ? T.endGood(this.result) : T.endOk(this.result)
    ctx.fillText(title, W / 2, H * 0.24)
    if (this.mode === '2p') {
      ctx.font = `bold ${Math.max(26, H * 0.09)}px "Noto Sans TC",sans-serif`
      ctx.fillStyle = '#2e3c22'
      ctx.fillText(`P1 ${this.score[1]} : ${this.score[2]} P2`, W / 2, H * 0.4)
    } else {
      ctx.font = `${Math.max(24, H * 0.08)}px "Noto Sans TC",sans-serif`
      ctx.fillStyle = '#2e3c22'
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.42)
    }
    ctx.fillStyle = '#3a4a2e'
    wrapBb(ctx, T.teach, W / 2, H * 0.56, W * 0.62, H * 0.05)
    ctx.restore()
  }
}

function rBb(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function wrapBb(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
