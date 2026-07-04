// 客西馬尼・警醒(耶穌生平之旅 闖關⑥,太 26:36-46)——「撐住不睡」挑戰(牧師 2026-07-04 拍板)。
// ★神學守法(設計稿鐵則,改這關前必讀):
//   1. 挑戰=誠實「體會」儆醒有多難——眼皮越來越重,按鍵/點按撐開。
//   2. 無論玩家撐得多好,聖經的結局不變:三位門徒睡了、主獨自順服(太 26:40)。玩家是無名的
//      第四位守望者,撐住≠改寫聖經;撐不住=溫柔進入同一段敘事,不是失敗(永遠 won:true)。
//   3. 耶穌在遠處禱告(遠景/背影,不特寫、玩家永不操控);過關反思=「救恩不靠我們撐住,靠祂成全」。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete})、boot()、destroy()。不會輸。
// 經文(和合本,2026-07-05 已用 cuv lookup 太 26:36-46 逐字核對;注意原文是「警醒」不是「儆醒」);文案待牧者審核。
import { initSpeech, speakScripture, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
// 三次禱告=三更(round):秒數與睏意上升速率一輪比一輪重(太 26:43 因為他們的眼睛困倦)
const ROUNDS = [
  { dur: 18, rise: 0.055 },
  { dur: 20, rise: 0.085 },
  { dur: 22, rise: 0.12 },
]
const PUSH = 0.16 // 每按一下撐開多少眼皮

const T = {
  title: '🌙 客西馬尼・警醒',
  ref: '馬太福音 26:36-46',
  how:
    '你是跟在後面的無名門徒——第四位守望者。主到那邊去禱告了,彼得他們已經睏了。\n' +
    '按空白鍵/點畫面,把越來越重的眼皮撐開,和主一同警醒片時。\n' +
    '(放心:無論你撐得多好,聖經的結局都不會改變——這是「體會」,不是任務。)',
  introLine: '我心裡甚是憂傷，幾乎要死；你們在這裡等候，和我一同警醒。',
  introRef: '太 26:38',
  beats: [
    {
      head: '第一次禱告',
      ref: '太 26:39-41',
      speakRef: '馬太福音 26:39', // 朗讀出處錨點(全名,唸起來才不是「太」;預錄 mp3 的 key 也用它)
      line: '我父啊，倘若可行，求你叫這杯離開我。然而，不要照我的意思，只要照你的意思。',
      after: '主回來,見他們睡著了,就對彼得說:「怎麼樣?你們不能同我警醒片時嗎?總要警醒禱告,免得入了迷惑。你們心靈固然願意,肉體卻軟弱了。」',
    },
    {
      head: '第二次禱告',
      ref: '太 26:42-43',
      speakRef: '馬太福音 26:42',
      line: '我父啊，這杯若不能離開我，必要我喝，就願你的意旨成全。',
      after: '主又來,見他們睡著了,因為他們的眼睛困倦。',
    },
    {
      head: '第三次禱告',
      ref: '太 26:44-46',
      speakRef: '馬太福音 26:44',
      line: '第三次禱告，說的話還是與先前一樣。',
      after: '於是主來到門徒那裡,說:「時候到了,人子被賣在罪人手裡了。起來!我們走吧。看哪,賣我的人近了。」',
    },
  ],
  winHead: '願你的意旨成全',
  winRef: '馬太福音 26:41',
  winVerse: '總要警醒禱告，免得入了迷惑。你們心靈固然願意，肉體卻軟弱了。',
  // 兩種收尾反思——結局同一個(主獨自順服),只有「你」的位置不同;都不是失敗。
  winBodyAwake:
    '你撐住了片時——但看看身旁:彼得、雅各、約翰都睡了,主仍是獨自禱告、獨自順服。那個夜晚,沒有任何人陪祂撐到底。救恩不是靠我們撐住,是靠祂成全:「不要照我的意思,只要照你的意思。」',
  winBodySlept:
    '你也睡著了——和彼得他們一樣。「心靈固然願意,肉體卻軟弱了。」但請看:主沒有叫醒你重來一次,祂自己禱告到底、順服到底。救恩不是靠我們撐住,是靠祂成全:「不要照我的意思,只要照你的意思。」',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.stopped = false
    this.finished = false
    this.state = 'intro' // intro → watch(1..3) → beat(1..3) → win
    this.round = 0 // 0-based
    this.t = 0
    this.roundT = 0
    this.drowse = 0 // 睏意 0..1(1=眼皮合上)
    this.sleptThisRound = false
    this.sleptAny = false
    this.awakeRounds = 0
    this.pushFx = 0 // 按鍵撐開的視覺回饋
    this.fx = []
    this._loop = this._loop.bind(this)
    this._audio = null
  }

  boot() {
    initSpeech()
    this._onKey = (e, down) => {
      if (down && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter')) {
        e.preventDefault()
        this._press()
      }
    }
    this._kd = (e) => this._onKey(e, true)
    window.addEventListener('keydown', this._kd)
    this._pd = (e) => { e.preventDefault(); this._press() }
    this.canvas.addEventListener('pointerdown', this._pd)
    this.last = null
    this.acc = 0
    requestAnimationFrame(this._loop)
  }

  destroy() {
    this.stopped = true
    window.removeEventListener('keydown', this._kd)
    this.canvas.removeEventListener('pointerdown', this._pd)
    try { this._audio?.close() } catch {}
    stopSpeech()
  }

  _press() {
    if (this.state === 'intro') { this._startRound(0); return }
    if (this.state === 'beat') { this._afterBeat(); return }
    if (this.state === 'watch' && !this.sleptThisRound) {
      // 撐開眼皮(睡著後這輪就安睡到主回來——溫柔,不是懲罰)
      this.drowse = Math.max(0, this.drowse - PUSH)
      this.pushFx = 1
      this._chime(392 + this.round * 60, 0.08, 0.12)
    }
  }

  _startRound(i) {
    this.state = 'watch'
    this.round = i
    this.roundT = 0
    this.drowse = i === 0 ? 0 : 0.25 // 越夜越重:後面兩更從已有睏意開始
    this.sleptThisRound = false
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      this._audio = this._audio || new AC()
    } catch {}
  }

  _endRound() {
    if (!this.sleptThisRound) this.awakeRounds++
    this.state = 'beat'
    const b = T.beats[this.round]
    // 走 speakScripture(mp3 優先、缺檔退回 Web Speech+ttsFix)——speakText 不查預錄 mp3,會有機器味
    setTimeout(() => { if (!this.stopped) speakScripture(b.line, { ref: b.speakRef }) }, 400)
  }

  _afterBeat() {
    if (this.round < ROUNDS.length - 1) this._startRound(this.round + 1)
    else this._finish()
  }

  _finish() {
    if (this.finished || this.stopped) return
    this.finished = true
    this.state = 'win'
    this._chime(523, 0.2, 0.5); this._chime(659, 0.15, 0.7)
    setTimeout(() => { if (!this.stopped) speakScripture(T.winVerse, { ref: T.winRef }) }, 600)
    // ★不會輸:撐住或睡著都 won:true——挑戰是「體會」,不是達成救恩條件
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.winPoints + this.awakeRounds }) }, 900)
  }

  _chime(freq, gain = 0.15, dur = 0.3) {
    const ctx = this._audio
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'; o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(ctx.destination)
    o.start(t); o.stop(t + dur + 0.05)
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
    this.pushFx = Math.max(0, this.pushFx - dt * 3)
    for (const f of this.fx) f.age += dt
    this.fx = this.fx.filter((f) => f.age < f.life)
    if (this.state !== 'watch') return
    const r = ROUNDS[this.round]
    this.roundT += dt
    if (!this.sleptThisRound) {
      // 睏意上升,偶爾一陣「更重」的波(誠實體會:不是穩定節奏)
      const wave = 1 + 0.6 * Math.max(0, Math.sin(this.t * 0.7 + this.round * 2))
      this.drowse = Math.min(1, this.drowse + r.rise * wave * dt)
      if (this.drowse >= 1) {
        this.sleptThisRound = true
        this.sleptAny = true
        this.fx.push({ age: 0, life: 2.2, label: '你的眼皮終於合上了……' })
      }
    }
    if (this.roundT >= r.dur) this._endRound()
  }

  // ---------- 繪圖 ----------
  _draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    if (this.canvas.width !== Math.round(w * dpr)) { this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr) }
    const ctx = this.ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this._scene(ctx, w, h)
    if (this.state === 'watch' || this.state === 'beat') this._eyelids(ctx, w, h)
    if (this.state === 'watch') this._hud(ctx, w, h) // HUD 畫在眼皮之上:睏意再重,提示條都看得見
    for (const f of this.fx) {
      const p = f.age / f.life
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = '#e8e2f0'
      ctx.font = 'bold 18px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(f.label, w / 2, h * 0.4 - p * 24)
      ctx.globalAlpha = 1
    }
    if (this.state === 'intro') this._card(ctx, w, h, T.title, `${T.how}\n\n「${T.introLine}」`, `${T.introRef}`, '點畫面 / 空白鍵　開始守望')
    else if (this.state === 'beat') {
      const b = T.beats[this.round]
      this._card(ctx, w, h, `🙏 ${b.head}`, `主俯伏在地,禱告說:\n「${b.line}」\n\n${b.after}`, b.ref, this.round < ROUNDS.length - 1 ? '點畫面　繼續守望' : '點畫面　看結局')
    } else if (this.state === 'win') {
      this._card(ctx, w, h, `✓ ${T.winHead}`, `${this.sleptAny ? T.winBodySlept : T.winBodyAwake}\n\n「${T.winVerse}」`, T.winRef, '')
    }
  }

  _scene(ctx, w, h) {
    const gy = h * 0.8
    // 深夜的橄欖園:靛藍夜空、滿月、星
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#141a33'); sky.addColorStop(0.7, '#232a4a'); sky.addColorStop(1, '#2c3350')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 137) % 100) / 100 * w, sy = ((i * 61) % 55) / 100 * h
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 1.2 + i))
      ctx.globalAlpha = 0.5 * tw
      ctx.fillRect(sx, sy, 2, 2)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#f2edd8'
    ctx.beginPath(); ctx.arc(w * 0.82, h * 0.16, 26, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(20,26,51,0.25)'
    ctx.beginPath(); ctx.arc(w * 0.83, h * 0.15, 8, 0, Math.PI * 2); ctx.arc(w * 0.79, h * 0.18, 5, 0, Math.PI * 2); ctx.fill()
    // 地面
    ctx.fillStyle = '#2a3324'; ctx.fillRect(0, gy, w, h - gy)
    // 橄欖樹(扭曲短幹+銀綠簇)
    this._olive(ctx, w * 0.12, gy, 1.1); this._olive(ctx, w * 0.4, gy, 0.8); this._olive(ctx, w * 0.92, gy, 1.0)
    // 遠處:耶穌在磐石旁俯伏禱告(遠景背影,柔光——玩家永不操控)
    const jx = w * 0.66, jy = gy - 6
    const glow = ctx.createRadialGradient(jx, jy - 20, 4, jx, jy - 20, 70)
    glow.addColorStop(0, 'rgba(240,230,190,0.35)'); glow.addColorStop(1, 'rgba(240,230,190,0)')
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(jx, jy - 20, 70, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#6a6a52'
    ctx.beginPath(); ctx.ellipse(jx + 26, jy - 10, 20, 13, 0, 0, Math.PI * 2); ctx.fill() // 磐石
    ctx.fillStyle = '#ded5b8' // 俯伏的身影(小,背影)
    ctx.beginPath(); ctx.ellipse(jx - 2, jy - 6, 16, 7, -0.12, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(jx + 12, jy - 12, 6, 0, Math.PI * 2); ctx.fill()
    // 三個睡著的門徒(近景,側臥+Zzz)
    this._sleeper(ctx, w * 0.18, gy + 14, '#7a5a9c', 0)
    this._sleeper(ctx, w * 0.3, gy + 18, '#3d6e8e', 1)
    this._sleeper(ctx, w * 0.44, gy + 16, '#8e5a3d', 2)
    // 你(第四位守望者,前景坐姿;睏意越重頭越垂)
    this._watcher(ctx, w * 0.55, gy + 26)
  }

  _olive(ctx, x, gy, k) {
    ctx.strokeStyle = '#4a4232'; ctx.lineWidth = 7 * k; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + 8 * k, gy - 26 * k, x - 4 * k, gy - 48 * k); ctx.stroke()
    ctx.fillStyle = '#5f7a5a'
    for (const [ox, oy, r] of [[-18, -62, 16], [4, -74, 19], [22, -58, 14], [-2, -52, 13]]) {
      ctx.beginPath(); ctx.arc(x + ox * k, gy + oy * k, r * k, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = 'rgba(200,215,190,0.25)'
    ctx.beginPath(); ctx.arc(x + 4 * k, gy - 76 * k, 10 * k, 0, Math.PI * 2); ctx.fill()
  }

  _sleeper(ctx, x, y, robe, i) {
    ctx.fillStyle = robe
    ctx.beginPath(); ctx.ellipse(x, y - 8, 24, 9, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(x - 24, y - 12, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath(); ctx.arc(x - 25, y - 15, 7, Math.PI * 0.9, Math.PI * 1.9); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.2 // 閉眼+微張的嘴(睡了)
    ctx.beginPath(); ctx.moveTo(x - 28, y - 12); ctx.lineTo(x - 24, y - 12); ctx.stroke()
    const zt = (this.t * 0.8 + i * 0.6) % 1.6
    ctx.globalAlpha = Math.max(0, 1 - zt / 1.6)
    ctx.fillStyle = '#cfd6ff'
    ctx.font = `bold ${11 + zt * 6}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('z', x - 24 + zt * 14, y - 26 - zt * 18)
    ctx.globalAlpha = 1
  }

  _watcher(ctx, x, y) {
    const droop = this.state === 'watch' ? this.drowse : 0 // 頭垂角度跟著睏意
    const lift = this.pushFx * 6
    ctx.fillStyle = '#a3823d' // 坐姿身體
    ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.lineTo(x + 11, y - 30); ctx.lineTo(x - 11, y - 30); ctx.closePath(); ctx.fill()
    const hy = y - 40 + droop * 10 - lift // 頭:睏了往下垂,按鍵抬起來
    const hx = x + droop * 6
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#4a3520'
    ctx.beginPath(); ctx.arc(hx, hy - 3, 9.5, Math.PI, 0); ctx.fill()
    // 眼睛跟著睏意瞇起來
    const eyeH = Math.max(0.6, 2.6 * (1 - droop))
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.ellipse(hx - 3.4, hy + 1, 1.6, eyeH, 0, 0, Math.PI * 2); ctx.ellipse(hx + 3.4, hy + 1, 1.6, eyeH, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.4
    ctx.beginPath()
    if (droop > 0.7) { ctx.arc(hx, hy + 6.5, 2.2, Math.PI * 1.1, Math.PI * 1.9) } // 快睡著:嘴往下
    else { ctx.moveTo(hx - 2.6, hy + 6); ctx.lineTo(hx + 2.6, hy + 6) }
    ctx.stroke()
  }

  _hud(ctx, w, h) {
    // 睏意條(眼皮沉重度)+ 更次
    const bw = Math.min(300, w * 0.5)
    ctx.fillStyle = 'rgba(14,18,36,0.6)'
    ctx.fillRect(12, 12, bw + 16, 56)
    ctx.fillStyle = '#cfd6ff'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`第 ${this.round + 1} / 3 次守望`, 20, 30)
    ctx.fillStyle = '#3a405e'
    ctx.fillRect(20, 40, bw, 16)
    const g = ctx.createLinearGradient(20, 0, 20 + bw, 0)
    g.addColorStop(0, '#7ec8a0'); g.addColorStop(0.6, '#e0c46a'); g.addColorStop(1, '#c05a5a')
    ctx.fillStyle = g
    ctx.fillRect(20, 40, bw * this.drowse, 16)
    ctx.strokeStyle = '#cfd6ff'; ctx.lineWidth = 1
    ctx.strokeRect(20, 40, bw, 16)
    ctx.fillStyle = '#e8e2f0'
    ctx.font = '12px system-ui'
    ctx.fillText(this.sleptThisRound ? '你睡著了……主還在禱告' : '眼皮好重——空白鍵/點畫面 撐開!', 20 + bw + 24 > w - 200 ? 20 : 20, 84)
  }

  _eyelids(ctx, w, h) {
    // 眼皮=上下兩片暗幕,睏意越高闔得越多(睡著=全黑一瞬,由 beat 卡片接手)
    const d = this.sleptThisRound ? 1 : this.drowse
    if (d <= 0.02) return
    const cover = (h / 2) * Math.pow(d, 1.4)
    ctx.fillStyle = 'rgba(8,10,20,0.92)'
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, cover)
    ctx.quadraticCurveTo(w / 2, cover + 34 * d, 0, cover); ctx.closePath(); ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.lineTo(w, h - cover)
    ctx.quadraticCurveTo(w / 2, h - cover - 34 * d, 0, h - cover); ctx.closePath(); ctx.fill()
  }

  _card(ctx, w, h, kicker, body, ref, cont) {
    ctx.fillStyle = 'rgba(10,12,24,0.6)'
    ctx.fillRect(0, 0, w, h)
    const cw = Math.min(w * 0.88, 560)
    const ch = Math.min(h * 0.82, 460)
    const cx = (w - cw) / 2
    const cy = (h - ch) / 2
    ctx.fillStyle = '#fffdf7'
    this._rr(ctx, cx, cy, cw, ch, 18); ctx.fill()
    ctx.strokeStyle = '#6a6a9c'; ctx.lineWidth = 3
    this._rr(ctx, cx + 6, cy + 6, cw - 12, ch - 12, 14); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3d3a5c'
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
    ctx.fillStyle = '#6a6d8e'
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
