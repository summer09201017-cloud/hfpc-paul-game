// 好管家(太 25:14-30;林前 4:2)——經營管理②(本系列玩法類型④的第二個活實作,grain-management 範式)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:太 25:14-15、25:21、林前 4:2),牧者審核通過前不進大廳卡。
//
// 玩法:主人把銀子交託給你(按年齡檔:幼=二千、童/青=五千,對應比喻裡「按著各人的才幹」),
//   每一季把每袋銀子點一點,分到「市集(拿去做買賣)」或「地裡的坑(埋起來)」;開市後看它結果;
//   幾季之後主人回來算帳——星等只看「忠心運用了多少」,不看賺了多少。
// ★ 神學守法(grain-management 三鐵則的本關版):
//   ①「聖經策略剛好最優」=全部拿去運用 → 3 星「又良善又忠心」;比喻裡五千的和二千的
//     賺的數目不同、得的稱讚卻是同一句(太 25:21,23)——所以星等按「忠心度」不按金額,
//     幼檔二千全運用=童檔五千全運用=同樣 3 星。
//   ②做買賣永遠有收成(比喻裡兩個忠心僕人都翻倍,沒有虧損劇情)——事件只影響「賺多賺少」,
//     絕不畫成賭博或血本無歸;埋起來的=不多也不少(原封不動)。
//   ③永不會輸:埋太多不罵「又惡又懶」(兒童版溫柔化),主人溫柔提醒+教導,仍然 won:true,
//     星等 1 星是「再學學管家的功課」不是失敗。
// 年齡三檔:幼(二千銀子・2 季・事件單純)/童(五千・3 季)/青(五千・4 季・事件更多樣)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;太 25:21 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '二千銀子・2 季', coins: 2, rounds: 2, events: 2 },
  kid: { label: '🙂 童', desc: '五千銀子・3 季', coins: 5, rounds: 3, events: 3 },
  teen: { label: '🔥 青', desc: '五千銀子・4 季', coins: 5, rounds: 4, events: 4 },
}

// 每季事件(只影響賺多賺少,永遠是收成;bags = 市集裡每袋這季多結的小錢袋數)
const EVENTS = [
  { text: '🌾 今年豐收,買賣興旺!', bags: 2 },
  { text: '🌦️ 下了幾場大雨,行情平平。', bags: 1 },
  { text: '🐑 羊毛賣了好價錢。', bags: 2 },
  { text: '🍇 收成普通,但夠用了。', bags: 1 },
]

