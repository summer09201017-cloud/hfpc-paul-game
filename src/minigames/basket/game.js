// 摩西的籃子(出 2:1-10)——系列第一個「縱向捲軸漂流閃避」關(新類型⑨,雷電骨架反向化:只躲不打)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:出 2:3-4、2:10;詩 121:4),牧者審核通過前不進大廳卡。
//
// 玩法:蒲草箱順尼羅河漂流(畫面由上往下捲),左右移動閃開蘆葦叢、漩渦、鱷魚;
//   姊姊米利暗在岸上遠遠跟著(出 2:4)。碰到障礙=籃子被輕輕推開、晃一下(嬰孩永遠平安,
//   漂流稍慢一點而已);漂到法老女兒沐浴處=被拉出水面,過關!
// ★ 神學守法:玩家沒有任何攻擊——雷電的「開火」整個拿掉,只留捲軸+閃避;鱷魚畫可愛不猙獰,
//   碰到只是推開不傷人;永不會輸(路只有快慢)。信息:神保護嬰孩摩西(詩 121:4 也不打盹也不睡覺)。
// 年齡三檔:幼(河寬・障礙少慢)/童(標準)/青(河窄・快・鱷魚會橫游)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;出 2:10 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '河面寬・慢慢漂', dist: 90, speed: 0.09, spawnEvery: 2.6, riverW: 0.62, croc: false },
  kid: { label: '🙂 童', desc: '標準', dist: 120, speed: 0.12, spawnEvery: 2.0, riverW: 0.52, croc: true },
  teen: { label: '🔥 青', desc: '河窄・鱷魚橫游', dist: 150, speed: 0.15, spawnEvery: 1.5, riverW: 0.42, croc: true },
}

