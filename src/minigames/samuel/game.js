// 撒母耳聽呼喚(撒母耳記上 3)——系列第一個「記憶序列(Simon 型)」關。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:撒上 3:4-5、3:9、3:10、3:19),牧者已審核通過(2026-07-06),大廳卡已點亮。
//
// 玩法:夜裡的會幕,「神的燈還沒有熄滅」——四盞油燈依序亮起、各有音色;
//   注意聽、注意看,然後照同樣的順序把燈點回來(=「聽了,還要記住、回應」)。
//   一輪比一輪長;前幾輪像撒母耳三次跑到以利那裡;最後一輪,學會回應:「請說,僕人敬聽!」
// ★ 神學守法:永不會輸——聽錯了,燈搖一搖、「再聽一次」重播,不扣命(以利說:你仍去睡罷;神必再呼喚)。
//   主題是「聽與順服」:聽見 → 記住 → 回應,不是比反應快。
// 年齡三檔:幼(3 輪)/童(4 輪)/青(5 輪+播放更快)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;撒上 3:10 已烤進 manifest,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '三次呼喚', rounds: 3, startLen: 2, speed: 0.62 },
  kid: { label: '🙂 童', desc: '四次呼喚', rounds: 4, startLen: 2, speed: 0.52 },
  teen: { label: '🔥 青', desc: '五次呼喚・更快・最後純聽', rounds: 5, startLen: 3, speed: 0.38, soundOnly: true },
}
// 四盞燈:位置(相對)+ 音高 + 燈焰色
const LAMPS = [
  { x: 0.2, y: 0.38, tone: 392, hue: '#ffca66' },
  { x: 0.4, y: 0.3, tone: 494, hue: '#ffb066' },
  { x: 0.6, y: 0.3, tone: 587, hue: '#ffd98a' },
  { x: 0.8, y: 0.38, tone: 698, hue: '#ffe9a8' },
]

