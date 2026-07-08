// 拾穗的路得(得 2:15-17;2:12)——交換配對⑰第二個活實作(manna 換皮)+★斜線實驗版。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:得 2:15-17、2:12),牧者審核通過前不進大廳卡。
//
// 玩法:收割後的麥田滿是麥穗。點一穗、再點相鄰的一穗交換;排成一排 3 個同款=「拾取」——
//   捆成一捆收進籃裡(不是消失!);上面的麥穗落下來補位、新的從田那頭撒下來;
//   收滿「約有一伊法」(得 2:17),回去見拿俄米——過關!
// ★ 斜線實驗(2026-07-09 牧者拍板,全系列唯一):這塊田「橫、直、斜」都算一排——
//   語意釘在得 2:15-16:波阿斯吩咐僕人**故意從捆裡抽出些留給路得**;連斜著的一排也算數,
//   正是「恩典故意多給一點」的手感。斜線 3 連拾取時畫一條捆繩把三穗綁起來,孩子看得懂是一捆。
// ★ 神學守法(消消樂反向化,同 manna):①配對=捆成一捆收進籃,絕非爆裂消滅;②補位=僕人抽出來留在地下
//   (神藉波阿斯供應);③無步數/時間限制,永不會輸;換不成=溫柔換回;④無可動的手=風吹過麥田溫柔重洗,進度保留;
//   ⑤信息:投靠在耶和華翅膀下的,滿得祂的賞賜(得 2:12)——波阿斯預表基督。
// 年齡三檔:幼(6×6・4 款・收 8 捆)/童(7×7・5 款・12 捆)/青(8×8・5 款・16 捆)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;得 2:12 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const VW = 960
const VH = 540
const SHEAF = 8 // 每拾 8 穗=捆成一捆

const AGES = {
  young: { label: '🐣 幼', desc: '6×6・收 8 捆', size: 6, kinds: 4, goal: 8 },
  kid: { label: '🙂 童', desc: '7×7・收 12 捆', size: 7, kinds: 5, goal: 12 },
  teen: { label: '🔥 青', desc: '8×8・收 16 捆', size: 8, kinds: 5, goal: 16 },
}

// 五款麥穗形態(都是大麥的金黃色系,靠形狀分辨)
const KINDS = ['ear', 'bent', 'double', 'head', 'grain']

