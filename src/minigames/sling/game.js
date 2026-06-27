// 大衛甩石（簡化版）主迴圈 + 狀態機。嵌入契約：new Game(canvas,{embed,onComplete})、boot()、destroy()。
// 狀態：intro → aim →（放手）flying →（命中）win ／（落空）miss →(還有石子) aim ／(沒石子) lose。
import { WORLD, PHYSICS, AIM, DRAG, GROUND_Y, DAVID, GOLIATH, RULES, getAge, speedStars } from './config.js'
import { CONTENT } from './content.js'
import { launchVelocity, stepProjectile, segmentHitsRect, deg2rad } from './projectile.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { SlingAudio } from './audio.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
const MISS_AUTO_SEC = 1.6 // 落空提示停留多久自動換下一顆（也可點畫面快轉）

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new SlingAudio()

    // —— 年齡旋鈕（幼稚園/兒童/青少年）：一個年齡檔決定擺速、命中區、石子數、是否語音/計時、歌利亞動作 ——
    this.age = getAge(opts.age) // 預設 kids
    this.sweep = this.age.sweepDegPerSec
    this.foreheadBase = this.age.forehead || GOLIATH.forehead // 命中區「靜止位置」（會被動作平移）
    this.forehead = { ...this.foreheadBase } // 每幀重算（歌利亞會動）
    this.timed = !!this.age.timed
    this.motion = this.age.motion || null
    this.gx = 0 // 歌利亞水平位移（前後移動）
    this.gy = 0 // 垂直位移（負=跳起、正=蹲下/端下）
    this.gPhase = 0 // 動作相位累加
    this.clock = 0 // 青少年計時（從第一次瞄準起算到命中）
    this.speedStars = 0

    this.stopped = false
    this.finished = false
    this.totalStones = this.age.stones ?? RULES.stones
    this.stonesLeft = this.totalStones
    this.aimDeg = AIM.minDeg // (保留;拖曳版不再用於瞄準)
    this.aimDir = 1
    this.pull = null // 拖曳拉弓向量 { vx, vy, px, py, len }
    this.stone = null
    this.trail = []
    this.flightT = 0
    this.missTimer = 0
    this.missIdx = 0
    this.state = 'intro'
    this.beat = {
      kind: 'intro',
      kicker: CONTENT.title,
      ref: CONTENT.intro.ref,
      line: CONTENT.intro.line,
      teach: CONTENT.how,
      cont: '點畫面 / 按空白鍵　開始甩石',
    }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.audio.unlock()
    this.input.attach(this.canvas)
    this.last = null
    this.acc = 0
    // ① 語音玩法簡介：幼稚園(不識字)自動朗讀「怎麼玩」;稍延遲等語音清單就緒。
    if (this.age.speakHowto) setTimeout(() => this.speakHowto(), 350)
    requestAnimationFrame(this._loop)
  }

  // 朗讀玩法說明(🔊 鈕也呼叫這個);沒中文語音→靜默。在 intro 才唸,避免蓋過經文朗讀。
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

  // 歌利亞動作（增加難度的「會動的靶」）：左右移動 + 週期跳起 + 週期蹲下；命中區跟著平移。
  _updateGoliath(dt) {
    if (!this.motion) { this.gx = 0; this.gy = 0 }
    else {
      this.gPhase += dt
      const m = this.motion
      this.gx = (m.swayAmp || 0) * Math.sin(this.gPhase * (m.swaySpeed || 1))
      let gy = 0
      if (m.jump) { // 跳起：在每個週期前段走一條上拋弧（gy 為負＝往上）
        const t = this.gPhase % m.jump.everySec
        if (t < m.jump.durSec) gy -= m.jump.h * Math.sin(Math.PI * (t / m.jump.durSec))
      }
      if (m.crouch) { // 蹲下/端下：頭部下沉（gy 為正＝往下），躲開瞄準線
        const t = (this.gPhase + (m.crouch.everySec / 2)) % m.crouch.everySec
        if (t < m.crouch.durSec) gy += m.crouch.drop * Math.sin(Math.PI * (t / m.crouch.durSec))
      }
      this.gy = gy
    }
    // 命中區跟著動作平移（renderer 的歌利亞身體也用同一組 gx/gy 位移，兩邊同步）
    this.forehead.x = this.foreheadBase.x + this.gx
    this.forehead.y = this.foreheadBase.y + this.gy
  }

  _step(dt) {
    const fire = this.input.consumeFire()
    // 瞄準/飛行時：歌利亞持續移動 + 青少年計時
    if (this.state === 'aim' || this.state === 'flying') {
      this._updateGoliath(dt)
      if (this.timed) this.clock += dt
    }
    switch (this.state) {
      case 'intro':
        if (fire) this._startAim()
        break
      case 'aim': {
        // 拖曳彈弓:按住往後拉設「角度+力道」,放手發射。
        if (this.input.down) {
          const p = this.renderer.toWorld(this.input.cx, this.input.cy)
          let dx = DRAG.anchorX - p.x, dy = DRAG.anchorY - p.y // 往後拉 → 發射方向(前/上)
          const len = Math.hypot(dx, dy)
          if (len > DRAG.maxPull) { dx = dx / len * DRAG.maxPull; dy = dy / len * DRAG.maxPull }
          this.pull = { vx: dx, vy: dy, px: DRAG.anchorX - dx, py: DRAG.anchorY - dy, len: Math.min(len, DRAG.maxPull) }
        } else if (fire) {
          if (this.pull && this.pull.len >= DRAG.minPull) this._launch()
          else this.pull = null // 誤觸(沒拉夠)→ 不發射、不浪費石子
        }
        break
      }
      case 'flying': {
        this.flightT += dt
        const prev = this.stone
        const next = stepProjectile(prev, dt, PHYSICS.gravity)
        if (segmentHitsRect(prev.x, prev.y, next.x, next.y, this.forehead)) {
          this.stone = next
          this._win()
          break
        }
        this.stone = next
        if (this.trail.length === 0 || Math.hypot(next.x - this.trail[this.trail.length - 1].x, next.y - this.trail[this.trail.length - 1].y) > 14) {
          this.trail.push({ x: next.x, y: next.y })
        }
        if (next.y >= GROUND_Y || next.x > WORLD.w + 80 || this.flightT > RULES.maxFlightSec) this._miss()
        break
      }
      case 'miss':
        this.missTimer += dt
        if (fire || this.missTimer >= MISS_AUTO_SEC) this._afterMiss()
        break
      case 'win':
      case 'lose':
        if (fire) this._finish()
        break
    }
  }

  _startAim() {
    this.state = 'aim'
    this.beat = null
    this.stone = null
    this.trail = []
    this.pull = null
  }

  _launch() {
    let vx = this.pull.vx * DRAG.power, vy = this.pull.vy * DRAG.power
    const sp = Math.hypot(vx, vy)
    if (sp > DRAG.maxSpeed) { vx = vx / sp * DRAG.maxSpeed; vy = vy / sp * DRAG.maxSpeed }
    this.stone = { x: DRAG.anchorX, y: DRAG.anchorY, vx, vy }
    this.pull = null
    this.trail = []
    this.flightT = 0
    this.state = 'flying'
    this.audio.swing()
  }

  _win() {
    this.state = 'win'
    this.audio.hit()
    speakScripture(CONTENT.win?.line, { ref: CONTENT.win?.ref })
    this.audio.win()
    // 青少年計時挑戰：命中越快星越多（純獎勵，不影響過關/score）
    if (this.timed) this.speedStars = speedStars(this.clock, this.age)
    const star = this.timed && this.speedStars
      ? `　⏱ ${this.clock.toFixed(1)}s ${'★'.repeat(this.speedStars)}${'☆'.repeat(3 - this.speedStars)}`
      : ''
    this.beat = {
      kind: 'win',
      kicker: '🎯 正中額頭！歌利亞仆倒了' + star,
      ref: CONTENT.win.ref,
      line: CONTENT.win.line,
      teach: CONTENT.win.teach,
      cont: '點畫面 / 按空白鍵　完成挑戰',
    }
  }

  _miss() {
    this.stonesLeft -= 1
    this.audio.miss()
    if (this.stonesLeft <= 0) {
      this.state = 'lose'
      speakScripture(CONTENT.lose?.line || CONTENT.lose?.teach, { ref: CONTENT.lose?.ref })   // 失敗也朗讀經文
      this.beat = {
        kind: 'lose',
        kicker: `${this.totalStones} 顆石子都甩完了`,
        ref: CONTENT.lose.ref,
        line: CONTENT.lose.line,
        teach: CONTENT.lose.teach,
        cont: '點畫面 / 按空白鍵　回到棋盤',
      }
    } else {
      this.state = 'miss'
      this.missTimer = 0
      this.beat = {
        kind: 'miss',
        kicker: '差一點！',
        teach: CONTENT.miss[this.missIdx % CONTENT.miss.length],
        cont: `還有 ${this.stonesLeft} 顆——點畫面繼續`,
      }
      this.missIdx += 1
    }
  }

  _afterMiss() {
    this.beat = null
    this.stone = null
    this.trail = []
    this._startAim()
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    const won = this.state === 'win'
    this.onComplete({ won, score: won ? this.winPoints : 0, level: 'sling' })
  }

  destroy() {
    stopSpeech()
    this.stopped = true
    this.input.detach()
    this.audio.destroy()
  }
}
