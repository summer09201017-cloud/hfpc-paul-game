// 羅得紅綠燈(創 19:15-17;路 17:32)——系列第一個「忍住誘惑・向前跑」關(新類型⑬,123 木頭人反向化)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:創 19:15-17、路 17:32),牧者審核通過前不進大廳卡。
//
// 玩法:天使催逼:「逃命吧!不可回頭看!」按住(空白鍵/畫面)一路往山上跑;
//   路上會傳來身後的聲音引誘你——畫面跳出一顆好大的「👀 回頭看一眼」按鈕,千萬別按!
//   忍住幾秒誘惑就過去;真的按了,就會像羅得的妻子那樣定住開始變鹽柱……
//   但天使會拉住你的手(創 19:16「因為耶和華憐恤羅得」),繼續逃!跑到山上就得救。
// ★ 神學守法:①「不可回頭」是天使(神)的吩咐——遊戲唯一的規則就是這句話;
//   ②按了回頭鍵=定住+鹽白化的驚險一刻,但**永不會輸**——天使拉住你(經文根據:19:16
//     連「遲延不走」的羅得,天使都拉著他的手把他領出來,因為耶和華憐恤);回頭只影響星等;
//   ③羅得妻子的結局不畫出來,用主的話「你們要回想羅得的妻子」(路 17:32)溫柔帶出教導;
//   ④星等=忍住了幾次誘惑(0 次回頭=3 星),不是跑多快。
// 年齡三檔:幼(路短・誘惑 1 次)/童(標準・2 次)/青(3 次+誘惑中還要一直按住往前跑,分心就開始回頭)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;創 19:16 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '路短・誘惑 1 次', dist: 70, tempts: 1, temptDur: 3.2, hold: false },
  kid: { label: '🙂 童', desc: '標準・誘惑 2 次', dist: 100, tempts: 2, temptDur: 3.4, hold: false },
  teen: { label: '🔥 青', desc: '誘惑 3 次・不能鬆手', dist: 130, tempts: 3, temptDur: 3.8, hold: true },
}

const TEMPT_LINES = [
  '身後傳來聲音:回頭看看吧…你的家當都還在城裡!',
  '身後傳來聲音:就看一眼,一眼就好…',
  '身後傳來聲音:那麼熱鬧的城,真的不回去了嗎?',
]