const T = {
  title: '🧺 摩西的籃子',
  ref: '出埃及記 2:1-10',
  intro1: '「就取了一個蒲草箱,抹上石漆和石油,將孩子放在裡頭,把箱子擱在河邊的蘆荻中。孩子的姊姊遠遠站著,要知道他究竟怎麼樣。」(出 2:3-4)',
  how: '蒲草箱順著尼羅河漂流。用 ←→(或手指左右拖)移開蘆葦、漩渦和鱷魚——別怕,碰到只會被輕輕推開,神保護著小摩西。一路漂到法老女兒沐浴的地方!',
  pick: '河水緩緩流。選一段河:',
  hud: (pct) => `🧺 順流而下 ${pct}%`,
  bump: { reed: '沙沙…擦過蘆葦叢', whirl: '打了個轉…', croc: '鱷魚游過,籃子被推開了' },
  miriam: '姊姊米利暗遠遠看顧著…',
  winVerse: '他給孩子起名叫摩西,意思說:因我把他從水裡拉出來。',
  winRef: '出埃及記 2:10',
  teachVerse: '保護以色列的,也不打盹也不睡覺。',
  teachRef: '詩篇 121:4',
  teach: '一個小小的蒲草箱,漂在大大的河上——看起來好危險,但神的眼目一直看顧。法老的女兒把他拉出水面,起名摩西。你也是這樣被神看顧的。',
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
    this._keys = {}
    this._onKeyDown = (e) => { this._keys[e.key] = true; this._key(e) }
    this._onKeyUp = (e) => { this._keys[e.key] = false }
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = () => { this._touchX = null }
    this._onResize = () => this._resize()
    this.progress = 0
    this.bx = 0.5 // 籃子在河道內的相對位置 0-1
    this.bumpT = 0 // 被推開後的短暫緩流
    this.obs = [] // {kind:'reed'|'whirl'|'croc', lane(0-1), y(0 上方→1 籃子), vx(croc 橫游)}
    this.toasts = []
    this.spawnT = 0
    this.miriamT = 8
    this._touchX = null
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKeyDown)
    addEventListener('keyup', this._onKeyUp)
    this.cv.addEventListener('pointerdown', this._onDown)
    addEventListener('pointermove', this._onMove)
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
    removeEventListener('pointermove', this._onMove)
    removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.progress = 0
    this.bx = 0.5
    this.bumpT = 0
    this.obs = []
    this.toasts = []
    this.spawnT = 2
    this.miriamT = 6
    this.state = 'play'
  }

  _update(dt) {
    if (this.state !== 'play') return
    // 左右移動(鍵盤/觸控)
    const mv = (this._keys.ArrowLeft || this._keys.a ? -1 : 0) + (this._keys.ArrowRight || this._keys.d ? 1 : 0)
    this.bx = Math.max(0.06, Math.min(0.94, this.bx + mv * dt * 1.1))
    if (this._touchX != null) {
      const g = this._layout()
      const target = Math.max(0.06, Math.min(0.94, (this._touchX - g.riverL) / g.riverWpx))
      this.bx += (target - this.bx) * Math.min(1, dt * 8)
    }
    // 漂流(被推開後短暫緩流)
    if (this.bumpT > 0) this.bumpT -= dt
    this.progress = Math.min(this.cfg.dist, this.progress + dt * (this.bumpT > 0 ? 2.2 : 6) * (this.cfg.speed / 0.12))
    // 出障礙
    this.spawnT -= dt
    if (this.spawnT <= 0) {
      this.spawnT = this.cfg.spawnEvery * (0.75 + Math.random() * 0.5)
      const kinds = ['reed', 'whirl']
      if (this.cfg.croc) kinds.push('croc')
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      const lane = 0.1 + Math.random() * 0.8
      this.obs.push({ kind, lane, y: -0.08, vx: kind === 'croc' ? (Math.random() < 0.5 ? -0.1 : 0.1) : 0 })
    }
    // 障礙移動+碰撞(碰到=輕推+緩流,嬰孩平安)
    for (const o of this.obs) {
      o.y += dt * this.cfg.speed * 3.2
      if (o.vx) {
        o.lane += o.vx * dt
        if (o.lane < 0.08 || o.lane > 0.92) o.vx = -o.vx
      }
      if (!o.hit && Math.abs(o.y - 0.82) < 0.045 && Math.abs(o.lane - this.bx) < 0.09) {
        o.hit = true
        this.bumpT = 1.2
        this.bx = Math.max(0.06, Math.min(0.94, this.bx + (this.bx > o.lane ? 0.1 : -0.1)))
        this._tone(220, 0.18)
        this.toasts.push({ text: T.bump[o.kind], t: this._t })
      }
    }
    this.obs = this.obs.filter((o) => o.y < 1.15)
    // 米利暗看顧提示(氛圍,不定時)
    this.miriamT -= dt
    if (this.miriamT <= 0) {
      this.miriamT = 9 + Math.random() * 5
      this.toasts.push({ text: T.miriam, t: this._t })
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
    if (this.progress >= this.cfg.dist) this._win()
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25, 0.15)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'basket' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
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
    if (this.state === 'play') this._touchX = x
  }
  _movePt(e) {
    if (this._touchX == null || this.state !== 'play') return
    this._touchX = this._pt(e).x
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
    const { W } = this
    const riverWpx = W * this.cfg.riverW
    const riverL = (W - riverWpx) / 2
    return { riverL, riverWpx, riverR: riverL + riverWpx }
  }
  _laneX(lane, g) { return g.riverL + lane * g.riverWpx }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    if (this.state === 'intro') {
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#cfe6dc'); sky.addColorStop(1, '#a8c8a0')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
      return this._drawIntro()
    }
    const g = this._layout()
    const scroll = this._t * this.cfg.speed * H * 3.2
    // 兩岸(沙地+蘆荻)
    ctx.fillStyle = '#d8c890'; ctx.fillRect(0, 0, g.riverL, H)
    ctx.fillStyle = '#d0be82'; ctx.fillRect(g.riverR, 0, W - g.riverR, H)
    // 河水(緩動波紋)
    const water = ctx.createLinearGradient(0, 0, 0, H)
    water.addColorStop(0, '#6aa8c8'); water.addColorStop(1, '#4a88ac')
    ctx.fillStyle = water; ctx.fillRect(g.riverL, 0, g.riverWpx, H)
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2
    for (let i = 0; i < 7; i++) {
      const yy = ((i * H) / 7 + scroll) % H
      ctx.beginPath(); ctx.moveTo(g.riverL + 8, yy)
      for (let x = g.riverL + 8; x < g.riverR - 8; x += 24) ctx.quadraticCurveTo(x + 12, yy + 5, x + 24, yy)
      ctx.stroke()
    }
    // 岸邊蘆荻(隨捲動)
    ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    for (let i = 0; i < 10; i++) {
      const yy = ((i * H) / 5 + scroll * 0.9) % (H + 40) - 20
      for (const bx of [g.riverL - 12, g.riverR + 12]) {
        ctx.beginPath(); ctx.moveTo(bx, yy + 22); ctx.quadraticCurveTo(bx + 4, yy + 8, bx + 2, yy); ctx.stroke()
      }
    }
    // 米利暗(右岸小人,跟著籃子的高度遠遠站著)
    const mx = g.riverR + (W - g.riverR) * 0.45, my = H * 0.62
    ctx.fillStyle = '#8a5a7a'
    ctx.fillRect(mx - 7, my - 12, 14, 26)
    ctx.fillStyle = '#c9a06a'
    ctx.beginPath(); ctx.arc(mx, my - 20, 8, 0, 7); ctx.fill()
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath(); ctx.arc(mx - 2.5, my - 21, 1.4, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(mx + 2.5, my - 21, 1.4, 0, 7); ctx.fill()
    // 障礙
    for (const o of this.obs) {
      const x = this._laneX(o.lane, g), y = o.y * H
      const k = Math.min(W, H) * 0.035
      if (o.kind === 'reed') { // 蘆葦叢
        ctx.strokeStyle = '#3f7a2f'; ctx.lineWidth = 4; ctx.lineCap = 'round'
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(x + i * k * 0.5, y + k)
          ctx.quadraticCurveTo(x + i * k * 0.7, y - k * 0.4, x + i * k * 0.4, y - k)
          ctx.stroke()
        }
      } else if (o.kind === 'whirl') { // 漩渦
        ctx.strokeStyle = 'rgba(240,250,255,0.7)'; ctx.lineWidth = 3
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath(); ctx.arc(x, y, k * i * 0.4, this._t * 3 + i, this._t * 3 + i + 4.6); ctx.stroke()
        }
      } else { // 鱷魚(可愛版:圓吻+圓眼)
        ctx.fillStyle = '#5a8a4a'
        ctx.beginPath(); ctx.ellipse(x, y, k * 1.5, k * 0.65, 0, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.ellipse(x + Math.sign(o.vx || 1) * k * 1.4, y, k * 0.55, k * 0.35, 0, 0, 7); ctx.fill()
        ctx.fillStyle = '#f4f0e0'
        ctx.beginPath(); ctx.arc(x - k * 0.3, y - k * 0.5, k * 0.24, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(x + k * 0.3, y - k * 0.5, k * 0.24, 0, 7); ctx.fill()
        ctx.fillStyle = '#2a3a1a'
        ctx.beginPath(); ctx.arc(x - k * 0.3, y - k * 0.5, k * 0.1, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(x + k * 0.3, y - k * 0.5, k * 0.1, 0, 7); ctx.fill()
      }
    }
    // 籃子(蒲草箱+襁褓嬰孩,被推開時晃動)
    const bxp = this._laneX(this.bx, g), byp = H * 0.82
    const wob = this.bumpT > 0 ? Math.sin(this._t * 18) * 4 : Math.sin(this._t * 2.4) * 2
    const bk = Math.min(W, H) * 0.045
    ctx.save()
    ctx.translate(bxp, byp + wob * 0.4)
    ctx.rotate(wob * 0.012)
    ctx.fillStyle = '#a9884e'
    r9(ctx, -bk * 1.2, -bk * 0.5, bk * 2.4, bk * 1.0, bk * 0.4); ctx.fill()
    ctx.strokeStyle = '#7a5c2a'; ctx.lineWidth = 2
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-bk * 1.1, i * bk * 0.22); ctx.lineTo(bk * 1.1, i * bk * 0.22); ctx.stroke() }
    // 嬰孩(襁褓+睡臉)
    ctx.fillStyle = '#f4e0c8'
    ctx.beginPath(); ctx.arc(0, -bk * 0.45, bk * 0.42, 0, 7); ctx.fill()
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(-bk * 0.14, -bk * 0.5, bk * 0.07, 0.15, Math.PI - 0.15); ctx.stroke() // 睡眼
    ctx.beginPath(); ctx.arc(bk * 0.14, -bk * 0.5, bk * 0.07, 0.15, Math.PI - 0.15); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, -bk * 0.3, bk * 0.08, 0.3, Math.PI - 0.3); ctx.stroke() // 微笑
    ctx.restore()
    // 神看顧的柔光(籃子上方淡淡一圈)
    const glow = ctx.createRadialGradient(bxp, byp - bk, bk * 0.4, bxp, byp - bk, bk * 3)
    glow.addColorStop(0, 'rgba(255,240,190,0.22)'); glow.addColorStop(1, 'rgba(255,240,190,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(bxp, byp - bk, bk * 3, 0, 7); ctx.fill()
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#1e3040'; ctx.strokeStyle = 'rgba(255,255,245,0.85)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, W / 2, H * 0.3 - k * 22)
      ctx.fillText(t.text, W / 2, H * 0.3 - k * 22)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(20,40,54,0.62)'
    r9(ctx, W * 0.2, H * 0.02, W * 0.6, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#dceaf8'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(Math.floor((this.progress / this.cfg.dist) * 100))} ・ ←→ 移動閃開`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card9(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#28506b'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.16)
    ctx.fillStyle = '#5a7a8e'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 神看顧著', W / 2, H * 0.23)
    ctx.fillStyle = '#2e3a44'
    wrap9(ctx, T.intro1, W / 2, H * 0.31, W * 0.72, H * 0.045)
    wrap9(ctx, T.how, W / 2, H * 0.47, W * 0.72, H * 0.045)
    ctx.fillStyle = '#5a7a8e'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#6ab0c8'
      r9(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#0e2a3a'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    card9(ctx, W * 0.1, H * 0.08, W * 0.8, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#28506b'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 從水裡拉出來!', W / 2, H * 0.2)
    ctx.fillStyle = '#2e3a44'
    wrap9(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.28, W * 0.66, H * 0.046)
    ctx.fillStyle = '#5a6a2a'
    wrap9(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.5, W * 0.66, H * 0.043)
    ctx.fillStyle = '#2e3a44'
    wrap9(ctx, T.teach, W / 2, H * 0.62, W * 0.66, H * 0.043)
  }
}

function r9(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card9(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,251,255,0.96)'
  ctx.strokeStyle = '#6a9ac0'; ctx.lineWidth = 3
  r9(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrap9(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
