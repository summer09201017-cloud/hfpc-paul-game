// 擒拿小狐狸(歌 2:15)——「守護反應(打地鼠家族)」第二式:分辨型擒拿(新類型⑦b)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:歌 2:15),牧者審核通過前不進大廳卡。
//
// 玩法:葡萄園裡小狐狸從藏身處探頭,要咬正在開花的葡萄藤——點狐狸=用網子「擒拿」帶走(經文動詞!不是打死);
//   沒點到,牠咬一口,葡萄藤的花況倒退一點(會慢慢恢復,永不會輸)。蝴蝶、瓢蟲也會探頭——牠們無害,別抓錯!
//   擒滿目標數=過關。★ 分辨型:反應+分辨,「不是所有動的都要抓」。
// ★ 神學守法:擒拿=溫柔捉走(網子+提走動畫),不見血不打擊;信息=小狐狸像看似不起眼的小罪/壞習慣,
//   趁牠還小就對付,不然毀壞整園(葡萄正在開花的時候最要緊)。
// 年齡三檔:幼(狐狸停留久・無誘餌)/童(有蝴蝶誘餌)/青(誘餌多・狐狸快・兩隻同時)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;歌 2:15 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '狐狸慢・無誘餌', goal: 5, stay: 3.6, spawnEvery: 3.4, decoyRate: 0 },
  kid: { label: '🙂 童', desc: '小心蝴蝶', goal: 7, stay: 2.7, spawnEvery: 2.8, decoyRate: 0.35 },
  teen: { label: '🔥 青', desc: '誘餌多・狐狸快', goal: 9, stay: 1.9, spawnEvery: 2.2, decoyRate: 0.5 },
}
const SPOTS = 6 // 藏身處(葡萄藤下的洞口)

