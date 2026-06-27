// 耶利哥城牆(忿怒鳥式,書 6)主迴圈 + 狀態機。嵌入契約:new Game(canvas,{embed,onComplete})、boot()、destroy()。
// 狀態:aim(蓄力瞄準)→ fly(吶喊聲波飛行+震牆)→ settle(等靜止)→ aim/下一聲 或 win/lose。
// ★神學:玩家發射的是「順服的吶喊/號角」,城牆塌陷歸功於神(書 6:20),不是玩家的武力。
import { WORLD, GROUND_Y, PHYS, SLING, AMMO, defaultStructure, getAgeCfg, SCRIPTURE } from './config.js'
import { makeBlocks, hitBlock, stepWorld, allTargetsDown, worldRested } from './blocks.js'
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
    this.toppleAngle = this.age.toppleAngle
    this.ammoLeft = this.age.ammo

    this.blocks = makeBlocks(defaultStructure())
    this.ammo = null // 飛行中的彈丸
    this.pull = null // 拖曳中的拉弓向量 { vx, vy, px, py }
    this.state = 'aim'
    this.won = false
    this.finished = false
    this.stopped = false
    this.beat = { kind: 'intro', kicker: '🎺 耶利哥城牆 · 第七天的呼喊', ref: SCRIPTURE.intro.ref, line: SCRIPTURE.intro.line, teach: HOWTO, cont: '按住往後拉蓄力 → 放手吶喊' }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.input.attach(this.canvas)
    this.last = null
    this.acc = 0
    if (this.age.speakHowto) setTimeout(() => { if (!this.stopped) speakText(HOWTO) }, 350)
    requestAnimationFrame(this._loop)
  }

  _loop(t) {
    if (this.stopped) return
    if (this.last == null) this.last = t
    let dt = (t - this.last) / 1000
    this.last = t
    if (dt > 0.1) dt = 0.1
    this.acc += dt
    while (this.acc >= STEP) { this._step(STEP); this.acc -= STEP; if (this.stopped) return }
    this.renderer.draw(this)
    requestAnimationFrame(this._loop)
  }

  _step(dt) {
    switch (this.state) {
      case 'aim': this._aimStep(); break
      case 'fly': this._flyStep(dt); break
      case 'settle':
        stepWorld(this.blocks, dt)
        if (allTargetsDown(this.blocks, this.toppleAngle)) return this._win()
        if (worldRested(this.blocks)) {
          if (allTargetsDown(this.blocks, this.toppleAngle)) this._win()
          else if (this.ammoLeft > 0) { this.state = 'aim'; this.beat = null }
          else this._lose()
        }
        break
      case 'win': case 'lose':
        if (this.input.consumeReleased()) this._finish()
        break
    }
  }

  _aimStep() {
    if (this.beat && this.beat.kind === 'intro') {
      // intro:第一次按下才開始(避免誤觸);按下後清掉說明
      if (this.input.down) this.beat = null
      else { this.input.consumeReleased(); return }
    }
    if (this.input.down) {
      const p = this.renderer.toWorld(this.input.cx, this.input.cy)
      let dx = SLING.x - p.x, dy = SLING.y - p.y // 往後拉 → 發射方向(前/上)
      const len = Math.hypot(dx, dy)
      if (len > SLING.maxPull) { dx = dx / len * SLING.maxPull; dy = dy / len * SLING.maxPull }
      this.pull = { vx: dx, vy: dy, px: SLING.x - dx, py: SLING.y - dy }
    } else if (this.input.consumeReleased() && this.pull) {
      this._launch()
    }
  }

  _launch() {
    let vx = this.pull.vx * SLING.power, vy = this.pull.vy * SLING.power
    const sp = Math.hypot(vx, vy)
    if (sp > SLING.maxSpeed) { vx = vx / sp * SLING.maxSpeed; vy = vy / sp * SLING.maxSpeed }
    this.ammo = { x: SLING.x, y: SLING.y, vx, vy, r: AMMO.r, trail: [], t: 0 }
    this.pull = null
    this.ammoLeft -= 1
    this.state = 'fly'
  }

  _flyStep(dt) {
    const a = this.ammo
    a.t += dt
    a.vy += PHYS.gravity * dt
    a.vx *= PHYS.airDrag
    a.x += a.vx * dt
    a.y += a.vy * dt
    if (a.trail.length === 0 || Math.hypot(a.x - a.trail[a.trail.length - 1].x, a.y - a.trail[a.trail.length - 1].y) > 12) {
      a.trail.push({ x: a.x, y: a.y }); if (a.trail.length > 40) a.trail.shift()
    }
    // 地面
    if (a.y + a.r >= GROUND_Y) { a.y = GROUND_Y - a.r; a.vy *= -0.35; a.vx *= 0.7 }
    // 撞磚(圓 vs AABB):打到就喚醒+施力,彈丸自身耗能
    for (const b of this.blocks) {
      const cx = Math.max(b.x - b.w / 2, Math.min(a.x, b.x + b.w / 2))
      const cy = Math.max(b.y - b.h / 2, Math.min(a.y, b.y + b.h / 2))
      const dx = a.x - cx, dy = a.y - cy
      if (dx * dx + dy * dy <= a.r * a.r) {
        hitBlock(b, a, Math.hypot(a.vx, a.vy))
        a.vx *= 0.45; a.vy *= 0.45
        // 把彈丸推出磚外,避免卡住連續觸發
        const d = Math.hypot(dx, dy) || 1
        a.x = cx + (dx / d) * (a.r + 1); a.y = cy + (dy / d) * (a.r + 1)
        break
      }
    }
    stepWorld(this.blocks, dt)
    if (allTargetsDown(this.blocks, this.toppleAngle)) return this._win()
    // 彈丸結束:出界 或 在地面幾乎停了
    const offscreen = a.x > WORLD.w + 60 || a.x < -60 || a.y > WORLD.h + 60
    const restedOnGround = a.y + a.r >= GROUND_Y - 1 && Math.hypot(a.vx, a.vy) < 40
    if (offscreen || restedOnGround || a.t > 4) { this.ammo = null; this.state = 'settle' } // a.t>4:逾時保險,飛行不卡住
  }

  _win() {
    if (this.won) return
    this.won = true
    this.ammo = null
    this.state = 'win'
    speakScripture(SCRIPTURE.win.line, { ref: SCRIPTURE.win.ref })
    this.beat = {
      kind: 'win',
      kicker: '🎺 城牆塌陷了！',
      ref: SCRIPTURE.win.ref,
      line: SCRIPTURE.win.line,
      teach: '城牆倒下不是靠你的力氣——是耶和華使它塌陷。我們只管順服:繞城、吹角、大聲呼喊。',
      cont: '點畫面 / 完成',
    }
  }

  _lose() {
    this.state = 'lose'
    speakScripture(SCRIPTURE.shout.line, { ref: SCRIPTURE.shout.ref })
    this.beat = { kind: 'lose', kicker: '吶喊聲用完了', teach: '城牆還沒全塌——再來一次,憑信心再呼喊!(「呼喊吧,因為耶和華已經把城交給你們了!」書 6:16)', cont: '點畫面 / 再試' }
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    this.onComplete({ won: this.won, score: this.won ? this.winPoints : 0, level: 'jericho' })
  }

  destroy() {
    stopSpeech()
    this.stopped = true
    this.input.detach()
  }
}