const T = {
  title: '💼 好管家',
  ref: '馬太福音 25:14-30',
  intro1: '「把他的家業交給他們，按著各人的才幹給他們銀子：一個給了五千，一個給了二千，一個給了一千，就往外國去了。」(太 25:14-15)',
  how: '主人出遠門前,把銀子交託給你。點每一袋銀子,把它放到「市集」拿去做買賣,或放進「地裡的坑」埋起來;放好了就開市。主人回來的時候,看的不是你賺多少——是你有沒有忠心去運用!',
  pick: '主人要出門了。你領多少銀子:',
  assign: '點銀袋,分到市集或坑裡',
  market: '開市!做買賣中…',
  settleTitle: '👳 主人回來了,和你算帳',
  buried: '埋在地裡的,原封不動…',
  winTitle: '🎉 又良善又忠心!',
  winVerse: '主人說：『好，你這又良善又忠心的僕人，你在不多的事上有忠心，我要把許多事派你管理；可以進來享受你主人的快樂。』',
  winRef: '馬太福音 25:21',
  teachVerse: '所求於管家的，是要他有忠心。',
  teachRef: '哥林多前書 4:2',
  teach3: '你把主人交託的都拿去運用了!比喻裡領五千的賺五千、領二千的賺二千——數目不同,主人的稱讚卻是同一句。神看的是忠心,不是數額。',
  teach2: '你運用了一部分,也埋了一些。主人溫柔地說:銀子是交給你去用的,別怕——下次把每一袋都拿去運用吧!',
  teach1: '大部分的銀子都埋在地裡了…主人沒有生氣,他輕輕地說:孩子,我把銀子交給你,是要你去用它。再來一次,學做又良善又忠心的管家!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → assign ⇄ market → settle → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onResize = () => this._resize()
    this.coins = [] // {zone:'hand'|'market'|'pit', bags, wob}
    this.round = 1
    this.faith = [] // 每季的運用比例
    this.marketT = 0
    this.event = null
    this.toasts = []
    this.stars = 0
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
    this.coins = Array.from({ length: this.cfg.coins }, () => ({ zone: 'hand', bags: 0, wob: Math.random() * 6 }))
    this.round = 1
    this.faith = []
    this.toasts = []
    this.state = 'assign'
  }

  _openMarket() {
    if (this.coins.some((c) => c.zone === 'hand')) return // 還有沒分配的
    const working = this.coins.filter((c) => c.zone === 'market').length
    this.faith.push(working / this.coins.length)
    this.event = EVENTS[Math.floor(Math.random() * this.cfg.events)]
    this.marketT = 2.6
    this.state = 'market'
    this._tone(392, 0.12, 0, 'triangle', 0.1)
  }

  _update(dt) {
    if (this.state === 'market') {
      this.marketT -= dt
      if (this.marketT <= 0) {
        for (const c of this.coins) if (c.zone === 'market') c.bags += this.event.bags
        if (this.coins.some((c) => c.zone === 'pit')) this.toasts.push({ text: T.buried, t: this._t })
        this.round += 1
        if (this.round > this.cfg.rounds) this._settle()
        else this.state = 'assign'
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2.2)
  }

  _settle() {
    const avg = this.faith.reduce((a, b) => a + b, 0) / this.faith.length
    this.stars = avg >= 0.9 ? 3 : avg >= 0.5 ? 2 : 1
    this.state = 'settle'
    this._tone(523, 0.15); this._tone(659, 0.2, 0.14)
    // 3 星才朗讀稱讚句(2/1 星是溫柔教導,不套那句稱讚);永不會輸,都是 won:true。
    setTimeout(() => {
      if (this.stopped) return
      if (this.stars === 3) speakScripture(T.winVerse, { ref: T.winRef })
      this.onComplete({ won: true, score: this.stars === 3 ? 100 : this.stars === 2 ? 70 : 40, level: 'steward' })
    }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state === 'assign' && (e.key === ' ' || e.key === 'Enter')) this._openMarket()
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * this.W, y: ((e.clientY - r.top) / r.height) * this.H }
  }
  _down(e) {
    const { x, y } = this._pt(e)
    for (const b of this._btns) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.key) return this._start(b.key)
        if (b.act === 'open') return this._openMarket()
      }
    }
    if (this.state !== 'assign') return
    // 點銀袋:手中 → 市集 → 坑 → 市集(循環於兩個去處)
    const g = this._layout()
    this.coins.forEach((c, i) => {
      const p = this._coinPos(c, i, g)
      if (Math.hypot(x - p.x, y - p.y) < g.coinR * 1.4) {
        c.zone = c.zone === 'market' ? 'pit' : 'market'
        this._tone(c.zone === 'market' ? 520 : 300, 0.07, 0, 'sine', 0.07)
      }
    })
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
    return {
      coinR: Math.min(W, H) * 0.045,
      handY: H * 0.44,
      marketBox: { x: W * 0.06, y: H * 0.52, w: W * 0.42, h: H * 0.34 },
      pitBox: { x: W * 0.56, y: H * 0.52, w: W * 0.38, h: H * 0.34 },
    }
  }

  // 銀袋位置:依所在區排排站
  _coinPos(c, i, g) {
    const zoneCoins = this.coins.filter((k) => k.zone === c.zone)
    const idx = zoneCoins.indexOf(c)
    const n = zoneCoins.length
    if (c.zone === 'hand') {
      const x0 = this.W / 2 - ((n - 1) * g.coinR * 2.6) / 2
      return { x: x0 + idx * g.coinR * 2.6, y: g.handY }
    }
    const box = c.zone === 'market' ? g.marketBox : g.pitBox
    const cols = Math.max(1, Math.floor(box.w / (g.coinR * 2.6)))
    return {
      x: box.x + g.coinR * 1.5 + (idx % cols) * g.coinR * 2.6,
      y: box.y + box.h * 0.42 + Math.floor(idx / cols) * g.coinR * 2.3,
    }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 黃昏市集底色
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#f4e6c8'); sky.addColorStop(0.65, '#e8d2a8'); sky.addColorStop(1, '#c8a878')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    if (this.state === 'intro') return this._drawIntro()
    if (this.state === 'settle') return this._drawSettle()
    const g = this._layout()
    // 市集區(棚子)
    this._zoneBox(g.marketBox, '#b07a3a', '🏪 市集(拿去做買賣)')
    ctx.fillStyle = '#8a5a26'
    ctx.beginPath(); ctx.moveTo(g.marketBox.x, g.marketBox.y)
    ctx.lineTo(g.marketBox.x + g.marketBox.w / 2, g.marketBox.y - H * 0.05)
    ctx.lineTo(g.marketBox.x + g.marketBox.w, g.marketBox.y); ctx.fill()
    // 地裡的坑
    this._zoneBox(g.pitBox, '#7a6a4a', '🕳️ 地裡的坑(埋起來)')
    ctx.fillStyle = 'rgba(60,45,25,0.5)'
    ctx.beginPath(); ctx.ellipse(g.pitBox.x + g.pitBox.w / 2, g.pitBox.y + g.pitBox.h * 0.75, g.pitBox.w * 0.3, g.coinR * 1.1, 0, 0, 7); ctx.fill()
    // 銀袋
    this.coins.forEach((c, i) => {
      const p = this._coinPos(c, i, g)
      const wob = this.state === 'market' && c.zone === 'market' ? Math.sin(this._t * 8 + c.wob) * 5 : Math.sin(this._t * 1.8 + c.wob) * 2
      this._bag(p.x, p.y + wob, g.coinR, c.bags)
    })
    // 頂部說明/開市鈕
    ctx.fillStyle = 'rgba(90,60,20,0.62)'
    rS(ctx, W * 0.16, H * 0.015, W * 0.68, H * 0.055, 12); ctx.fill()
    ctx.fillStyle = '#fdf4dc'
    ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`💼 第 ${Math.min(this.round, this.cfg.rounds)}/${this.cfg.rounds} 季 ・ ${this.state === 'market' ? T.market : T.assign}`, W / 2, H * 0.052)
    this._btns = this._btns.filter((b) => b.key) // 保留 intro 鈕清法
    this._btns = []
    if (this.state === 'assign') {
      const unplaced = this.coins.filter((c) => c.zone === 'hand').length
      const bw = W * 0.2, bh = H * 0.085, bx = W / 2 - bw / 2, by = H * 0.9
      ctx.fillStyle = unplaced ? '#b8a888' : '#c8892a'
      rS(ctx, bx, by, bw, bh, 12); ctx.fill()
      ctx.fillStyle = unplaced ? '#6a5a3a' : '#fff8e8'
      ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
      ctx.fillText(unplaced ? `還有 ${unplaced} 袋沒分配` : '🔔 開市!', bx + bw / 2, by + bh * 0.62)
      if (!unplaced) this._btns.push({ x: bx, y: by, w: bw, h: bh, act: 'open' })
    }
    // 事件字
    if (this.state === 'market' && this.event) {
      ctx.fillStyle = '#5a3a10'; ctx.strokeStyle = 'rgba(255,250,235,0.9)'; ctx.lineWidth = 4
      ctx.font = `bold ${Math.max(14, H * 0.036)}px "Noto Sans TC",sans-serif`
      ctx.strokeText(this.event.text, W / 2, H * 0.34)
      ctx.fillText(this.event.text, W / 2, H * 0.34)
    }
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2.2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#4a3a18'
      ctx.font = `${Math.max(12, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.fillText(t.text, W / 2, H * 0.4 - k * 16)
      ctx.globalAlpha = 1
    }
  }

  _zoneBox(box, color, label) {
    const { ctx } = this
    ctx.fillStyle = 'rgba(255,250,235,0.35)'
    rS(ctx, box.x, box.y, box.w, box.h, 14); ctx.fill()
    ctx.strokeStyle = color; ctx.lineWidth = 3
    rS(ctx, box.x, box.y, box.w, box.h, 14); ctx.stroke()
    ctx.fillStyle = '#5a3a10'
    ctx.font = `bold ${Math.max(12, this.H * 0.028)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(label, box.x + box.w / 2, box.y + this.H * 0.045)
  }

  // 一袋銀子(束口袋+$記號),bags=旁邊多結的小錢袋
  _bag(x, y, r, bags) {
    const { ctx } = this
    ctx.fillStyle = '#c9b089'
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.1, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#a08050'
    rS(ctx, x - r * 0.4, y - r * 1.25, r * 0.8, r * 0.4, r * 0.15); ctx.fill()
    ctx.strokeStyle = '#7a5c2a'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, y - r * 0.85); ctx.quadraticCurveTo(x, y - r * 0.55, x + r * 0.45, y - r * 0.85); ctx.stroke()
    ctx.fillStyle = '#6a4a16'
    ctx.font = `bold ${r * 0.9}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('千', x, y + r * 0.32)
    for (let i = 0; i < bags; i++) {
      ctx.fillStyle = '#e0c890'
      ctx.beginPath(); ctx.arc(x + r * 1.1 + (i % 2) * r * 0.55, y - r * 0.3 + Math.floor(i / 2) * r * 0.55, r * 0.24, 0, 7); ctx.fill()
    }
  }

  _drawIntro() {
    const { ctx, W, H } = this
    cardS(ctx, W * 0.08, H * 0.05, W * 0.84, H * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6a4416'
    ctx.font = `bold ${Math.max(22, H * 0.07)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.15)
    ctx.fillStyle = '#96784a'
    ctx.font = `${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 按才幹交託', W / 2, H * 0.22)
    ctx.fillStyle = '#4a3820'
    wrapS(ctx, T.intro1, W / 2, H * 0.3, W * 0.72, H * 0.045)
    wrapS(ctx, T.how, W / 2, H * 0.47, W * 0.72, H * 0.045)
    ctx.fillStyle = '#96784a'
    ctx.fillText(T.pick, W / 2, H * 0.66)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.7
      ctx.fillStyle = '#d8a858'
      rS(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#432c08'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.026)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawSettle() {
    const { ctx, W, H } = this
    const total = this.coins.length
    const gained = this.coins.reduce((n, c) => n + c.bags, 0)
    cardS(ctx, W * 0.08, H * 0.05, W * 0.84, H * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6a4416'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(this.stars === 3 ? T.winTitle : T.settleTitle, W / 2, H * 0.16)
    // 星等(按忠心不按金額)
    ctx.font = `${Math.max(26, H * 0.08)}px "Noto Sans TC",sans-serif`
    ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.28)
    ctx.fillStyle = '#96784a'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`領受 ${total} 千 ・ 買賣另賺了 ${gained} 小袋 ・ 忠心運用 ${Math.round((this.faith.reduce((a, b) => a + b, 0) / this.faith.length) * 100)}%`, W / 2, H * 0.35)
    if (this.stars === 3) {
      ctx.fillStyle = '#4a3820'
      wrapS(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.43, W * 0.68, H * 0.044)
      ctx.fillStyle = '#7a5c14'
      wrapS(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.66, W * 0.68, H * 0.042)
      ctx.fillStyle = '#4a3820'
      wrapS(ctx, T.teach3, W / 2, H * 0.74, W * 0.68, H * 0.042)
    } else {
      ctx.fillStyle = '#4a3820'
      wrapS(ctx, this.stars === 2 ? T.teach2 : T.teach1, W / 2, H * 0.46, W * 0.68, H * 0.046)
      ctx.fillStyle = '#7a5c14'
      wrapS(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.64, W * 0.68, H * 0.044)
    }
  }
}

function rS(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardS(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(253,248,236,0.96)'
  ctx.strokeStyle = '#c09a50'; ctx.lineWidth = 3
  rS(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapS(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