const T = {
  title: '🦊 擒拿小狐狸',
  ref: '雅歌 2:15',
  intro1: '「要給我們擒拿狐狸,就是毀壞葡萄園的小狐狸,因為我們的葡萄正在開花。」(歌 2:15)',
  how: '小狐狸會從葡萄藤下探頭,想咬正在開花的葡萄!點狐狸=用網子擒拿帶走。小心——蝴蝶和瓢蟲也會出來,牠們是無害的,別抓錯。擒滿目標數就過關!',
  pick: '葡萄正在開花。選一個園子:',
  hud: (got, goal) => `🕸️ 擒拿 ${got}/${goal}`,
  caught: '擒住了!帶去園外放',
  bite: '啊,葡萄被咬了一口…',
  harmless: '牠是無害的,別抓牠 🦋',
  winVerse: '要給我們擒拿狐狸,就是毀壞葡萄園的小狐狸,因為我們的葡萄正在開花。',
  winRef: '雅歌 2:15',
  teach: '毀壞葡萄園的,常常不是獅子,是「小」狐狸——像那些看起來不要緊的小壞習慣、小謊言。趁牠還小就對付,葡萄才能好好開花結果。',
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
    this.caught = 0
    this.bloom = 100 // 花況(被咬倒退,緩慢恢復;純視覺與敘事,不會歸零失敗)
    this.pops = [] // {spot, kind:'fox'|'butterfly'|'ladybug', t0, stay, state:'up'|'caught'|'gone', liftT}
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
    this.caught = 0
    this.bloom = 100
    this.pops = []
    this.toasts = []
    this.spawnT = 1.6
    this.state = 'play'
  }

  _freeSpots() {
    const used = new Set(this.pops.filter((p) => p.state === 'up').map((p) => p.spot))
    return Array.from({ length: SPOTS }, (_, i) => i).filter((i) => !used.has(i))
  }

  _update(dt) {
    if (this.state !== 'play') return
    this.bloom = Math.min(100, this.bloom + dt * 2.2) // 花況緩慢恢復
    this.spawnT -= dt
    if (this.spawnT <= 0) {
      this.spawnT = this.cfg.spawnEvery * (0.7 + Math.random() * 0.6)
      const free = this._freeSpots()
      if (free.length) {
        const kind = Math.random() < this.cfg.decoyRate ? (Math.random() < 0.5 ? 'butterfly' : 'ladybug') : 'fox'
        this.pops.push({ spot: free[Math.floor(Math.random() * free.length)], kind, t0: this._t, stay: this.cfg.stay * (0.85 + Math.random() * 0.3), state: 'up', liftT: 0 })
        if (this.age === 'teen' && Math.random() < 0.35) {
          const free2 = this._freeSpots()
          if (free2.length) this.pops.push({ spot: free2[Math.floor(Math.random() * free2.length)], kind: 'fox', t0: this._t, stay: this.cfg.stay, state: 'up', liftT: 0 })
        }
      }
    }
    for (const p of this.pops) {
      if (p.state === 'caught') { p.liftT += dt; continue }
      if (p.state === 'up' && this._t - p.t0 >= p.stay) {
        p.state = 'gone'
        if (p.kind === 'fox') { // 狐狸得逞:咬一口(花況倒退,不會輸)
          this.bloom = Math.max(20, this.bloom - 14)
          this._tone(180, 0.22)
          this.toasts.push({ text: T.bite, spot: p.spot, t: this._t })
        }
      }
    }
    this.pops = this.pops.filter((p) => (p.state === 'up') || (p.state === 'caught' && p.liftT < 1.1) || (p.state === 'gone' && this._t - p.t0 < p.stay + 0.4))
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.6)
    if (this.caught >= this.cfg.goal) this._win()
  }

  _tap(pi) {
    const p = this.pops[pi]
    if (!p || p.state !== 'up') return
    if (p.kind === 'fox') {
      p.state = 'caught'
      this.caught++
      this._tone(620, 0.12); this._tone(840, 0.16, 0.1)
      this.toasts.push({ text: T.caught, spot: p.spot, t: this._t })
    } else { // 無害的:溫柔提醒,不懲罰
      this._tone(420, 0.14, 0, 'sine', 0.1)
      this.toasts.push({ text: T.harmless, spot: p.spot, t: this._t })
    }
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25, 0.15)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'foxes' }) }, 900)
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
    const g = this._layout()
    const hitR = Math.min(this.W, this.H) * 0.085
    for (let i = 0; i < this.pops.length; i++) {
      const p = this._popPos(this.pops[i], g)
      if (Math.hypot(x - p.x, y - p.y) <= hitR) return this._tap(i)
    }
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
    // 3×2 藏身處
    const x0 = W * 0.16, gx = W * 0.34
    const y0 = H * 0.5, gy = H * 0.24
    return { x0, gx, y0, gy }
  }
  _popPos(p, g) {
    const col = p.spot % 3, row = Math.floor(p.spot / 3)
    const lift = p.state === 'caught' ? p.liftT * this.H * 0.3 : 0
    return { x: g.x0 + col * g.gx, y: g.y0 + row * g.gy - lift }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 葡萄園(暖陽)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#f2e2b8'); sky.addColorStop(0.5, '#dfe4b0'); sky.addColorStop(1, '#a8b070')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()

    const g = this._layout()
    // 上方一排葡萄藤(花況 bloom 決定花多寡)
    const vineY = H * 0.2
    ctx.strokeStyle = '#5a4a26'; ctx.lineWidth = Math.max(4, H * 0.012); ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(W * 0.05, vineY)
    for (let x = 0.05; x <= 0.95; x += 0.1) ctx.quadraticCurveTo(W * (x + 0.05), vineY + Math.sin(x * 20) * H * 0.03, W * (x + 0.1), vineY)
    ctx.stroke()
    const flowers = Math.round((this.bloom / 100) * 12)
    for (let i = 0; i < 12; i++) {
      const fx = W * (0.08 + i * 0.078), fy = vineY + Math.sin(i * 2.2) * H * 0.035 + H * 0.03
      ctx.fillStyle = '#4a7a3a'
      ctx.beginPath(); ctx.ellipse(fx, fy, W * 0.016, W * 0.01, 0.6, 0, 7); ctx.fill() // 葉
      if (i < flowers) { // 小白花簇(開花中)
        ctx.fillStyle = '#f8f4e0'
        for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(fx + (j - 1) * W * 0.008, fy + H * 0.018, W * 0.006, 0, 7); ctx.fill() }
      }
    }
    // 藏身處(洞口)與探頭者
    for (let i = 0; i < SPOTS; i++) {
      const col = i % 3, row = Math.floor(i / 3)
      const x = g.x0 + col * g.gx, y = g.y0 + row * g.gy
      ctx.fillStyle = '#6a5230'
      ctx.beginPath(); ctx.ellipse(x, y + H * 0.035, W * 0.075, H * 0.03, 0, 0, 7); ctx.fill()
      ctx.fillStyle = '#453518'
      ctx.beginPath(); ctx.ellipse(x, y + H * 0.03, W * 0.06, H * 0.022, 0, 0, 7); ctx.fill()
    }
    for (const p of this.pops) {
      if (p.state === 'gone') continue
      const pos = this._popPos(p, g)
      const k = Math.min(W, H) * 0.045
      const remain = p.state === 'up' ? Math.max(0, 1 - (this._t - p.t0) / p.stay) : 1
      if (p.kind === 'fox') this._drawFox(pos.x, pos.y, k, p.state === 'caught', remain)
      else if (p.kind === 'butterfly') this._drawButterfly(pos.x, pos.y, k)
      else this._drawLadybug(pos.x, pos.y, k)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.6
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#3a2e16'; ctx.strokeStyle = 'rgba(255,252,235,0.85)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      const col = t.spot % 3
      const tx = g.x0 + col * g.gx, ty = g.y0 + Math.floor(t.spot / 3) * g.gy - H * 0.09 - k * 24
      ctx.strokeText(t.text, tx, ty); ctx.fillText(t.text, tx, ty)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(58,42,18,0.62)'
    r4(ctx, W * 0.2, H * 0.02, W * 0.6, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#ffeec2'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.caught, this.cfg.goal)} ・ 🌸 花況 ${Math.round(this.bloom)}%`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawFox(x, y, k, caught, remain) {
    const { ctx } = this
    // 擒住:網子罩住+上提
    // 身(探頭:頭+前爪)
    ctx.fillStyle = '#c66a2a'
    ctx.beginPath(); ctx.ellipse(x, y, k * 1.05, k * 0.85, 0, 0, 7); ctx.fill()
    // 耳(三角,內耳白)
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#c66a2a'
      ctx.beginPath(); ctx.moveTo(x + s * k * 0.7, y - k * 0.5); ctx.lineTo(x + s * k * 1.05, y - k * 1.45); ctx.lineTo(x + s * k * 0.15, y - k * 0.85); ctx.fill()
      ctx.fillStyle = '#f4e2ce'
      ctx.beginPath(); ctx.moveTo(x + s * k * 0.62, y - k * 0.62); ctx.lineTo(x + s * k * 0.88, y - k * 1.22); ctx.lineTo(x + s * k * 0.3, y - k * 0.82); ctx.fill()
    }
    // 白吻+黑鼻+眼
    ctx.fillStyle = '#f4e2ce'
    ctx.beginPath(); ctx.ellipse(x, y + k * 0.28, k * 0.55, k * 0.42, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a1c10'
    ctx.beginPath(); ctx.arc(x, y + k * 0.34, k * 0.13, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x - k * 0.34, y - k * 0.08, k * 0.1, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + k * 0.34, y - k * 0.08, k * 0.1, 0, 7); ctx.fill()
    if (caught) { // 網子
      ctx.strokeStyle = 'rgba(90,74,38,0.9)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(x, y - k * 0.1, k * 1.5, 0, 7); ctx.stroke()
      for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.arc(x, y - k * 0.1, k * (0.5 + a * 0.2), 0, 7); ctx.stroke() }
      for (let a = 0; a < 8; a++) { const th = (a / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x, y - k * 0.1); ctx.lineTo(x + Math.cos(th) * k * 1.5, y - k * 0.1 + Math.sin(th) * k * 1.5); ctx.stroke() }
    } else { // 停留倒數細條(要跑了的提示)
      ctx.fillStyle = 'rgba(90,74,38,0.4)'
      ctx.fillRect(x - k, y + k * 1.05, k * 2, k * 0.12)
      ctx.fillStyle = '#c66a2a'
      ctx.fillRect(x - k, y + k * 1.05, k * 2 * remain, k * 0.12)
    }
  }
  _drawButterfly(x, y, k) {
    const { ctx } = this
    const flap = Math.sin(this._t * 10) * 0.4 + 0.8
    ctx.fillStyle = '#7a9ad0'
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(x + s * k * 0.5 * flap, y - k * 0.2, k * 0.55 * flap, k * 0.75, s * 0.5, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.ellipse(x + s * k * 0.4 * flap, y + k * 0.35, k * 0.4 * flap, k * 0.5, s * 0.3, 0, 7); ctx.fill()
    }
    ctx.fillStyle = '#3a3a3a'
    ctx.beginPath(); ctx.ellipse(x, y, k * 0.12, k * 0.6, 0, 0, 7); ctx.fill()
  }
  _drawLadybug(x, y, k) {
    const { ctx } = this
    ctx.fillStyle = '#c43a3a'
    ctx.beginPath(); ctx.ellipse(x, y, k * 0.7, k * 0.55, 0, 0, 7); ctx.fill()
    ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x, y - k * 0.55); ctx.lineTo(x, y + k * 0.55); ctx.stroke()
    ctx.fillStyle = '#2a1a1a'
    ctx.beginPath(); ctx.arc(x, y - k * 0.55, k * 0.22, 0, 7); ctx.fill()
    for (const [dx, dy] of [[-0.3, -0.15], [0.3, -0.1], [-0.25, 0.25], [0.28, 0.28]]) {
      ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, k * 0.09, 0, 7); ctx.fill()
    }
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card4(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#7a4a1b'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.18)
    ctx.fillStyle = '#9a7a3e'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 趁牠還小就對付', W / 2, H * 0.25)
    ctx.fillStyle = '#4a3a20'
    wrap4(ctx, T.intro1, W / 2, H * 0.33, W * 0.72, H * 0.046)
    wrap4(ctx, T.how, W / 2, H * 0.45, W * 0.72, H * 0.046)
    ctx.fillStyle = '#9a7a3e'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#e0a04a'
      r4(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#4a2e08'
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
    ctx.fillStyle = '#7a4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 葡萄園保住了,滿園花香!', W / 2, H * 0.2)
    ctx.fillStyle = '#4a3a20'
    wrap4(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.3, W * 0.66, H * 0.046)
    ctx.fillStyle = '#4a3a20'
    wrap4(ctx, T.teach, W / 2, H * 0.58, W * 0.66, H * 0.045)
  }
}

function r4(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card4(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,251,238,0.96)'
  ctx.strokeStyle = '#c8a35a'; ctx.lineWidth = 3
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
