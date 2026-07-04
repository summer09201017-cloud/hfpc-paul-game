// 五餅二魚・分餅關(耶穌生平之旅 闖關③,約 6:1-13)——「收集反轉」:不是撿,是分出去。
// ★規則即講道:每分給一群人,籃子裡的餅「不減反增」——在主手中,分出去的越分越多。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete})、boot()、destroy()。不會輸(走完必過)。
// 玩法:← → / A D 走動,走近一群坐著的人,空白鍵/↑/點畫面=分餅;八群都吃飽 → 十二籃零碎 → 過關。
// 經文(和合本,2026-07-04 已用 cuv lookup 約 6:11-13 逐字核對);文案待牧者審核。
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const SCRIPTURE = {
  title: '五餅二魚 · 你們給他們吃吧',
  ref: '約翰福音 6:1-13',
  how: '用左右鍵(或按住畫面左右)走到每一群坐著的人旁邊,按空白鍵(或點畫面)把餅分給他們。你會發現——籃子裡的餅,越分越多!',
  winRef: '約 6:11-13',
  winText: '耶穌拿起餅來，祝謝了，就分給那坐著的人；分魚也是這樣，都隨著他們所要的。他們吃飽了，耶穌對門徒說：「把剩下的零碎收拾起來，免得有糟蹋的。」他們便將那五個大麥餅的零碎，就是眾人吃了剩下的，收拾起來，裝滿了十二個籃子。',
  winHead: '裝滿了十二個籃子!',
  winBody: '你手上只有五餅二魚——但經過主祝謝的手,分出去的不減反增,連零碎都裝滿十二籃。小小的奉獻,在主手中夠眾人吃飽。',
}

