// 各從其類・動物歸艙(創 6:20;7:8-9,14-16)——系列第一個「彈珠配對」關(新類型⑭,泡泡龍反向化)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:創 6:20、7:8-9、7:14-16),牧者審核通過前不進大廳卡。
//
// 玩法:動物們亂哄哄地聚在空地上。挪亞把一隻動物輕輕送上去(瞄準+發射),同類靠在一起
//   湊滿 3 隻=「各從其類」——牠們一起快快樂樂走進方舟(不是爆破消失!);
//   全部歸艙,耶和華就把門關上——過關!
// ★ 神學守法(泡泡龍反向化):①配對成功=**同類聚集、一起進方舟**,絕不畫成泡泡爆掉/動物消失
//   ——是「歸聚」不是「消除」;②懸空的動物=神親自招聚,也飛進方舟(經文:牠們是「要到你那裡」
//   自己來的,創 6:20);③永不會輸:沒有射數限制、沒有下壓死線(堆太低=神親自招聚下層,溫柔收回);
//   ④結尾必是「耶和華就把他關在方舟裡頭」(創 7:16)——關門的是神,保全的是神。
// 年齡三檔:幼(3 種動物・3 排)/童(4 種・4 排)/青(5 種・5 排)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;創 7:16 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '3 種動物・3 排', kinds: 3, rows: 3, cols: 8 },
  kid: { label: '🙂 童', desc: '4 種動物・4 排', kinds: 4, rows: 4, cols: 9 },
  teen: { label: '🔥 青', desc: '5 種動物・5 排', kinds: 5, rows: 5, cols: 10 },
}

const KINDS = ['lion', 'sheep', 'pig', 'frog', 'bird']
const VW = 960
const VH = 540
const D = 52 // 動物泡泡直徑
const ROWSTEP = D * 0.87
const MAXROW = 8 // 堆到這排=神親自招聚下層(溫柔收回,不是輸)

