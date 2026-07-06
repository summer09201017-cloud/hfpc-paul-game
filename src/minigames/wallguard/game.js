// 尼希米守望(尼希米記 3-6)——系列第一個「塔防(佈置守望)」關(新類型⑤)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:尼 4:9、4:17-20、6:15-16),牧者審核通過前不進大廳卡。
//
// 玩法:城牆分六段,工人自動修造;仇敵一波波來擾亂。你是尼希米——把「吹角的守望者」
//   佈置到牆段上(點牆段放置/收回,人數有限):仇敵靠近有守望者的牆段,角聲一響就懼怕退去;
//   沒人看守的牆段被靠近,工程就暫停倒退。六段全修完(五十二天)=過關。
// ★ 神學守法:守望者不殺敵——角聲=召聚+「我們的神必為我們爭戰」(尼 4:20);仇敵是「懼怕退去」
//   (尼 6:16),不是被打死。永不會輸:工程只有快慢,沒有失敗。禱告與警醒並行(尼 4:9)。
// 與現有 nehemiah(修牆閃避,動作版)是 two-forms:同一故事,靜一點的佈置版 vs 動一點的閃避版。
// 年齡三檔:幼(守望 4 人/敵慢)/童(3 人)/青(3 人+敵快波密)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;尼 6:16 已烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '守望四人・敵少', guards: 4, waveEvery: 7, foeSpeed: 0.055, buildRate: 5.2 },
  kid: { label: '🙂 童', desc: '守望三人', guards: 3, waveEvery: 5.5, foeSpeed: 0.07, buildRate: 4.6 },
  teen: { label: '🔥 青', desc: '守望三人・敵快波密', guards: 3, waveEvery: 4, foeSpeed: 0.095, buildRate: 4.2 },
}
const SEGS = 6 // 牆段數(尼 3:按家族分段修造)