const T = {
  title: '🧂 羅得紅綠燈',
  ref: '創世記 19:15-17',
  intro1: '「逃命吧！不可回頭看，也不可在平原站住。要往山上逃跑，免得你被剿滅。」(創 19:17)',
  how: '按住空白鍵(或按住畫面)往山上跑!路上會跳出「👀 回頭看一眼」的按鈕——千萬別按!忍住,誘惑就會過去。真的按了也別怕,天使會拉住你……但要記得:祂說了,不可回頭。',
  pick: '天明了,天使催逼著。選一段路:',
  hudRun: (pct) => `🏃 往山上逃 ${pct}%`,
  temptHint: '⚠ 千萬別按!繼續向前跑!',
  temptBtn: '👀 回頭看一眼',
  resist: '你沒有回頭!繼續逃!',
  saltToast: '⚡ 定住了……開始變成鹽柱!',
  rescueToast: '天使拉住你的手:「不可回頭!」(耶和華憐恤,創 19:16)',
  headTurn: '手鬆了……頭不由自主轉過去……',
  winTitle: '🌄 逃到山上,得救了!',
  winVerse: '二人因為耶和華憐恤羅得，就拉著他的手和他妻子的手，並他兩個女兒的手，把他們領出來，安置在城外',
  winRef: '創世記 19:16',
  teachVerse: '你們要回想羅得的妻子。',
  teachRef: '路加福音 17:32',
  teach: '為什麼不可以回頭?因為回頭的眼睛,連著捨不得的心。神救我們離開,是要我們一直朝著祂往前走。主耶穌說「你們要回想羅得的妻子」——把這一關的心跳記住,別讓任何東西比神更捨不得。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → run ⇄ tempt/salt → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._keys = {}
    this._onKeyDown = (e) => { this._keys[e.key] = true; this._key(e) }
    this._onKeyUp = (e) => { this._keys[e.key] = false }
    this._onDown = (e) => this._down(e)
    this._onUp = () => { this._touch = false }
    this._onResize = () => this._resize()
    this.progress = 0
    this.tempt = null // {line,t,btn}
    this.temptsLeft = 0
    this.nextTemptAt = 0
    this.saltT = 0
    this.salts = 0 // 回頭次數
    this.headT = 0 // 青檔:誘惑中鬆手的回頭量表
    this.toasts = []
    this._touch = false
    this._audio = null
  }

  boot() {
    initSpeech()
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
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.progress = 0
    this.tempt = null
    this.temptsLeft = this.cfg.tempts
    this.nextTemptAt = this.cfg.dist * (0.25 + Math.random() * 0.15)
    this.saltT = 0
    this.salts = 0
    this.headT = 0
    this.toasts = []
    this.state = 'run'
  }

  _running() {
    return this._keys[' '] || this._keys.ArrowRight || this._keys.d || this._touch
  }

  _update(dt) {
    if (this.state === 'salt') {
      this.saltT -= dt
      if (this.saltT <= 0) {
        this.toasts.push({ text: T.rescueToast, t: this._t })
        this.state = 'run'
      }
      this.toasts = this.toasts.filter((t) => this._t - t.t < 2.4)
      return
    }
    if (this.state !== 'run' && this.state !== 'tempt') return
    // 前進(誘惑中也可以邊忍邊跑)
    if (this._running()) this.progress = Math.min(this.cfg.dist, this.progress + dt * 7)
    // 誘惑排程
    if (this.state === 'run' && this.temptsLeft > 0 && this.progress >= this.nextTemptAt) {
      this.temptsLeft -= 1
      this.tempt = { line: TEMPT_LINES[Math.floor(Math.random() * TEMPT_LINES.length)], t: this.cfg.temptDur }
      this.headT = 0
      this.state = 'tempt'
      this._tone(180, 0.25, 0, 'sine', 0.1)
    }
    if (this.state === 'tempt') {
      this.tempt.t -= dt
      // 青檔:誘惑中鬆手=頭不由自主轉過去
      if (this.cfg.hold) {
        if (!this._running()) {
          this.headT += dt
          if (this.headT > 1.1) return this._salt(T.headTurn)
        } else this.headT = Math.max(0, this.headT - dt * 1.6)
      }
      if (this.tempt.t <= 0) {
        this.tempt = null
        this.state = 'run'
        this.nextTemptAt = this.progress + this.cfg.dist * (0.18 + Math.random() * 0.15)
        this.toasts.push({ text: T.resist, t: this._t })
        this._tone(660, 0.15, 0, 'triangle', 0.1)
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2.4)
    if (this.progress >= this.cfg.dist) this._win()
  }

  _salt(reason) {
    this.salts += 1
    this.tempt = null
    this.saltT = 1.8
    this.state = 'salt'
    this.toasts.push({ text: reason || T.saltToast, t: this._t })
    this._tone(140, 0.4, 0, 'sine', 0.12)
  }

  _win() {
    this.state = 'win'
    this.stars = this.salts === 0 ? 3 : this.salts === 1 ? 2 : 1
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.stars === 3 ? 100 : this.stars === 2 ? 70 : 40, level: 'lotrun' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
    }
    // 鍵盤黨的「回頭鍵」:誘惑中按 ← 就是回頭
    if (this.state === 'tempt' && (e.key === 'ArrowLeft' || e.key === 'a')) this._salt()
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
    // 誘惑大按鈕(千萬別按!)
    if (this.state === 'tempt' && this._temptBtn) {
      const b = this._temptBtn
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._salt()
    }
    if (this.state === 'run' || this.state === 'tempt') this._touch = true
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

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 天將明(左=城的火光,右=晨光的山)
    const sky = ctx.createLinearGradient(0, 0, W, 0)
    sky.addColorStop(0, '#5a3040'); sky.addColorStop(0.45, '#7a5060'); sky.addColorStop(1, '#e8b060')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.75)
    ctx.fillStyle = '#8a7050'; ctx.fillRect(0, H * 0.75, W, H * 0.25)
    if (this.state === 'intro') return this._drawIntro()
    const m = Math.min(W, H)
    // 身後的城(左,火光跳動;不畫毀滅細節)
    const fl = Math.sin(this._t * 7) * 0.06
    const glow = ctx.createRadialGradient(0, H * 0.6, 10, 0, H * 0.6, W * 0.35)
    glow.addColorStop(0, `rgba(255,120,40,${0.35 + fl})`); glow.addColorStop(1, 'rgba(255,120,40,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W * 0.4, H)
    ctx.fillStyle = 'rgba(60,30,40,0.85)'
    for (let i = 0; i < 4; i++) rR(ctx, W * 0.02 + i * W * 0.035, H * 0.56 + (i % 2) * H * 0.05, W * 0.028, H * 0.19 - (i % 2) * H * 0.05, 3)
    // 前方的山(右)+晨光
    ctx.fillStyle = '#6a5a42'
    ctx.beginPath(); ctx.moveTo(W * 0.72, H * 0.75)
    ctx.quadraticCurveTo(W * 0.86, H * 0.34, W, H * 0.42); ctx.lineTo(W, H * 0.75); ctx.fill()
    const sun = ctx.createRadialGradient(W * 0.95, H * 0.3, 4, W * 0.95, H * 0.3, m * 0.2)
    sun.addColorStop(0, 'rgba(255,230,150,0.9)'); sun.addColorStop(1, 'rgba(255,230,150,0)')
    ctx.fillStyle = sun
    ctx.beginPath(); ctx.arc(W * 0.95, H * 0.3, m * 0.2, 0, 7); ctx.fill()
    // 羅得一家(位置照 progress 從左走到右)
    const px = W * (0.16 + 0.62 * (this.progress / this.cfg.dist))
    const py = H * 0.72
    const salted = this.state === 'salt'
    const runB = this._running() && !salted ? Math.abs(Math.sin(this._t * 10)) * 5 : 0
    for (let i = 0; i < 4; i++) {
      const fx = px - i * m * 0.045
      const bob = salted && i === 0 ? 0 : runB * ((i % 2) + 0.6)
      ctx.fillStyle = salted && i === 0 ? '#e8e8e8' : ['#7a5a3a', '#8a5a7a', '#5a7a8a', '#a06a4a'][i]
      ctx.fillRect(fx - m * 0.012, py - m * 0.045 - bob, m * 0.024, m * 0.05)
      ctx.fillStyle = salted && i === 0 ? '#f0f0f0' : '#c9a06a'
      ctx.beginPath(); ctx.arc(fx, py - m * 0.06 - bob, m * 0.014, 0, 7); ctx.fill()
    }
    if (salted) { // 鹽白化+閃電符號
      ctx.fillStyle = 'rgba(240,240,248,0.28)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#fffef0'
      ctx.font = `bold ${m * 0.09}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('🧂', px, py - m * 0.11)
    }
    // 天使(在隊伍前方引路;salt 時飛回來拉手)
    const ax = salted ? px + m * 0.05 : px + m * 0.11
    ctx.fillStyle = 'rgba(255,250,220,0.92)'
    ctx.beginPath(); ctx.ellipse(ax, py - m * 0.07 + Math.sin(this._t * 3) * 4, m * 0.016, m * 0.032, 0, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(ax - m * 0.018, py - m * 0.085, m * 0.02, m * 0.008, -0.6, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(ax + m * 0.018, py - m * 0.085, m * 0.02, m * 0.008, 0.6, 0, 7); ctx.fill()
    // 誘惑面板(大大的「回頭看一眼」鈕——千萬別按)
    this._temptBtn = null
    if (this.state === 'tempt' && this.tempt) {
      ctx.fillStyle = 'rgba(40,20,36,0.55)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffd8c0'; ctx.strokeStyle = 'rgba(30,10,20,0.9)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(15, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(this.tempt.line, W / 2, H * 0.3)
      ctx.fillText(this.tempt.line, W / 2, H * 0.3)
      const bw = W * 0.3, bh = H * 0.13, bx = W / 2 - bw / 2, by = H * 0.4
      const puls = 1 + Math.sin(this._t * 6) * 0.03
      ctx.save()
      ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(puls, puls)
      ctx.fillStyle = '#c04a5a'
      rR(ctx, -bw / 2, -bh / 2, bw, bh, 16); ctx.fill()
      ctx.fillStyle = '#fff0f0'
      ctx.font = `bold ${Math.max(16, H * 0.045)}px "Noto Sans TC",sans-serif`
      ctx.fillText(T.temptBtn, 0, bh * 0.12)
      ctx.restore()
      this._temptBtn = { x: bx, y: by, w: bw, h: bh }
      ctx.fillStyle = '#ffe9a0'
      ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
      ctx.fillText(T.temptHint + (this.cfg.hold ? '(手也不能鬆!)' : ''), W / 2, H * 0.62)
      // 忍耐倒數圈
      ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(W / 2, H * 0.72, m * 0.045, -Math.PI / 2, -Math.PI / 2 + (this.tempt.t / this.cfg.temptDur) * Math.PI * 2); ctx.stroke()
      if (this.cfg.hold && this.headT > 0.15) {
        ctx.fillStyle = '#ffb0a0'
        ctx.fillText(T.headTurn, W / 2, H * 0.83)
      }
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2.4
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff4dc'; ctx.strokeStyle = 'rgba(40,20,30,0.85)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, W / 2, H * 0.18 - k * 18)
      ctx.fillText(t.text, W / 2, H * 0.18 - k * 18)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(40,20,30,0.6)'
    rR(ctx, W * 0.2, H * 0.015, W * 0.6, H * 0.055, 12); ctx.fill()
    ctx.fillStyle = '#ffeede'
    ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hudRun(Math.floor((this.progress / this.cfg.dist) * 100))} ・ 按住=跑 ・ 回頭 ${this.salts} 次`, W / 2, H * 0.052)
    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    cardR(ctx, W * 0.08, H * 0.05, W * 0.84, H * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a3040'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.15)
    ctx.fillStyle = '#96687a'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 不可回頭看', W / 2, H * 0.22)
    ctx.fillStyle = '#43303a'
    wrapR(ctx, T.intro1, W / 2, H * 0.3, W * 0.72, H * 0.045)
    wrapR(ctx, T.how, W / 2, H * 0.45, W * 0.72, H * 0.045)
    ctx.fillStyle = '#96687a'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#d89060'
      rR(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#402028'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    cardR(ctx, W * 0.1, H * 0.07, W * 0.8, H * 0.86)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a3040'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.17)
    ctx.font = `${Math.max(26, H * 0.08)}px "Noto Sans TC",sans-serif`
    ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.28)
    ctx.fillStyle = '#96687a'
    ctx.font = `${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.fillText(this.salts === 0 ? '一次都沒有回頭!' : `回頭了 ${this.salts} 次——天使仍拉著你的手`, W / 2, H * 0.35)
    ctx.fillStyle = '#43303a'
    wrapR(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.42, W * 0.66, H * 0.044)
    ctx.fillStyle = '#7a4a2a'
    wrapR(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.62, W * 0.66, H * 0.043)
    ctx.fillStyle = '#43303a'
    wrapR(ctx, T.teach, W / 2, H * 0.7, W * 0.66, H * 0.042)
  }
}

function rR(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardR(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(253,246,240,0.96)'
  ctx.strokeStyle = '#b87a60'; ctx.lineWidth = 3
  rR(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapR(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
