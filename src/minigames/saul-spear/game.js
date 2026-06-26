// 掃羅擲槍・大衛閃避 主迴圈 + 狀態機。嵌入契約:new Game(canvas,{embed,onComplete,age})、boot()、destroy()。
// 狀態:intro →(確認)dodge →(撐過所有的槍)win ／(被打中超過上限)lose。大衛全程不還手——只躲。
import { WORLD, SAUL, HARP_Y, LANE, DAVID, SPEAR, SPEAR_START_Y, RULES, getAge, survivalStars } from './config.js'

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
import { CONTENT } from './content.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { SpearAudio } from './audio.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new SpearAudio()

    // —— 年齡旋鈕(幼稚園/兒童/青少年):一個年齡檔決定預警秒數、槍速、同時支數、移速、要躲幾支、容錯次數、計時、假動作 ——
    this.age = getAge(opts.age)
    this.telegraphSec = this.age.telegraphSec
    this.speedY = this.age.speedY
    this.simultaneous = this.age.simultaneous
    this.moveSpeed = this.age.moveSpeed
    this.throwsToWin = this.age.throwsToWin
    this.maxHits = this.age.maxHits
    this.spawnGap = this.age.spawnGap
    this.timed = !!this.age.timed
    this.feint = !!this.age.feint
    this.diagChance = this.age.diagChance || 0
    this.diagMax = this.age.diagMax || 0
    this.aimJitter = this.age.aimJitter ?? 24

    this.david = { x: DAVID.startX, flinch: 0 }
    this.spears = [] // { phase:'telegraph'|'fly', x, y, t, resolved }
    this.stuck = [] // 躲過的槍插在牆上(撒上 19:10)——純視覺
    this.spawnedCount = 0
    this.survivedCount = 0
    this.hits = 0
    this.spawnTimer = 0
    this.clock = 0
    this.stars = 0
    this.toast = null // 非阻斷小提示(躲過/被打中的鼓勵)

    this.stopped = false
    this.finished = false
    this.state = 'intro'
    this.beat = {
      kind: 'intro',
      kicker: CONTENT.title,
      ref: CONTENT.intro.ref,
      line: CONTENT.intro.line,
      teach: CONTENT.how,
      cont: '點畫面 / 按空白鍵　開始',
    }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.audio.unlock()
    this.input.attach(this.canvas)
    this.last = null
    this.acc = 0
    if (this.age.speakHowto) setTimeout(() => this.speakHowto(), 350) // 幼稚園(不識字)自動朗讀玩法
    requestAnimationFrame(this._loop)
  }

  speakHowto() {
    if (this.finished || this.stopped) return
    speakText(CONTENT.how)
  }

  _loop(t) {
    if (this.stopped) return
    if (this.last == null) this.last = t
    let dt = (t - this.last) / 1000
    this.last = t
    if (dt > 0.1) dt = 0.1
    this.acc += dt
    while (this.acc >= STEP) {
      this._step(STEP)
      this.acc -= STEP
      if (this.stopped) return
    }
    this.renderer.draw(this)
    requestAnimationFrame(this._loop)
  }

  _step(dt) {
    const confirm = this.input.consumeConfirm()
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null }
    if (this.david.flinch > 0) this.david.flinch = Math.max(0, this.david.flinch - dt)

    switch (this.state) {
      case 'intro':
        // 按空白/點畫面開始;★也接受方向鍵開始(否則玩家按方向鍵卻沒反應,以為「大衛不會動」)
        if (confirm || this.input.dir() !== 0) this._startDodge()
        break
      case 'dodge':
        this._moveDavid(dt)
        this._updateSpears(dt)
        if (this.timed) this.clock += dt
        // 過關 = 所有槍都擲完且場上清空(不管躲過幾支、擦到幾支——擦到沒超過上限就還在)。
        // ★ 不可用「躲過數 >= 目標」當條件:被擦到的槍不算躲過,但也不會再生新槍 → 會卡死永不結束。
        if (this.spawnedCount >= this.throwsToWin && this.spears.length === 0) this._win()
        else if (this.clock > RULES.maxSec) this._win() // 逾時保險:當作撐過
        break
      case 'win':
      case 'lose':
        if (confirm) this._finish()
        break
    }
  }

  _moveDavid(dt) {
    const d = this.input.dir()
    this.david.x += d * this.moveSpeed * dt
    if (this.david.x < LANE.minX) this.david.x = LANE.minX
    if (this.david.x > LANE.maxX) this.david.x = LANE.maxX
  }

  _spawnSpear() {
    // 斜射:出手點(launchX)偏到大衛一側;直射:出手點就在大衛正上方。落點(targetX)在預警期間追蹤大衛。
    const diagonal = this.diagChance > 0 && Math.random() < this.diagChance
    let launchX = this.david.x
    if (diagonal) {
      const side = Math.random() < 0.5 ? -1 : 1
      launchX = clamp(this.david.x + side * (this.diagMax * 0.55 + Math.random() * this.diagMax * 0.45), 72, WORLD.w - 72)
    }
    this.spears.push({
      phase: 'telegraph', diagonal, launchX, targetX: this.david.x,
      x: launchX, y: SAUL.y, startY: SPEAR_START_Y, t: 0, resolved: false, ux: 0, uy: 1,
    })
    this.spawnedCount += 1
    this.audio.warn()
  }

  _updateSpears(dt) {
    // 生成節奏:還沒擲完該躲的支數、空中支數未滿、間隔到了 → 擲一支
    this.spawnTimer -= dt
    const airborne = this.spears.length
    if (this.spawnedCount < this.throwsToWin && airborne < this.simultaneous && this.spawnTimer <= 0) {
      this._spawnSpear()
      this.spawnTimer = this.spawnGap
    }
    const halfHit = DAVID.halfW + SPEAR.halfW
    for (const s of this.spears) {
      if (s.phase === 'telegraph') {
        s.t += dt
        // ★ 紅色預警線追蹤大衛現在的位置(站著不動就會被瞄準);直射的出手點也跟著移到正上方。
        s.targetX = this.david.x
        if (!s.diagonal) s.launchX = this.david.x
        if (s.t >= this.telegraphSec) {
          // 出手:把落點「鎖定」在大衛當下位置 + 一點抖動 → 必須移動才躲得開,站著不動會被打中。
          s.phase = 'fly'
          s.t = 0
          s.y = s.startY
          const jitter = (Math.random() * 2 - 1) * this.aimJitter
          s.targetX = clamp(this.david.x + jitter, LANE.minX, LANE.maxX)
          if (!s.diagonal) s.launchX = s.targetX
          const dx = s.targetX - s.launchX, dy = HARP_Y - s.startY, m = Math.hypot(dx, dy) || 1
          s.ux = dx / m; s.uy = dy / m
          this.audio.throw()
        }
      } else { // fly:沿 launchX→targetX 直線等速下落(斜射就是斜線)
        s.y += this.speedY * dt
        const span = HARP_Y - s.startY
        const p = span > 0 ? clamp((s.y - s.startY) / span, 0, 1) : 1
        s.x = s.launchX + (s.targetX - s.launchX) * p
        if (!s.resolved && s.y >= HARP_Y) {
          s.resolved = true
          if (Math.abs(s.x - this.david.x) < halfHit) this._onHit(s)
          else this._onDodged(s)
        }
      }
    }
    // 清掉已處理且落到底的槍
    this.spears = this.spears.filter((s) => !(s.resolved && s.y >= HARP_Y + 36))
  }

  _onDodged(s) {
    this.survivedCount += 1
    this.audio.thunk()
    this.stuck.push({ x: s.x, y: HARP_Y + 8, ux: s.ux, uy: s.uy }) // 槍刺入牆(撒上 19:10),保留入射角度
    if (this.stuck.length > 14) this.stuck.shift()
    if (Math.random() < 0.4) this.toast = { text: CONTENT.dodged[Math.floor(Math.random() * CONTENT.dodged.length)], t: 1.4, good: true }
  }

  _onHit(s) {
    this.hits += 1
    this.david.flinch = 0.5
    this.audio.ouch()
    if (this.hits > this.maxHits) { this._lose(); return }
    this.toast = { text: CONTENT.hit[(this.hits - 1) % CONTENT.hit.length], t: 1.8, good: false }
  }

  _win() {
    if (this.state !== 'dodge') return
    this.state = 'win'
    this.audio.win()
    speakScripture(CONTENT.win.line, { ref: CONTENT.win.ref })
    if (this.timed) this.stars = survivalStars(this.clock, this.age)
    const star = this.timed && this.stars
      ? `　⏱ ${this.clock.toFixed(1)}s ${'★'.repeat(this.stars)}${'☆'.repeat(3 - this.stars)}`
      : ''
    this.beat = {
      kind: 'win',
      kicker: '🛡️ 撐過所有的槍——大衛不還手,得勝!' + star,
      ref: CONTENT.win.ref,
      line: CONTENT.win.line,
      teach: CONTENT.win.teach,
      cont: '點畫面 / 按空白鍵　完成挑戰',
    }
  }

  _lose() {
    this.state = 'lose'
    speakScripture(CONTENT.lose.line, { ref: CONTENT.lose.ref })
    this.beat = {
      kind: 'lose',
      kicker: '被掃羅追上了',
      ref: CONTENT.lose.ref,
      line: CONTENT.lose.line,
      teach: CONTENT.lose.teach,
      cont: '點畫面 / 按空白鍵　回到棋盤',
    }
  }

  _startDodge() {
    this.state = 'dodge'
    this.beat = null
    this.spears = []
    this.stuck = []
    this.spawnedCount = 0
    this.survivedCount = 0
    this.hits = 0
    this.spawnTimer = 0.6 // 小小前置,讓玩家就位
    this.clock = 0
    this.david.x = DAVID.startX
    this.david.flinch = 0
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    const won = this.state === 'win'
    this.onComplete({ won, score: won ? this.winPoints : 0, level: 'saul-spear' })
  }

  destroy() {
    stopSpeech()
    this.stopped = true
    this.input.detach()
    this.audio.destroy()
  }
}
