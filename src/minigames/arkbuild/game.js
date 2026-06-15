// 依序放木板蓋方舟 主迴圈 + 狀態機。
// 嵌入契約：new Game(canvas,{embed,onComplete,winPoints})、boot()、destroy()。
// 流程：intro →（每段）sectionIntro 讀經文 → placing 一塊塊放完該段 → … → won → onComplete。
// 這一關「不會失敗」——重點是「照樣行了」的順服（創 6:22），不是手速。
import { WORLD, BOX, DOOR, WINDOW, RULES } from './config.js'
import { CONTENT } from './content.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { BuildAudio } from './audio.js'

const SECTION_ORDER = ['hull', 'walls', 'door', 'window', 'roof']

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new BuildAudio()

    this.stopped = false
    this.finished = false
    this.state = 'intro'
    this.tAccum = 0 // ghost 脈動用的累計時間
    this.planks = this._buildPlanks()
    this.total = this.planks.length
    this.placedCount = 0
    this.sectionIdx = 0
    this.beat = {
      kind: 'intro',
      kicker: CONTENT.intro.kicker,
      ref: CONTENT.intro.ref,
      line: CONTENT.intro.line,
      teach: CONTENT.intro.teach,
      cont: CONTENT.intro.cont,
    }
    this._loop = this._loop.bind(this)
  }

  // 依建造順序生出每塊木板（含幾何），全部 placed:false。
  _buildPlanks() {
    const list = []
    list.push({ section: 'hull', kind: 'hull', placed: false, drop: 0 })
    for (let i = 0; i < BOX.rows; i++) {
      const deck = Math.floor(i / (BOX.rows / 3)) // 0=下層 1=中層 2=上層
      list.push({
        section: 'walls',
        kind: 'wall',
        deck: Math.min(2, deck),
        rect: { x: BOX.left, y: BOX.wallBottom - (i + 1) * BOX.rowH, w: BOX.right - BOX.left, h: BOX.rowH },
        placed: false,
        drop: 0,
      })
    }
    list.push({ section: 'door', kind: 'door', rect: { ...DOOR }, placed: false, drop: 0 })
    list.push({ section: 'window', kind: 'window', rect: { ...WINDOW }, placed: false, drop: 0 })
    list.push({ section: 'roof', kind: 'roof', placed: false, drop: 0 })
    return list
  }

  get years() {
    return Math.max(1, Math.round((this.placedCount / this.total) * RULES.totalYears))
  }

  // 目前這一段還沒放的「下一塊」（ghost 就畫在它的位置）。
  _nextPlank() {
    const sec = SECTION_ORDER[this.sectionIdx]
    return this.planks.find((p) => p.section === sec && !p.placed) || null
  }

  boot() {
    this.audio.unlock()
    this.input.attach(this.canvas)
    this.last = null
    requestAnimationFrame(this._loop)
  }

  _loop(t) {
    if (this.stopped) return
    if (this.last == null) this.last = t
    let dt = (t - this.last) / 1000
    this.last = t
    if (dt > 0.1) dt = 0.1
    this.renderer.measure()
    this._update(dt)
    if (this.stopped) return
    this.renderer.draw(this)
    requestAnimationFrame(this._loop)
  }

  _update(dt) {
    this.tAccum += dt
    // 落板動畫
    for (const p of this.planks) {
      if (p.placed && p.drop < 1) p.drop = Math.min(1, p.drop + dt / RULES.dropSec)
    }
    const fire = this.input.consumeFire()
    switch (this.state) {
      case 'intro':
        if (fire) this._enterSection(0)
        break
      case 'sectionIntro':
        if (fire) { this.state = 'placing'; this.beat = null }
        break
      case 'placing':
        if (fire) this._place()
        break
      case 'won':
        if (fire) this._finish()
        break
    }
  }

  _enterSection(idx) {
    this.sectionIdx = idx
    const key = SECTION_ORDER[idx]
    const s = CONTENT.sections[key]
    this.state = 'sectionIntro'
    this.beat = {
      kind: 'section',
      kicker: `🪵 ${s.label}`,
      ref: s.ref,
      line: s.line,
      teach: s.teach,
      cont: '點畫面　開始放木板',
    }
  }

  _place() {
    const p = this._nextPlank()
    if (p) {
      p.placed = true
      p.drop = 0
      this.placedCount++
      this.audio.knock()
    }
    // 這一段放完了？
    if (!this._nextPlank()) {
      if (this.sectionIdx < SECTION_ORDER.length - 1) {
        this.audio.section()
        this._enterSection(this.sectionIdx + 1)
      } else {
        this.state = 'won'
        this.audio.win()
        this.beat = {
          kind: 'win',
          kicker: CONTENT.win.kicker,
          ref: CONTENT.win.ref,
          line: CONTENT.win.line,
          teach: CONTENT.win.teach,
          cont: CONTENT.win.cont,
        }
      }
    }
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    this.onComplete({ won: true, score: this.winPoints, level: 'arkbuild' })
  }

  destroy() {
    this.stopped = true
    this.input.detach()
    this.audio.destroy()
  }
}
