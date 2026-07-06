// 約瑟的彩衣(創世記 37 → 50)——系列第一個「滑塊拼圖」關(新類型③)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:創 37:3、45:5、50:20),牧者審核通過前不進大廳卡。
//
// 玩法:雅各給約瑟做的彩衣被撕碎打亂了——點「空格旁邊」的碎塊把彩衣拼回來。
//   彩衣是 Canvas 手繪(零美術檔):條紋彩袍+領口+腰帶,切成滑塊。
// ★ 神學守法:永不會輸——拼圖沒有失敗,只有「還沒拼完」;卡住可按「💡 提示」自動走一步。
//   信息:哥哥們把彩衣(和約瑟的人生)撕碎,但神把破碎的拼回,「神的意思原是好的」(創 50:20)。
//   打亂=從完成狀態做 N 步合法亂走 → 天然可解,絕不出現無解盤面。
// 年齡三檔:幼(3×3 淺亂)/童(3×3 深亂)/青(4×4)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;創 50:20 已烤進 manifest,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const AGES = {
  young: { label: '🐣 幼', desc: '3×3・淺淺打亂', n: 3, scramble: 10 },
  kid: { label: '🙂 童', desc: '3×3・好好打亂', n: 3, scramble: 40 },
  teen: { label: '🔥 青', desc: '4×4・挑戰', n: 4, scramble: 90 },
}