const T = {
  title: '🌾 拾穗的路得',
  ref: '路得記 2:15-17',
  intro1: '「波阿斯吩咐僕人說：「她就是在捆中拾取麥穗，也可以容她，不可羞辱她；並要從捆裡抽出些來，留在地下任她拾取，不可叱嚇她。」」(得 2:15-16)',
  how: '收割後的田裡滿是麥穗!點一穗、再點旁邊的一穗交換位置;排成一排 3 個同款就「拾取」捆成一捆,收進籃裡。★這塊田橫、直、連斜的都算一排——因為波阿斯吩咐僕人故意多留給路得!收滿一伊法就回家。放心慢慢撿——沒有步數限制。',
  pick: '天亮了,跟著收割的人下田。選一塊田:',
  hud: (n, goal) => `🌾 已收 ${n}/${goal} 捆`,
  gather: '拾取!捆成一捆',
  cascade: '僕人又抽出些,留在地下…',
  shuffle: '風吹過麥田,穗子換了位置…',
  noswap: '這樣排不成一排——輕輕放回去',
  closeLine: '將所拾取的打了，約有一伊法大麥。(得 2:17)',
  winTitle: '🎉 滿滿一伊法,回去見拿俄米!',
  winVerse: '願耶和華照你所行的賞賜你。你來投靠耶和華─以色列　神的翅膀下，願你滿得他的賞賜。',
  winRef: '路得記 2:12',
  teach: '路得殷勤地撿,波阿斯慷慨地留——他吩咐僕人故意抽出些留在地下,連斜著的一排也算數:恩典總是多給一點。這位善待外邦女子的波阿斯,預表我們的救贖主耶穌;凡投靠在耶和華翅膀下的,必滿得祂的賞賜。',
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
    this._onResize = () => this._resize()
    this.grid = [] // [r][c] = { kind, dy }
    this.sel = null
    this.lock = 0
    this.collected = 0 // 已拾穗數
    this.flyers = [] // 收進籃的動畫
    this.bands = [] // 捆繩動畫 {ax,ay,bx,by,t,dur}(斜線可讀性的關鍵)
    this.pending = null // 兩拍拾取:亮著等收的那幾排(Set "r,c")
    this.shakeBack = null
    this.toasts = []
    this.closeT = 0
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

  _kindsPool() { return KINDS.slice(0, this.cfg.kinds) }
  _rand() { const p = this._kindsPool(); return p[Math.floor(Math.random() * p.length)] }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    const n = this.cfg.size
    // 起手盤:保證無現成 3 連(含兩條斜向——本關斜的也算)
    this.grid = []
    for (let r = 0; r < n; r++) {
      this.grid.push([])
      for (let c = 0; c < n; c++) {
        let k
        do { k = this._rand() } while (
          (c >= 2 && this.grid[r][c - 1].kind === k && this.grid[r][c - 2].kind === k) ||
          (r >= 2 && this.grid[r - 1][c].kind === k && this.grid[r - 2][c].kind === k) ||
          (r >= 2 && c >= 2 && this.grid[r - 1][c - 1].kind === k && this.grid[r - 2][c - 2].kind === k) ||
          (r >= 2 && c + 2 < n && this.grid[r - 1][c + 1].kind === k && this.grid[r - 2][c + 2].kind === k)
        )
        this.grid[r].push({ kind: k, dy: -(n - r) * 40 - 60 })
      }
    }
    this.sel = null
    this.lock = 0.5
    this.collected = 0
    this.flyers = []
    this.bands = []
    this.pending = null
    this.toasts = []
    this.state = 'play'
    if (!this._hasMove()) this._shuffle(false)
  }

  _sheaves() { return Math.floor(this.collected / SHEAF) }

  _geo() {
    const n = this.cfg.size
    const D = Math.min(420 / n, 58)
    const bw = D * n
    return { n, D, x0: VW * 0.40 - bw / 2, y0: (VH - bw) / 2 + 14 }
  }
  _cellXY(r, c, g) { return { x: g.x0 + c * g.D + g.D / 2, y: g.y0 + r * g.D + g.D / 2 } }

  // —— 配對邏輯:四方向掃 run(橫/直/↘斜/↙斜——本關的招牌就是斜的也算) ——
  _scanRuns(grid) {
    const n = this.cfg.size
    const hit = new Set(), runs = []
    const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]]
    for (const [dr, dc] of DIRS) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const k = grid[r][c].kind
        if (!k) continue
        const pr = r - dr, pc = c - dc
        if (pr >= 0 && pr < n && pc >= 0 && pc < n && grid[pr][pc].kind === k) continue // 非起點
        let len = 0
        while (true) {
          const rr = r + dr * len, cc = c + dc * len
          if (rr < 0 || rr >= n || cc < 0 || cc >= n || grid[rr][cc].kind !== k) break
          len++
        }
        if (len >= 3) {
          const cells = []
          for (let i = 0; i < len; i++) { const rr = r + dr * i, cc = c + dc * i; hit.add(rr + ',' + cc); cells.push([rr, cc]) }
          runs.push(cells)
        }
      }
    }
    return { hit, runs }
  }
  _findMatches(grid) { return this._scanRuns(grid).hit }

  // 放 k 到 (r,c) 會不會立刻成 3 連(四方向)。給補位「軟迴避」用——
  // 四方向讓連鎖極易失控(實測一手可雪崩 80+ 穗直接過關),補位重擲最多 2 次壓下來;
  // 偶爾仍會連鎖(「僕人又抽出些」的恩典感保留),但不再一手清盤。
  _wouldMatchAt(r, c, k) {
    const n = this.cfg.size, g = this.grid
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let cnt = 1
      for (const s2 of [1, -1]) {
        let rr = r + dr * s2, cc = c + dc * s2
        while (rr >= 0 && rr < n && cc >= 0 && cc < n && g[rr][cc].kind === k) { cnt++; rr += dr * s2; cc += dc * s2 }
      }
      if (cnt >= 3) return true
    }
    return false
  }

  _hasMove() {
    const n = this.cfg.size
    const g = this.grid
    const trySwap = (r1, c1, r2, c2) => {
      const a = g[r1][c1].kind, b = g[r2][c2].kind
      g[r1][c1].kind = b; g[r2][c2].kind = a
      const ok = this._findMatches(g).size > 0
      g[r1][c1].kind = a; g[r2][c2].kind = b
      return ok
    }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (c + 1 < n && trySwap(r, c, r, c + 1)) return true
      if (r + 1 < n && trySwap(r, c, r + 1, c)) return true
    }
    return false
  }

  _shuffle(toast = true) {
    const n = this.cfg.size
    const flat = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) flat.push(this.grid[r][c].kind)
    let tries = 0
    do {
      for (let i = flat.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [flat[i], flat[j]] = [flat[j], flat[i]] }
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { this.grid[r][c].kind = flat[r * n + c]; this.grid[r][c].dy = -40 }
    } while ((this._findMatches(this.grid).size > 0 || !this._hasMove()) && ++tries < 60)
    this.lock = 0.4
    if (toast) { this.toasts.push({ text: T.shuffle, t: this._t }); this._tone(320, 0.15, 0, 'sine', 0.07) }
  }

  // 拾取分兩拍(牧者定案:慢一點,讓人看清是哪幾排被收):
  // ①_markPending:先亮捆繩+高亮那幾排,停 0.7 秒 ②_clearPending:才真的收進籃、補位。
  _markPending() {
    const g = this._geo()
    const { hit, runs } = this._scanRuns(this.grid)
    if (!hit.size) return false
    this.pending = hit
    for (const cells of runs) {
      const a = this._cellXY(cells[0][0], cells[0][1], g)
      const b = this._cellXY(cells[cells.length - 1][0], cells[cells.length - 1][1], g)
      this.bands.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 1.3, dur: 1.3 })
    }
    this._tone(392, 0.12, 0, 'triangle', 0.09)
    return true
  }

  _clearPending() {
    const g = this._geo()
    const hit = this.pending
    this.pending = null
    if (!hit || !hit.size) return 0
    for (const key of hit) {
      const [r, c] = key.split(',').map(Number)
      if (!this.grid[r][c].kind) continue
      const p = this._cellXY(r, c, g)
      this.flyers.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, kind: this.grid[r][c].kind, t: 0 })
      this.grid[r][c].kind = null
    }
    const n = this.cfg.size
    for (let c = 0; c < n; c++) {
      let write = n - 1
      for (let r = n - 1; r >= 0; r--) {
        if (this.grid[r][c].kind) {
          if (write !== r) {
            this.grid[write][c].kind = this.grid[r][c].kind
            this.grid[write][c].dy = -(write - r) * g.D
            this.grid[r][c].kind = null
          }
          write--
        }
      }
      for (let r = write; r >= 0; r--) {
        let k, tries = 0
        do { k = this._rand() } while (++tries < 3 && this._wouldMatchAt(r, c, k))
        this.grid[r][c].kind = k
        this.grid[r][c].dy = -(write + 1) * g.D - 60
      }
    }
    this._tone(523, 0.1, 0, 'triangle', 0.1); this._tone(659, 0.14, 0.08, 'triangle', 0.1)
    return hit.size
  }

  _update(dt) {
    if (this.state === 'close') {
      this.closeT -= dt
      if (this.closeT <= 0) this._win()
    }
    if (this.grid.length) {
      for (const row of this.grid) for (const cell of row) {
        if (cell.dy) { cell.dy += (0 - cell.dy) * Math.min(1, dt * 9); if (Math.abs(cell.dy) < 1) cell.dy = 0 }
      }
    }
    if (this.lock > 0) {
      this.lock -= dt
      if (this.lock <= 0 && this.state === 'play') {
        if (this.pending) {
          // 第二拍:真的收進籃(慢節奏,先前已亮 0.7 秒讓人看清)
          const got = this._clearPending()
          if (got) {
            this.collected += got
            this.toasts.push({ text: this.collected % SHEAF === 0 ? T.gather : T.cascade, t: this._t })
          }
          this.lock = 0.55
        } else if (this._markPending()) {
          this.lock = 0.7 // 第一拍:捆繩亮著,看清是哪幾排
        } else if (this._sheaves() >= this.cfg.goal) {
          this.state = 'close'
          this.closeT = 2.2
          this._tone(392, 0.2, 0, 'triangle', 0.1); this._tone(523, 0.3, 0.18, 'triangle', 0.1)
        } else if (!this._hasMove()) this._shuffle()
      }
    }
    if (this.shakeBack) { this.shakeBack.t -= dt; if (this.shakeBack.t <= 0) this.shakeBack = null }
    for (const f of this.flyers) {
      f.t += dt * 0.9 // 飛進籃也放慢,看得見收了什麼
      const k = Math.min(1, f.t)
      const ease = k * k * (3 - 2 * k)
      f.x = f.sx + (BASKET.x - f.sx) * ease
      f.y = f.sy + (BASKET.y - f.sy) * ease - Math.sin(k * Math.PI) * 60
    }
    this.flyers = this.flyers.filter((f) => f.t < 1)
    for (const b of this.bands) b.t -= dt
    this.bands = this.bands.filter((b) => b.t > 0)
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'glean' }) }, 900)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
    }
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
    if (this.state !== 'play' || this.lock > 0) return
    const g = this._geo()
    const c = Math.floor((x - g.x0) / g.D)
    const r = Math.floor((y - g.y0) / g.D)
    if (r < 0 || c < 0 || r >= g.n || c >= g.n) { this.sel = null; return }
    if (!this.sel) { this.sel = { r, c }; this._tone(500, 0.05, 0, 'sine', 0.05); return }
    const { r: r0, c: c0 } = this.sel
    if (r0 === r && c0 === c) { this.sel = null; return }
    const adjacent = Math.abs(r0 - r) + Math.abs(c0 - c) === 1
    if (!adjacent) { this.sel = { r, c }; this._tone(500, 0.05, 0, 'sine', 0.05); return }
    const a = this.grid[r0][c0], b = this.grid[r][c]
    ;[a.kind, b.kind] = [b.kind, a.kind]
    if (this._findMatches(this.grid).size > 0) {
      this.sel = null
      this.lock = 0.05
      this._tone(440, 0.06, 0, 'sine', 0.07)
    } else {
      ;[a.kind, b.kind] = [b.kind, a.kind]
      this.shakeBack = { a: { r: r0, c: c0 }, b: { r, c }, t: 0.35 }
      this.toasts.push({ text: T.noswap, t: this._t })
      this.sel = null
      this._tone(220, 0.1, 0, 'sine', 0.06)
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
    // 收割季的金色麥田
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#cfe0ec'); sky.addColorStop(0.5, '#e8d9a8'); sky.addColorStop(1, '#c8a95e')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    const g = this._geo()
    // 田面
    ctx.fillStyle = 'rgba(150,118,58,0.25)'
    rGl(ctx, g.x0 - 10, g.y0 - 10, g.D * g.n + 20, g.D * g.n + 20, 14); ctx.fill()
    ctx.strokeStyle = 'rgba(120,94,44,0.18)'; ctx.lineWidth = 1
    for (let i = 1; i < g.n; i++) {
      ctx.beginPath(); ctx.moveTo(g.x0 + i * g.D, g.y0); ctx.lineTo(g.x0 + i * g.D, g.y0 + g.n * g.D); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(g.x0, g.y0 + i * g.D); ctx.lineTo(g.x0 + g.n * g.D, g.y0 + i * g.D); ctx.stroke()
    }
    // 麥穗
    for (let r = 0; r < g.n; r++) for (let c = 0; c < g.n; c++) {
      const cell = this.grid[r][c]
      if (!cell.kind) continue
      const p = this._cellXY(r, c, g)
      let dx = 0
      if (this.shakeBack) {
        const sb = this.shakeBack
        if ((sb.a.r === r && sb.a.c === c) || (sb.b.r === r && sb.b.c === c)) dx = Math.sin(this._t * 40) * 3
      }
      const selHere = this.sel && this.sel.r === r && this.sel.c === c
      if (selHere) {
        ctx.strokeStyle = '#c07830'; ctx.lineWidth = 3
        rGl(ctx, g.x0 + c * g.D + 3, g.y0 + r * g.D + 3, g.D - 6, g.D - 6, 10); ctx.stroke()
      }
      const pendHere = this.pending && this.pending.has(r + ',' + c)
      if (pendHere) { // 兩拍拾取第一拍:整排亮金光,看清要收哪些
        ctx.fillStyle = 'rgba(255,214,110,0.4)'
        rGl(ctx, g.x0 + c * g.D + 2, g.y0 + r * g.D + 2, g.D - 4, g.D - 4, 10); ctx.fill()
      }
      this._wheat(p.x + dx, p.y + cell.dy, g.D * 0.38, cell.kind, selHere || pendHere)
    }
    // 捆繩(拾取的一排——斜的也一眼看懂)
    for (const b of this.bands) {
      const k = b.t / (b.dur || 0.45)
      ctx.globalAlpha = k
      ctx.strokeStyle = '#8a5a20'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.bx, b.by); ctx.stroke()
      ctx.strokeStyle = '#d8a850'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.bx, b.by); ctx.stroke()
      // 繩結
      const mx = (b.ax + b.bx) / 2, my = (b.ay + b.by) / 2
      ctx.fillStyle = '#8a5a20'
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, 7); ctx.fill()
      ctx.globalAlpha = 1
    }
    // 收進籃的飛行麥穗
    for (const f of this.flyers) this._wheat(f.x, f.y, 15 * (1 - f.t * 0.3), f.kind)
    // 右側:伊法籃
    this._basket()
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#4a3810'; ctx.strokeStyle = 'rgba(255,250,232,0.9)'; ctx.lineWidth = 4
      ctx.font = 'bold 19px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW * 0.40, 40 - k * 14)
      ctx.fillText(t.text, VW * 0.40, 40 - k * 14)
      ctx.globalAlpha = 1
    }
    if (this.state === 'close' || this.state === 'win') {
      ctx.fillStyle = '#4a3810'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(T.closeLine, VW / 2, VH - 26)
    }
    // HUD
    ctx.fillStyle = 'rgba(74,56,16,0.62)'
    rGl(ctx, VW * 0.17, VH - 44, VW * 0.46, 30, 12); ctx.fill()
    ctx.fillStyle = '#faf4dc'
    ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(this._sheaves(), this.cfg.goal)} ・ 點兩穗相鄰的交換・斜的也算!`, VW * 0.40, VH - 24)
    ctx.restore()
    if (this.state === 'win') this._drawWinCard()
  }

  // 右側伊法籃:編織筐+麥堆隨進度升高;完成的捆立在籃旁
  _basket() {
    const { ctx } = this
    const bx = BASKET.x, by = 150
    const bw = 120, bh = 190
    const frac = Math.min(1, this.collected / (this.cfg.goal * SHEAF))
    // 麥堆(在筐口冒出來)
    if (frac > 0.85) {
      ctx.fillStyle = '#e0b860'
      ctx.beginPath(); ctx.ellipse(bx, by + 14, bw * 0.42, 16 + (frac - 0.85) * 60, 0, 0, 7); ctx.fill()
    }
    // 編織筐(上寬下窄)
    ctx.fillStyle = '#a87838'
    ctx.beginPath()
    ctx.moveTo(bx - bw / 2, by + 16)
    ctx.lineTo(bx - bw * 0.34, by + bh)
    ctx.lineTo(bx + bw * 0.34, by + bh)
    ctx.lineTo(bx + bw / 2, by + 16)
    ctx.closePath(); ctx.fill()
    // 編織紋
    ctx.strokeStyle = 'rgba(120,80,30,0.5)'; ctx.lineWidth = 2
    for (let i = 1; i < 5; i++) {
      const yy = by + 16 + (bh - 16) * (i / 5)
      const half = bw / 2 - (bw * 0.16) * (i / 5)
      ctx.beginPath(); ctx.moveTo(bx - half, yy); ctx.lineTo(bx + half, yy); ctx.stroke()
    }
    // 筐內麥子水位(挖個窗看進度)
    const wy = by + 30, wh = bh - 48
    ctx.fillStyle = 'rgba(60,40,14,0.35)'
    rGl(ctx, bx - 26, wy, 52, wh, 8); ctx.fill()
    ctx.fillStyle = '#ecc668'
    const fh = wh * frac
    rGl(ctx, bx - 22, wy + wh - fh - 3 + 3, 44, fh, 6); ctx.fill()
    // 筐口
    ctx.strokeStyle = '#7a5424'; ctx.lineWidth = 5
    ctx.beginPath(); ctx.ellipse(bx, by + 16, bw / 2, 12, 0, 0, 7); ctx.stroke()
    ctx.fillStyle = '#4a3810'
    ctx.font = 'bold 14px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('伊法籃', bx, by - 26)
    ctx.font = '13px "Noto Sans TC",sans-serif'
    ctx.fillText(`${this._sheaves()}/${this.cfg.goal} 捆`, bx, by + bh + 22)
  }

  // 一株麥穗(五款:直穗/彎穗/雙穗/穗頭/散粒——都是金黃色系,形狀分辨)
  _wheat(x, y, r, kind, glow = false) {
    const { ctx } = this
    if (glow) {
      ctx.fillStyle = 'rgba(255,230,160,0.35)'
      ctx.beginPath(); ctx.arc(x, y, r * 1.4, 0, 7); ctx.fill()
    }
    const grain = (gx, gy, gr, ang, fill) => {
      ctx.fillStyle = fill
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(ang)
      ctx.beginPath(); ctx.ellipse(0, 0, gr * 0.42, gr, 0, 0, 7); ctx.fill()
      ctx.restore()
    }
    if (kind === 'ear') { // 直穗:一根直桿+兩排麥粒
      ctx.strokeStyle = '#a8862a'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y - r * 0.9); ctx.stroke()
      for (let i = 0; i < 4; i++) {
        const yy = y - r * 0.75 + i * r * 0.42
        grain(x - r * 0.3, yy, r * 0.3, -0.5, '#e6c268')
        grain(x + r * 0.3, yy, r * 0.3, 0.5, '#e6c268')
      }
      grain(x, y - r * 0.95, r * 0.32, 0, '#e6c268')
    } else if (kind === 'bent') { // 彎穗:桿子彎腰(飽滿低頭)
      ctx.strokeStyle = '#a8862a'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x - r * 0.5, y + r)
      ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.6, x + r * 0.55, y - r * 0.35); ctx.stroke()
      for (let i = 0; i < 4; i++) {
        const k2 = i / 3
        grain(x + r * (0.1 + k2 * 0.5), y - r * (0.5 - k2 * 0.15), r * 0.3, 1.2, '#d8ae4e')
      }
    } else if (kind === 'double') { // 雙穗:兩根小穗成 V
      ctx.strokeStyle = '#a8862a'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - r * 0.45, y - r * 0.7); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x + r * 0.45, y - r * 0.7); ctx.stroke()
      for (let i = 0; i < 3; i++) {
        grain(x - r * (0.25 + i * 0.1), y - r * (0.15 + i * 0.28), r * 0.26, -0.4, '#ecd088')
        grain(x + r * (0.25 + i * 0.1), y - r * (0.15 + i * 0.28), r * 0.26, 0.4, '#ecd088')
      }
    } else if (kind === 'head') { // 穗頭:短胖一束(掉下來的穗頭)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        grain(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.34, a + 1.57, '#dcb85e')
      }
      grain(x, y, r * 0.36, 0, '#e8c876')
    } else { // grain 散粒:一小撮麥粒
      const pts = [[-0.5, -0.15], [0.1, -0.5], [0.55, 0.1], [0.1, 0.5], [-0.4, 0.4]]
      for (const [ux, uy] of pts) grain(x + ux * r, y + uy * r, r * 0.3, ux + uy, '#e2c26a')
    }
  }

  _drawIntro() {
    const { ctx } = this
    cardGl(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a4210'
    ctx.font = 'bold 34px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.16)
    ctx.fillStyle = '#8a7440'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 投靠在祂翅膀下', VW / 2, VH * 0.23)
    ctx.fillStyle = '#3e3212'
    wrapGl(ctx, T.intro1, VW / 2, VH * 0.3, VW * 0.68, 23)
    wrapGl(ctx, T.how, VW / 2, VH * 0.49, VW * 0.68, 23)
    ctx.fillStyle = '#8a7440'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.7)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.75
      ctx.fillStyle = '#d8bc68'
      rGl(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#3a2a04'
      ctx.font = 'bold 21px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.42)
      ctx.font = '13px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.78)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawWinCard() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.1, y = H * 0.07, w = W * 0.8, h = H * 0.86
    ctx.fillStyle = '#fdf9ec' // 全不透明
    ctx.strokeStyle = '#b09850'; ctx.lineWidth = 3
    rGl(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a4210'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.16)
    ctx.fillStyle = '#8a7440'
    ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC",sans-serif`
    ctx.fillText(`收滿 ${this.cfg.goal} 捆——約有一伊法大麥`, W / 2, H * 0.24)
    ctx.fillStyle = '#3e3212'
    wrapGl(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.33, W * 0.68, H * 0.047)
    ctx.fillStyle = '#3e3212'
    wrapGl(ctx, T.teach, W / 2, H * 0.56, W * 0.68, H * 0.044)
    ctx.restore()
  }
}

const BASKET = { x: 820, y: 200 }

function rGl(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardGl(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(253,249,236,0.96)'
  ctx.strokeStyle = '#b09850'; ctx.lineWidth = 3
  rGl(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapGl(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
