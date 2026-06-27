// 海邊的復興(約 21:15-19)主迴圈 + 狀態機。嵌入契約:new Game(canvas,{embed,onComplete})、boot()、destroy()。
// 狀態:intro → ask(主問「你愛我嗎?」)→ feed(點羊餵餅)→ reflect(彼得回應+主託付)→ 下一回合 或 win。
// ★神學:三次跌倒、三次託付;愛主就餵養祂的羊。⛔ 不渲染殉道,聚焦恢復與「你跟從我吧」(21:19)。
import { WORLD, SEA_Y, ROUNDS, getAgeCfg, SCRIPTURE } from './config.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { getAgePref } from '../../agePrefs.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
const HOWTO = SCRIPTURE.how

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.renderer = new Renderer(canvas)
    this.input = new Input()

    this.age = getAgeCfg(opts.age || getAgePref())
    this.r = 0                 // 第幾回合(0..2)
    this.sheep = []
    this.fed = 0
    this.t = 0
    this.breads = []           // 飛向羊的餅(視覺)

    this.state = 'intro'
    this.won = false
    this.finished = false
    this.stopped = false
    this.beat = { kind: 'intro', kicker: '🔥 海邊的復興 · 炭火旁的接納', ref: SCRIPTURE.intro.ref, line: SCRIPTURE.intro.line, teach: HOWTO, cont: '點畫面開始' }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.input.attach(this.canvas)
    this.last = null; this.acc = 0
    if (this.age.speakHowto) setTimeout(() => { if (!this.stopped) speakText(HOWTO) }, 350)
    requestAnimationFrame(this._loop)
  }

  _loop(tms) {
    if (this.stopped) return
    if (this.last == null) this.last = tms
    let dt = (tms - this.last) / 1000
    this.last = tms
    if (dt > 0.1) dt = 0.1
    this.acc += dt
    while (this.acc >= STEP) { this._step(STEP); this.acc -= STEP; if (this.stopped) return }
    this.renderer.draw(this)
    requestAnimationFrame(this._loop)
  }

  _spawnSheep() {
    const n = this.age.sheep[this.r]
    this.sheep = []
    for (let i = 0; i < n; i++) {
      const x = 360 + Math.random() * 540
      const y = SEA_Y + 90 + Math.random() * (WORLD.h - SEA_Y - 130)
      this.sheep.push({ x, baseY: y, y, dir: Math.random() < 0.5 ? 1 : -1, sp: 14 + Math.random() * 12, phase: Math.random() * 6, fed: false, lamb: ROUNDS[this.r].lamb })
    }
    this.fed = 0
  }

  _startRound() {
    const R = ROUNDS[this.r]
    this.state = 'ask'
    speakScripture(R.ask, { ref: R.ref })
    this.beat = { kind: 'ask', kicker: `🔥 第 ${R.n} 次 · 你愛我嗎?`, ref: R.ref, line: R.ask, teach: '彼得曾三次不認主——如今主在炭火旁再問你。', cont: '點畫面回應:主啊,我愛你 ❤️' }
  }

  _step(dt) {
    this.t += dt
    // 羊悠閒走動 + 餅飛行
    for (const s of this.sheep) {
      if (s.fed) continue
      s.x += s.dir * s.sp * dt
      if (s.x < 340) { s.x = 340; s.dir = 1 }
      if (s.x > WORLD.w - 26) { s.x = WORLD.w - 26; s.dir = -1 }
      s.y = s.baseY + Math.sin(this.t * 2 + s.phase) * 4
    }
    for (const b of this.breads) { b.t += dt; b.x += (b.tx - b.x) * 0.18; b.y += (b.ty - b.y) * 0.18 }
    this.breads = this.breads.filter((b) => b.t < 0.5)

    switch (this.state) {
      case 'intro':
        if (this.input.consumeReleased()) { this.input.consumeTap(); this.beat = null; this._startRound() }
        break
      case 'ask':
        if (this.input.consumeReleased()) { this.input.consumeTap(); this.beat = null; this._spawnSheep(); this.state = 'feed' }
        break
      case 'feed': this._feedStep(); break
      case 'reflect':
        if (this.input.consumeReleased()) {
          this.input.consumeTap(); this.beat = null
          this.r += 1
          if (this.r >= ROUNDS.length) this._win()
          else this._startRound()
        }
        break
      case 'win':
        if (this.input.consumeReleased()) this._finish()
        break
    }
  }

  _feedStep() {
    const tap = this.input.consumeTap()
    if (tap) {
      const p = this.renderer.toWorld(tap.cx, tap.cy)
      // 找最近的「還沒餵」的羊(夠近就餵)
      let best = null, bd = 46 * 46
      for (const s of this.sheep) {
        if (s.fed) continue
        const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2
        if (d < bd) { bd = d; best = s }
      }
      if (best) {
        best.fed = true; this.fed += 1
        this.breads.push({ x: 150, y: SEA_Y + 60, tx: best.x, ty: best.y - 6, t: 0 }) // 從炭火邊丟餅過去
      }
    }
    if (this.sheep.length > 0 && this.sheep.every((s) => s.fed)) {
      const R = ROUNDS[this.r]
      speakScripture(R.commission, { ref: R.ref })
      this.state = 'reflect'
      this.beat = { kind: 'reflect', kicker: `🐑 ${R.commission}`, ref: R.ref, line: R.ans, teach: `彼得說:「${R.ans}」　耶穌說:「${R.commission}」`, cont: this.r >= ROUNDS.length - 1 ? '點畫面 →' : '點畫面 · 下一次託付' }
    }
  }

  _win() {
    if (this.won) return
    this.won = true
    this.state = 'win'
    speakScripture(SCRIPTURE.win.line, { ref: SCRIPTURE.win.ref })
    this.beat = {
      kind: 'win',
      kicker: '🔥 三次託付,完全的接納!',
      ref: SCRIPTURE.win.ref,
      line: SCRIPTURE.win.line,
      teach: '彼得三次不認主,主就三次問「你愛我嗎」、三次託付「餵養我的羊」——愛主,就牧養祂的羊。主沒有丟棄跌倒的人,反而說:「你跟從我吧!」',
      cont: '點畫面 / 完成',
    }
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    this.onComplete({ won: this.won, score: this.won ? this.winPoints : 0, level: 'shore' })
  }

  destroy() {
    stopSpeech()
    this.stopped = true
    this.input.detach()
  }
}
