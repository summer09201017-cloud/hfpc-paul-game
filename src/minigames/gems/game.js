// 大祭司胸牌・寶石歸位(出 28:17-21,29)——系列第一個「歸位配對」關(新類型⑮,精確歸位型)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:出 28:17-21、28:29),牧者審核通過前不進大廳卡。
//
// 玩法:胸牌上要鑲寶石四行(出 28:17)。點下方托盤裡的寶石,再點胸牌上它的位置——
//   放對=鑲進金槽發光;放錯=溫柔搖一搖,再想想。十二塊都歸位,胸牌就完成了——
//   「刻著以色列兒子名字的,帶在胸前」!
// ★ 神學守法:①放錯不扣分不懲罰(搖一搖+提示),永不會輸;②石名與四行排序**完全照和合本**
//   (出 28:17-20:紅寶石/紅璧璽/紅玉;綠寶石/藍寶石/金鋼石;紫瑪瑙/白瑪瑙/紫晶;水蒼玉/紅瑪瑙/碧玉);
//   ③支派名照生來次序(出 28:10「照他們生來的次序」);④結尾必是 28:29——名字帶在胸前,
//   在耶和華面前常作紀念(預表大祭司基督把屬祂的人帶在心上)。
// 年齡三檔:幼(前兩行 6 塊・槽位有顏色提示)/童(12 塊・槽位標石名)/青(12 塊・槽位只標支派,對照經文卡放)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;出 28:29 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

// 十二塊寶石:四行排序完全照出 28:17-20;支派照生來次序(出 28:10)
const STONES = [
  { name: '紅寶石', tribe: '流便', c: '#c23a4a' },
  { name: '紅璧璽', tribe: '西緬', c: '#d0703a' },
  { name: '紅玉', tribe: '利未', c: '#b03068' },
  { name: '綠寶石', tribe: '猶大', c: '#3a9a5a' },
  { name: '藍寶石', tribe: '但', c: '#3a5ac0' },
  { name: '金鋼石', tribe: '拿弗他利', c: '#dfe6ee' },
  { name: '紫瑪瑙', tribe: '迦得', c: '#7a4a9a' },
  { name: '白瑪瑙', tribe: '亞設', c: '#e8e0cc' },
  { name: '紫晶', tribe: '以薩迦', c: '#9a5ace' },
  { name: '水蒼玉', tribe: '西布倫', c: '#4ab0ac' },
  { name: '紅瑪瑙', tribe: '約瑟', c: '#c05a32' },
  { name: '碧玉', tribe: '便雅憫', c: '#3a7a68' },
]

const AGES = {
  young: { label: '🐣 幼', desc: '6 塊・看顏色放', count: 6, hint: 'color' },
  kid: { label: '🙂 童', desc: '12 塊・槽位標石名', count: 12, hint: 'name' },
  teen: { label: '🔥 青', desc: '12 塊・對照經文放', count: 12, hint: 'scroll' },
}

const VW = 960
const VH = 540