const STEP = 1 / 60
const WORLD_W = 2400 // 世界寬(px 邏輯座標)
const GROUPS = 8 // 八群人(路 9:14 一排一排坐下)
const GIVE_RANGE = 90 // 靠多近可以分餅

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.stopped = false
    this.finished = false
    this.state = 'intro' // intro → play → win
    this.t = 0
    this.px = 120 // 玩家世界座標
    this.dir = 1
    this.walk = 0 // 走路相位
    this.moveL = false
    this.moveR = false
    this.bread = 5 // ★籃子計數:從五餅開始,每分一群 +1(不減反增——規則即講道)
    this.gave = 0
    this.groups = Array.from({ length: GROUPS }, (_, i) => ({
      x: 340 + i * ((WORLD_W - 500) / (GROUPS - 1)),
      fed: false,
      pop: 0, // 吃飽的歡喜動畫
      size: 3 + (i % 3), // 每群 3-5 個人
    }))
    this.fx = [] // { x, y, age, life, label }
    this._loop = this._loop.bind(this)
    this._audio = null
  }

  boot() {
    initSpeech()
    this._onKey = (e, down) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.moveL = down; e.preventDefault() }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.moveR = down; e.preventDefault() }
      if (down && (e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault()
        if (this.state === 'intro') this._start()
        else this._give()
      }
    }
    this._kd = (e) => this._onKey(e, true)
    this._ku = (e) => this._onKey(e, false)
    window.addEventListener('keydown', this._kd)
    window.addEventListener('keyup', this._ku)
    // 觸控:點畫面=開始/分餅;按住左右 1/3 = 走
    this._pd = (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      if (this.state === 'intro') { this._start(); return }
      if (x < rect.width * 0.3) { this.moveL = true; this._pLane = 'L' }
      else if (x > rect.width * 0.7) { this.moveR = true; this._pLane = 'R' }
      else this._give()
    }
    this._pu = () => { if (this._pLane === 'L') this.moveL = false; if (this._pLane === 'R') this.moveR = false; this._pLane = null }
    this.canvas.addEventListener('pointerdown', this._pd)
    this.canvas.addEventListener('pointerup', this._pu)
    this.canvas.addEventListener('pointercancel', this._pu)
    this.last = null
    this.acc = 0
    requestAnimationFrame(this._loop)
  }

  destroy() {
    this.stopped = true
    window.removeEventListener('keydown', this._kd)
    window.removeEventListener('keyup', this._ku)
    this.canvas.removeEventListener('pointerdown', this._pd)
    this.canvas.removeEventListener('pointerup', this._pu)
    this.canvas.removeEventListener('pointercancel', this._pu)
    try { this._audio?.close() } catch {}
    stopSpeech()
  }

  _start() {
    this.state = 'play'
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      this._audio = this._audio || new AC()
    } catch {}
  }

  _chime(freq, gain = 0.2, dur = 0.3) {
    const ctx = this._audio
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'triangle'; o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(ctx.destination)
    o.start(t); o.stop(t + dur + 0.05)
  }

  _give() {
    if (this.state !== 'play') return
    const g = this.groups.find((gr) => !gr.fed && Math.abs(gr.x - this.px) < GIVE_RANGE)
    if (!g) { this._chime(220, 0.08, 0.15); return } // 附近沒人:輕聲提示,不懲罰
    g.fed = true
    g.pop = 1
    this.gave++
    this.bread++ // ★不減反增
    this._chime(660 + this.gave * 40, 0.22, 0.4)
    this.fx.push({ x: g.x, y: 0, age: 0, life: 1.1, label: `分給他們!🍞 籃裡還有 ${this.bread} 個` })
    if (this.gave >= GROUPS) setTimeout(() => this._finish(), 900)
  }

  _finish() {
    if (this.finished || this.stopped) return
    this.finished = true
    this.state = 'win'
    this._chime(523, 0.25, 0.5); this._chime(784, 0.2, 0.7)
    setTimeout(() => { if (!this.stopped) speakScripture(SCRIPTURE.winText, { ref: SCRIPTURE.winRef }) }, 600)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.winPoints + 12 }) }, 900)
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
    for (const f of this.fx) f.age += dt
    this.fx = this.fx.filter((f) => f.age < f.life)
    for (const g of this.groups) if (g.pop > 0) g.pop = Math.max(0, g.pop - dt * 0.8)
    if (this.state !== 'play') return
    const v = 240
    if (this.moveL) { this.px -= v * dt; this.dir = -1; this.walk += dt * 9 }
    if (this.moveR) { this.px += v * dt; this.dir = 1; this.walk += dt * 9 }
    this.px = Math.max(60, Math.min(WORLD_W - 60, this.px))
  }

  _draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    if (this.canvas.width !== Math.round(w * dpr)) { this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr) }
    const ctx = this.ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 相機跟隨
    const cam = Math.max(0, Math.min(WORLD_W - w, this.px - w / 2))
    const groundY = h * 0.78
    // 黃昏天空(約 6:嚴近日暮)+ 加利利湖遠景 + 青草地(可 6:39 坐在青草地上)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#7ba3cc'); sky.addColorStop(0.5, '#e8c48a'); sky.addColorStop(0.66, '#5f93b8'); sky.addColorStop(0.7, '#6faa5f'); sky.addColorStop(1, '#4d8a45')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#fff3c4'
    ctx.beginPath(); ctx.arc(w * 0.8, h * 0.18, 22, 0, Math.PI * 2); ctx.fill()
    // 草
    ctx.strokeStyle = 'rgba(30,80,30,0.35)'; ctx.lineWidth = 1.5
    for (let gx = -(cam % 46); gx < w; gx += 46) {
      ctx.beginPath(); ctx.moveTo(gx, groundY + 14); ctx.lineTo(gx + 4, groundY + 4); ctx.stroke()
    }
    // 人群(一群一群坐著)
    for (const g of this.groups) {
      const sx = g.x - cam
      if (sx < -160 || sx > w + 160) continue
      for (let i = 0; i < g.size; i++) {
        const ox = (i - (g.size - 1) / 2) * 30
        const bob = g.fed ? Math.sin(this.t * 4 + i) * 3 * (1 + g.pop) : 0
        this._person(ctx, sx + ox, groundY - bob, g.fed, i)
      }
      if (!g.fed && Math.abs(g.x - this.px) < GIVE_RANGE && this.state === 'play') {
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 15px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('空白鍵/點畫面:分餅 🍞', sx, groundY - 92)
      }
    }
    // 玩家(門徒+籃子)
    this._player(ctx, this.px - cam, groundY)
    // 特效字
    for (const f of this.fx) {
      const p = f.age / f.life
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = '#fff8dc'
      ctx.font = 'bold 16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(f.label, f.x - cam, groundY - 100 - p * 30)
      ctx.globalAlpha = 1
    }
    // HUD:籃子計數 + 進度
    ctx.fillStyle = 'rgba(30,40,26,0.55)'
    ctx.fillRect(10, 10, 235, 34)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 15px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`🧺 籃裡的餅:${this.bread}　已分:${this.gave}/${GROUPS} 群`, 18, 33)
    // 卡片
    if (this.state === 'intro') this._card(ctx, w, h, SCRIPTURE.title, `${SCRIPTURE.how}`, SCRIPTURE.ref, '點畫面 / 空白鍵　開始分餅')
    else if (this.state === 'win') this._card(ctx, w, h, SCRIPTURE.winHead, `${SCRIPTURE.winBody}\n\n「${SCRIPTURE.winText}」`, SCRIPTURE.winRef, '')
  }

  _person(ctx, x, y, fed, i) {
    const c = ['#b0577a', '#7a5a9c', '#3d8e7a', '#c48a3d', '#5f7ab0'][i % 5]
    ctx.fillStyle = c
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 6, y - 22); ctx.lineTo(x - 6, y - 22); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(x, y - 29, 7, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath(); ctx.arc(x, y - 31.5, 6.5, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(x - 2.4, y - 29.5, 1, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 2.4, y - 29.5, 1, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1
    ctx.beginPath()
    if (fed) ctx.arc(x, y - 27, 2.6, 0.15 * Math.PI, 0.85 * Math.PI)
    else { ctx.moveTo(x - 2, y - 26); ctx.lineTo(x + 2, y - 26) }
    ctx.stroke()
    if (fed) { ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🍞', x + 9, y - 34) }
  }

  _player(ctx, x, y) {
    const bob = (this.moveL || this.moveR) ? Math.abs(Math.sin(this.walk)) * 4 : 0
    const yy = y - bob
    ctx.fillStyle = '#8a6238'
    ctx.beginPath(); ctx.moveTo(x - 12, yy); ctx.lineTo(x + 12, yy); ctx.lineTo(x + 8, yy - 40); ctx.lineTo(x - 8, yy - 40); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(x, yy - 49, 9, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#5a3a1e'
    ctx.beginPath(); ctx.arc(x, yy - 52, 8.5, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(x - 3, yy - 50, 1.2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 3, yy - 50, 1.2, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(x, yy - 46.5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    // 籃子(拿在前手,餅數多畫幾個突起)
    const bx = x + this.dir * 16
    ctx.strokeStyle = '#b9863f'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(bx, yy - 22, 9, 0, Math.PI, false); ctx.stroke()
    ctx.fillStyle = '#e8c48a'
    const lumps = Math.min(5, 2 + Math.floor(this.bread / 4))
    for (let i = 0; i < lumps; i++) {
      ctx.beginPath(); ctx.arc(bx - 6 + i * 3, yy - 24, 2.6, 0, Math.PI * 2); ctx.fill()
    }
    ctx.strokeStyle = '#e8b88a'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x + this.dir * 5, yy - 34); ctx.lineTo(bx, yy - 26); ctx.stroke()
  }

  _card(ctx, w, h, kicker, body, ref, cont) {
    ctx.fillStyle = 'rgba(20,26,18,0.6)'
    ctx.fillRect(0, 0, w, h)
    const cw = Math.min(w * 0.88, 560)
    const ch = Math.min(h * 0.78, 420)
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
    ctx.fillText(`— ${ref}`, w / 2, cy + ch - 52)
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
