// 約阿施射得勝箭（王下 13）主迴圈 + 狀態機。嵌入契約：new Game(canvas,{embed,onComplete})、boot()、destroy()。
// 與大衛甩石同一套「瞄準擺動→放手→拋射→命中」物理 + 年齡旋鈕 + 會動的靶（沿用 sling 引擎換皮）。
// ★ 反向 RPG 鉤子：不在「一箭定勝負」，而在「憑信多射幾次＝得勝越完全」——射完所有箭才結算（王下 13:19 應當射五六次）。
// 狀態：intro → aim →（放手）flying →（命中/落空）between →(還有箭) aim ／(箭射完) finale。
import { WORLD, PHYSICS, AIM, GROUND_Y, DAVID, GOLIATH, RULES, getAge } from './config.js'
import { CONTENT } from './content.js'
import { launchVelocity, stepProjectile, segmentHitsRect, deg2rad } from './projectile.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { SlingAudio } from './audio.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
const BETWEEN_AUTO_SEC = 1.4 // 命中/落空提示停留多久自動換下一箭（也可點畫面快轉）
const ARROWS_BY_AGE = { kinder: 6, kids: 5, teen: 6 } // 「射五六次」——比甩石多,讓「射越多次=得勝越完全」成立

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new SlingAudio()

    // —— 年齡旋鈕（幼稚園/兒童/青少年）：擺速、命中區、移動、是否語音/計時 ——
    this.age = getAge(opts.age)
    this.sweep = this.age.sweepDegPerSec
    this.foreheadBase = this.age.forehead || GOLIATH.forehead
    this.forehead = { ...this.foreheadBase }
    this.timed = !!this.age.timed
    this.motion = this.age.motion || null
    this.gx = 0
    this.gy = 0
    this.gPhase = 0
    this.clock = 0

    this.stopped = false
    this.finished = false
    // 「箭」用 totalStones/stonesLeft 這組欄位（renderer HUD 共用；顯示為「箭」）
    this.totalStones = ARROWS_BY_AGE[this.age.id] || 5
    this.stonesLeft = this.totalStones
    this.hitCount = 0 // ★ 命中次數＝得勝完全度
    this.aimDeg = AIM.minDeg
    this.aimDir = 1
    this.stone = null
    this.trail = []
    this.flightT = 0
    this.betweenTimer = 0
    this.missIdx = 0
    this.hitIdx = 0
    this.state = 'intro'
    this.beat = {
      kind: 'intro',
      kicker: CONTENT.title,
      ref: CONTENT.intro.ref,
      line: CONTENT.intro.line,
      teach: CONTENT.how,
      cont: '點畫面 / 按空白鍵　開始射箭',
    }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.audio.unlock()
    this.input.attach(this.canvas)
    this.last = null
    this.acc = 0
    if (this.age.speakHowto) setTimeout(() => this.speakHowto(), 350) // 幼稚園自動朗讀玩法
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

  // 靶（亞蘭仇敵）動作：左右移動 + 週期跳起 + 週期蹲下；命中區跟著平移（與 renderer 同步）。
  _updateGoliath(dt) {
    if (!this.motion) { this.gx = 0; this.gy = 0 }
    else {
      this.gPhase += dt
      const m = this.motion
      this.gx = (m.swayAmp || 0) * Math.sin(this.gPhase * (m.swaySpeed || 1))
      let gy = 0
      if (m.jump) {
        const t = this.gPhase % m.jump.everySec
        if (t < m.jump.durSec) gy -= m.jump.h * Math.sin(Math.PI * (t / m.jump.durSec))
      }
      if (m.crouch) {
        const t = (this.gPhase + (m.crouch.everySec / 2)) % m.crouch.everySec
        if (t < m.crouch.durSec) gy += m.crouch.drop * Math.sin(Math.PI * (t / m.crouch.durSec))
      }
      this.gy = gy
    }
    this.forehead.x = this.foreheadBase.x + this.gx
    this.forehead.y = this.foreheadBase.y + this.gy
  }

  _step(dt) {
    const fire = this.input.consumeFire()
    if (this.state === 'aim' || this.state === 'flying') {
      this._updateGoliath(dt)
      if (this.timed) this.clock += dt
    }
    switch (this.state) {
      case 'intro':
        if (fire) this._startAim()
        break
      case 'aim': {
        this.aimDeg += this.aimDir * this.sweep * dt
        if (this.aimDeg >= AIM.maxDeg) { this.aimDeg = AIM.maxDeg; this.aimDir = -1 }
        else if (this.aimDeg <= AIM.minDeg) { this.aimDeg = AIM.minDeg; this.aimDir = 1 }
        if (fire) this._launch()
        break
      }
      case 'flying': {
        this.flightT += dt
        const prev = this.stone
        const next = stepProjectile(prev, dt, PHYSICS.gravity)
        if (segmentHitsRect(prev.x, prev.y, next.x, next.y, this.forehead)) {
          this.stone = next
          this._hit()
          break
        }
        this.stone = next
        if (this.trail.length === 0 || Math.hypot(next.x - this.trail[this.trail.length - 1].x, next.y - this.trail[this.trail.length - 1].y) > 14) {
          this.trail.push({ x: next.x, y: next.y })
        }
        if (next.y >= GROUND_Y || next.x > WORLD.w + 80 || this.flightT > RULES.maxFlightSec) this._missShot()
        break
      }
      case 'between': // 命中/落空後的短暫提示，自動或點擊換下一箭
        this.betweenTimer += dt
        if (fire || this.betweenTimer >= BETWEEN_AUTO_SEC) this._afterShot()
        break
      case 'finale':
        if (fire) this._finish()
        break
    }
  }

  _startAim() {
    this.state = 'aim'
    this.beat = null
    this.stone = null
    this.trail = []
    this.aimDeg = AIM.minDeg
    this.aimDir = 1
  }

  _launch() {
    const a = deg2rad(this.aimDeg)
    const v = launchVelocity(a, PHYSICS.power)
    this.stone = { x: DAVID.x + Math.cos(a) * 30, y: DAVID.y - 6 - Math.sin(a) * 30, vx: v.vx, vy: v.vy }
    this.trail = []
    this.flightT = 0
    this.stonesLeft -= 1 // 射出一箭（HUD 即時反映剩餘箭數）
    this.state = 'flying'
    this.audio.swing()
  }

  // 命中：累計得勝，不結束——繼續射下一箭（憑信多射＝得勝越完全）
  _hit() {
    this.hitCount += 1
    this.audio.hit()
    this.audio.win()
    this._enterBetween('hit', '🎯 得勝的箭！', CONTENT.hit[this.hitIdx % CONTENT.hit.length])
    this.hitIdx += 1
  }

  _missShot() {
    this.audio.miss()
    this._enterBetween('miss', '差一點！', CONTENT.miss[this.missIdx % CONTENT.miss.length])
    this.missIdx += 1
  }

  _enterBetween(kind, kicker, teach) {
    this.state = 'between'
    this.betweenTimer = 0
    const left = this.stonesLeft
    this.beat = {
      kind,
      kicker: `${kicker}　(已得勝 ${this.hitCount} 次)`,
      teach,
      cont: left > 0 ? `還有 ${left} 枝箭——點畫面繼續` : '點畫面 / 按空白鍵　看結果',
    }
  }

  _afterShot() {
    this.beat = null
    this.stone = null
    this.trail = []
    if (this.stonesLeft <= 0) this._finale()
    else this._startAim()
  }

  // 結算：命中次數決定「得勝完全度」（不會輸；至少鼓勵再來）
  _finale() {
    this.state = 'finale'
    const total = this.totalStones
    const h = this.hitCount
    let c
    if (h === 0) c = CONTENT.finaleNone
    else if (h >= total - 1) c = CONTENT.finaleFull
    else c = CONTENT.finalePartial
    speakScripture(c.line, { ref: c.ref })
    if (h > 0) this.audio.win()
    const kicker = h === 0
      ? '箭都射完了'
      : h >= total - 1
        ? `🏹 完全得勝！射中 ${h}/${total} 箭`
        : `🏹 得勝 ${h}/${total} 次（再來,憑信射更多！）`
    this.beat = {
      kind: h > 0 ? 'win' : 'lose',
      kicker,
      ref: c.ref,
      line: c.line,
      teach: c.teach,
      cont: '點畫面 / 按空白鍵　完成挑戰',
    }
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    const won = this.hitCount >= 1 // 至少得勝一次＝過關（完全度看 hitCount）
    this.onComplete({ won, score: this.hitCount * this.winPoints, hits: this.hitCount, total: this.totalStones, level: 'joash' })
  }

  destroy() {
    stopSpeech()
    this.stopped = true
    this.input.detach()
    this.audio.destroy()
  }
}
