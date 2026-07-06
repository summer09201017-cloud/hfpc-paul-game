// 撲滅小火苗(雅 3:5;箴 21:23)——「守護反應(打地鼠家族)」第三式:蔓延型撲滅(新類型⑦c)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:雅 3:5、箴 21:23),牧者審核通過前不進大廳卡。
//
// 玩法:樹林邊不時冒出小火苗,火苗會慢慢長大;點火苗=倒水撲滅(水花)。拖太久火長滿,
//   會「蔓延」再冒出兩個新火苗、天色也暗一點(corruption 式漸變)——但永遠救得回來。
//   撲滿目標數且場上全清=過關。
// ★ 神學守法:信息=「最小的火能點著最大的樹林」(雅 3:5)——舌頭的火、罪的火,趁小撲滅;
//   蔓延只是「更多要滅的火」,沒有燒毀、沒有失敗,天色暗了會隨撲滅亮回來。永不會輸。
// 年齡三檔:幼(火長得慢・不蔓延)/童(標準)/青(長得快・蔓延兩個)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;雅 3:5、箴 21:23 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '火慢・不蔓延', goal: 6, growTime: 7, spawnEvery: 3.6, spreadN: 0 },
  kid: { label: '🙂 童', desc: '會蔓延一個', goal: 9, growTime: 5.2, spawnEvery: 3.0, spreadN: 1 },
  teen: { label: '🔥 青', desc: '火快・蔓延兩個', goal: 12, growTime: 3.8, spawnEvery: 2.4, spreadN: 2 },
}
const MAXFIRES = 8

