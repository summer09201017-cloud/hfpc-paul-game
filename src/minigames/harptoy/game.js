// 大衛彈琴・自由演奏(音樂玩具/music toy,撒上 16:14-23)——節奏家族之外的「自由演奏」子型。
// ★不是節奏判定:沒有音符、沒有時機、沒有錯的音——五根琴弦調成五聲音階(C D E G A),
//   怎麼亂彈都好聽。只要「有在彈」,掃羅的愁煩就慢慢散開;停太久黑影會慢慢回來(溫柔提醒,不懲罰)。
//   受眾=幼稚園(跟不上拍子的小小孩);與 davidharp(GuitarHero 節奏判定版)同故事兩玩法
//   =bible-minigame-two-forms 範式,音樂闖關合輯並排兩張卡。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete})、boot()、destroy()。不會輸。
// 經文(和合本,2026-07-03 已用 cuv lookup 撒上 16:14-23 逐字核對);文案待牧者審核。
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const SCRIPTURE = {
  title: '大衛彈琴 · 自由演奏',
  ref: '撒母耳記上 16:23',
  how: '這是大衛的琴。想彈哪根弦,就點哪根弦(或按 D F G J K)——每一根都好聽,沒有錯的音!你一直彈,掃羅王的愁煩就會慢慢散開。小鴿子停在哪根弦,也可以跟著牠彈彈看。',
  winText: '從　神那裡來的惡魔臨到掃羅身上的時候，大衛就拿琴，用手而彈，掃羅便舒暢爽快，惡魔離了他。',
  winHead: '惡魔離了他!',
  winBody: '你的琴聲讓掃羅王舒暢爽快了!安慰人心的不是厲害的技巧——是神藉著琴聲賜下的平安。',
}

// 五聲音階(C 大調):怎麼彈都不難聽——這就是「沒有錯的音」的祕密
const STRINGS = [
  { key: 'KeyD', num: 'Digit1', freq: 261.63, name: 'Do' },
  { key: 'KeyF', num: 'Digit2', freq: 293.66, name: 'Re' },
  { key: 'KeyG', num: 'Digit3', freq: 329.63, name: 'Mi' },
  { key: 'KeyJ', num: 'Digit4', freq: 392.0, name: 'Sol' },
  { key: 'KeyK', num: 'Digit5', freq: 440.0, name: 'La' },
]
const KEYCAPS = ['D／1', 'F／2', 'G／3', 'J／4', 'K／5']
// 小鴿子的建議旋律(純引導,不判定):跟不跟都好
const BIRD_MELODY = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2]

