// 護住好種子(太 13:4;路 8:15)——系列第一個「守護反應(打地鼠家族・驅趕型)」關(新類型⑦a)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:太 13:4、13:19、路 8:15),牧者審核通過前不進大廳卡。
//
// 玩法:田裡剛撒下好種子,種子慢慢發芽長大;飛鳥不時俯衝下來要吃種子。點飛鳥=拍手驅趕
//   (鳥受驚飛走,不受傷);鳥啄到種子,那顆的成長會倒退一點(不會消失)。全部種子長成小苗=過關。
// ★ 神學守法:驅趕不傷鳥(拍手聲+鳥飛走);種子絕不會被吃光——被啄只倒退,永不會輸(只有快慢)。
//   信息:惡者要奪去撒在心裡的道(太 13:19),把道「持守在誠實善良的心裡」(路 8:15)。
// 年齡三檔:幼(種子少鳥慢)/童(標準)/青(鳥多快且會兩隻同時)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;路 8:15 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '種子四顆・鳥慢', seeds: 4, spawnEvery: 5.5, birdSpeed: 0.16, growRate: 7 },
  kid: { label: '🙂 童', desc: '種子五顆', seeds: 5, spawnEvery: 4.2, birdSpeed: 0.2, growRate: 6 },
  teen: { label: '🔥 青', desc: '鳥多且快', seeds: 6, spawnEvery: 3.0, birdSpeed: 0.26, growRate: 5.2 },
}

