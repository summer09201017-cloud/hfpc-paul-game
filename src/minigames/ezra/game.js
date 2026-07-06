// 以斯拉護送(以斯拉記 8:21-23)——系列第一個「護送」關(新類型⑥)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:拉 8:21-23),牧者審核通過前不進大廳卡。
//
// 玩法:回歸的隊伍(婦人孩子+聖殿器皿車)沿路自動前行,前往耶路撒冷。路上有仇敵的暗影出沒——
//   暗影靠近,隊伍就害怕停下。你是以斯拉:點暗影(或方向鍵移動+空白鍵),以斯拉就到隊伍與暗影
//   之間「舉手禱告」——神施恩的手的光罩護住隊伍,暗影退散,隊伍繼續前行。走到耶路撒冷=過關。
// ★ 神學守法:以斯拉刻意不求兵丁護送(拉 8:22「本以為羞恥」)——玩家沒有武器,唯一的動作是「禱告」;
//   保護是神應允的(8:23),不是人打出來的。永不會輸:暗影只會讓隊伍停下,路只有快慢。
// 年齡三檔:幼(暗影少慢)/童(標準)/青(暗影多快+兩側同時)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;拉 8:22 已烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '平坦的路', spawnEvery: 6.5, foeSpeed: 0.05, dist: 100 },
  kid: { label: '🙂 童', desc: '標準', spawnEvery: 4.8, foeSpeed: 0.065, dist: 130 },
  teen: { label: '🔥 青', desc: '暗影多且快', spawnEvery: 3.4, foeSpeed: 0.085, dist: 160 },
}