const STEP = 1 / 60
const GLOOM_START = 0.85
const GLOOM_PER_NOTE = 0.035
const IDLE_REGROW_AFTER = 2.5 // 停彈幾秒後黑影慢慢回來
const IDLE_REGROW_RATE = 0.02

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.stopped = false
    this.finished = false
    this.state = 'intro'
    this.t = 0
    this.gloom = GLOOM_START
    this.notes = 0
    this.lastPluckAt = -9
    this.vib = STRINGS.map(() => 0) // 每弦振動量(衰減)
    this.sparks = [] // { x, y, vx, vy, age, life, hue }
    this.birdIdx = 0
    this.birdT = 0
    this._audio = null
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this._kd = (e) => {
      if (e.repeat) return
      if (this.state === 'intro' && (e.code === 'Space' || STRINGS.some((s) => s.code === e.code))) { this._start(); }
      const i = STRINGS.findIndex((s) => s.key === e.code || s.num === e.code)
      if (i >= 0) {
        e.preventDefault()
        if (this.state === 'intro') this._start()
        this._pluck(i)
      } else if (e.code === 'Space' && this.state === 'intro') {
        e.preventDefault()
        this._start()
      }
    }
    window.addEventListener('keydown', this._kd)
    this._pd = (e) => {
      e.preventDefault()
      if (this.state === 'intro') { this._start(); return }
      const rect = this.canvas.getBoundingClientRect()
      const i = this._stringAt(e.clientX - rect.left)
      if (i != null) this._pluck(i)
    }
    this.canvas.addEventListener('pointerdown', this._pd)
    setTimeout(() => { if (this.state === 'intro' && !this.stopped) speakText(SCRIPTURE.how) }, 350) // 幼稚園:自動唸玩法
    this.last = null
    this.acc = 0
    requestAnimationFrame(this._loop)
  }

  destroy() {
    this.stopped = true
    window.removeEventListener('keydown', this._kd)
    this.canvas.removeEventListener('pointerdown', this._pd)
    try { this._audio?.close() } catch {}
    stopSpeech()
  }

  _start() {
    if (this.state !== 'intro') return
    this.state = 'play'
    stopSpeech()
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      this._audio = this._audio || new AC()
    } catch {}
  }

  // 撥弦音色(同 davidharp:三角波+五度泛音,古琴感)
  _tone(freq) {
    const ctx = this._audio
    if (!ctx) return
    const t = ctx.currentTime
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.3, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
    const o1 = ctx.createOscillator()
    o1.type = 'triangle'; o1.frequency.value = freq
    const o2 = ctx.createOscillator()
    o2.type = 'sine'; o2.frequency.value = freq * 1.5
    const g2 = ctx.createGain(); g2.gain.value = 0.12
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(ctx.destination)
    o1.start(t); o2.start(t)
    o1.stop(t + 1.2); o2.stop(t + 1.2)
  }

  _pluck(i) {
    if (this.state !== 'play') return
    this._tone(STRINGS[i].freq)
    this.vib[i] = 1
    this.notes++
    this.lastPluckAt = this.t
    this.gloom = Math.max(0, this.gloom - GLOOM_PER_NOTE)
    // 火花(顏色隨弦)
    const geo = this._lyre()
    const sx = geo.x0 + i * geo.gap
    for (let k = 0; k < 5; k++) {
      this.sparks.push({
        x: sx, y: geo.yMid, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 70,
        age: 0, life: 0.7 + Math.random() * 0.4, hue: 40 + i * 45,
      })
    }
    if (this.gloom <= 0.02) this._finish()
  }

  _finish() {
    if (this.finished || this.stopped) return
    this.finished = true
    this.state = 'win'
    this.gloom = 0
    // 小號角琶音
    ;[261.63, 329.63, 392.0, 523.25].forEach((f, i) => setTimeout(() => this._tone(f), i * 150))
    setTimeout(() => { if (!this.stopped) speakScripture(SCRIPTURE.winText, { ref: SCRIPTURE.ref }) }, 700)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.winPoints + Math.min(20, this.notes) }) }, 1000)
  }

  _loop(ts) {
    if (this.stopped) return
    if (this.last == null) this.last = ts
    let dt = (ts - this.last) / 1000
    this.last = ts
    if (dt > 0.25) dt = 0.25
    this.acc += dt
    while (this.acc >= STEP) { this._update(STEP); this.acc -= STEP }
    this._draw()
    requestAnimationFrame(this._loop)
  }

  _update(dt) {
    this.t += dt
    for (let i = 0; i < this.vib.length; i++) this.vib[i] = Math.max(0, this.vib[i] - dt * 2.2)
    for (const s of this.sparks) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt }
    this.sparks = this.sparks.filter((s) => s.age < s.life)
    if (this.state !== 'play') return
    // 停彈太久:黑影慢慢回來(不超過開場值;溫柔提醒「繼續彈」)
    if (this.t - this.lastPluckAt > IDLE_REGROW_AFTER) {
      this.gloom = Math.min(GLOOM_START, this.gloom + IDLE_REGROW_RATE * dt)
    }
    // 小鴿子換弦
    this.birdT += dt
    if (this.birdT > 1.3) { this.birdT = 0; this.birdIdx = (this.birdIdx + 1) % BIRD_MELODY.length }
  }

  // 大琴幾何(置中)
  _lyre() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    const lw = Math.min(w * 0.6, 460)
    const gap = lw / (STRINGS.length - 1)
    return {
      x0: w / 2 - lw / 2, gap, lw,
      yTop: h * 0.30, yBot: h * 0.74, yMid: h * 0.52,
    }
  }
  _stringAt(x) {
    const g = this._lyre()
    const i = Math.round((x - g.x0) / g.gap)
    if (i < 0 || i >= STRINGS.length) return null
    if (Math.abs(x - (g.x0 + i * g.gap)) > g.gap * 0.5) return null
    return i
  }

  _draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    if (this.canvas.width !== Math.round(w * dpr)) { this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr) }
    const ctx = this.ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 王宮背景(同 davidharp 色系)
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#1d1a2e'); bg.addColorStop(0.55, '#3a2f45'); bg.addColorStop(1, '#5c4632')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(120,100,80,0.30)'
    for (const px of [0.05, 0.95]) {
      ctx.fillRect(w * px - 10, h * 0.12, 20, h * 0.72)
      ctx.fillRect(w * px - 16, h * 0.12 - 8, 32, 10)
    }
    for (const fx of [0.05, 0.95]) {
      const gl = ctx.createRadialGradient(w * fx, h * 0.3, 4, w * fx, h * 0.3, 80)
      gl.addColorStop(0, 'rgba(255,180,90,0.45)')
      gl.addColorStop(1, 'rgba(255,180,90,0)')
      ctx.fillStyle = gl
      ctx.fillRect(w * fx - 80, h * 0.3 - 80, 160, 160)
    }
    // 兩位角色:大衛(左,小)與掃羅(右,愁煩黑影)
    this._david(ctx, w * 0.10, h * 0.82, Math.min(w, h) / 420, Math.max(0, 1 - (this.t - this.lastPluckAt) * 3))
    this._saul(ctx, w * 0.90, h * 0.82, Math.min(w, h) / 420)
    // 大琴(玩家彈的):框+五弦
    const g = this._lyre()
    ctx.strokeStyle = '#b9863f'
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(g.x0 - 34, g.yBot + 10); ctx.quadraticCurveTo(g.x0 - 56, g.yMid, g.x0 - 30, g.yTop - 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(g.x0 + g.lw + 34, g.yBot + 10); ctx.quadraticCurveTo(g.x0 + g.lw + 56, g.yMid, g.x0 + g.lw + 30, g.yTop - 6); ctx.stroke()
    ctx.lineWidth = 10
    ctx.beginPath(); ctx.moveTo(g.x0 - 30, g.yTop - 6); ctx.lineTo(g.x0 + g.lw + 30, g.yTop - 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(g.x0 - 34, g.yBot + 10); ctx.lineTo(g.x0 + g.lw + 34, g.yBot + 10); ctx.stroke()
    // 弦(振動=正弦彎)
    for (let i = 0; i < STRINGS.length; i++) {
      const x = g.x0 + i * g.gap
      const v = this.vib[i]
      ctx.strokeStyle = v > 0 ? '#fff3c4' : '#e8d9b0'
      ctx.lineWidth = 2.2 + (STRINGS.length - i) * 0.35
      ctx.beginPath()
      if (v > 0.01) {
        const amp = v * 9
        ctx.moveTo(x, g.yTop)
        for (let yy = g.yTop; yy <= g.yBot; yy += 8) {
          const p = (yy - g.yTop) / (g.yBot - g.yTop)
          ctx.lineTo(x + Math.sin(p * Math.PI * 3 + this.t * 40) * amp * Math.sin(p * Math.PI), yy)
        }
      } else {
        ctx.moveTo(x, g.yTop); ctx.lineTo(x, g.yBot)
      }
      ctx.stroke()
      // 鍵帽
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(KEYCAPS[i], x, g.yBot + 34)
      ctx.fillStyle = '#c8b88a'
      ctx.font = '11px system-ui'
      ctx.fillText(STRINGS[i].name, x, g.yTop - 16)
    }
    // 小鴿子(引導,不判定)
    if (this.state === 'play') {
      const bi = BIRD_MELODY[this.birdIdx]
      const bx = g.x0 + bi * g.gap
      const by = g.yTop - 34 + Math.sin(this.t * 6) * 3
      ctx.font = '22px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('🕊️', bx, by)
    }
    // 火花
    for (const s of this.sparks) {
      const p = s.age / s.life
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = `hsl(${s.hue} 80% 70%)`
      ctx.beginPath(); ctx.arc(s.x, s.y, 3.4 - p * 2, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
    }
    // HUD:愁煩條(越低越好)+音數
    const gw = Math.min(200, w * 0.3)
    ctx.fillStyle = 'rgba(20,16,30,0.6)'
    this._rr(ctx, w - gw - 14, 12, gw, 20, 8); ctx.fill()
    ctx.fillStyle = '#5a4a75'
    this._rr(ctx, w - gw - 12, 14, (gw - 4) * this.gloom, 16, 6); ctx.fill()
    ctx.fillStyle = '#cfc4e0'
    ctx.font = 'bold 12px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText('掃羅的愁煩(一直彈就會散開)', w - 18, 46)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 15px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`🎵 彈了 ${this.notes} 個音`, 12, h - 14)
    if (this.state === 'intro') this._card(ctx, w, h, SCRIPTURE.title, SCRIPTURE.how, SCRIPTURE.ref, '點畫面　開始彈琴')
    else if (this.state === 'win') this._card(ctx, w, h, SCRIPTURE.winHead, `${SCRIPTURE.winBody}\n\n「${SCRIPTURE.winText}」`, SCRIPTURE.ref, '')
  }

  // ——(重用 davidharp 的人物畫法,縮編)——
  _david(ctx, x, y, s, strum) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s)
    ctx.fillStyle = '#7a5a9c'
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(11, -56); ctx.lineTo(-11, -56); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(0, -68, 12, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(0, -72, 11, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(-4, -69, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(4, -69, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(0, -64, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    const a = -0.5 + strum * 0.9
    ctx.strokeStyle = '#e8b88a'; ctx.lineWidth = 4.5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(-6 + Math.cos(a) * 26, -34 + Math.sin(a) * 16); ctx.stroke()
    ctx.restore()
  }
  _saul(ctx, x, y, s) {
    const gloom = this.gloom
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s)
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-24, -70, 48, 70)
    ctx.fillStyle = '#8a6238'; ctx.fillRect(-20, -66, 40, 62)
    ctx.fillStyle = '#a33d3d'
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(10, -44); ctx.lineTo(-10, -44); ctx.closePath(); ctx.fill()
    const hd = gloom * 6
    ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(0, -54 + hd, 11, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#e8c33d'
    ctx.beginPath()
    ctx.moveTo(-10, -62 + hd); ctx.lineTo(10, -62 + hd); ctx.lineTo(8, -70 + hd); ctx.lineTo(4, -64 + hd)
    ctx.lineTo(0, -71 + hd); ctx.lineTo(-4, -64 + hd); ctx.lineTo(-8, -70 + hd); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.4
    const brow = gloom * 3
    ctx.beginPath(); ctx.moveTo(-7, -57 + hd + brow); ctx.lineTo(-2, -58 + hd); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(7, -57 + hd + brow); ctx.lineTo(2, -58 + hd); ctx.stroke()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(-4, -54 + hd, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(4, -54 + hd, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath()
    if (gloom > 0.5) { ctx.moveTo(-4, -48 + hd); ctx.lineTo(4, -48 + hd) }
    else ctx.arc(0, -50 + hd, 3.6, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
    if (gloom > 0.04) {
      ctx.globalAlpha = gloom * 0.75
      ctx.fillStyle = '#241a30'
      const cs = 10 + gloom * 16
      for (let i = 0; i < 4; i++) {
        const a = this.t * 1.6 + i * 1.7
        ctx.beginPath()
        ctx.arc(Math.cos(a) * 8, -86 - Math.abs(Math.sin(a)) * 6, cs - i * 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  _card(ctx, w, h, kicker, body, ref, cont) {
    ctx.fillStyle = 'rgba(12,10,22,0.65)'
    ctx.fillRect(0, 0, w, h)
    const cw = Math.min(w * 0.88, 560)
    const ch = Math.min(h * 0.72, 400)
    const cx = (w - cw) / 2
    const cy = (h - ch) / 2
    ctx.fillStyle = '#fffdf7'
    this._rr(ctx, cx, cy, cw, ch, 18); ctx.fill()
    ctx.strokeStyle = '#b9863f'; ctx.lineWidth = 3
    this._rr(ctx, cx + 6, cy + 6, cw - 12, ch - 12, 14); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5c4a28'
    ctx.font = `bold ${Math.min(23, cw / 17)}px system-ui`
    ctx.fillText(kicker, w / 2, cy + 46)
    ctx.fillStyle = '#3d3123'
    const fs = Math.min(16, cw / 26)
    ctx.font = `${fs}px system-ui`
    let y = cy + 80
    let line = ''
    for (const c of [...body]) {
      if (ctx.measureText(line + c).width > cw - 64 || c === '\n') {
        ctx.fillText(line, w / 2, y); y += fs * 1.6
        line = c === '\n' ? '' : c
      } else line += c
    }
    if (line) ctx.fillText(line, w / 2, y)
    ctx.fillStyle = '#8a6d3b'
    ctx.font = `bold ${fs - 1}px system-ui`
    ctx.fillText(`— ${ref}`, w / 2, cy + ch - 50)
    ctx.fillStyle = '#b04a2f'
    ctx.font = `bold ${fs}px system-ui`
    ctx.fillText(cont || '', w / 2, cy + ch - 24)
  }
  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
}
