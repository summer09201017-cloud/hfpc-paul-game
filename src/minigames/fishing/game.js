// 下網得魚(收集類,路加福音 5:1-11)主迴圈 + 狀態機。嵌入契約:new Game(canvas,{embed,onComplete})、boot()、destroy()。
// 狀態:intro(說明)→ play(點水面下網收魚)→ prompt(耶穌:開到水深之處,phase 切換)→ win/lose。
// ★神學:整夜勞力空手 → 「依從你的話」在水深之處下網 → 網滿魚(神使豐收)→「得人如得魚,撇下所有跟從」。
import { WORLD, WATER_Y, FISH, NET, PHASE, getAgeCfg, SCRIPTURE } from './config.js'
import { makeFish, stepFish } from './fish.js'
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
    this.target = this.age.target
    this.castsLeft = this.age.casts
    this.caught = 0
    this.phase = 1                 // 1=整夜勞力(淺處魚少)、2=水深之處(魚滿)
    this.fish = []
    this.net = null                // 下網動畫 { x, y, t, phase, caught }
    this.t = 0                     // 世界時間(魚擺動用)
    this._spawnT = 0

    this.state = 'intro'
    this.won = false
    this.finished = false
    this.stopped = false
    this.beat = { kind: 'intro', kicker: '🎣 下網得魚 · 整夜勞力', ref: SCRIPTURE.intro.ref, line: SCRIPTURE.intro.line, teach: HOWTO, cont: '點水面「下網」開始' }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.input.attach(this.canvas)
    this.last = null
    this.acc = 0
    // 先放幾條「淺處」的魚(整夜勞力,本就不多)
    for (let i = 0; i < PHASE.capShallow; i++) this.fish.push(makeFish(false, this.age.speedMul))
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

  _cap() { return this.phase === 1 ? PHASE.capShallow : this.age.capDeep }

  _step(dt) {
    this.t += dt
    // 魚一直游(各狀態都游,畫面才活)
    for (const f of this.fish) stepFish(f, dt, this.t)

    switch (this.state) {
      case 'intro':
        if (this.input.consumeReleased()) { this.input.consumeCast(); this.beat = null; this.state = 'play' }
        break
      case 'play': this._playStep(dt); break
      case 'prompt':
        if (this.input.consumeReleased()) { this.input.consumeCast(); this.beat = null; this.state = 'play' }
        break
      case 'win': case 'lose':
        if (this.input.consumeReleased()) this._finish()
        break
    }
  }

  _playStep(dt) {
    // 補魚到上限
    this._spawnT += dt
    if (this._spawnT > 0.5) {
      this._spawnT = 0
      if (this.fish.length < this._cap()) this.fish.push(makeFish(this.phase === 2, this.age.speedMul))
    }

    if (this.net) { this._netStep(dt); return }

    // 沒有下網中 → 接受新的下網
    const c = this.input.consumeCast()
    if (c && this.castsLeft > 0) {
      const p = this.renderer.toWorld(c.cx, c.cy)
      const x = Math.max(30, Math.min(WORLD.w - 30, p.x))
      const y = Math.max(WATER_Y + 16, Math.min(WORLD.h - 24, p.y)) // 一定落在水裡
      this.net = { x, y, t: 0, phase: 'sink', caught: 0 }
      this.castsLeft -= 1
    }
  }

  _netStep(dt) {
    const n = this.net
    n.t += dt * 1000
    if (n.phase === 'sink') {
      if (n.t >= NET.sinkMs) { n.t = 0; n.phase = 'hold'; this._haul() } // 沉到位 → 收魚
    } else if (n.phase === 'hold') {
      if (n.t >= NET.holdMs) { n.t = 0; n.phase = 'reel' }
    } else { // reel
      if (n.t >= NET.reelMs) {
        this.fish = this.fish.filter((f) => !f.caught) // 收網,網裡的魚帶走
        this.net = null
        this._afterCast()
      }
    }
  }

  // 下網到位:網圈內的魚一網打盡
  _haul() {
    const n = this.net
    let got = 0 // 這一網的漁獲分數(大魚 3/中 2/小 1)
    for (const f of this.fish) {
      if (f.caught) continue
      if (Math.hypot(f.x - n.x, f.y - n.y) <= this.age.netR + f.r * 0.5) { f.caught = true; got += f.value }
    }
    n.caught = got
    this.caught += got
  }

  _afterCast() {
    if (this.caught >= this.target) return this._win()
    const castsUsed = this.age.casts - this.castsLeft
    if (this.phase === 1 && castsUsed >= PHASE.shallowCasts) {
      // 「夫子,我們整夜勞力並沒有打著甚麼。但依從你的話,我就下網。」→ 開到水深之處
      this.phase = 2
      for (let i = this.fish.length; i < this.age.capDeep; i++) this.fish.push(makeFish(true, this.age.speedMul)) // 魚滿
      this.state = 'prompt'
      speakScripture(SCRIPTURE.obey.line, { ref: SCRIPTURE.obey.ref })
      this.beat = { kind: 'prompt', kicker: '🌊 開到水深之處!', ref: SCRIPTURE.deep.ref, line: SCRIPTURE.deep.line, teach: '整夜勞力沒打著——但「依從你的話」就下網。水深之處,魚滿了網!', cont: '點水深之處下網' }
      return
    }
    if (this.castsLeft <= 0) this._lose()
  }

  _win() {
    if (this.won) return
    this.won = true
    this.net = null
    this.state = 'win'
    speakScripture(SCRIPTURE.win.line, { ref: SCRIPTURE.win.ref })
    this.beat = {
      kind: 'win',
      kicker: `🎣 滿載而歸!漁獲 ${this.caught}`,
      ref: SCRIPTURE.win.ref,
      line: SCRIPTURE.win.line,
      teach: '不是靠你整夜的本事——是依從主的話,神使網滿。彼得就撇下所有的跟從了耶穌(路 5:11)。從今以後,你要得人了!',
      cont: '點畫面 / 完成',
    }
  }

  _lose() {
    this.state = 'lose'
    speakScripture(SCRIPTURE.obey.line, { ref: SCRIPTURE.obey.ref })
    this.beat = { kind: 'lose', kicker: `網次用完了(漁獲 ${this.caught}/${this.target})`, teach: '別灰心——彼得整夜也沒打著。再來一次,「依從你的話」在水深之處下網!', cont: '點畫面 / 再試' }
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    this.onComplete({ won: this.won, score: this.won ? Math.max(this.winPoints, this.caught) : this.caught, level: 'fishing' })
  }

  destroy() {
    stopSpeech()
    this.stopped = true
    this.input.detach()
  }
}
