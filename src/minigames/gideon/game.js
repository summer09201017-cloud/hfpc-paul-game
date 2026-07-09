// 基甸拆祭壇(士 6:25-27)——系列第一個「打磚塊」關(新類型⑪,夜裡奉命拆假壇)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:士 6:25-27、約翰一書 5:21),牧者審核通過前不進大廳卡。
//
// 玩法:夜裡,火把光下。左右移動木槓,彈起石球,把巴力壇的石塊一塊一塊拆下來;
//   最後砍下壇旁的木偶,再看見「為耶和華築一座壇」——過關!
// ★ 神學守法:①這關「拆」是對的——是耶和華當夜親口吩咐基甸拆巴力壇(士 6:25),立場全對;
//   ⚠ 絕不可把本關換皮成耶利哥(耶利哥的牆是神使它塌陷的,不是人砸的——jericho skill 鐵則);
//   ②石球掉出去=僕人悄悄撿回來,不扣命、永不會輸(基甸帶了十個僕人,士 6:27);
//   ③拆毀不畫成火爆:石塊淡淡碎落、輕輕的聲音(他們夜間行事,不敢張揚);
//   ④拆完必接「築真壇」一幕——信息是「先拆假的,才立真的」,不是破壞本身。
// 年齡三檔:幼(球慢・槓寬・磚 3 層)/童(標準・4 層)/青(快・槓窄・5 層)。
// 2026-07-09 牧者拍板加料(⚠ 道具文案待牧者審核):
//   ①滑鼠不必按住,左右移動木槓就跟著(觸控維持拖曳);
//   ②拆下石塊偶爾掉「應許卷軸」——道具名=士師記 6 章神對基甸的原話(不是把屬靈詞彙當抽獎品,
//     是「神的話壯膽」:接住應許,手上就有力):
//     📜「大能的勇士啊,耶和華與你同在!」(6:12)=多一顆石球(同在壯膽,人手加倍)
//     📜「你靠著你這能力去」(6:14)=木槓加寬 8 秒(神所賜的能力接得住更多)
//     📜「我與你同在,你就必擊打米甸人」(6:16)=石鑿連發 4 秒(工匠鑿石,不是開槍——孩子模仿也安全)
//   ③沒接到的卷軸落地就淡去,不懲罰;道具只在「拆假壇」段有效——神吩咐拆的才拆。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。
// 朗讀鐵則:過關經文走 speakScripture(mp3 優先;士 6:27 同輪烤,見 scripts/tts-verses.json)。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

// bhp=每塊壇石要撞幾下才全碎(2026-07-09 牧者點名加難:石壇是砌實的,多敲幾下才拆得下來;
//   裂痕隨傷勢漸進,看得見進度)。木偶維持 2 下(文案「木偶搖晃了…」對應,不動)。
//   配套:應許卷軸掉落率 0.22→0.3、場上上限 2→3,免得節奏拖過兒童營單局長度。
const AGES = {
  young: { label: '🐣 幼', desc: '球慢・槓寬・石塊 2 下', speed: 240, padW: 190, rows: 3, bhp: 2 },
  kid: { label: '🙂 童', desc: '標準・石塊 3 下', speed: 310, padW: 150, rows: 4, bhp: 3 },
  teen: { label: '🔥 青', desc: '球快・槓窄・石塊 4 下', speed: 380, padW: 112, rows: 5, bhp: 4 },
}

// 固定虛擬座標(960×540,uniform scale 置中),物理全在這個空間算
const VW = 960
const VH = 540