const T = {
  title: '🌱 護住好種子',
  ref: '馬太福音 13:4;路加福音 8:15',
  intro1: '「撒的時候,有落在路旁的,飛鳥來吃盡了;」(太 13:4)',
  how: '好種子剛撒下,正在發芽長大。飛鳥會俯衝下來啄種子——點飛鳥(拍手)把牠嚇走!被啄到的種子成長會倒退一點,別怕,護著它,等每一顆都長成小苗。',
  pick: '選一塊田:',
  hud: (grown, total) => `🌱 發芽 ${grown}/${total}`,
  scare: '啪!飛鳥受驚飛走了',
  peck: '種子被啄了一口,再長吧…',
  winVerse: '那落在好土裡的,就是人聽了道,持守在誠實善良的心裡,並且忍耐著結實。',
  winRef: '路加福音 8:15',
  teachVerse: '凡聽見天國道理不明白的,那惡者就來,把所撒在他心裡的奪了去;這就是撒在路旁的了。',
  teachRef: '馬太福音 13:19',
  teach: '種子就是神的道,撒在你心裡。惡者像飛鳥,想把它奪去——把聽見的道護住、存記在心,忍耐著,它就會長大結實。',
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
    this._onUp = (e) => this._up(e)
    this._onKey = (e) => this._key(e)
    this._onResize = () => this._resize()
    this.seeds = [] // {progress 0-100, peckFlash}
    this.birds = [] // {seed, y(0 天上→1 種子), wob, state:'come'|'flee'}
    this.toasts = []
    this.spawnT = 0
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
    this.seeds = Array.from({ length: this.cfg.seeds }, () => ({ progress: 6 + Math.random() * 8, peckFlash: 0 }))
    this.birds = []
    this.toasts = []
    this.spawnT = 2.2
    this.state = 'play'
  }

  _update(dt) {
    if (this.state !== 'play') return
    for (const s of this.seeds) {
      if (s.peckFlash > 0) s.peckFlash -= dt
      s.progress = Math.min(100, s.progress + dt * this.cfg.growRate)
    }
    this.spawnT -= dt
    if (this.spawnT <= 0) {
      this.spawnT = this.cfg.spawnEvery * (0.75 + Math.random() * 0.5)
      const open = this.seeds.map((s, i) => (s.progress < 100 ? i : -1)).filter((i) => i >= 0)
      if (open.length) {
        this.birds.push({ seed: open[Math.floor(Math.random() * open.length)], y: 0, wob: Math.random() * 7, state: 'come' })
        if (this.age === 'teen' && open.length > 1 && Math.random() < 0.4) {
          const rest = open.filter((i) => i !== this.birds[this.birds.length - 1].seed)
          this.birds.push({ seed: rest[Math.floor(Math.random() * rest.length)], y: -0.12, wob: Math.random() * 7, state: 'come' })
        }
      }
    }
    for (const b of this.birds) {
      if (b.state === 'come') {
        b.y += dt * this.cfg.birdSpeed
        if (b.y >= 1) { // 啄到:成長倒退一點,鳥自行飛走(永不會輸)
          b.state = 'flee'
          const s = this.seeds[b.seed]
          s.progress = Math.max(4, s.progress - 16)
          s.peckFlash = 0.8
          this._tone(190, 0.2)
          this.toasts.push({ text: T.peck, seed: b.seed, t: this._t })
        }
      } else {
        b.y -= dt * 0.9
      }
    }
    this.birds = this.birds.filter((b) => !(b.state === 'flee' && b.y <= -0.15))
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.6)
    if (this.seeds.every((s) => s.progress >= 100)) this._win()
  }

  _scare(bi) {
    const b = this.birds[bi]
    if (!b || b.state !== 'come') return
    b.state = 'flee'
    this._clap()
    this.toasts.push({ text: T.scare, seed: b.seed, t: this._t })
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25, 0.15)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'sower' }) }, 900)
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
    // 點鳥(命中半徑放寬到觸控友善)
    const g = this._layout()
    const hitR = Math.min(this.W, this.H) * 0.075
    for (let i = 0; i < this.birds.length; i++) {
      const p = this._birdPos(this.birds[i], g)
      if (Math.hypot(x - p.x, y - p.y) <= hitR) return this._scare(i)
    }
  }

  _clap() { // 拍手:短促白噪
    this._tone(880, 0.05, 0, 'square', 0.1)
    this._tone(1320, 0.05, 0.03, 'square', 0.08)
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

  _layout() {
    const { W, H } = this
    const n = this.seeds.length || 1
    const x0 = W * 0.1, span = W * 0.8
    return { x0, span, gap: span / Math.max(1, n - 1), groundY: H * 0.72 }
  }
  _seedX(i, g) { return this.seeds.length === 1 ? g.x0 + g.span / 2 : g.x0 + i * g.gap }
  _birdPos(b, g) {
    const x = this._seedX(b.seed, g) + Math.sin(this._t * 5 + b.wob) * this.W * 0.015
    const y = this.H * 0.08 + Math.max(0, b.y) * (g.groundY - this.H * 0.16)
    return { x, y }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 清晨的田
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#bfe0ee'); sky.addColorStop(0.6, '#dcecd8'); sky.addColorStop(1, '#c9d8a8')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()

    const g = this._layout()
    // 田壟
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(0, g.groundY, W, H - g.groundY)
    ctx.strokeStyle = 'rgba(90,62,30,0.5)'; ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) { const y = g.groundY + (H - g.groundY) * (0.25 + i * 0.18); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
    // 種子/小苗
    for (let i = 0; i < this.seeds.length; i++) {
      const s = this.seeds[i]
      const x = this._seedX(i, g), y = g.groundY
      const k = Math.min(W, H) * 0.05
      if (s.peckFlash > 0) { ctx.fillStyle = `rgba(200,90,60,${s.peckFlash * 0.35})`; ctx.beginPath(); ctx.arc(x, y - k * 0.4, k * 1.5, 0, 7); ctx.fill() }
      // 土堆
      ctx.fillStyle = '#6a4e2c'
      ctx.beginPath(); ctx.ellipse(x, y, k * 0.9, k * 0.32, 0, 0, 7); ctx.fill()
      // 苗:progress 決定株高與葉
      const h = (s.progress / 100) * k * 2.4
      ctx.strokeStyle = '#3f7a2f'; ctx.lineWidth = Math.max(3, k * 0.16); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke()
      if (s.progress > 30) { // 兩片葉
        ctx.beginPath(); ctx.moveTo(x, y - h * 0.55); ctx.quadraticCurveTo(x - k * 0.7, y - h * 0.55 - k * 0.35, x - k * 0.85, y - h * 0.55 + k * 0.05); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x, y - h * 0.7); ctx.quadraticCurveTo(x + k * 0.7, y - h * 0.7 - k * 0.35, x + k * 0.85, y - h * 0.7 + k * 0.05); ctx.stroke()
      }
      if (s.progress >= 100) { ctx.fillStyle = '#e8c94a'; ctx.beginPath(); ctx.arc(x, y - h - k * 0.18, k * 0.22, 0, 7); ctx.fill() } // 結穗
      ctx.fillStyle = s.progress >= 100 ? '#2f6b2f' : '#5a4318'
      ctx.font = `bold ${Math.max(11, H * 0.024)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(s.progress >= 100 ? '✓' : `${Math.floor(s.progress)}%`, x, y + k * 0.85)
    }
    // 飛鳥(俯衝的深色小鳥,受驚回頭飛)
    for (const b of this.birds) {
      const p = this._birdPos(b, g)
      const k = Math.min(W, H) * 0.032
      const flee = b.state === 'flee'
      ctx.fillStyle = flee ? 'rgba(70,70,90,0.55)' : '#3a3a52'
      ctx.beginPath(); ctx.ellipse(p.x, p.y, k * 1.1, k * 0.7, flee ? -0.4 : 0.35, 0, 7); ctx.fill()
      // 翅膀拍動
      const flap = Math.sin(this._t * 14 + b.wob) * k * 0.8
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(3, k * 0.3); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(p.x - k * 0.2, p.y); ctx.lineTo(p.x - k * 1.2, p.y - flap); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(p.x + k * 0.2, p.y); ctx.lineTo(p.x + k * 1.2, p.y - flap); ctx.stroke()
      // 喙
      ctx.fillStyle = '#d8a03a'
      ctx.beginPath(); ctx.moveTo(p.x + k * 0.9, p.y + (flee ? -k * 0.3 : k * 0.3)); ctx.lineTo(p.x + k * 1.4, p.y + (flee ? -k * 0.1 : k * 0.55)); ctx.lineTo(p.x + k * 0.7, p.y + (flee ? -k * 0.55 : k * 0.55)); ctx.fill()
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.6
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#2e3a22'; ctx.strokeStyle = 'rgba(255,255,240,0.8)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      const tx = this._seedX(t.seed, g), ty = H * 0.42 - k * 26
      ctx.strokeText(t.text, tx, ty); ctx.fillText(t.text, tx, ty)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(40,52,26,0.6)'
    r4(ctx, W * 0.2, H * 0.02, W * 0.6, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#f2f8dc'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    const grown = this.seeds.filter((s) => s.progress >= 100).length
    ctx.fillText(`${T.hud(grown, this.seeds.length)} ・ 點飛鳥拍手趕走牠`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card4(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3f5a22'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.18)
    ctx.fillStyle = '#6a7a44'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 撒種的比喻', W / 2, H * 0.25)
    ctx.fillStyle = '#3a4426'
    wrap4(ctx, T.intro1, W / 2, H * 0.33, W * 0.72, H * 0.046)
    wrap4(ctx, T.how, W / 2, H * 0.44, W * 0.72, H * 0.046)
    ctx.fillStyle = '#6a7a44'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#8fbb4e'
      r4(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#2e3a16'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    card4(ctx, W * 0.1, H * 0.08, W * 0.8, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3f5a22'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 每一顆種子都長大了!', W / 2, H * 0.2)
    ctx.fillStyle = '#3a4426'
    wrap4(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.28, W * 0.66, H * 0.046)
    ctx.fillStyle = '#6a5a2a'
    wrap4(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.5, W * 0.66, H * 0.043)
    ctx.fillStyle = '#3a4426'
    wrap4(ctx, T.teach, W / 2, H * 0.7, W * 0.66, H * 0.043)
  }
}

function r4(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card4(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(252,255,242,0.96)'
  ctx.strokeStyle = '#8faf5a'; ctx.lineWidth = 3
  r4(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrap4(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
