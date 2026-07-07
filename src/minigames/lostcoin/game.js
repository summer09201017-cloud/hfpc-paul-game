// 失錢找物(路 15:8-10)——系列第一個「找物/找碴」關(新類型⑫,點燈尋找)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:路 15:8-10),牧者審核通過前不進大廳卡。
//
// 玩法:婦人失落了一塊錢。屋裡昏暗——移動油燈(跟著手指/滑鼠)照亮角落,在罐子、籃子、
//   布巾之間細細地找;(青檔)錢幣藏在家具底下,要先點家具「打掃」挪開。找著了,
//   就請朋友鄰舍一同歡喜!
// ★ 神學守法:①玩的就是天父尋找人的心——「細細地找,直到找著」,所以**沒有時間到就失敗**,
//   永不會輸(直到找著為止);②找到的歡慶對齊經文「請朋友鄰舍來…一同歡喜」+
//   「一個罪人悔改…也是這樣為他歡喜」(路 15:10)——歡喜的高潮在天上。
// 年齡三檔:幼(較亮・錢幣大・常閃光)/童(標準)/青(更暗・要打掃家具・錢幣藏在底下)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;路 15:9 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '亮一點・錢幣大', dark: 0.72, lampR: 0.3, coinR: 0.028, objs: 6, sweep: false, glint: 2.2 },
  kid: { label: '🙂 童', desc: '標準', dark: 0.85, lampR: 0.24, coinR: 0.02, objs: 9, sweep: false, glint: 4 },
  teen: { label: '🔥 青', desc: '更暗・要打掃', dark: 0.93, lampR: 0.19, coinR: 0.018, objs: 12, sweep: true, glint: 6.5 },
}

const T = {
  title: '🪙 失錢找物',
  ref: '路加福音 15:8-10',
  intro1: '「或是一個婦人有十塊錢，若失落一塊，豈不點上燈，打掃屋子，細細地找，直到找著嗎？」(路 15:8)',
  how: '屋裡好暗!移動手指(或滑鼠)提著油燈照亮角落,細細地找那失落的一塊錢;看到閃光就靠過去。青檔的錢幣藏在家具底下——點家具把它掃開。放心慢慢找,直到找著!',
  pick: '點上燈。選一間屋子:',
  hud: '🪔 細細地找,直到找著…',
  sweepToast: '掃開了…底下沒有',
  foundToast: '✨ 找著了!',
  winTitle: '🎉 請朋友鄰舍一同歡喜!',
  winVerse: '我失落的那塊錢已經找著了，你們和我一同歡喜吧！',
  winRef: '路加福音 15:9',
  teachVerse: '一個罪人悔改，在　神的使者面前也是這樣為他歡喜。',
  teachRef: '路加福音 15:10',
  teach: '一塊錢而已,值得點燈、打掃、細細地找嗎?值得——因為在天父眼中,每一個失落的人都寶貴。你找錢幣的著急,就是天父尋找人的心;找著了,天上也這樣歡喜!',
}