const T = {
  title: '⚒️ 基甸拆祭壇',
  ref: '士師記 6:25-27',
  intro1: '「當那夜，耶和華吩咐基甸說：…拆毀你父親為巴力所築的壇，砍下壇旁的木偶…」(士 6:25)',
  how: '夜裡,火把光下。滑鼠左右移動(或 ←→、手指拖)木槓,彈起石球拆掉巴力壇的石塊,最後砍下木偶。拆石塊會掉下「應許卷軸」——用木槓接住,神的話使手有力!別怕球掉下去——僕人會悄悄撿回來!',
  pick: '夜色安靜。選一段工程:',
  hud: (left) => `⚒️ 還剩 ${left} 塊`,
  drop: '僕人悄悄把石球撿回來了',
  pow1: '「大能的勇士啊，耶和華與你同在！」(士 6:12)——多一顆石球!',
  pow2: '「你靠著你這能力去」(士 6:14)——木槓加寬!',
  pow3: '「我與你同在，你就必擊打米甸人」(士 6:16)——石鑿連發!',
  pole1: '木偶搖晃了…',
  pole2: '砍下壇旁的木偶!',
  build: '在這磐石上,為耶和華─你的　神築一座壇。(士 6:26)',
  winTitle: '🎉 照著耶和華吩咐的行了!',
  winVerse: '基甸就從他僕人中挑了十個人，照著耶和華吩咐他的行了。',
  winRef: '士師記 6:27',
  teachVerse: '小子們哪，你們要自守，遠避偶像！',
  teachRef: '約翰一書 5:21',
  teach: '神吩咐基甸:先拆掉假神的壇,才為耶和華築真的壇。基甸雖然害怕,還是在夜裡照著吩咐做了。心裡佔了神位置的東西,也求神幫助我們一塊一塊拆下來。',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → build → win
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._keys = {}
    this._onKeyDown = (e) => this._key(e)
    this._onKeyUp = (e) => { this._keys[e.key] = false }
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = () => { this._drag = false }
    this._onResize = () => this._resize()
    this.bricks = [] // {x,y,w,h,hp,pole?,fade?}
    this.dust = [] // 碎落微塵 {x,y,vx,vy,t}
    this.padX = VW / 2
    this.balls = [] // 多球:{x,y,vx,vy,stuck,returning,r}(應許 6:12 會多球)
    this.drops = [] // 掉落的應許卷軸 {x,y,vy,kind:'presence'|'strength'|'strike',t}
    this.chisels = [] // 飛出的石鑿 {x,y,vy}
    this.wideT = 0 // 木槓加寬剩餘秒(士 6:14)
    this.chiselT = 0 // 石鑿連發剩餘秒(士 6:16)
    this.chiselCd = 0
    this.toasts = []
    this.buildT = 0
    this._drag = false
    this._audio = null
    this._stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 137.5) % VW, y: ((i * 61) % 200), tw: (i % 7) / 7 }))
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
    this.padX = VW / 2
    this.toasts = []
    this.dust = []
    this.buildT = 0
    // 巴力壇:金字塔式石層(下寬上窄)+頂上的木偶(2 下才倒)
    this.bricks = []
    const bw = 74, bh = 26, gap = 6
    const topY = 132 // 頂層石的 y;木偶在其上方,要留空別被 HUD 蓋住
    for (let r = 0; r < this.cfg.rows; r++) {
      const n = 8 - r
      const y = topY + (this.cfg.rows - 1 - r) * (bh + gap)
      const x0 = VW / 2 - (n * (bw + gap) - gap) / 2
      for (let i = 0; i < n; i++) this.bricks.push({ x: x0 + i * (bw + gap), y, w: bw, h: bh, hp: this.cfg.bhp, maxHp: this.cfg.bhp })
    }
    const poleY = topY - (bh + gap) - 34
    this.bricks.push({ x: VW / 2 - 13, y: poleY, w: 26, h: 56, hp: 2, pole: true })
    this.drops = []
    this.chisels = []
    this.wideT = 0
    this.chiselT = 0
    this._resetBall()
    this.state = 'play'
  }

  // 木槓有效寬度(士 6:14 應許加寬 1.5 倍)
  _padW() { return this.cfg.padW * (this.wideT > 0 ? 1.5 : 1) }

  _newBall() {
    return { x: this.padX, y: VH - 58, vx: 0, vy: 0, stuck: true, returning: false, r: 10 }
  }

  _resetBall() {
    this.balls = [this._newBall()]
  }

  _launch(ball) {
    const b = ball || this.balls.find((k) => k.stuck)
    if (!b || !b.stuck) return
    const a = -Math.PI / 2 + (Math.random() * 0.5 - 0.25)
    b.vx = Math.cos(a) * this.cfg.speed
    b.vy = Math.sin(a) * this.cfg.speed
    b.stuck = false
  }

  // 接住應許卷軸(士 6 神對基甸的原話——神的話壯膽,手上就有力)
  _applyDrop(kind) {
    if (kind === 'presence') { // 6:12 同在=多一顆石球
      const nb = this._newBall()
      nb.stuck = false
      const a = -Math.PI / 2 + (Math.random() * 0.9 - 0.45)
      nb.vx = Math.cos(a) * this.cfg.speed
      nb.vy = Math.sin(a) * this.cfg.speed
      this.balls.push(nb)
      this.toasts.push({ text: T.pow1, t: this._t })
      this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(659, 0.16, 0.1, 'triangle', 0.1)
    } else if (kind === 'strength') { // 6:14 能力=木槓加寬
      this.wideT = 8
      this.toasts.push({ text: T.pow2, t: this._t })
      this._tone(440, 0.12, 0, 'triangle', 0.1); this._tone(587, 0.16, 0.1, 'triangle', 0.1)
    } else { // strike 6:16 擊打=石鑿連發(工匠鑿石,不是開槍)
      this.chiselT = 4
      this.chiselCd = 0
      this.toasts.push({ text: T.pow3, t: this._t })
      this._tone(494, 0.12, 0, 'triangle', 0.1); this._tone(740, 0.16, 0.1, 'triangle', 0.1)
    }
  }

  // 石塊被拆時的共用結尾(球與石鑿都走這裡):碎塵+機率掉應許卷軸
  _brickDown(k) {
    k.fade = 0.5
    for (let i = 0; i < 6; i++) this.dust.push({ x: k.x + k.w / 2, y: k.y + k.h / 2, vx: (Math.random() - 0.5) * 60, vy: 20 + Math.random() * 50, t: 0.7 })
    if (!k.pole && Math.random() < 0.3 && this.drops.length < 3) {
      const r = Math.random()
      const kind = r < 0.4 ? 'presence' : r < 0.75 ? 'strength' : 'strike'
      this.drops.push({ x: k.x + k.w / 2, y: k.y + k.h / 2, vy: 92, kind })
    }
  }

  _update(dt) {
    if (this.state === 'build') {
      this.buildT -= dt
      if (this.buildT <= 0) this._win()
      return
    }
    if (this.state !== 'play') return
    // 木槓移動(鍵盤/拖曳/滑鼠跟隨)
    const mv = (this._keys.ArrowLeft || this._keys.a ? -1 : 0) + (this._keys.ArrowRight || this._keys.d ? 1 : 0)
    this.padX = Math.max(this._padW() / 2, Math.min(VW - this._padW() / 2, this.padX + mv * dt * 520))
    // 應許效果倒數
    if (this.wideT > 0) this.wideT -= dt
    if (this.chiselT > 0) {
      this.chiselT -= dt
      this.chiselCd -= dt
      if (this.chiselCd <= 0) { // 石鑿連發(工匠鑿石)
        this.chisels.push({ x: this.padX, y: VH - 52 })
        this.chiselCd = 0.33
        this._tone(320, 0.04, 0, 'square', 0.04)
      }
    }
    const py = VH - 46
    for (const b of this.balls) {
      if (b.stuck) {
        b.x = this.padX; b.y = VH - 58
        if (this._keys[' '] || this._keys.ArrowUp) this._launch(b)
      } else if (b.returning) {
        // 僕人撿回:球緩緩飄回木槓上
        b.x += (this.padX - b.x) * Math.min(1, dt * 3)
        b.y += (VH - 58 - b.y) * Math.min(1, dt * 3)
        if (Math.abs(b.y - (VH - 58)) < 4) { b.returning = false; b.stuck = true }
      } else {
        b.x += b.vx * dt
        b.y += b.vy * dt
        // 牆
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) }
        if (b.x > VW - b.r) { b.x = VW - b.r; b.vx = -Math.abs(b.vx) }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) }
        // 木槓(依打點改角度;應許 6:14 生效時更寬)
        const pw = this._padW()
        if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + 18 && Math.abs(b.x - this.padX) <= pw / 2 + b.r) {
          const k = (b.x - this.padX) / (pw / 2)
          const a = -Math.PI / 2 + k * 1.05
          const sp = Math.hypot(b.vx, b.vy)
          b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp
          b.y = py - b.r
          this._tone(200, 0.06, 0, 'sine', 0.07)
        }
        // 掉出去:多球時悄悄收走一顆;最後一顆=僕人撿回(不扣命)
        if (b.y > VH + 30) {
          if (this.balls.filter((k) => !k.dead).length > 1) {
            b.dead = true
          } else {
            b.returning = true
            this.toasts.push({ text: T.drop, t: this._t })
            this._tone(260, 0.2, 0, 'sine', 0.06)
          }
        }
        // 磚(壇石/木偶)
        for (const k of this.bricks) {
          if (k.fade) continue
          if (b.x + b.r < k.x || b.x - b.r > k.x + k.w || b.y + b.r < k.y || b.y - b.r > k.y + k.h) continue
          // 反彈軸:比較穿透深度
          const ox = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r))
          const oy = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r))
          if (ox < oy) b.vx = b.x < k.x + k.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx)
          else b.vy = b.y < k.y + k.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy)
          k.hp -= 1
          if (k.pole) {
            this.toasts.push({ text: k.hp > 0 ? T.pole1 : T.pole2, t: this._t })
            this._tone(k.hp > 0 ? 180 : 140, 0.16, 0, 'sine', 0.1)
          } else this._tone(170, 0.07, 0, 'sine', 0.08)
          if (k.hp <= 0) this._brickDown(k)
          else if (!k.pole) for (let i = 0; i < 2; i++) this.dust.push({ x: b.x, y: k.y + k.h, vx: (Math.random() - 0.5) * 40, vy: 12 + Math.random() * 30, t: 0.45 }) // 還沒碎:敲下小碎屑
          break
        }
      }
    }
    this.balls = this.balls.filter((b) => !b.dead)
    // 石鑿飛行與碎石
    for (const c of this.chisels) {
      c.y -= 430 * dt
      if (c.y < -20) { c.dead = true; continue }
      for (const k of this.bricks) {
        if (k.fade) continue
        if (c.x < k.x - 4 || c.x > k.x + k.w + 4 || c.y > k.y + k.h || c.y + 18 < k.y) continue
        k.hp -= 1
        c.dead = true
        if (k.pole) {
          this.toasts.push({ text: k.hp > 0 ? T.pole1 : T.pole2, t: this._t })
          this._tone(k.hp > 0 ? 180 : 140, 0.16, 0, 'sine', 0.1)
        } else this._tone(190, 0.05, 0, 'sine', 0.07)
        if (k.hp <= 0) this._brickDown(k)
        else if (!k.pole) for (let i = 0; i < 2; i++) this.dust.push({ x: c.x, y: k.y + k.h, vx: (Math.random() - 0.5) * 40, vy: 12 + Math.random() * 30, t: 0.45 })
        break
      }
    }
    this.chisels = this.chisels.filter((c) => !c.dead)
    // 應許卷軸下落與接取
    for (const d of this.drops) {
      d.y += d.vy * dt
      if (d.y >= py - 8 && d.y <= py + 22 && Math.abs(d.x - this.padX) <= this._padW() / 2 + 16) {
        d.dead = true
        this._applyDrop(d.kind)
      } else if (d.y > VH + 20) d.dead = true // 沒接到=落地淡去,不懲罰
    }
    this.drops = this.drops.filter((d) => !d.dead)
    for (const k of this.bricks) if (k.fade != null) k.fade -= dt
    this.bricks = this.bricks.filter((k) => k.fade == null || k.fade > 0)
    if (!this.bricks.some((k) => k.hp > 0 || (k.fade != null && k.fade > 0))) {
      // 全拆完 → 築真壇一幕
      this.state = 'build'
      this.buildT = 2.6
      this.toasts = []
      this._tone(392, 0.2, 0, 'triangle', 0.1); this._tone(523, 0.3, 0.18, 'triangle', 0.1)
    }
    for (const d of this.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.t -= dt }
    this.dust = this.dust.filter((d) => d.t > 0)
    this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
  }

  _win() {
    this.state = 'win'
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 500)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: 100, level: 'gideon' }) }, 900)
  }

  _key(e) {
    this._keys[e.key] = true
    if (this.state === 'intro') {
      if (e.key === '1') return this._start('young')
      if (e.key === '2' || e.key === 'Enter') return this._start('kid')
      if (e.key === '3') return this._start('teen')
    }
  }

  // 畫布座標 → 虛擬座標
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
    if (this.state === 'play') {
      this._drag = true
      this.padX = Math.max(this._padW() / 2, Math.min(VW - this._padW() / 2, x))
      if (this.balls.some((b) => b.stuck)) this._launch()
    }
  }
  _movePt(e) {
    if (this.state !== 'play') return
    // 滑鼠不必按住也跟隨(牧者點名);觸控天然只在按住時有 pointermove,行為不變
    if (!this._drag && e.pointerType && e.pointerType !== 'mouse') return
    const { x } = this._pt(e)
    this.padX = Math.max(this._padW() / 2, Math.min(VW - this._padW() / 2, x))
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
    // 夜空鋪滿整個畫布
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#101830'); sky.addColorStop(0.7, '#1c2440'); sky.addColorStop(1, '#2a2c46')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    // 星
    for (const st of this._stars) {
      ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(this._t * 0.8 + st.tw * 6.28))
      ctx.fillStyle = '#e8ecff'
      ctx.fillRect(st.x, st.y, 2, 2)
    }
    ctx.globalAlpha = 1
    // 兩側火把
    this._torch(70, VH - 120)
    this._torch(VW - 70, VH - 120)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    if (this.state === 'build' || this.state === 'win') { this._drawBuild(); ctx.restore(); if (this.state === 'win') this._drawWinCard(); return }
    // 巴力壇石塊+木偶
    for (const k of this.bricks) {
      ctx.globalAlpha = k.fade != null ? Math.max(0, k.fade / 0.5) : 1
      if (k.pole) {
        // 木偶(亞舍拉柱):深木色直柱+刻紋
        ctx.fillStyle = '#5a4028'
        rG(ctx, k.x, k.y, k.w, k.h, 5); ctx.fill()
        ctx.strokeStyle = '#3a2814'; ctx.lineWidth = 2
        for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(k.x + 4, k.y + (k.h / 4) * i); ctx.lineTo(k.x + k.w - 4, k.y + (k.h / 4) * i); ctx.stroke() }
        if (k.hp === 1) { // 搖晃裂痕
          ctx.strokeStyle = '#1a1008'
          ctx.beginPath(); ctx.moveTo(k.x + k.w * 0.3, k.y + 6); ctx.lineTo(k.x + k.w * 0.6, k.y + k.h * 0.5); ctx.stroke()
        }
      } else {
        // 傷勢越重石色越暗
        const dmg = (k.maxHp || 1) - Math.max(0, k.hp)
        const shade = Math.min(dmg, 3) * 8
        ctx.fillStyle = `rgb(${106 - shade},${106 - shade},${114 - shade})`
        rG(ctx, k.x, k.y, k.w, k.h, 4); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        rG(ctx, k.x, k.y, k.w, k.h * 0.4, 4); ctx.fill()
        // 裂痕漸進(每挨一下多一道;位置以磚座標定值,不閃爍)
        if (dmg > 0) {
          ctx.strokeStyle = 'rgba(24,26,38,0.7)'
          ctx.lineWidth = 1.6
          for (let c = 0; c < dmg; c++) {
            const seed = (k.x * 7 + k.y * 13 + c * 41) % 100
            const sx = k.x + 8 + ((seed * 0.83) % (k.w - 16))
            const sy = k.y + 3 + ((seed * 0.37) % (k.h * 0.4))
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(sx + ((seed % 3) - 1) * 9 - 4, sy + k.h * 0.4)
            ctx.lineTo(sx + ((seed % 5) - 2) * 6, sy + k.h * 0.82)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
    }
    // 碎落微塵(淡淡的,不是爆炸)
    for (const d of this.dust) {
      ctx.globalAlpha = Math.max(0, d.t / 0.7) * 0.6
      ctx.fillStyle = '#9a9aa2'
      ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1
    // 掉落的應許卷軸(接住=神的話壯膽)
    for (const d of this.drops) {
      const wob = Math.sin(this._t * 5 + d.x) * 3
      ctx.fillStyle = 'rgba(255,224,144,0.25)'
      ctx.beginPath(); ctx.arc(d.x + wob, d.y, 22, 0, 7); ctx.fill()
      ctx.fillStyle = '#f0e2b8'
      rG(ctx, d.x - 13 + wob, d.y - 9, 26, 18, 4); ctx.fill()
      ctx.fillStyle = '#c8a860'
      rG(ctx, d.x - 16 + wob, d.y - 11, 5, 22, 2); ctx.fill()
      rG(ctx, d.x + 11 + wob, d.y - 11, 5, 22, 2); ctx.fill()
      ctx.fillStyle = '#5a4416'
      ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.kind === 'presence' ? '同在' : d.kind === 'strength' ? '能力' : '擊打', d.x + wob, d.y + 4)
    }
    // 石鑿(工匠的鑿子:鐵刃+木柄,不是子彈)
    for (const c of this.chisels) {
      ctx.fillStyle = '#8a6a3e'
      rG(ctx, c.x - 3, c.y + 8, 6, 10, 2); ctx.fill()
      ctx.fillStyle = '#c0c4cc'
      ctx.beginPath(); ctx.moveTo(c.x, c.y - 6); ctx.lineTo(c.x + 4, c.y + 8); ctx.lineTo(c.x - 4, c.y + 8); ctx.closePath(); ctx.fill()
    }
    // 木槓(基甸的隊伍;應許 6:14 生效=更寬+微光)
    const pw = this._padW(), py = VH - 46
    if (this.wideT > 0) {
      ctx.fillStyle = 'rgba(255,224,144,0.2)'
      rG(ctx, this.padX - pw / 2 - 4, py - 4, pw + 8, 22, 9); ctx.fill()
    }
    ctx.fillStyle = '#8a6a3e'
    rG(ctx, this.padX - pw / 2, py, pw, 14, 7); ctx.fill()
    ctx.fillStyle = 'rgba(255,240,200,0.25)'
    rG(ctx, this.padX - pw / 2, py, pw, 5, 7); ctx.fill()
    // 石球(可能不只一顆——士 6:12 同在應許)
    for (const b of this.balls) {
      ctx.fillStyle = '#c8c4b8'
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, b.r * 0.4, 0, 7); ctx.fill()
    }
    if (this.balls.some((b) => b.stuck)) {
      ctx.fillStyle = '#d8dcf0'
      ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('點畫面 / 空白鍵 發球 ・ 滑鼠移動木槓就跟著', VW / 2, VH - 90)
    }
    // 應許效果狀態列(右上,小小的)
    if (this.wideT > 0 || this.chiselT > 0) {
      ctx.fillStyle = '#ffe9a0'
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'right'
      const parts = []
      if (this.wideT > 0) parts.push(`🪵 加寬 ${Math.ceil(this.wideT)}s`)
      if (this.chiselT > 0) parts.push(`⛏ 石鑿 ${Math.ceil(this.chiselT)}s`)
      ctx.fillText(parts.join(' ・ '), VW - 16, 29)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 2
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#f0ead8'; ctx.strokeStyle = 'rgba(20,24,48,0.85)'; ctx.lineWidth = 4
      ctx.font = 'bold 19px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.44 - k * 22)
      ctx.fillText(t.text, VW / 2, VH * 0.44 - k * 22)
      ctx.globalAlpha = 1
    }
    // HUD
    const left = this.bricks.filter((k) => k.hp > 0).length
    ctx.fillStyle = 'rgba(10,16,36,0.62)'
    rG(ctx, VW * 0.24, 8, VW * 0.52, 30, 12); ctx.fill()
    ctx.fillStyle = '#e8e4d0'
    ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${T.hud(left)} ・ ←→ 移動木槓`, VW / 2, 29)
    ctx.restore()
  }

  _torch(x, y) {
    const { ctx } = this
    const glow = ctx.createRadialGradient(x, y - 26, 4, x, y - 26, 130)
    glow.addColorStop(0, 'rgba(255,190,90,0.5)'); glow.addColorStop(1, 'rgba(255,190,90,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(x, y - 26, 130, 0, 7); ctx.fill()
    ctx.fillStyle = '#6a4a26'
    ctx.fillRect(x - 4, y - 20, 8, 52)
    const f = Math.sin(this._t * 9 + x) * 3
    ctx.fillStyle = '#ffb040'
    ctx.beginPath(); ctx.ellipse(x, y - 30 + f * 0.4, 9, 15 + f, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#ffe090'
    ctx.beginPath(); ctx.ellipse(x, y - 27 + f * 0.4, 4.5, 8, 0, 0, 7); ctx.fill()
  }

  // 築真壇一幕:整整齊齊的新壇+暖光(士 6:26)
  _drawBuild() {
    const { ctx } = this
    const cx = VW / 2, baseY = VH * 0.62
    const glow = ctx.createRadialGradient(cx, baseY - 40, 10, cx, baseY - 40, 240)
    glow.addColorStop(0, 'rgba(255,225,150,0.5)'); glow.addColorStop(1, 'rgba(255,225,150,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(cx, baseY - 40, 240, 0, 7); ctx.fill()
    ctx.fillStyle = '#b09a72'
    for (let r = 0; r < 3; r++) {
      const w = 200 - r * 44
      rG(ctx, cx - w / 2, baseY - (r + 1) * 30, w, 26, 4); ctx.fill()
    }
    ctx.fillStyle = '#f4ecd4'
    ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    wrapG(ctx, T.build, cx, baseY + 60, VW * 0.7, 30)
  }

  _drawIntro() {
    const { ctx } = this
    cardG(ctx, VW * 0.1, VH * 0.06, VW * 0.8, VH * 0.88)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c3658'
    ctx.font = 'bold 38px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.17)
    ctx.fillStyle = '#5a6488'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.ref + ' ・ 夜裡行事', VW / 2, VH * 0.24)
    ctx.fillStyle = '#2e3444'
    wrapG(ctx, T.intro1, VW / 2, VH * 0.32, VW * 0.66, 24)
    wrapG(ctx, T.how, VW / 2, VH * 0.5, VW * 0.66, 24)
    ctx.fillStyle = '#5a6488'
    ctx.font = '17px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pick, VW / 2, VH * 0.67)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.13, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.72
      ctx.fillStyle = '#7a90c0'
      rG(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#0e1830'
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
    ctx.fillStyle = '#f6f8ff' // 全不透明:別讓底下「築真壇」的字透過卡片

    ctx.strokeStyle = '#7a90c0'; ctx.lineWidth = 3
    rG(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c3658'
    ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC",sans-serif`
    ctx.fillText(T.winTitle, W / 2, H * 0.18)
    ctx.fillStyle = '#2e3444'
    wrapG(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.28, W * 0.66, H * 0.045)
    ctx.fillStyle = '#4a5a2a'
    wrapG(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.46, W * 0.66, H * 0.043)
    ctx.fillStyle = '#2e3444'
    wrapG(ctx, T.teach, W / 2, H * 0.58, W * 0.66, H * 0.043)
    ctx.restore()
  }
}

function rG(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function cardG(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(240,244,255,0.95)'
  ctx.strokeStyle = '#7a90c0'; ctx.lineWidth = 3
  rG(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapG(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