const T = {
  title: '💧 撲滅小火苗',
  ref: '雅各書 3:5',
  intro1: '「看哪,最小的火能點著最大的樹林。」(雅 3:5)',
  how: '樹林邊不時冒出小火苗——點它,倒水把它撲滅!拖太久火會長大、蔓延出更多火苗,天色也會暗下來。別怕,一個一個滅,天就亮回來。撲滿目標數、場上全清就過關!',
  pick: '守住這片樹林。選一個難度:',
  hud: (done, goal) => `💧 撲滅 ${done}/${goal}`,
  douse: '滋——熄了!',
  spread: '火蔓延了!快撲滅',
  winVerse: '這樣,舌頭在百體裡也是最小的,卻能說大話。看哪,最小的火能點著最大的樹林。',
  winRef: '雅各書 3:5',
  teachVerse: '謹守口與舌的,就保守自己免受災難。',
  teachRef: '箴言 21:23',
  teach: '一句氣話、一個小謊,像一粒火星——落地的時候很小,燒起來就是一片樹林。趁它還小就撲滅;求神幫助我們謹守口與舌。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro'
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onUp = (e) => this._up(e)
    this._onKey = (e) => this._key(e)
    this._onResize = () => this._resize()
    this.fires = [] // {x,y(0-1 相對), size(0-1), state:'burn'|'out', outT}
    this.splashes = [] // {x,y,t0}
    this.toasts = []
    this.doused = 0
    this.gloom = 0 // 0-1 天色變暗(蔓延+火多時上升,撲滅後回落)
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
    this.fires = []
    this.splashes = []
    this.toasts = []
    this.doused = 0
    this.gloom = 0
    this.spawnT = 1.4
    this.state = 'play'
  }

  _spawn(nearX, nearY) {
    if (this.fires.filter((f) => f.state === 'burn').length >= MAXFIRES) return
    const x = nearX != null ? Math.min(0.92, Math.max(0.08, nearX + (Math.random() - 0.5) * 0.22)) : 0.1 + Math.random() * 0.8
    const y = nearY != null ? Math.min(0.9, Math.max(0.45, nearY + (Math.random() - 0.5) * 0.18)) : 0.48 + Math.random() * 0.4
    this.fires.push({ x, y, size: 0.12, state: 'burn', outT: 0 })
  }

  _update(dt) {
    if (this.state !== 'play') return
    // 出新火(還沒撲滿目標才出)
    if (this.doused < this.cfg.goal) {
      this.spawnT -= dt
      if (this.spawnT <= 0) {
        this.spawnT = this.cfg.spawnEvery * (0.7 + Math.random() * 0.6)
        this._spawn()
      }
    }
    // 火成長與蔓延
    for (const f of this.fires) {
      if (f.state === 'out') { f.outT += dt; continue }
      f.size = Math.min(1, f.size + dt / this.cfg.growTime)
      if (f.size >= 1) { // 長滿:縮回中火 + 蔓延(不是燒毀,是「更多要滅的火」)
        f.size = 0.45
        this.gloom = Math.min(1, this.gloom + 0.18)
        if (this.cfg.spreadN > 0) {
          for (let i = 0; i < this.cfg.spreadN; i++) this._spawn(f.x, f.y)
          this._tone(160, 0.3, 0, 'sawtooth', 0.1)
          this.toasts.push({ x: f.x, y: f.y, text: T.spread, t: this._t })
        }
      }
    }
    this.fires = this.fires.filter((f) => !(f.state === 'out' && f.outT > 0.8))
    this.splashes = this.splashes.filter((s) => this._t - s.t0 < 0.7)
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.6)
    // 天色隨場上火量緩慢回亮
    const burning = this.fires.filter((f) => f.state === 'burn').length
    this.gloom = Math.max(0, this.gloom - dt * (burning === 0 ? 0.35 : 0.05))
    // 過關:撲滿且全清
    if (this.doused >= this.cfg.goal && burning === 0) this._win()
  }

  _douse(fi) {
    const f = this.fires[fi]
    if (!f || f.state !== 'burn') return
    f.state = 'out'
    this.doused++
    this.splashes.push({ x: f.x, y: f.y, t0: this._t })
    this._hiss()
    this.toasts.push({ x: f.x, y: f.y, text: T.douse, t: this._t })
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25, 0.15)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'sparks' }) }, 900)
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
    const hitR = Math.min(this.W, this.H) * 0.085
    for (let i = 0; i < this.fires.length; i++) {
      const f = this.fires[i]
      if (Math.hypot(x - f.x * this.W, y - f.y * this.H) <= hitR + f.size * hitR) return this._douse(i)
    }
  }

  _hiss() { // 滋——水澆火
    this._tone(1600, 0.06, 0, 'square', 0.06)
    this._tone(500, 0.22, 0.02, 'sine', 0.1)
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
    // 樹林邊(天色受 gloom 影響)
    const gl = this.gloom
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, lerpColor('#cfe6ee', '#5a5a6e', gl))
    sky.addColorStop(0.55, lerpColor('#dcead0', '#6e6a5e', gl))
    sky.addColorStop(1, lerpColor('#b8c890', '#5e5a46', gl))
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()

    // 遠景樹列(剪影)
    ctx.fillStyle = lerpColor('#4a7a3a', '#33402a', gl)
    for (let i = 0; i < 7; i++) {
      const tx = W * (0.06 + i * 0.15), ty = H * 0.3
      ctx.beginPath(); ctx.moveTo(tx, ty - H * 0.14); ctx.lineTo(tx - W * 0.05, ty + H * 0.06); ctx.lineTo(tx + W * 0.05, ty + H * 0.06); ctx.fill()
      ctx.fillRect(tx - W * 0.008, ty + H * 0.06, W * 0.016, H * 0.04)
    }
    // 地面
    ctx.fillStyle = lerpColor('#a8b478', '#5c5c44', gl)
    ctx.fillRect(0, H * 0.42, W, H)

    // 火苗
    for (const f of this.fires) {
      const x = f.x * W, y = f.y * H
      const k = Math.min(W, H) * (0.03 + f.size * 0.075)
      if (f.state === 'out') { // 餘煙
        ctx.strokeStyle = `rgba(120,120,120,${Math.max(0, 0.6 - f.outT)})`
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + k * 0.5, y - k * 1.4, x, y - k * 2.4); ctx.stroke()
        continue
      }
      const wob = Math.sin(this._t * 9 + x) * k * 0.14
      // 外焰/內焰/芯
      ctx.fillStyle = 'rgba(235,120,40,0.9)'
      ctx.beginPath(); ctx.moveTo(x - k * 0.7, y); ctx.quadraticCurveTo(x - k * 0.5, y - k * 1.1, x + wob, y - k * 1.9); ctx.quadraticCurveTo(x + k * 0.5, y - k * 1.1, x + k * 0.7, y); ctx.closePath(); ctx.fill()
      ctx.fillStyle = 'rgba(250,190,70,0.95)'
      ctx.beginPath(); ctx.moveTo(x - k * 0.4, y); ctx.quadraticCurveTo(x - k * 0.25, y - k * 0.7, x + wob * 0.7, y - k * 1.15); ctx.quadraticCurveTo(x + k * 0.3, y - k * 0.7, x + k * 0.4, y); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#fff3c8'
      ctx.beginPath(); ctx.ellipse(x, y - k * 0.3, k * 0.2, k * 0.36, 0, 0, 7); ctx.fill()
      // 大小條(快長滿=快蔓延的提示)
      ctx.fillStyle = 'rgba(60,40,20,0.4)'
      ctx.fillRect(x - k, y + k * 0.35, k * 2, k * 0.14)
      ctx.fillStyle = f.size > 0.75 ? '#d84a2a' : '#e8a44a'
      ctx.fillRect(x - k, y + k * 0.35, k * 2 * f.size, k * 0.14)
    }
    // 水花
    for (const s of this.splashes) {
      const k = (this._t - s.t0) / 0.7
      const x = s.x * W, y = s.y * H
      ctx.strokeStyle = `rgba(90,160,220,${1 - k})`
      ctx.lineWidth = 4
      for (let a = 0; a < 6; a++) {
        const th = (a / 6) * Math.PI * 2
        const rr = k * Math.min(W, H) * 0.06
        ctx.beginPath(); ctx.moveTo(x + Math.cos(th) * rr * 0.5, y + Math.sin(th) * rr * 0.5); ctx.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr); ctx.stroke()
      }
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.6
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#243040'; ctx.strokeStyle = 'rgba(255,255,245,0.85)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, t.x * W, t.y * H - H * 0.08 - k * 24)
      ctx.fillText(t.text, t.x * W, t.y * H - H * 0.08 - k * 24)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(30,40,52,0.62)'
    r4(ctx, W * 0.2, H * 0.02, W * 0.6, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#dceaf8'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.doused, this.cfg.goal)} ・ 點火苗倒水撲滅`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card4(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#28506b'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.18)
    ctx.fillStyle = '#5a7a8e'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 趁小撲滅', W / 2, H * 0.25)
    ctx.fillStyle = '#2e3a44'
    wrap4(ctx, T.intro1, W / 2, H * 0.33, W * 0.72, H * 0.046)
    wrap4(ctx, T.how, W / 2, H * 0.43, W * 0.72, H * 0.046)
    ctx.fillStyle = '#5a7a8e'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#6aa8d0'
      r4(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#122a3a'
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
    ctx.fillStyle = '#28506b'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 火都熄了,樹林平安!', W / 2, H * 0.2)
    ctx.fillStyle = '#2e3a44'
    wrap4(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.28, W * 0.66, H * 0.046)
    ctx.fillStyle = '#5a6a2a'
    wrap4(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.52, W * 0.66, H * 0.043)
    ctx.fillStyle = '#2e3a44'
    wrap4(ctx, T.teach, W / 2, H * 0.64, W * 0.66, H * 0.043)
  }
}

function lerpColor(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
function r4(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card4(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,251,255,0.96)'
  ctx.strokeStyle = '#6a9ac0'; ctx.lineWidth = 3
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