// 家具種類(向量畫)
const OBJ_KINDS = ['jar', 'basket', 'cloth', 'stool', 'pot', 'broom']

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → seek → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onResize = () => this._resize()
    this.lamp = { x: 0.5, y: 0.5 } // 相對座標
    this.objs = [] // {kind,x,y,s,swept,dx}
    this.coin = null // {x,y,under}
    this.dust = []
    this.toasts = []
    this.seekT = 0
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKeyDown)
    this.cv.addEventListener('pointerdown', this._onDown)
    addEventListener('pointermove', this._onMove)
    addEventListener('resize', this._onResize)
    this._resize()
    let last = performance.now()
    const loop = (now) => {
      if (this.stopped) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      this._t += dt
      if (this.state === 'seek') this.seekT += dt
      this.dust = this.dust.filter((d) => (d.t -= dt) > 0)
      this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
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
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.seekT = 0
    this.dust = []
    this.toasts = []
    // 家具散在屋內(避開太邊緣)
    this.objs = Array.from({ length: this.cfg.objs }, (_, i) => ({
      kind: OBJ_KINDS[i % OBJ_KINDS.length],
      x: 0.1 + Math.random() * 0.8,
      y: 0.3 + Math.random() * 0.55,
      s: 0.05 + Math.random() * 0.03,
      swept: false,
      dx: Math.random() < 0.5 ? -1 : 1,
    }))
    // 錢幣:青檔藏在某件家具正下方;其餘檔在空地
    if (this.cfg.sweep) {
      const host = this.objs[Math.floor(Math.random() * this.objs.length)]
      this.coin = { x: host.x, y: host.y + 0.01, under: host }
    } else {
      this.coin = { x: 0.08 + Math.random() * 0.84, y: 0.32 + Math.random() * 0.5, under: null }
    }
    this.lamp = { x: 0.5, y: 0.5 }
    this.state = 'seek'
  }

  _win() {
    this.state = 'win'
    this._tone(659, 0.12); this._tone(784, 0.12, 0.1); this._tone(1046, 0.3, 0.2)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'lostcoin' }) }, 900)
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
    return { x: ((e.clientX - r.left) / r.width) * this.W, y: ((e.clientY - r.top) / r.height) * this.H }
  }
  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state !== 'seek') return
    this.lamp = { x: x / this.W, y: y / this.H }
    // 錢幣命中?(在燈光範圍內才算看得見、點得到;藏在家具下要先掃開)
    const cx = this.coin.x * this.W, cy = this.coin.y * this.H
    const lampR = this.cfg.lampR * Math.min(this.W, this.H)
    const visible = Math.hypot(cx - this.lamp.x * this.W, cy - this.lamp.y * this.H) < lampR
    const uncovered = !this.coin.under || this.coin.under.swept
    if (visible && uncovered && Math.hypot(x - cx, y - cy) < Math.max(this.cfg.coinR * Math.min(this.W, this.H) * 1.8, 26)) {
      this.toasts.push({ text: T.foundToast, t: this._t })
      return this._win()
    }
    // 打掃家具(青檔)
    if (this.cfg.sweep) {
      for (const o of this.objs) {
        if (o.swept) continue
        const ox = o.x * this.W, oy = o.y * this.H, os = o.s * Math.min(this.W, this.H) * 2
        if (Math.abs(x - ox) < os && Math.abs(y - oy) < os) {
          o.swept = true
          for (let i = 0; i < 5; i++) this.dust.push({ x: ox, y: oy, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, t: 0.6 })
          this._tone(240, 0.08, 0, 'sine', 0.07)
          if (this.coin.under !== o) this.toasts.push({ text: T.sweepToast, t: this._t })
          return
        }
      }
    }
  }
  _movePt(e) {
    if (this.state !== 'seek') return
    const { x, y } = this._pt(e)
    this.lamp = { x: x / this.W, y: y / this.H }
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
    // 屋內底色(土牆+地板)
    const wall = ctx.createLinearGradient(0, 0, 0, H)
    wall.addColorStop(0, '#c8b090'); wall.addColorStop(0.55, '#b89e7c'); wall.addColorStop(1, '#8a7050')
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#9a8060'
    ctx.fillRect(0, H * 0.28, W, 3) // 牆腳線
    if (this.state === 'intro') return this._drawIntro()
    const m = Math.min(W, H)
    // 家具
    for (const o of this.objs) this._obj(o, m)
    // 錢幣(掃開/沒被蓋住才畫;偶爾閃光提示)
    const uncovered = !this.coin.under || this.coin.under.swept
    const cx = this.coin.x * W, cy = this.coin.y * H, cr = Math.max(this.cfg.coinR * m, 9)
    if (uncovered) {
      ctx.fillStyle = '#d8c060'
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.fill()
      ctx.strokeStyle = '#a8902a'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, cr * 0.62, 0, 7); ctx.stroke()
    }
    // 塵土
    for (const d of this.dust) {
      d.x += d.vx * 0.016; d.y += d.vy * 0.016
      ctx.globalAlpha = Math.max(0, d.t / 0.6) * 0.5
      ctx.fillStyle = '#c8b494'
      ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1
    // 黑暗+油燈光(挖洞)
    if (this.state === 'seek') {
      ctx.save()
      ctx.fillStyle = `rgba(14,10,4,${this.cfg.dark})`
      ctx.beginPath()
      ctx.rect(0, 0, W, H)
      const lx = this.lamp.x * W, ly = this.lamp.y * H, lr = this.cfg.lampR * m
      ctx.arc(lx, ly, lr, 0, Math.PI * 2, true) // 反向=挖洞
      ctx.fill('evenodd')
      // 光暈邊
      const glow = ctx.createRadialGradient(lx, ly, lr * 0.55, lx, ly, lr)
      glow.addColorStop(0, 'rgba(255,214,120,0)'); glow.addColorStop(1, `rgba(14,10,4,${this.cfg.dark * 0.85})`)
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 7); ctx.fill()
      ctx.restore()
      // 油燈本體(跟著指尖)
      ctx.fillStyle = '#e8b040'
      ctx.beginPath(); ctx.ellipse(lx, ly - lr * 0.02, 9, 5, 0, 0, 7); ctx.fill()
      const f = Math.sin(this._t * 10) * 2
      ctx.fillStyle = '#ffd870'
      ctx.beginPath(); ctx.ellipse(lx, ly - 10 + f * 0.3, 3.5, 6 + f, 0, 0, 7); ctx.fill()
      // 錢幣閃光(穿透黑暗的小星,每隔幾秒閃一下引導)
      if (uncovered && Math.sin(this._t * (6.28 / this.cfg.glint)) > 0.93) {
        ctx.strokeStyle = 'rgba(255,240,170,0.95)'; ctx.lineWidth = 2
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + this._t
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * cr * 1.3, cy + Math.sin(a) * cr * 1.3)
          ctx.lineTo(cx + Math.cos(a) * cr * 2.4, cy + Math.sin(a) * cr * 2.4); ctx.stroke()
        }
      }
    }
    // 漂浮字+HUD
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff4d8'; ctx.strokeStyle = 'rgba(40,26,8,0.85)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(14, H * 0.034)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, W / 2, H * 0.2 - k * 18)
      ctx.fillText(t.text, W / 2, H * 0.2 - k * 18)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = 'rgba(40,26,8,0.6)'
    rL(ctx, W * 0.24, H * 0.015, W * 0.52, H * 0.055, 12); ctx.fill()
    ctx.fillStyle = '#ffeec8'
    ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(T.hud, W / 2, H * 0.052)
    if (this.state === 'win') this._drawWin()
  }

  // 家具(向量,swept=滑開+變淡)
  _obj(o, m) {
    const { ctx } = this
    const x = (o.x + (o.swept ? 0.06 * o.dx : 0)) * this.W
    const y = o.y * this.H
    const s = o.s * m
    ctx.save()
    ctx.globalAlpha = o.swept ? 0.5 : 1
    if (o.kind === 'jar') {
      ctx.fillStyle = '#a06a3a'
      ctx.beginPath(); ctx.ellipse(x, y, s * 0.7, s, 0, 0, 7); ctx.fill()
      ctx.fillStyle = '#7a4a22'
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.95, s * 0.35, s * 0.15, 0, 0, 7); ctx.fill()
    } else if (o.kind === 'basket') {
      ctx.fillStyle = '#b08a4a'
      ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.4); ctx.lineTo(x + s, y - s * 0.4); ctx.lineTo(x + s * 0.7, y + s * 0.5); ctx.lineTo(x - s * 0.7, y + s * 0.5); ctx.fill()
      ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 2
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - s * 0.9, y - s * 0.1 + i * s * 0.22); ctx.lineTo(x + s * 0.9, y - s * 0.1 + i * s * 0.22); ctx.stroke() }
    } else if (o.kind === 'cloth') {
      ctx.fillStyle = '#8a5a6a'
      ctx.beginPath(); ctx.moveTo(x - s, y)
      for (let i = 0; i <= 6; i++) ctx.quadraticCurveTo(x - s + (i + 0.5) * (s / 3), y + (i % 2 ? -1 : 1) * s * 0.24, x - s + (i + 1) * (s / 3), y)
      ctx.lineTo(x + s, y + s * 0.5); ctx.lineTo(x - s, y + s * 0.5); ctx.fill()
    } else if (o.kind === 'stool') {
      ctx.fillStyle = '#7a5a34'
      rL(ctx, x - s, y - s * 0.3, s * 2, s * 0.3, 3); ctx.fill()
      ctx.fillRect(x - s * 0.8, y, s * 0.2, s * 0.8)
      ctx.fillRect(x + s * 0.6, y, s * 0.2, s * 0.8)
    } else if (o.kind === 'pot') {
      ctx.fillStyle = '#5a5a62'
      ctx.beginPath(); ctx.arc(x, y, s * 0.8, 0, 7); ctx.fill()
      ctx.fillStyle = '#3a3a42'
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.7, s * 0.5, s * 0.14, 0, 0, 7); ctx.fill()
    } else { // broom
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s); ctx.lineTo(x + s * 0.3, y + s * 0.5); ctx.stroke()
      ctx.fillStyle = '#c8a860'
      ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.3); ctx.lineTo(x + s * 0.8, y + s * 0.9); ctx.lineTo(x - s * 0.2, y + s * 0.9); ctx.fill()
    }
    ctx.restore()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    cardL(ctx, W * 0.08, H * 0.05, W * 0.84, H * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a3c14'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.15)
    ctx.fillStyle = '#96784a'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 直到找著', W / 2, H * 0.22)
    ctx.fillStyle = '#463418'
    wrapL(ctx, T.intro1, W / 2, H * 0.3, W * 0.72, H * 0.045)
    wrapL(ctx, T.how, W / 2, H * 0.46, W * 0.72, H * 0.045)
    ctx.fillStyle = '#96784a'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#d8b060'
      rL(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#402c08'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    cardL(ctx, W * 0.1, H * 0.07, W * 0.8, H * 0.86)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a3c14'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.17)
    // 婦人與鄰舍(簡筆歡喜小人)+錢幣
    const cy = H * 0.28
    for (let i = 0; i < 4; i++) {
      const px = W * (0.36 + i * 0.09)
      const bob = Math.sin(this._t * 5 + i) * 4
      ctx.fillStyle = ['#8a5a7a', '#5a7a8a', '#7a8a5a', '#a06a4a'][i]
      ctx.fillRect(px - 7, cy - 8 + bob, 14, 24)
      ctx.fillStyle = '#c9a06a'
      ctx.beginPath(); ctx.arc(px, cy - 16 + bob, 8, 0, 7); ctx.fill()
    }
    ctx.fillStyle = '#d8c060'
    ctx.beginPath(); ctx.arc(W * 0.31, cy - 6, 11, 0, 7); ctx.fill()
    ctx.fillStyle = '#463418'
    wrapL(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.42, W * 0.66, H * 0.045)
    ctx.fillStyle = '#7a5c14'
    wrapL(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.56, W * 0.66, H * 0.043)
    ctx.fillStyle = '#463418'
    wrapL(ctx, T.teach, W / 2, H * 0.68, W * 0.66, H * 0.042)
  }
}

function rL(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardL(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(253,248,236,0.96)'
  ctx.strokeStyle = '#b8944a'; ctx.lineWidth = 3
  rL(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapL(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