const T = {
  title: '🕊️ 以斯拉護送',
  ref: '以斯拉記 8:21-23',
  intro1: '回歸的隊伍要上耶路撒冷——有婦人孩子,還有聖殿的金銀器皿。以斯拉不求王的步兵馬兵,因他曾對王說:我們神施恩的手必幫助一切尋求他的。',
  how: '隊伍自動前行;仇敵的暗影出沒,靠近隊伍就會讓大家害怕停下。點暗影——以斯拉會過去「舉手禱告」,神的保護光罩退散暗影。護送全隊平安到耶路撒冷!',
  pick: '在亞哈瓦河邊禁食祈求之後,出發:',
  hud: '🕊️ 護送中…點暗影,以斯拉去禱告',
  scared: '隊伍害怕,停下了…',
  repelled: '神施恩的手護住我們!',
  winVerse: '我們 神施恩的手必幫助一切尋求他的;但他的能力和忿怒必攻擊一切離棄他的。',
  winRef: '以斯拉記 8:22',
  teachVerse: '所以我們禁食祈求我們的 神,他就應允了我們。',
  teachRef: '以斯拉記 8:23',
  teach: '以斯拉沒有刀,也沒有兵——他有禱告。整條路上,保護隊伍的不是武力,是神施恩的手。你的路,也可以這樣走。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKey = (e) => this._key(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.progress = 0 // 0→dist 到耶路撒冷
    this.foes = [] // {x(0-1 畫面比例), y, side, state:'come'|'flee'}
    this.ezra = { x: 0.5, y: 0.5, target: null, prayT: 0 } // 以斯拉(相對座標)
    this.scaredT = 0
    this.spawnT = 0
    this.toasts = []
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKey)
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
    this.cv.removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.progress = 0
    this.foes = []
    this.toasts = []
    this.ezra = { x: 0.42, y: 0.52, target: null, prayT: 0 }
    this.scaredT = 0
    this.spawnT = 3
    this.state = 'play'
  }

  _update(dt) {
    if (this.state !== 'play') return
    // 隊伍前進(有暗影貼近=害怕暫停)
    const threat = this.foes.some((f) => f.state === 'come' && f.dist < 0.2)
    if (threat) { this.scaredT = 0.6 }
    if (this.scaredT > 0) this.scaredT -= dt
    else this.progress = Math.min(this.cfg.dist, this.progress + dt * 6)
    // 出暗影
    this.spawnT -= dt
    if (this.spawnT <= 0) {
      this.spawnT = this.cfg.spawnEvery * (0.75 + Math.random() * 0.5)
      const side = Math.random() < 0.5 ? -1 : 1
      const ang = Math.random() * Math.PI * 0.8 + Math.PI * 0.1
      this.foes.push({ ang: side < 0 ? Math.PI - ang : ang, dist: 0.55, side, state: 'come' })
      if (this.age === 'teen' && Math.random() < 0.35) { // 青:偶爾兩側同時
        this.foes.push({ ang: Math.random() * Math.PI, dist: 0.58, side: -side, state: 'come' })
      }
    }
    // 暗影向隊伍(畫面中心)靠近/退散
    for (const f of this.foes) {
      if (f.state === 'come') f.dist = Math.max(0.1, f.dist - dt * this.cfg.foeSpeed)
      else f.dist += dt * 0.42
    }
    this.foes = this.foes.filter((f) => !(f.state === 'flee' && f.dist > 0.7))
    // 以斯拉移動與禱告
    const ez = this.ezra
    if (ez.target) {
      const dx = ez.target.x - ez.x, dy = ez.target.y - ez.y
      const d = Math.hypot(dx, dy)
      if (d < 0.02) {
        ez.target = null
        ez.prayT = 1.0 // 到位:舉手禱告
        this._pray()
      } else { ez.x += (dx / d) * dt * 0.5; ez.y += (dy / d) * dt * 0.5 }
    }
    if (ez.prayT > 0) {
      ez.prayT -= dt
      // 禱告光罩:退散附近暗影
      for (const f of this.foes) {
        if (f.state !== 'come') continue
        const fx = 0.5 + Math.cos(f.ang) * f.dist, fy = 0.5 - Math.sin(f.ang) * f.dist * 0.7
        if (Math.hypot(fx - ez.x, fy - ez.y) < 0.24) {
          f.state = 'flee'
          this.toasts.push({ text: T.repelled, t: this._t })
          this._chime()
        }
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
    if (this.progress >= this.cfg.dist) this._win()
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'ezra' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
    }
  }

  _up(e) {
    const r = this.cv.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * this.W
    const y = ((e.clientY - r.top) / r.height) * this.H
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state !== 'play') return
    // 點畫面:以斯拉走過去(通常點暗影)
    this.ezra.target = { x: x / this.W, y: y / this.H }
  }

  _pray() { this._tone(523, 0.18, 0, 'sine', 0.12); this._tone(659, 0.3, 0.15, 'sine', 0.12) }
  _chime() { this._tone(784, 0.12); this._tone(1046, 0.22, 0.1) }
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
    // 曠野路(背景隨進度微捲)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#c9dcE8'.toLowerCase()); sky.addColorStop(0.6, '#e0cfa0'); sky.addColorStop(1, '#c9a870')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()

    const scroll = (this.progress * 40) % (W * 0.2)
    // 路(中央水平帶)
    ctx.fillStyle = '#d8bC8a'.toLowerCase()
    ctx.fillRect(0, H * 0.42, W, H * 0.26)
    ctx.strokeStyle = 'rgba(140,110,60,0.4)'; ctx.lineWidth = 3; ctx.setLineDash([26, 30])
    ctx.lineDashOffset = scroll
    ctx.beginPath(); ctx.moveTo(0, H * 0.55); ctx.lineTo(W, H * 0.55); ctx.stroke(); ctx.setLineDash([])
    // 遠山與耶路撒冷剪影(接近終點時浮現)
    const near = this.progress / this.cfg.dist
    if (near > 0.75) {
      ctx.globalAlpha = (near - 0.75) * 4
      ctx.fillStyle = '#a89060'
      ctx.fillRect(W * 0.86, H * 0.3, W * 0.05, H * 0.12)
      ctx.fillRect(W * 0.92, H * 0.26, W * 0.045, H * 0.16)
      ctx.globalAlpha = 1
    }
    // 隊伍(畫面中心:器皿車+婦孺,scared 時發抖)
    const cx = W * 0.5, cy = H * 0.55
    const shake = this.scaredT > 0 ? Math.sin(this._t * 30) * 3 : 0
    ctx.save(); ctx.translate(shake, 0)
    // 器皿車
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(cx - 26, cy - 22, 52, 20)
    ctx.fillStyle = '#c9a63a'; ctx.fillRect(cx - 16, cy - 34, 32, 12) // 金器
    ctx.strokeStyle = '#5a4318'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(cx - 15, cy + 2, 9, 0, 7); ctx.arc(cx + 15, cy + 2, 9, 0, 7); ctx.stroke()
    // 婦孺(三個小人)
    for (const [dx, s] of [[-46, 0.85], [42, 0.8], [58, 0.65]]) {
      const px = cx + dx, py = cy - 2
      ctx.fillStyle = '#9c7a8a'
      ctx.fillRect(px - 5 * s, py - 16 * s, 10 * s, 16 * s)
      ctx.fillStyle = '#e8bb8d'
      ctx.beginPath(); ctx.arc(px, py - 20 * s, 5.5 * s, 0, 7); ctx.fill()
    }
    ctx.restore()
    // 暗影(從畫面外圍向隊伍靠近)
    for (const f of this.foes) {
      const fx = W * (0.5 + Math.cos(f.ang) * f.dist)
      const fy = H * (0.5 - Math.sin(f.ang) * f.dist * 0.7)
      const k = Math.min(W, H) * 0.03
      ctx.fillStyle = f.state === 'flee' ? 'rgba(50,40,60,0.4)' : 'rgba(36,28,44,0.85)'
      ctx.beginPath(); ctx.ellipse(fx, fy, k, k * 1.5, 0, 0, 7); ctx.fill()
      ctx.fillStyle = 'rgba(24,18,30,0.9)'
      ctx.beginPath(); ctx.arc(fx, fy - k * 1.5, k * 0.6, 0, 7); ctx.fill()
    }
    // 以斯拉(禱告時舉手+光罩)
    const ez = this.ezra
    const ex = ez.x * W, ey = ez.y * H
    if (ez.prayT > 0) {
      const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, Math.min(W, H) * 0.22)
      glow.addColorStop(0, 'rgba(255,240,190,0.5)'); glow.addColorStop(1, 'rgba(255,240,190,0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(ex, ey, Math.min(W, H) * 0.24, 0, 7); ctx.fill()
    }
    ctx.fillStyle = '#3a6a9c'
    ctx.fillRect(ex - 7, ey - 20, 14, 22)
    ctx.fillStyle = '#e8bb8d'
    ctx.beginPath(); ctx.arc(ex, ey - 26, 7, 0, 7); ctx.fill()
    ctx.strokeStyle = '#3a6a9c'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath()
    if (ez.prayT > 0) { ctx.moveTo(ex - 6, ey - 16); ctx.lineTo(ex - 13, ey - 32); ctx.moveTo(ex + 6, ey - 16); ctx.lineTo(ex + 13, ey - 32) } // 舉手
    else { ctx.moveTo(ex - 6, ey - 14); ctx.lineTo(ex - 11, ey - 4); ctx.moveTo(ex + 6, ey - 14); ctx.lineTo(ex + 11, ey - 4) }
    ctx.stroke()
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = 'rgba(60,40,10,0.6)'; ctx.lineWidth = 3
      ctx.font = `bold ${Math.max(14, H * 0.034)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, W / 2, H * 0.3 - k * 26); ctx.fillText(t.text, W / 2, H * 0.3 - k * 26)
      ctx.globalAlpha = 1
    }
    // HUD:進度
    ctx.fillStyle = 'rgba(40,26,8,0.6)'
    r5(ctx, W * 0.08, H * 0.02, W * 0.84, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#ffe9b0'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${this.scaredT > 0 ? T.scared : T.hud} ・ 到耶路撒冷 ${Math.floor(near * 100)}%`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card5(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.18)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 神施恩的手', W / 2, H * 0.25)
    ctx.fillStyle = '#4a3a20'
    wrap5(ctx, T.intro1, W / 2, H * 0.33, W * 0.72, H * 0.046)
    wrap5(ctx, T.how, W / 2, H * 0.48, W * 0.72, H * 0.046)
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#f0b23e'
      r5(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    card5(ctx, W * 0.1, H * 0.08, W * 0.8, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 平安到了耶路撒冷!', W / 2, H * 0.2)
    ctx.fillStyle = '#4a3a20'
    wrap5(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.28, W * 0.66, H * 0.046)
    ctx.fillStyle = '#7a5222'
    wrap5(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.52, W * 0.66, H * 0.043)
    ctx.fillStyle = '#4a3a20'
    wrap5(ctx, T.teach, W / 2, H * 0.64, W * 0.66, H * 0.043)
  }
}

function r5(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card5(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,251,238,0.96)'
  ctx.strokeStyle = '#c8a35a'; ctx.lineWidth = 3
  r5(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrap5(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