const T = {
  title: '🦁 各從其類・動物歸艙',
  ref: '創世記 7:14-16',
  intro1: '「飛鳥各從其類，牲畜各從其類，地上的昆蟲各從其類，每樣兩個，要到你那裡，好保全生命。」(創 6:20)',
  how: '動物們亂哄哄地聚在空地上!移動滑鼠(或手指)瞄準、放開發射,把動物送到同類旁邊——湊滿 3 隻,牠們就「各從其類」一起走進方舟。全部歸艙,神就把門關上!',
  pick: '方舟造好了。選一場招聚:',
  hud: (n, ark) => `🦁 場上還有 ${n} 隻 ・ 方舟裡 ${ark} 隻`,
  gather: '各從其類,一起進方舟!',
  float: '神親自招聚牠們…',
  low: '堆太低了——神親自招聚下層的動物',
  closeLine: '耶和華就把他關在方舟裡頭。(創 7:16)',
  winTitle: '🎉 都進入方舟,門關上了!',
  winVerse: '凡有血肉進入方舟的，都是有公有母，正如　神所吩咐挪亞的。耶和華就把他關在方舟裡頭。',
  winRef: '創世記 7:16',
  teachVerse: '都是一對一對地，有公有母，到挪亞那裡進入方舟，正如　神所吩咐挪亞的。',
  teachRef: '創世記 7:9',
  teach: '獅子跟獅子、綿羊跟綿羊——「各從其類」是神造物的次序,連進方舟也是整整齊齊。而且你注意到了嗎?動物是「自己來的」(要到你那裡),關門的是耶和華。招聚的是神,保全的也是神。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → close → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.grid = new Map() // "r,c" → kind
    this.cur = null // 待發射的動物 kind
    this.next = null
    this.flying = null // {x,y,vx,vy,kind}
    this.flyers = [] // 歸艙動畫 {x,y,kind,sx,sy,t}
    this.aim = -Math.PI / 2
    this.arkCount = 0
    this.closeT = 0
    this.toasts = []
    this._audio = null
  }

  boot() {
    initSpeech()
    addEventListener('keydown', this._onKeyDown)
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
    this.grid = new Map()
    const kinds = KINDS.slice(0, this.cfg.kinds)
    for (let r = 0; r < this.cfg.rows; r++)
      for (let c = 0; c < this.cfg.cols - (r % 2); c++)
        this.grid.set(`${r},${c}`, kinds[Math.floor(Math.random() * kinds.length)])
    this.arkCount = 0
    this.flyers = []
    this.flying = null
    this.toasts = []
    this.cur = this._pick()
    this.next = this._pick()
    this.aim = -Math.PI / 2
    this.state = 'play'
  }

  // 只發「場上還有的種類」(避免死局)
  _pick() {
    const present = [...new Set(this.grid.values())]
    if (!present.length) return KINDS[0]
    return present[Math.floor(Math.random() * present.length)]
  }

  _ox() { return (VW - this.cfg.cols * D) / 2 + D / 2 }
  _cellXY(r, c) { return { x: this._ox() + c * D + (r % 2) * (D / 2), y: 70 + r * ROWSTEP } }
  _neighbors(r, c) {
    return r % 2 === 0
      ? [[r, c - 1], [r, c + 1], [r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]]
      : [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]]
  }

  _shoot() {
    if (this.flying || this.state !== 'play') return
    const sp = 620
    this.flying = { x: VW / 2, y: VH - 70, vx: Math.cos(this.aim) * sp, vy: Math.sin(this.aim) * sp, kind: this.cur }
    this.cur = this.next
    this.next = this._pick()
    this._tone(440, 0.07, 0, 'sine', 0.08)
  }

  _snap(b) {
    // 找最近的空格(從座標推格,占用則往鄰居擴散)
    let r = Math.max(0, Math.round((b.y - 70) / ROWSTEP))
    let c = Math.max(0, Math.min(this.cfg.cols - 1 - (r % 2), Math.round((b.x - this._ox() - (r % 2) * (D / 2)) / D)))
    if (this.grid.has(`${r},${c}`)) {
      let best = null, bestD = 1e9
      const seen = new Set([`${r},${c}`])
      const queue = [[r, c]]
      while (queue.length) {
        const [qr, qc] = queue.shift()
        for (const [nr, nc] of this._neighbors(qr, qc)) {
          const key = `${nr},${nc}`
          if (nr < 0 || nc < 0 || nc > this.cfg.cols - 1 - (nr % 2) || seen.has(key)) continue
          seen.add(key)
          if (!this.grid.has(key)) {
            const p = this._cellXY(nr, nc)
            const d = Math.hypot(p.x - b.x, p.y - b.y)
            if (d < bestD) { bestD = d; best = [nr, nc] }
          } else if (seen.size < 60) queue.push([nr, nc])
        }
      }
      if (best) { r = best[0]; c = best[1] }
    }
    this.grid.set(`${r},${c}`, b.kind)
    this._tone(220, 0.06, 0, 'sine', 0.07)
    this._settle(r, c)
  }

  _settle(r, c) {
    // 同類連通 ≥3 → 一起歸艙(非爆破)
    const kind = this.grid.get(`${r},${c}`)
    const group = []
    const seen = new Set()
    const bfs = [[r, c]]
    while (bfs.length) {
      const [qr, qc] = bfs.shift()
      const key = `${qr},${qc}`
      if (seen.has(key) || this.grid.get(key) !== kind) continue
      seen.add(key)
      group.push([qr, qc])
      for (const [nr, nc] of this._neighbors(qr, qc)) if (!seen.has(`${nr},${nc}`)) bfs.push([nr, nc])
    }
    if (group.length >= 3) {
      for (const [gr, gc] of group) this._toArk(gr, gc)
      this.toasts.push({ text: T.gather, t: this._t })
      this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(659, 0.18, 0.1, 'triangle', 0.11)
      // 懸空的(沒連到頂排)=神親自招聚
      const anchored = new Set()
      const q = []
      for (const key of this.grid.keys()) if (key.startsWith('0,')) { q.push(key); anchored.add(key) }
      while (q.length) {
        const [qr, qc] = q.shift().split(',').map(Number)
        for (const [nr, nc] of this._neighbors(qr, qc)) {
          const key = `${nr},${nc}`
          if (this.grid.has(key) && !anchored.has(key)) { anchored.add(key); q.push(key) }
        }
      }
      const floating = [...this.grid.keys()].filter((k) => !anchored.has(k))
      if (floating.length) {
        for (const key of floating) { const [fr, fc] = key.split(',').map(Number); this._toArk(fr, fc) }
        this.toasts.push({ text: T.float, t: this._t })
      }
    }
    // 堆太低=神親自招聚下層(溫柔收回,不是輸)
    const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
    if (tooLow.length) {
      for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
        const [fr, fc] = key.split(',').map(Number); this._toArk(fr, fc)
      }
      this.toasts.push({ text: T.low, t: this._t })
    }
    if (this.grid.size === 0) {
      this.state = 'close'
      this.closeT = 2.4
      this._tone(392, 0.2, 0, 'triangle', 0.1); this._tone(523, 0.3, 0.18, 'triangle', 0.1)
    } else {
      // 場上種類變了,重抽下一發(避免發出已清空的種類)
      const present = new Set(this.grid.values())
      if (!present.has(this.cur)) this.cur = this._pick()
      if (!present.has(this.next)) this.next = this._pick()
    }
  }

  _toArk(r, c) {
    const kind = this.grid.get(`${r},${c}`)
    if (!kind) return
    this.grid.delete(`${r},${c}`)
    const p = this._cellXY(r, c)
    this.flyers.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, kind, t: 0 })
  }

  _update(dt) {
    if (this.state === 'close') {
      this.closeT -= dt
      if (this.closeT <= 0) this._win()
    }
    if (this.flying) {
      const b = this.flying
      b.x += b.vx * dt
      b.y += b.vy * dt
      const wallL = this._ox() - D / 2, wallR = this._ox() + (this.cfg.cols - 0.5) * D + D / 2
      if (b.x < wallL + D / 2) { b.x = wallL + D / 2; b.vx = Math.abs(b.vx) }
      if (b.x > wallR - D / 2) { b.x = wallR - D / 2; b.vx = -Math.abs(b.vx) }
      let hit = b.y <= 70
      if (!hit) for (const key of this.grid.keys()) {
        const [r, c] = key.split(',').map(Number)
        const p = this._cellXY(r, c)
        if (Math.hypot(p.x - b.x, p.y - b.y) < D * 0.86) { hit = true; break }
      }
      if (hit) { const bb = this.flying; this.flying = null; this._snap(bb) }
      else if (b.y > VH + 40) this.flying = null // 極罕見:垂直射空,溫柔重來
    }
    for (const f of this.flyers) f.t += dt * 1.4
    for (const f of this.flyers) {
      const k = Math.min(1, f.t)
      const ease = k * k * (3 - 2 * k)
      f.x = f.sx + (ARK.x - f.sx) * ease
      f.y = f.sy + (ARK.y - f.sy) * ease - Math.sin(k * Math.PI) * 60
    }
    const done = this.flyers.filter((f) => f.t >= 1).length
    if (done) { this.arkCount += done; this.flyers = this.flyers.filter((f) => f.t < 1) }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'arkmatch' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state !== 'play') return
    if (e.key === 'ArrowLeft' || e.key === 'a') this.aim = Math.max(-Math.PI + 0.3, this.aim - 0.09)
    else if (e.key === 'ArrowRight' || e.key === 'd') this.aim = Math.min(-0.3, this.aim + 0.09)
    else if (e.key === ' ' || e.key === 'ArrowUp') this._shoot()
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * this.W
    const py = ((e.clientY - r.top) / r.height) * this.H
    const { s, ox, oy } = this._view()
    return { x: (px - ox) / s, y: (py - oy) / s }
  }
  _aimTo(x, y) {
    const a = Math.atan2(y - (VH - 70), x - VW / 2)
    this.aim = Math.max(-Math.PI + 0.3, Math.min(-0.3, a))
  }
  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state === 'play') { this._aimTo(x, y); this._press = true }
  }
  _movePt(e) {
    if (this.state !== 'play') return
    const { x, y } = this._pt(e)
    this._aimTo(x, y)
  }
  _up() {
    if (this._press && this.state === 'play') this._shoot()
    this._press = false
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
    // 雨前的天色
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#9ab4c8'); sky.addColorStop(0.7, '#b8c8b8'); sky.addColorStop(1, '#a0b088')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    // 方舟(右側)
    this._ark(this.state === 'close' || this.state === 'win')
    // 網格動物
    for (const [key, kind] of this.grid) {
      const [r, c] = key.split(',').map(Number)
      const p = this._cellXY(r, c)
      this._animal(p.x, p.y, D / 2 - 2, kind)
    }
    // 飛行中
    if (this.flying) this._animal(this.flying.x, this.flying.y, D / 2 - 2, this.flying.kind)
    // 歸艙動畫
    for (const f of this.flyers) this._animal(f.x, f.y, (D / 2 - 2) * (1 - f.t * 0.3), f.kind)
    // 發射台(挪亞)
    if (this.state === 'play') {
      const sx = VW / 2, sy = VH - 70
      // 瞄準虛線
      ctx.strokeStyle = 'rgba(60,80,60,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10])
      ctx.beginPath(); ctx.moveTo(sx, sy)
      ctx.lineTo(sx + Math.cos(this.aim) * 130, sy + Math.sin(this.aim) * 130); ctx.stroke()
      ctx.setLineDash([])
      // 挪亞(簡筆)
      ctx.fillStyle = '#7a5a3a'
      ctx.fillRect(sx - 30 - 9, sy - 8, 18, 34)
      ctx.fillStyle = '#c9a06a'
      ctx.beginPath(); ctx.arc(sx - 30, sy - 18, 10, 0, 7); ctx.fill()
      ctx.fillStyle = '#e8e4d8'
      ctx.beginPath(); ctx.moveTo(sx - 34, sy - 12); ctx.quadraticCurveTo(sx - 30, sy - 2, sx - 26, sy - 12); ctx.fill() // 鬍子
      // 當前動物+下一隻
      this._animal(sx, sy, D / 2 - 2, this.cur)
      ctx.fillStyle = '#4a5a4a'
      ctx.font = '13px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('下一隻', sx + 74, sy + 4)
      this._animal(sx + 74, sy - 22, D / 3, this.next)
    }
    // 關門一幕
    if (this.state === 'close' || this.state === 'win') {
      ctx.fillStyle = '#3a4a3a'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(T.closeLine, VW / 2, VH * 0.6)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#2a3a2a'; ctx.strokeStyle = 'rgba(250,255,245,0.9)'; ctx.lineWidth = 4
      ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.55 - k * 20)
      ctx.fillText(t.text, VW / 2, VH * 0.55 - k * 20)
      ctx.globalAlpha = 1
    }
    // HUD
    ctx.fillStyle = 'rgba(40,56,40,0.62)'
    rA(ctx, VW * 0.22, 8, VW * 0.56, 30, 12); ctx.fill()
    ctx.fillStyle = '#eef4e8'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this.grid.size, this.arkCount)} ・ ←→瞄準 空白鍵發射`, VW / 2, 29)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 方舟(右側;closed=門關上+光)
  _ark(closed) {
    const { ctx } = this
    const x = ARK.x, y = ARK.y
    ctx.fillStyle = '#8a6a42'
    rA(ctx, x - 60, y - 6, 120, 40, 10); ctx.fill() // 船身
    ctx.fillStyle = '#a5854f'
    rA(ctx, x - 42, y - 34, 84, 30, 6); ctx.fill() // 艙房
    ctx.fillStyle = '#6a4a26'
    rA(ctx, x - 46, y - 40, 92, 8, 4); ctx.fill() // 屋頂
    // 門(開=黑洞口;關=木門)
    if (closed) {
      ctx.fillStyle = '#7a5a32'
      rA(ctx, x - 10, y - 26, 20, 22, 3); ctx.fill()
      ctx.strokeStyle = '#4a3216'; ctx.lineWidth = 2
      rA(ctx, x - 10, y - 26, 20, 22, 3); ctx.stroke()
      const glow = ctx.createRadialGradient(x, y - 15, 4, x, y - 15, 90)
      glow.addColorStop(0, 'rgba(255,240,180,0.5)'); glow.addColorStop(1, 'rgba(255,240,180,0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(x, y - 15, 90, 0, 7); ctx.fill()
    } else {
      ctx.fillStyle = '#2a1c0e'
      rA(ctx, x - 10, y - 26, 20, 22, 3); ctx.fill()
    }
    ctx.fillStyle = '#3a4a3a'
    ctx.font = '13px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('方舟', x, y + 50)
  }

  // 動物泡泡(圓臉向量,五種)
  _animal(x, y, r, kind) {
    const { ctx } = this
    if (kind === 'lion') {
      ctx.fillStyle = '#c08a30'
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, r * 0.3, 0, 7); ctx.fill() }
      ctx.fillStyle = '#e0b060'
      ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, 7); ctx.fill()
      ctx.fillStyle = '#8a5a1a'
      ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.12, r * 0.09, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.25, y - r * 0.12, r * 0.09, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x, y + r * 0.18, r * 0.11, 0, 7); ctx.fill() // 鼻
    } else if (kind === 'sheep') {
      ctx.fillStyle = '#f2eee0'
      for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68, r * 0.36, 0, 7); ctx.fill() }
      ctx.fillStyle = '#d8c8a8'
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.08, r * 0.42, r * 0.5, 0, 0, 7); ctx.fill()
      ctx.fillStyle = '#4a3a28'
      ctx.beginPath(); ctx.arc(x - r * 0.16, y - r * 0.05, r * 0.07, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.16, y - r * 0.05, r * 0.07, 0, 7); ctx.fill()
    } else if (kind === 'pig') {
      ctx.fillStyle = '#eaaBab'
      ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 7); ctx.fill()
      ctx.fillStyle = '#d88a8a'
      ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.5); ctx.lineTo(x - r * 0.35, y - r * 0.85); ctx.lineTo(x - r * 0.25, y - r * 0.45); ctx.fill()
      ctx.beginPath(); ctx.moveTo(x + r * 0.7, y - r * 0.5); ctx.lineTo(x + r * 0.35, y - r * 0.85); ctx.lineTo(x + r * 0.25, y - r * 0.45); ctx.fill()
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.15, r * 0.32, r * 0.24, 0, 0, 7); ctx.fill()
      ctx.fillStyle = '#a85a5a'
      ctx.beginPath(); ctx.arc(x - r * 0.12, y + r * 0.15, r * 0.06, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.12, y + r * 0.15, r * 0.06, 0, 7); ctx.fill()
      ctx.fillStyle = '#5a3a3a'
      ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.07, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.07, 0, 7); ctx.fill()
    } else if (kind === 'frog') {
      ctx.fillStyle = '#8ac860'
      ctx.beginPath(); ctx.arc(x, y + r * 0.08, r * 0.8, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.55, r * 0.3, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.55, r * 0.3, 0, 7); ctx.fill()
      ctx.fillStyle = '#f4f8ee'
      ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.55, r * 0.17, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.55, r * 0.17, 0, 7); ctx.fill()
      ctx.fillStyle = '#2a3a1a'
      ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.55, r * 0.08, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.55, r * 0.08, 0, 7); ctx.fill()
      ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.3, 0.4, Math.PI - 0.4); ctx.stroke()
    } else { // bird
      ctx.fillStyle = '#78a8d8'
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.fill()
      ctx.fillStyle = '#5a88b8'
      ctx.beginPath(); ctx.ellipse(x - r * 0.4, y + r * 0.15, r * 0.32, r * 0.18, -0.5, 0, 7); ctx.fill()
      ctx.fillStyle = '#e8a030'
      ctx.beginPath(); ctx.moveTo(x + r * 0.55, y); ctx.lineTo(x + r * 0.95, y + r * 0.1); ctx.lineTo(x + r * 0.5, y + r * 0.25); ctx.fill()
      ctx.fillStyle = '#2a3a4a'
      ctx.beginPath(); ctx.arc(x + r * 0.2, y - r * 0.2, r * 0.08, 0, 7); ctx.fill()
    }
  }

  _drawIntro() {
    const { ctx } = this
    cardA(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a34'
    ctx.font = 'bold 36px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#5a7a62'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 一起進方舟', VW / 2, VH * 0.24)
    ctx.fillStyle = '#2e3c30'
    wrapA(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapA(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#5a7a62'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.67)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.72
      ctx.fillStyle = '#7ab088'
      rA(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#0e2a18'
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
    ctx.fillStyle = '#f4faf2' // 全不透明:別讓底下關門字透過卡片
    ctx.strokeStyle = '#7aa088'; ctx.lineWidth = 3
    rA(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c4a34'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.17)
    ctx.fillStyle = '#5a7a62'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`方舟裡一共 ${this.arkCount} 隻,各從其類、整整齊齊`, W / 2, H * 0.26)
    ctx.fillStyle = '#2e3c30'
    wrapA(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.34, W * 0.66, H * 0.045)
    ctx.fillStyle = '#4a6a2a'
    wrapA(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.56, W * 0.66, H * 0.043)
    ctx.fillStyle = '#2e3c30'
    wrapA(ctx, T.teach, W / 2, H * 0.7, W * 0.66, H * 0.042)
    ctx.restore()
  }
}

const ARK = { x: 870, y: 460 }

function rA(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardA(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,252,244,0.96)'
  ctx.strokeStyle = '#7aa088'; ctx.lineWidth = 3
  rA(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapA(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