const T = {
  title: '🧥 約瑟的彩衣',
  ref: '創世記 37',
  intro1: '以色列(雅各)愛約瑟,給他做了一件彩衣。哥哥們嫉妒他,把彩衣剝了、把他賣到埃及。',
  how: '彩衣被撕碎打亂了——點「空格旁邊」的碎塊,把彩衣一塊一塊拼回來。拼不動沒關係,按 💡 提示會幫你走一步。',
  pick: '把破碎的拼回來。選一條路:',
  hud: '🧩 點空格旁的碎塊移動',
  hint: '💡 提示',
  midEncourage: '快了!神把破碎的一塊塊拼回…',
  winVerse: '從前你們的意思是要害我,但 神的意思原是好的,要保全許多人的性命,成就今日的光景。',
  winRef: '創世記 50:20',
  teachVerse: '這是 神差我在你們以先來,為要保全生命。',
  teachRef: '創世記 45:5',
  teach: '彩衣被撕碎那天,約瑟的人生好像全毀了。可是多年後回頭看——每一塊破碎,都在神手中拼成拯救許多人的圖畫。你的人生,也在祂手裡。',
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
    this.n = 3
    this.tiles = [] // tiles[pos] = 原始格編號;空格 = n*n-1
    this.moves = 0
    this.slide = null // {from,to,start} 滑動動畫
    this._coat = null // 離屏彩衣圖(依棋盤尺寸重繪)
    this._coatSize = 0
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
    this.n = this.cfg.n
    const total = this.n * this.n
    this.tiles = Array.from({ length: total }, (_, i) => i)
    this.moves = 0
    this._coat = null // 重切
    // 打亂:從完成狀態做 N 步合法亂走(不走回頭路)→ 必可解
    let blank = total - 1
    let prev = -1
    for (let s = 0; s < this.cfg.scramble; s++) {
      const opts = this._neighbors(blank).filter((p) => p !== prev)
      const pick = opts[Math.floor(Math.random() * opts.length)]
      ;[this.tiles[blank], this.tiles[pick]] = [this.tiles[pick], this.tiles[blank]]
      prev = blank
      blank = pick
    }
    this.state = 'play'
  }

  _neighbors(pos) {
    const n = this.n, r = Math.floor(pos / n), c = pos % n, out = []
    if (r > 0) out.push(pos - n)
    if (r < n - 1) out.push(pos + n)
    if (c > 0) out.push(pos - 1)
    if (c < n - 1) out.push(pos + 1)
    return out
  }

  _blankPos() { return this.tiles.indexOf(this.n * this.n - 1) }

  _tryMove(pos) {
    if (this.state !== 'play' || this.slide) return
    const blank = this._blankPos()
    if (!this._neighbors(blank).includes(pos)) { this._tone(150, 0.12); return }
    this.slide = { from: pos, to: blank, tile: this.tiles[pos], start: this._t }
    ;[this.tiles[pos], this.tiles[blank]] = [this.tiles[blank], this.tiles[pos]]
    this.moves++
    this._tone(420 + Math.random() * 120, 0.08)
    setTimeout(() => { if (!this.stopped) { this.slide = null; this._checkWin() } }, 130)
  }

  _hint() {
    if (this.state !== 'play' || this.slide) return
    if (this.n >= 4) {
      // 4×4(挑戰檔)狀態空間太大不搜解:提示=閃示完成圖 2.5 秒,讓孩子對照
      this.peek = this._t + 2.5
      this._tone(520, 0.12)
      return
    }
    // 3×3:BFS 求最佳解的下一步(狀態空間 181440,瞬間算完)——提示永遠真的有用,不會把孩子帶進死胡同
    const goal = this.tiles.map((_, i) => i).join(',')
    const start = this.tiles.join(',')
    if (start === goal) return
    const parent = new Map([[start, null]])
    const queue = [start]
    const n = this.n
    while (queue.length) {
      const cur = queue.shift()
      if (cur === goal) break
      const arr = cur.split(',').map(Number)
      const blank = arr.indexOf(n * n - 1)
      for (const p of this._neighbors(blank)) {
        const next = arr.slice()
        ;[next[blank], next[p]] = [next[p], next[blank]]
        const key = next.join(',')
        if (!parent.has(key)) { parent.set(key, { prev: cur, moved: p }); queue.push(key) }
      }
    }
    // 從 goal 往回走到 start 的下一步
    let node = goal, step = null
    while (node && parent.get(node)) { const info = parent.get(node); if (info.prev === start) { step = info.moved; break } node = info.prev }
    if (step != null) this._tryMove(step)
  }

  _checkWin() {
    if (this.tiles.some((t, i) => t !== i)) return
    this.state = 'win'
    this._tone(660, 0.15); this._tone(880, 0.25)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'joseph' }) }, 900)
  }

  // ── 輸入 ──
  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === ' ' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state !== 'play') return
    if (e.key === 'h' || e.key === 'H') return this._hint()
    // 方向鍵=把「該方向那一側的碎塊」推進空格(直覺:空格往那個方向走的相反塊)
    const blank = this._blankPos(), n = this.n
    const map = { ArrowUp: blank + n, ArrowDown: blank - n, ArrowLeft: blank + 1, ArrowRight: blank - 1 }
    const src = map[e.key]
    if (src == null) return
    // 邊界與同列檢查
    if (src < 0 || src >= n * n) return
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && Math.floor(src / n) !== Math.floor(blank / n)) return
    this._tryMove(src)
  }

  _up(e) {
    const r = this.cv.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * this.W
    const y = ((e.clientY - r.top) / r.height) * this.H
    for (const b of this._btns) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.key === 'hint') return this._hint()
        return this._start(b.key)
      }
    }
    if (this.state !== 'play') return
    const g = this._grid()
    if (x < g.x || y < g.y || x > g.x + g.size || y > g.y + g.size) return
    const c = Math.floor((x - g.x) / g.cell), rr = Math.floor((y - g.y) / g.cell)
    this._tryMove(rr * this.n + c)
  }

  _tone(freq, dur) {
    try {
      if (!this._audio) this._audio = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._audio
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'triangle'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.012)
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
    this._coat = null // 尺寸變了重繪彩衣
  }

  _grid() {
    const size = Math.min(this.W * 0.5, this.H * 0.74)
    return { x: this.W * 0.5 - size / 2, y: this.H * 0.14, size, cell: size / this.n }
  }

  // ── 彩衣(離屏手繪,切塊來源) ──
  _coatImage(size) {
    if (this._coat && this._coatSize === size) return this._coat
    const off = document.createElement('canvas')
    off.width = off.height = size
    const c = off.getContext('2d')
    // 底:溫暖的羊皮紙
    const bg = c.createLinearGradient(0, 0, 0, size)
    bg.addColorStop(0, '#f4e4bc'); bg.addColorStop(1, '#e8cf9a')
    c.fillStyle = bg; c.fillRect(0, 0, size, size)
    const u = size / 100
    // 彩衣本體(梯形長袍,鋪滿版面)
    c.fillStyle = '#c9563a'
    c.beginPath()
    c.moveTo(30 * u, 12 * u); c.lineTo(70 * u, 12 * u) // 肩
    c.lineTo(86 * u, 34 * u); c.lineTo(78 * u, 40 * u) // 右袖
    c.lineTo(72 * u, 32 * u); c.lineTo(74 * u, 92 * u) // 右身
    c.lineTo(26 * u, 92 * u); c.lineTo(28 * u, 32 * u) // 下擺→左身
    c.lineTo(22 * u, 40 * u); c.lineTo(14 * u, 34 * u) // 左袖
    c.closePath(); c.fill()
    // 彩條(橫向多彩:約瑟的「彩」衣)
    const stripes = ['#e8a33a', '#4a8a5a', '#3a6a9c', '#9c5a8a', '#d9c23a', '#b9482e']
    c.save(); c.clip()
    stripes.forEach((col, i) => {
      c.fillStyle = col
      c.globalAlpha = 0.85
      c.fillRect(0, (22 + i * 12) * u, size, 6.5 * u)
    })
    c.globalAlpha = 1
    c.restore()
    // 領口與腰帶
    c.fillStyle = '#8a3a26'
    c.beginPath(); c.arc(50 * u, 12 * u, 8 * u, 0, Math.PI); c.fill()
    c.fillStyle = '#6b4a1b'; c.fillRect(26 * u, 56 * u, 48 * u, 5 * u)
    // 縫線裝飾(讓每一塊都有可辨識的紋理)
    c.strokeStyle = 'rgba(90,50,20,0.35)'; c.lineWidth = 1.2 * u; c.setLineDash([3 * u, 3 * u])
    c.beginPath(); c.moveTo(50 * u, 12 * u); c.lineTo(50 * u, 92 * u); c.stroke()
    c.setLineDash([])
    this._coat = off
    this._coatSize = size
    return off
  }

  // ── 畫面 ──
  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    // 迦南的黃昏原野
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#d98a4a'); sky.addColorStop(0.6, '#e8c07a'); sky.addColorStop(1, '#c9a06a')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(120,80,40,0.25)'
    ctx.beginPath(); ctx.ellipse(W * 0.2, H * 0.94, W * 0.3, H * 0.07, 0, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(W * 0.85, H * 0.96, W * 0.25, H * 0.06, 0, 0, 7); ctx.fill()

    if (this.state === 'intro') return this._drawIntro()

    const g = this._grid()
    const coat = this._coatImage(Math.round(g.size))
    const total = this.n * this.n
    // 棋盤框
    ctx.fillStyle = 'rgba(60,36,16,0.5)'
    rounded3(ctx, g.x - g.cell * 0.08, g.y - g.cell * 0.08, g.size + g.cell * 0.16, g.size + g.cell * 0.16, 14)
    ctx.fill()
    // 完成圖淡淡墊底(給小小孩對照);4×4 按提示時閃示得更清楚
    ctx.globalAlpha = (this.peek || 0) > this._t ? 0.5 : 0.16
    ctx.drawImage(coat, g.x, g.y, g.size, g.size)
    ctx.globalAlpha = 1
    for (let pos = 0; pos < total; pos++) {
      const tile = this.tiles[pos]
      if (tile === total - 1 && this.state === 'play') continue // 空格
      let px = pos % this.n, py = Math.floor(pos / this.n)
      // 滑動動畫:剛移動的塊從舊位置滑過來
      if (this.slide && this.slide.tile === tile) {
        const p = Math.min(1, (this._t - this.slide.start) / 0.12)
        const fx = this.slide.from % this.n, fy = Math.floor(this.slide.from / this.n)
        px = fx + (px - fx) * p; py = fy + (py - fy) * p
      }
      const sx = (tile % this.n) * (coat.width / this.n)
      const sy = Math.floor(tile / this.n) * (coat.height / this.n)
      const dx = g.x + px * g.cell, dy = g.y + py * g.cell
      ctx.drawImage(coat, sx, sy, coat.width / this.n, coat.height / this.n, dx, dy, g.cell, g.cell)
      ctx.strokeStyle = 'rgba(90,50,20,0.55)'; ctx.lineWidth = Math.max(1.5, g.cell * 0.02)
      ctx.strokeRect(dx, dy, g.cell, g.cell)
    }

    // HUD
    ctx.fillStyle = 'rgba(60,36,16,0.6)'
    rounded3(ctx, W * 0.08, H * 0.02, W * 0.84, H * 0.062, 12); ctx.fill()
    ctx.fillStyle = '#ffe9b0'
    ctx.font = `bold ${Math.max(13, H * 0.032)}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    const done = this.tiles.filter((t, i) => t === i).length
    ctx.fillText(`${T.hud} ・ 已歸位 ${done}/${total} ・ 移動 ${this.moves} 步`, W / 2, H * 0.062)
    if (this.state === 'play' && done >= total - 4 && done < total) {
      ctx.fillStyle = '#fff3c8'
      ctx.fillText(T.midEncourage, W / 2, H * 0.12)
    }

    // 提示鈕
    this._btns = []
    if (this.state === 'play') {
      const bw = Math.max(84, W * 0.1), bh = Math.max(34, H * 0.08)
      const bx = W - bw - W * 0.03, by = H - bh - H * 0.05
      ctx.fillStyle = '#f0b23e'
      rounded3(ctx, bx, by, bw, bh, 12); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(13, bh * 0.42)}px "Noto Sans TC",sans-serif`
      ctx.fillText(T.hint, bx + bw / 2, by + bh * 0.62)
      this._btns.push({ x: bx, y: by, w: bw, h: bh, key: 'hint' })
    }

    if (this.state === 'win') this._drawWin()
  }

  _drawIntro() {
    const { ctx, W, H } = this
    card3(ctx, W * 0.08, H * 0.08, W * 0.84, H * 0.84)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(22, H * 0.075)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.title, W / 2, H * 0.21)
    ctx.fillStyle = '#8a6a33'
    ctx.font = `${Math.max(13, H * 0.034)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.ref + ' ・ 神把破碎拼回', W / 2, H * 0.29)
    ctx.fillStyle = '#4a3a20'
    wrap3(ctx, T.intro1, W / 2, H * 0.38, W * 0.72, H * 0.048)
    wrap3(ctx, T.how, W / 2, H * 0.5, W * 0.72, H * 0.048)
    ctx.fillStyle = '#8a6a33'
    ctx.fillText(T.pick, W / 2, H * 0.67)
    this._btns = []
    const bw = W * 0.22, bh = H * 0.12, gap = W * 0.04
    const x0 = W / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = H * 0.71
      ctx.fillStyle = '#f0b23e'
      rounded3(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#5a3a10'
      ctx.font = `bold ${Math.max(14, H * 0.04)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.45)
      ctx.font = `${Math.max(11, H * 0.028)}px "Noto Sans TC",sans-serif`
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.8)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWin() {
    const { ctx, W, H } = this
    card3(ctx, W * 0.1, H * 0.1, W * 0.8, H * 0.8)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#6b4a1b'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    ctx.fillText('🎉 彩衣拼回來了!', W / 2, H * 0.22)
    ctx.fillStyle = '#4a3a20'
    wrap3(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.3, W * 0.68, H * 0.047)
    ctx.fillStyle = '#7a5222'
    wrap3(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.55, W * 0.68, H * 0.044)
    ctx.fillStyle = '#4a3a20'
    wrap3(ctx, T.teach, W / 2, H * 0.68, W * 0.68, H * 0.044)
  }
}

function rounded3(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function card3(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,251,238,0.96)'
  ctx.strokeStyle = '#c8a35a'
  ctx.lineWidth = 3
  rounded3(ctx, x, y, w, h, 18)
  ctx.fill(); ctx.stroke()
}
function wrap3(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