const T = {
  title: '🕯️ 撒母耳聽呼喚',
  ref: '撒母耳記上 3',
  intro1: '夜裡,神的燈還沒有熄滅——童子撒母耳睡在耶和華的殿中。',
  how: '注意看、注意聽:油燈會依序亮起。然後照同樣的順序點回來。一輪比一輪長;聽錯了沒關係,再聽一次。',
  pick: '今夜,你是小撒母耳。選一條路:',
  watch: '👂 注意聽…',
  repeat: '換你了!照順序點燈',
  again: '沒關係——再聽一次(以利說:你仍去睡罷)',
  story1: {
    head: '第一次呼喚',
    line: '耶和華呼喚撒母耳。撒母耳說:我在這裡!就跑到以利那裡,說:你呼喚我?我在這裡。以利回答說:我沒有呼喚你,你去睡罷。',
    ref: '撒上 3:4-5',
    hint: '撒母耳還不認識耶和華的聲音——再聽下一輪。',
  },
  story2: {
    head: '以利明白了',
    line: '你仍去睡罷;若再呼喚你,你就說:耶和華啊,請說,僕人敬聽!',
    ref: '撒上 3:9',
    hint: '最後一次呼喚要來了——這次,學撒母耳回應。',
    hintDark: '最後一次呼喚要來了——夜更深,看不見燈了。單單用「聽」的,每盞燈的聲音都不一樣。',
  },
  winVerse: '耶和華又來站著,像前三次呼喚說:撒母耳啊!撒母耳啊!撒母耳回答說:請說,僕人敬聽!',
  winRef: '撒母耳記上 3:10',
  teachVerse: '撒母耳長大了,耶和華與他同在,使他所說的話一句都不落空。',
  teachRef: '撒母耳記上 3:19',
  teach: '聽神的話,不只是聽見——是記住、回應、照著行。小撒母耳學會了說「請說,僕人敬聽」,神就一生與他同在。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → watch → repeat → story → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKey = (e) => this._key(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.round = 1
    this.seq = []
    this.playIdx = -1 // 播放到第幾個(watch 狀態)
    this.inputIdx = 0
    this.flash = new Map() // lampIdx → 亮到幾秒
    this.shake = 0
    this.story = null
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
    this.round = 1
    this._newRound()
  }

  _newRound() {
    const len = this.cfg.startLen + this.round - 1
    this.seq = Array.from({ length: len }, () => Math.floor(Math.random() * LAMPS.length))
    this._playSeq()
  }

  _playSeq() {
    this.state = 'watch'
    this.playIdx = -1
    this.inputIdx = 0
    this._playT = this._t + 0.9 // 開播前小停頓
  }

  _update() {
    if (this.state === 'watch') {
      const step = this.cfg.speed
      const i = Math.floor((this._t - this._playT) / step)
      if (i > this.playIdx && i < this.seq.length) {
        this.playIdx = i
        const lamp = this.seq[i]
        // 青年檔最後一輪「純聽」:夜裡的呼喚是用聽的——不亮燈,只有各燈不同的音高(撒上 3:10 前的最後考驗)
        const dark = this.cfg.soundOnly && this.round === this.cfg.rounds
        if (!dark) this.flash.set(lamp, this._t + step * 0.6)
        this._tone(LAMPS[lamp].tone, step * 0.5)
      }
      if (i >= this.seq.length) this.state = 'repeat'
    }
    if (this.shake > 0) this.shake -= 0.04
  }

  _pressLamp(idx) {
    if (this.state !== 'repeat') return
    this.flash.set(idx, this._t + 0.28)
    if (idx === this.seq[this.inputIdx]) {
      this._tone(LAMPS[idx].tone, 0.22)
      this.inputIdx++
      if (this.inputIdx >= this.seq.length) this._roundDone()
    } else {
      // 聽錯了:溫柔重聽同一輪(不扣命、不會輸)
      this._tone(150, 0.25)
      this.shake = 1
      setTimeout(() => { if (!this.stopped) this._playSeq() }, 750)
    }
  }

  _roundDone() {
    this._tone(784, 0.15); this._tone(988, 0.2)
    if (this.round >= this.cfg.rounds) return this._win()
    // 故事節拍:第一輪後=3:4-5;倒數第二輪後=3:9;其餘小提示
    if (this.round === 1) this.story = T.story1
    else if (this.round === this.cfg.rounds - 1) this.story = T.story2
    else this.story = { head: `第${'一二三四五'[this.round] || this.round}次呼喚`, line: '撒母耳又跑到以利那裡——還不是以利在叫他。', ref: '參 撒上 3:6-8', hint: '再聽下一輪,一次比一次長。' }
    this.state = 'story'
  }

  _nextRound() {
    this.round++
    this.story = null
    this._newRound()
  }

  _win() {
    this.state = 'win'
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'samuel' }) }, 900)
  }

  // ── 輸入 ──
  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state === 'story' && (e.key === ' ' || e.key === 'Enter')) return this._nextRound()
    const n = { 1: 0, 2: 1, 3: 2, 4: 3 }[e.key]
    if (n != null) this._pressLamp(n)
  }
  _up(e) {
    const r = this.cv.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * this.W
    const y = ((e.clientY - r.top) / r.height) * this.H
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state === 'story') return this._nextRound()
    if (this.state !== 'repeat') return
    // 點到哪盞燈
    let best = -1, bd = 1e9
    LAMPS.forEach((L, i) => {
      const lx = L.x * this.W, ly = L.y * this.H
      const d = Math.hypot(x - lx, y - ly)
      if (d < bd) { bd = d; best = i }
    })
    if (best >= 0 && bd < Math.min(this.W, this.H) * 0.18) this._pressLamp(best)
  }

  _tone(freq, dur) {
    try {
      if (!this._audio) this._audio = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._audio
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
      o.connect(g).connect(ctx.destination)
      o.start(); o.stop(ctx.currentTime + dur + 0.02)
    } catch {}
  }

  _resize() {
    const r = this.cv.getBoundingClientRect()
    const s = Math.min(devicePixelRatio || 1, 2)
    this.cv.width = Math.round(r.width * s)
    this.cv.height = Math.round(r.height * s)
    this.W = this.cv.width; this.H = this.cv.height
  }

  // ── 畫面 ──
  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 夜裡的會幕:深藍夜 + 幔子微光(約櫃方向)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#141a33'); sky.addColorStop(1, '#241d2e')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W / 2, H * 0.14, 0, W / 2, H * 0.14, W * 0.3)
    glow.addColorStop(0, 'rgba(255,230,170,0.14)'); glow.addColorStop(1, 'rgba(255,230,170,0)')
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
    // 幔子
    ctx.fillStyle = '#3a2c4e'
    ctx.fillRect(W * 0.3, 0, W * 0.4, H * 0.16)
    for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(W * 0.3 + i * W * 0.05, 0, W * 0.012, H * 0.16) }

    if (this.state === 'intro') return this._drawIntro()

    const sx = this.shake > 0 ? Math.sin(this._t * 40) * this.shake * 6 : 0
    ctx.save(); ctx.translate(sx, 0)

    // 四盞油燈(柱座+油碗+火焰;序列亮=火焰旺+光暈)
    LAMPS.forEach((L, i) => {
      const x = L.x * W, y = L.y * H
      const lit = (this.flash.get(i) || 0) > this._t
      const r = Math.min(W, H) * 0.05
      if (lit) {
        const halo = ctx.createRadialGradient(x, y - r, 0, x, y - r, r * 4)
        halo.addColorStop(0, L.hue + 'cc'); halo.addColorStop(1, L.hue + '00')
        ctx.fillStyle = halo; ctx.fillRect(x - r * 4, y - r * 5, r * 8, r * 8)
      }
      ctx.strokeStyle = '#8a6a33'; ctx.lineWidth = r * 0.22
      ctx.beginPath(); ctx.moveTo(x, y + r * 2.1); ctx.lineTo(x, y + r * 0.4); ctx.stroke() // 柱
      ctx.fillStyle = '#a8834a'
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.4, r * 0.9, r * 0.34, 0, 0, 7); ctx.fill() // 油碗
      // 火焰
      const fh = lit ? r * 1.5 : r * 0.7
      const fl = ctx.createLinearGradient(x, y + r * 0.2 - fh, x, y + r * 0.2)
      fl.addColorStop(0, lit ? '#fff3c8' : '#f0b23e'); fl.addColorStop(1, '#c96a1e')
      ctx.fillStyle = fl
      ctx.beginPath()
      ctx.moveTo(x, y + r * 0.2 - fh)
      ctx.quadraticCurveTo(x + r * 0.42, y - r * 0.1, x, y + r * 0.25)
      ctx.quadraticCurveTo(x - r * 0.42, y - r * 0.1, x, y + r * 0.2 - fh)
      ctx.fill()
      // 鍵盤提示(1-4)
      ctx.fillStyle = 'rgba(255,240,200,0.55)'
      ctx.font = `${Math.max(10, r * 0.5)}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), x, y + r * 2.7)
    })

    // 小撒母耳(睡席上坐起,有臉;repeat 時舉手回應)
    const cx = W / 2, cy = H * 0.72, r = Math.min(W, H) * 0.09
    ctx.fillStyle = '#5a4632'
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.9, r * 1.7, r * 0.4, 0, 0, 7); ctx.fill() // 睡席
    ctx.fillStyle = '#b06a3a'
    rounded2(ctx, cx - r * 0.55, cy - r * 0.5, r * 1.1, r * 1.2, r * 0.3); ctx.fill() // 袍
    ctx.fillStyle = '#e8b98a'
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.85, r * 0.4, 0, 7); ctx.fill() // 頭
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath(); ctx.arc(cx, cy - r * 1.05, r * 0.36, Math.PI, 0); ctx.fill() // 髮
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(cx - r * 0.13, cy - r * 0.88, r * 0.07, 0, 7); ctx.arc(cx + r * 0.13, cy - r * 0.88, r * 0.07, 0, 7); ctx.fill()
    ctx.fillStyle = '#222'
    ctx.beginPath(); ctx.arc(cx - r * 0.12, cy - r * 0.88, r * 0.035, 0, 7); ctx.arc(cx + r * 0.14, cy - r * 0.88, r * 0.035, 0, 7); ctx.fill()
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = Math.max(1.2, r * 0.06)
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.75, r * 0.14, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke() // 微笑
    if (this.state === 'repeat') { // 舉手回應
      ctx.strokeStyle = '#e8b98a'; ctx.lineWidth = r * 0.18
      ctx.beginPath(); ctx.moveTo(cx + r * 0.5, cy - r * 0.2); ctx.lineTo(cx + r * 0.95, cy - r * 0.9); ctx.stroke()
    }

    ctx.restore()

    // HUD:輪數 + 指示
    ctx.fillStyle = 'rgba(10,10,24,0.6)'
    rounded2(ctx, W * 0.08, H * 0.02, W * 0.84, H * 0.062, 12); ctx.fill()
    ctx.fillStyle = '#ffe9b0'
    ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    const hud = this.state === 'watch' ? T.watch : this.state === 'repeat' ? `${T.repeat}(${this.inputIdx}/${this.seq.length})` : ''
    ctx.fillText(`第 ${this.round}/${this.cfg.rounds} 次呼喚 ・ ${hud}`, W / 2, H * 0.062)
    if (this.shake > 0.5) {
      ctx.fillStyle = '#ffb0a0'
      ctx.fillText(T.again, W / 2, H * 0.12)
    }

    if (this.state === 'story') this._drawStory()
    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card2(ctx, W * 0.08, H * 0.08, W * 0.84, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(22, H * 0.075)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.21)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(13, H * 0.034)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 聽與順服', W / 2, H * 0.29)
    ctx.fillStyle = '#4a3a20'
    wrap2(ctx, T.intro1, W / 2, H * 0.38, W * 0.72, H * 0.048)
    wrap2(ctx, T.how, W / 2, H * 0.5, W * 0.72, H * 0.048)
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.pick, W / 2, H * 0.67)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.71
      ctx.fillStyle = '#f0b23e'
      rounded2(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawStory() {
    const { ctx, W, H } = this
    const s = this.story
    card2(ctx, W * 0.12, H * 0.22, W * 0.76, H * 0.56)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(17, H * 0.05)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`✨ ${s.head}(${s.ref})`, W / 2, H * 0.33)
    ctx.fillStyle = '#4a3a20'
    wrap2(ctx, `「${s.line}」`, W / 2, H * 0.41, W * 0.62, H * 0.048)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(12, H * 0.032)}px "Noto Sans TC",sans-serif`
    const useDark = this.cfg && this.cfg.soundOnly && this.round === this.cfg.rounds - 1 && s.hintDark
    ctx.fillText(useDark ? s.hintDark : s.hint, W / 2, H * 0.66)
    ctx.fillText('點畫面 / 按空白鍵 → 繼續', W / 2, H * 0.72)
  }

  _drawWin() {
    const { ctx, W, H } = this
    card2(ctx, W * 0.1, H * 0.1, W * 0.8, H * 0.8)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 請說,僕人敬聽!', W / 2, H * 0.23)
    ctx.fillStyle = '#4a3a20'
    wrap2(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.31, W * 0.68, H * 0.048)
    ctx.fillStyle = '#7a5222'
    wrap2(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.55, W * 0.68, H * 0.045)
    ctx.fillStyle = '#4a3a20'
    wrap2(ctx, T.teach, W / 2, H * 0.7, W * 0.68, H * 0.045)
  }
}

function rounded2(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card2(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,251,238,0.96)'
  ctx.strokeStyle = '#c8a35a'
  ctx.lineWidth = 3
  rounded2(ctx, x, y, w, h, 18)
  ctx.fill(); ctx.stroke()
}
function wrap2(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