const T = {
  title: '🛡️ 尼希米守望',
  ref: '尼希米記 3-6',
  intro1: '「這工程浩大……你們聽見角聲在哪裡,就聚集到我們那裡去。我們的神必為我們爭戰。」(尼 4:19-20)',
  how: '工人自動修牆;仇敵會來擾亂。點牆段「放置/收回」吹角的守望者——仇敵靠近有守望的牆段,角聲一響就懼怕退去;沒人看守的段,工程會暫停倒退。把六段牆全修完!',
  pick: '重建的工開始了。選一條路:',
  hud: (free) => `🎺 守望者:${'🕴️'.repeat(free)}${free === 0 ? '(全數在崗)' : ' 點牆段佈崗'}`,
  retreat: '仇敵聽見角聲,懼怕退去!',
  stall: '這段沒人看守,工程被擾亂了…',
  winVerse: '我們一切仇敵、四圍的外邦人聽見了便懼怕,愁眉不展;因為見這工作完成是出乎我們的 神。',
  winRef: '尼希米記 6:16',
  teachVerse: '然而,我們禱告我們的 神,又因他們的緣故,就派人看守,晝夜防備。',
  teachRef: '尼希米記 4:9',
  teach: '尼希米沒有叫工人去追打仇敵——他們一手做工、一手拿兵器,吹角、禱告、警醒,把爭戰交給神。五十二天,牆修完了;仇敵自己懼怕了。',
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
    this.segs = [] // {progress(0-100), guard(bool), stallT}
    this.foes = [] // {seg, y(0=遠方→1=牆), state:'come'|'flee', flash}
    this.toasts = []
    this.waveT = 0
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
    this.segs = Array.from({ length: SEGS }, () => ({ progress: 8 + Math.random() * 10, guard: false, stallT: 0 }))
    this.foes = []
    this.toasts = []
    this.waveT = 2.5
    this.state = 'play'
  }

  _freeGuards() { return this.cfg.guards - this.segs.filter((s) => s.guard).length }

  _update(dt) {
    if (this.state !== 'play') return
    // 修牆(被擾亂的段暫停+微倒退)
    for (const s of this.segs) {
      if (s.stallT > 0) { s.stallT -= dt; s.progress = Math.max(0, s.progress - dt * 1.6) }
      else s.progress = Math.min(100, s.progress + dt * this.cfg.buildRate)
    }
    // 出波
    this.waveT -= dt
    if (this.waveT <= 0) {
      this.waveT = this.cfg.waveEvery * (0.8 + Math.random() * 0.4)
      const seg = Math.floor(Math.random() * SEGS)
      this.foes.push({ seg, y: 0, state: 'come' })
    }
    // 敵人行進
    for (const f of this.foes) {
      if (f.state === 'come') {
        f.y += dt * this.cfg.foeSpeed * 10
        const s = this.segs[f.seg]
        if (f.y >= 0.62 && s.guard) { // 進入守望警戒圈:吹角退敵
          f.state = 'flee'
          this._horn()
          this.toasts.push({ text: T.retreat, seg: f.seg, t: this._t })
        } else if (f.y >= 1) { // 到牆:擾亂(不傷人),停留一下自行離開
          f.state = 'flee'
          s.stallT = Math.max(s.stallT, 2.6)
          this._tone(180, 0.25)
          this.toasts.push({ text: T.stall, seg: f.seg, t: this._t })
        }
      } else {
        f.y -= dt * 0.5
      }
    }
    this.foes = this.foes.filter((f) => !(f.state === 'flee' && f.y <= 0))
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
    // 過關
    if (this.segs.every((s) => s.progress >= 100)) this._win()
  }

  _toggleGuard(seg) {
    const s = this.segs[seg]
    if (!s) return
    if (s.guard) { s.guard = false; this._tone(320, 0.1); return }
    if (this._freeGuards() <= 0) { this._tone(150, 0.15); return } // 沒人可派:低音提示
    s.guard = true
    this._tone(620, 0.12)
  }

  _win() {
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'wallguard' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    const n = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }[e.key]
    if (n != null) this._toggleGuard(n)
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
    if (y > g.wallY - g.cell * 1.4) { // 點牆段區
      const seg = Math.floor((x - g.x0) / g.segW)
      if (seg >= 0 && seg < SEGS) this._toggleGuard(seg)
    }
  }

  // 角聲(吹角退敵):兩聲上揚號角
  _horn() {
    this._tone(392, 0.22, 0, 'sawtooth', 0.14)
    this._tone(523, 0.42, 0.2, 'sawtooth', 0.16)
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
    const x0 = W * 0.06, segW = (W * 0.88) / SEGS
    return { x0, segW, wallY: H * 0.74, cell: Math.min(W, H) * 0.06 }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 黃昏的耶路撒冷
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#d98a4a'); sky.addColorStop(0.55, '#e0b070'); sky.addColorStop(1, '#8a6a44')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()

    const g = this._layout()
    // 敵人(遠方黑影,y 0→1 接近牆)
    for (const f of this.foes) {
      const x = g.x0 + (f.seg + 0.5) * g.segW + Math.sin(this._t * 4 + f.seg) * 4
      const y = H * 0.1 + f.y * (g.wallY - H * 0.22)
      const k = (0.4 + f.y * 0.6) * Math.min(W, H) * 0.028
      ctx.fillStyle = f.state === 'flee' ? 'rgba(60,50,66,0.45)' : 'rgba(44,36,52,0.85)'
      ctx.beginPath(); ctx.ellipse(x, y, k, k * 1.5, 0, 0, 7); ctx.fill()
      ctx.fillStyle = 'rgba(30,24,36,0.9)'
      ctx.beginPath(); ctx.arc(x, y - k * 1.5, k * 0.62, 0, 7); ctx.fill()
      if (f.state === 'flee') { // 逃跑的驚嚇線
        ctx.strokeStyle = 'rgba(255,240,200,0.6)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(x - k, y - k * 2.4); ctx.lineTo(x - k * 0.4, y - k * 1.9); ctx.stroke()
      }
    }
    // 牆段
    for (let i = 0; i < SEGS; i++) {
      const s = this.segs[i]
      const x = g.x0 + i * g.segW + 3, w = g.segW - 6
      const hMax = H * 0.3, h = (s.progress / 100) * hMax
      // 地基線
      ctx.fillStyle = '#6a5636'; ctx.fillRect(x, g.wallY, w, H * 0.05)
      // 牆體(石紋)
      ctx.fillStyle = s.stallT > 0 ? '#8a7a5e' : '#b0a080'
      ctx.fillRect(x, g.wallY - h, w, h)
      ctx.strokeStyle = 'rgba(70,58,38,0.5)'; ctx.lineWidth = 2
      for (let yy = g.wallY - h; yy < g.wallY; yy += 14) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke() }
      // 進度字
      ctx.fillStyle = s.progress >= 100 ? '#3c6b2c' : '#5a4318'
      ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(s.progress >= 100 ? '✓ 修完' : `${Math.floor(s.progress)}%`, x + w / 2, g.wallY + H * 0.035)
      // 工人(小點,修造中晃動)
      if (s.progress < 100 && s.stallT <= 0) {
        ctx.fillStyle = '#8a5a2a'
        ctx.beginPath(); ctx.arc(x + w * 0.3 + Math.sin(this._t * 6 + i) * 3, g.wallY - h - 6, 5, 0, 7); ctx.fill()
      }
      // 守望者(有=站牆上吹角剪影+警戒圈)
      if (s.guard) {
        const gx = x + w * 0.72, gy = g.wallY - h - 8
        ctx.fillStyle = '#4a3208'
        ctx.beginPath(); ctx.arc(gx, gy - 12, 6, 0, 7); ctx.fill() // 頭
        ctx.fillRect(gx - 4, gy - 8, 8, 14) // 身
        ctx.strokeStyle = '#c9a63a'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(gx + 4, gy - 12); ctx.lineTo(gx + 14, gy - 18); ctx.stroke() // 角
        ctx.strokeStyle = 'rgba(240,178,62,0.3)'
        ctx.beginPath(); ctx.arc(x + w / 2, g.wallY - h, g.segW * 0.62, Math.PI, 0); ctx.stroke() // 警戒圈
      } else if (s.progress < 100) {
        ctx.fillStyle = 'rgba(74,50,8,0.35)'
        ctx.font = `${Math.max(11, H * 0.024)}px "Noto Sans TC",sans-serif`
        ctx.fillText('點我佈崗', x + w / 2, g.wallY - h - 10)
      }
      // 鍵盤提示
      ctx.fillStyle = 'rgba(74,50,8,0.5)'
      ctx.font = `${Math.max(10, H * 0.02)}px sans-serif`
      ctx.fillText(String(i + 1), x + w / 2, g.wallY + H * 0.048 + 12)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = 'rgba(60,40,10,0.6)'; ctx.lineWidth = 3
      ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      const tx = g.x0 + (t.seg + 0.5) * g.segW, ty = H * 0.5 - k * 26
      ctx.strokeText(t.text, tx, ty); ctx.fillText(t.text, tx, ty)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(40,26,8,0.6)'
    r4(ctx, W * 0.08, H * 0.02, W * 0.84, H * 0.06, 12); ctx.fill()
    ctx.fillStyle = '#ffe9b0'
    ctx.font = `bold ${Math.max(13, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    const done = this.segs.filter((s) => s.progress >= 100).length
    ctx.fillText(`${T.hud(this._freeGuards())} ・ 牆段 ${done}/${SEGS}`, W / 2, H * 0.06)

    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card4(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.18)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 禱告與警醒', W / 2, H * 0.25)
    ctx.fillStyle = '#4a3a20'
    wrap4(ctx, T.intro1, W / 2, H * 0.33, W * 0.72, H * 0.046)
    wrap4(ctx, T.how, W / 2, H * 0.46, W * 0.72, H * 0.046)
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#f0b23e'
      r4(ctx, x, y, bw, bh, 14); ctx.fill()
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
    card4(ctx, W * 0.1, H * 0.08, W * 0.8, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.058)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 五十二天,牆修完了!', W / 2, H * 0.2)
    ctx.fillStyle = '#4a3a20'
    wrap4(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.28, W * 0.66, H * 0.046)
    ctx.fillStyle = '#7a5222'
    wrap4(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.52, W * 0.66, H * 0.043)
    ctx.fillStyle = '#4a3a20'
    wrap4(ctx, T.teach, W / 2, H * 0.66, W * 0.66, H * 0.043)
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