const T = {
  title: '💎 大祭司胸牌・寶石歸位',
  ref: '出埃及記 28:17-21',
  intro1: '「要在上面鑲寶石四行：第一行是紅寶石、紅璧璽、紅玉；第二行是綠寶石、藍寶石、金鋼石……」(出 28:17-18)',
  how: '大祭司的胸牌要鑲十二塊寶石,每塊刻著一個支派的名字。點下面的寶石,再點胸牌上它的位置——放對就鑲進金槽!放錯也沒關係,再想想。青檔要自己對照經文卡放。',
  pick: '金槽已經備好。選一種鑲法:',
  hud: (n, total) => `💎 已鑲 ${n}/${total} 塊`,
  wrong: '再想想——對照看看它是哪一塊',
  placed: (s, tr) => `${s},刻著「${tr}」——鑲進金槽!`,
  closeLine: '刻著以色列兒子名字的，帶在胸前。(出 28:29)',
  winTitle: '🎉 十二塊寶石都歸位了!',
  winVerse: '亞倫進聖所的時候，要將決斷胸牌，就是刻著以色列兒子名字的，帶在胸前，在耶和華面前常作紀念。',
  winRef: '出埃及記 28:29',
  teachVerse: '這些寶石都要按著以色列十二個兒子的名字，彷彿刻圖書，刻十二個支派的名字。',
  teachRef: '出埃及記 28:21',
  teach: '大祭司每次進聖所,胸前都帶著十二個名字——神的百姓,一個都不少地被帶到神面前。這正預表我們的大祭司耶穌:祂把屬祂的人刻在心上,在父面前常作紀念。胸牌上有名字的,何等安穩。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → place → close → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onResize = () => this._resize()
    this.slots = [] // {idx, placed}
    this.tray = [] // 待放寶石 idx(洗亂)
    this.sel = -1 // 選中的 tray 位置
    this.shake = null // {slot, t} 放錯搖動
    this.sparks = [] // 鑲對的火花
    this.closeT = 0
    this.toasts = []
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKeyDown)
    this.cv.addEventListener('pointerdown', this._onDown)
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
    this.cv.removeEventListener('pointerdown', this._onDown)
    removeEventListener('resize', this._onResize)
    stopSpeech()
    try { this._audio && this._audio.close() } catch {}
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.slots = Array.from({ length: this.cfg.count }, (_, i) => ({ idx: i, placed: false }))
    this.tray = [...Array(this.cfg.count).keys()]
    for (let i = this.tray.length - 1; i > 0; i--) { // 洗亂托盤
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.tray[i], this.tray[j]] = [this.tray[j], this.tray[i]]
    }
    this.sel = -1
    this.shake = null
    this.sparks = []
    this.toasts = []
    this.state = 'place'
  }

  _update(dt) {
    if (this.state === 'close') {
      this.closeT -= dt
      if (this.closeT <= 0) this._win()
    }
    if (this.shake) { this.shake.t -= dt; if (this.shake.t <= 0) this.shake = null }
    for (const sp of this.sparks) sp.t -= dt
    this.sparks = this.sparks.filter((sp) => sp.t > 0)
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'gems' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
    }
  }

  // 版面:胸牌置中偏左(青檔右側讓給經文卡),托盤在下
  _layout() {
    const bx = this.cfg.hint === 'scroll' ? VW * 0.33 : VW * 0.5
    const cw = 86, ch = 74
    const rows = Math.ceil(this.cfg.count / 3)
    return { bx, by: 96, cw, ch, rows }
  }
  _slotXY(i, g) {
    const r = Math.floor(i / 3), c = i % 3
    return { x: g.bx + (c - 1) * g.cw, y: g.by + r * g.ch }
  }
  _trayXY(pos) {
    const n = this.tray.length
    const cols = Math.min(n, 8)
    const x0 = VW / 2 - ((Math.min(n, cols) - 1) * 66) / 2
    return { x: x0 + (pos % cols) * 66, y: VH - 92 + Math.floor(pos / cols) * 58 }
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * this.W
    const py = ((e.clientY - r.top) / r.height) * this.H
    const { s, ox, oy } = this._view()
    return { x: (px - ox) / s, y: (py - oy) / s }
  }

  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state !== 'place') return
    // 點托盤選寶石
    for (let p = 0; p < this.tray.length; p++) {
      const t = this._trayXY(p)
      if (Math.hypot(x - t.x, y - t.y) < 30) {
        this.sel = this.sel === p ? -1 : p
        this._tone(480, 0.05, 0, 'sine', 0.06)
        return
      }
    }
    // 點槽位放置
    if (this.sel < 0) return
    const g = this._layout()
    for (const s of this.slots) {
      if (s.placed) continue
      const p = this._slotXY(s.idx, g)
      if (Math.abs(x - p.x) < g.cw / 2 - 4 && Math.abs(y - p.y) < g.ch / 2 - 4) {
        const gemIdx = this.tray[this.sel]
        if (gemIdx === s.idx) {
          s.placed = true
          this.tray.splice(this.sel, 1)
          this.sel = -1
          const st = STONES[gemIdx]
          this.toasts.push({ text: T.placed(st.name, st.tribe), t: this._t })
          for (let i = 0; i < 8; i++) this.sparks.push({ x: p.x, y: p.y, a: (i / 8) * 6.28, t: 0.5 })
          this._tone(659, 0.1, 0, 'triangle', 0.11); this._tone(880, 0.16, 0.08, 'triangle', 0.1)
          if (this.slots.every((k) => k.placed)) {
            this.state = 'close'
            this.closeT = 2.4
            this._tone(392, 0.2, 0.2, 'triangle', 0.1); this._tone(523, 0.3, 0.36, 'triangle', 0.1)
          }
        } else {
          this.shake = { slot: s.idx, t: 0.5 }
          this.toasts.push({ text: T.wrong, t: this._t })
          this._tone(220, 0.15, 0, 'sine', 0.08)
        }
        return
      }
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

  _view() {
    const s = Math.min(this.W / VW, this.H / VH)
    return { s, ox: (this.W - VW * s) / 2, oy: (this.H - VH * s) / 2 }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 聖所帷幕色
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#3a3050'); bg.addColorStop(0.6, '#4a3a58'); bg.addColorStop(1, '#5a4450')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    const g = this._layout()
    // 胸牌底(金邊織物)
    const bpW = g.cw * 3 + 34, bpH = g.ch * g.rows + 34
    ctx.fillStyle = '#28406a'
    rG2(ctx, g.bx - bpW / 2, g.by - g.ch / 2 - 17, bpW, bpH, 14); ctx.fill()
    ctx.strokeStyle = '#d8b048'; ctx.lineWidth = 5
    rG2(ctx, g.bx - bpW / 2, g.by - g.ch / 2 - 17, bpW, bpH, 14); ctx.stroke()
    // 槽位與寶石
    for (const sl of this.slots) {
      const p = this._slotXY(sl.idx, g)
      const st = STONES[sl.idx]
      const shaking = this.shake && this.shake.slot === sl.idx
      const dx = shaking ? Math.sin(this._t * 40) * 4 : 0
      // 金槽
      ctx.fillStyle = '#b08a2a'
      rG2(ctx, p.x - g.cw / 2 + 6 + dx, p.y - g.ch / 2 + 5, g.cw - 12, g.ch - 10, 9); ctx.fill()
      ctx.fillStyle = '#8a681a'
      rG2(ctx, p.x - g.cw / 2 + 10 + dx, p.y - g.ch / 2 + 9, g.cw - 20, g.ch - 18, 7); ctx.fill()
      if (sl.placed) {
        this._gem(p.x, p.y - 6, 22, STONES[sl.idx].c)
        ctx.fillStyle = '#fdf6dc'
        ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(st.tribe, p.x, p.y + g.ch / 2 - 12)
      } else {
        // 提示:幼=淡色底;童=石名+支派;青=只有支派
        if (this.cfg.hint === 'color') {
          ctx.globalAlpha = 0.4
          this._gem(p.x + dx, p.y - 6, 20, st.c)
          ctx.globalAlpha = 1
        }
        ctx.fillStyle = 'rgba(253,246,220,0.85)'
        ctx.font = 'bold 12px "Noto Sans TC",sans-serif'
        ctx.textAlign = 'center'
        if (this.cfg.hint === 'name') {
          ctx.fillText(st.name, p.x + dx, p.y - 4)
          ctx.font = '11px "Noto Sans TC",sans-serif'
          ctx.fillText(st.tribe, p.x + dx, p.y + 14)
        } else {
          ctx.fillText(st.tribe, p.x + dx, p.y + 4)
        }
      }
    }
    // 鑲對火花
    for (const sp of this.sparks) {
      const k = 1 - sp.t / 0.5
      ctx.globalAlpha = sp.t / 0.5
      ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sp.x + Math.cos(sp.a) * 14 * (1 + k), sp.y + Math.sin(sp.a) * 14 * (1 + k))
      ctx.lineTo(sp.x + Math.cos(sp.a) * 26 * (1 + k), sp.y + Math.sin(sp.a) * 26 * (1 + k))
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    // 青檔:右側經文卡(四行石名對照)
    if (this.cfg.hint === 'scroll' && this.state === 'place') {
      const sx = VW * 0.76
      ctx.fillStyle = 'rgba(250,244,222,0.94)'
      rG2(ctx, sx - 120, 66, 260, 260, 12); ctx.fill()
      ctx.strokeStyle = '#a8884a'; ctx.lineWidth = 2
      rG2(ctx, sx - 120, 66, 260, 260, 12); ctx.stroke()
      ctx.fillStyle = '#5a4416'
      ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📜 出 28:17-20', sx + 10, 94)
      ctx.font = '14px "Noto Sans TC",sans-serif'
      const lines = ['第一行:紅寶石、紅璧璽、紅玉', '第二行:綠寶石、藍寶石、金鋼石', '第三行:紫瑪瑙、白瑪瑙、紫晶', '第四行:水蒼玉、紅瑪瑙、碧玉']
      lines.forEach((ln, i) => ctx.fillText(ln, sx + 10, 128 + i * 30))
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillStyle = '#8a6a3a'
      ctx.fillText('(支派照生來的次序,由上排到下)', sx + 10, 258)
      ctx.fillText('流便→西緬→利未→猶大→但→拿弗他利', sx + 10, 282)
      ctx.fillText('→迦得→亞設→以薩迦→西布倫→約瑟→便雅憫', sx + 10, 302)
    }
    // 托盤
    if (this.state === 'place') {
      ctx.fillStyle = 'rgba(20,16,30,0.4)'
      rG2(ctx, VW * 0.08, VH - 128, VW * 0.84, 108, 14); ctx.fill()
      for (let p = 0; p < this.tray.length; p++) {
        const t = this._trayXY(p)
        const st = STONES[this.tray[p]]
        const lift = this.sel === p ? -10 : 0
        if (this.sel === p) {
          ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 3
          ctx.beginPath(); ctx.arc(t.x, t.y + lift, 28, 0, 7); ctx.stroke()
        }
        this._gem(t.x, t.y + lift, 21, st.c)
        ctx.fillStyle = '#f4ecd4'
        ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(st.name, t.x, t.y + lift + 34)
      }
    }
    // 完成光
    if (this.state === 'close' || this.state === 'win') {
      const glow = ctx.createRadialGradient(g.bx, g.by + g.ch, 20, g.bx, g.by + g.ch, 240)
      glow.addColorStop(0, 'rgba(255,235,160,0.5)'); glow.addColorStop(1, 'rgba(255,235,160,0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(g.bx, g.by + g.ch, 240, 0, 7); ctx.fill()
      ctx.fillStyle = '#fdf4d8'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(T.closeLine, VW / 2, VH - 48)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fdf4d8'; ctx.strokeStyle = 'rgba(30,20,40,0.85)'; ctx.lineWidth = 4
      ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, 46 - k * 14)
      ctx.fillText(t.text, VW / 2, 46 - k * 14)
      ctx.globalAlpha = 1
    }
    // HUD(左上角,避開漂浮字)
    const placedN = this.slots.filter((k) => k.placed).length
    ctx.fillStyle = 'rgba(20,16,30,0.6)'
    rG2(ctx, 12, 10, 190, 30, 10); ctx.fill()
    ctx.fillStyle = '#f4ecd4'
    ctx.font = 'bold 14px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(T.hud(placedN, this.slots.length), 107, 31)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 一顆寶石(切面感)
  _gem(x, y, r, color) {
    const { ctx } = this
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r * 0.85, y - r * 0.25)
    ctx.lineTo(x + r * 0.55, y + r * 0.85)
    ctx.lineTo(x - r * 0.55, y + r * 0.85)
    ctx.lineTo(x - r * 0.85, y - r * 0.25)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r * 0.45, y - r * 0.1)
    ctx.lineTo(x - r * 0.2, y - r * 0.05)
    ctx.fill()
    ctx.strokeStyle = 'rgba(60,40,10,0.4)'; ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r * 0.85, y - r * 0.25)
    ctx.lineTo(x + r * 0.55, y + r * 0.85)
    ctx.lineTo(x - r * 0.55, y + r * 0.85)
    ctx.lineTo(x - r * 0.85, y - r * 0.25)
    ctx.closePath()
    ctx.stroke()
  }

  _drawIntro() {
    const { ctx } = this
    cardG2(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3a2a5a'
    ctx.font = 'bold 32px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#6a5a8a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 名字帶在胸前', VW / 2, VH * 0.24)
    ctx.fillStyle = '#322a44'
    wrapG2(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapG2(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#6a5a8a'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.67)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.72
      ctx.fillStyle = '#9a80c0'
      rG2(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#1e1030'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = '14px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWinCard() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.1, y = H * 0.07, w = W * 0.8, h = H * 0.86
    ctx.fillStyle = '#faf6ee' // 全不透明
    ctx.strokeStyle = '#9a80c0'; ctx.lineWidth = 3
    rG2(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3a2a5a'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.16)
    ctx.fillStyle = '#6a5a8a'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`${this.slots.length} 塊寶石、${this.slots.length} 個名字——帶在胸前`, W / 2, H * 0.24)
    ctx.fillStyle = '#322a44'
    wrapG2(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.32, W * 0.66, H * 0.044)
    ctx.fillStyle = '#5a4a7a'
    wrapG2(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.5, W * 0.66, H * 0.042)
    ctx.fillStyle = '#322a44'
    wrapG2(ctx, T.teach, W / 2, H * 0.66, W * 0.66, H * 0.042)
    ctx.restore()
  }
}

function rG2(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardG2(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(250,246,238,0.96)'
  ctx.strokeStyle = '#9a80c0'; ctx.lineWidth = 3
  rG2(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapG2(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
