// 大衛彈琴趕憂——Guitar Hero 型主迴圈(邏輯同 psalm100 引擎,多「掃羅的愁煩」層)。
// 嵌入契約:new Game(canvas,{embed,winPoints,age,onComplete})、boot()、destroy()。
// ★不會輸:愁煩只影響畫面(掃羅頭上黑影),歌走完必過關,星等看命中率。
// ★長條規則(2026-07-03 定版,同 psalm100 修正後):按到頭=開始,撐到尾端才算命中;放太早=斷(連擊歸零、不計命中)。
import { LANES, getAge, starsForAccuracy, GLOOM } from './config.js'
import { SCRIPTURE, PHRASES, buildChart, BASS_FREQ, BEAT_SEC } from './content.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { HarpAudio } from './audio.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
const LOOKAHEAD = 0.4
const END_PAD = 2.4

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.age = getAge(opts.age)
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new HarpAudio()

    this.notes = buildChart(this.age)
    this.songLen = Math.max(...this.notes.map((n) => n.t + n.durMusic)) + END_PAD
    this.songTime = -0.0001
    this.state = 'intro'
    this.stopped = false
    this.finished = false

    this.score = 0
    this.combo = 0
    this.hits = 0
    this.judgedCount = 0
    this.gloom = GLOOM.start
    this.lastHitAt = -9 // renderer 撥弦動作用(視覺時鐘)
    this.effects = []
    this.laneHeld = new Array(LANES).fill(false)
    this.activeHolds = new Array(LANES).fill(null)
    this._scheduled = 0
    this._bassBeat = 0
    this.captionLine = null

    this.beat = {
      kicker: SCRIPTURE.title,
      ref: SCRIPTURE.introRef,
      line: `${SCRIPTURE.intro}\n${SCRIPTURE.how}`,
      cont: '點畫面 / 按任意鍵　開始彈琴',
    }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.audio.unlock()
    this.input.attach(this.canvas, {
      onLane: (lane, isDown) => this._onLane(lane, isDown),
      laneAt: (x) => this.renderer.laneAt(x),
    })
    this._tapToStart = () => { if (this.state === 'intro') this._start() }
    this.canvas.addEventListener('pointerdown', this._tapToStart)
    if (this.age.speakHowto) setTimeout(() => { if (this.state === 'intro') speakText(SCRIPTURE.how) }, 350)
    this.last = null
    this.acc = 0
    requestAnimationFrame(this._loop)
  }

  destroy() {
    this.stopped = true
    this.input.detach()
    this.canvas.removeEventListener('pointerdown', this._tapToStart)
    for (const h of this.activeHolds) h?.voice?.stop?.()
    this.audio.stop()
    stopSpeech()
  }

  _start() {
    this.state = 'play'
    this.beat = null
    stopSpeech()
    this.audio.unlock()
    this.songTime = 0
    this._anchor = this.audio.now()
  }

  _onLane(lane, isDown) {
    if (this.state === 'intro') { if (isDown) this._start(); return }
    if (this.state !== 'play') return
    this.laneHeld[lane] = isDown
    if (isDown) this._judgePress(lane)
    else this._judgeRelease(lane)
  }

  _gloomAdd(d) {
    this.gloom = Math.min(GLOOM.max, Math.max(GLOOM.min, this.gloom + d))
  }

  _judgePress(lane) {
    const win = this.age.window
    let best = null
    let bestAbs = Infinity
    for (const n of this.notes) {
      if (n.lane !== lane || n.judged) continue
      const d = this.songTime - n.t
      if (Math.abs(d) <= win && Math.abs(d) < bestAbs) { best = n; bestAbs = Math.abs(d) }
      if (n.t - this.songTime > win) break
    }
    if (!best) return // 空按不懲罰
    const perfect = bestAbs <= win * 0.5
    best.judged = true
    this.judgedCount++
    this.combo++
    this.score += perfect ? 100 : 50
    this.lastHitAt = this.renderer.t
    this._gloomAdd(GLOOM.perHit)
    this.audio.hit(lane, perfect)
    this.effects.push({ lane, age: 0, life: 0.5, perfect, label: perfect ? '完美!' : '好!' })
    if (best.dur > 0) {
      best.holding = true
      const voice = this.audio.holdStart(best.freq)
      this.activeHolds[lane] = { note: best, voice }
    } else {
      best.hit = true
      this.hits++
    }
  }

  _judgeRelease(lane) {
    const h = this.activeHolds[lane]
    if (!h) return
    this.activeHolds[lane] = null
    h.voice?.stop?.()
    const n = h.note
    n.holding = false
    const tail = n.t + n.dur
    if (this.songTime >= tail - this.age.window) {
      n.hit = true
      this.hits++
      this.score += 100
      this.lastHitAt = this.renderer.t
      this._gloomAdd(GLOOM.perHit)
      this.effects.push({ lane, age: 0, life: 0.5, perfect: true, label: '餘音悠長!' })
    } else {
      n.broken = true
      this.combo = 0
      this._gloomAdd(GLOOM.perBreak)
      this.effects.push({ lane, age: 0, life: 0.6, perfect: false, label: '弦斷了…要按住!' })
    }
  }

  _loop(t) {
    if (this.stopped) return
    if (this.last == null) this.last = t
    let dt = (t - this.last) / 1000
    this.last = t
    if (dt > 0.25) dt = 0.25
    this.acc += dt
    while (this.acc >= STEP) {
      this._update(STEP)
      this.acc -= STEP
    }
    this.renderer.draw(this)
    requestAnimationFrame(this._loop)
  }

  _update(dt) {
    for (const fx of this.effects) fx.age += dt
    this.effects = this.effects.filter((fx) => fx.age < fx.life)
    if (this.state !== 'play') return

    this.songTime += dt

    const horizon = this.songTime + LOOKAHEAD
    while (this._scheduled < this.notes.length && this.notes[this._scheduled].t <= horizon) {
      const n = this.notes[this._scheduled]
      this.audio.scheduleMelody(n.freq, this._anchor + n.t, n.durMusic)
      this._scheduled++
    }
    while (this._bassBeat * BEAT_SEC * 2 <= horizon && this._bassBeat * BEAT_SEC * 2 <= this.songLen - END_PAD) {
      this.audio.scheduleBass(BASS_FREQ, this._anchor + this._bassBeat * BEAT_SEC * 2)
      this._bassBeat++
    }

    for (const n of this.notes) {
      if (n.judged) continue
      if (this.songTime - n.t > this.age.window) {
        n.judged = true
        this.judgedCount++
        this.combo = 0
        this._gloomAdd(GLOOM.perMiss)
      }
      if (n.t > this.songTime) break
    }

    for (let i = 0; i < LANES; i++) {
      const h = this.activeHolds[i]
      if (h && this.songTime >= h.note.t + h.note.dur) {
        this.activeHolds[i] = null
        h.voice?.stop?.()
        h.note.holding = false
        h.note.hit = true
        this.hits++
        this.score += 100
        this._gloomAdd(GLOOM.perHit)
        this.effects.push({ lane: i, age: 0, life: 0.5, perfect: true, label: '餘音悠長!' })
      }
    }

    const pi = this._currentPhrase()
    if (pi != null) {
      const phraseNotes = this.notes.filter((n) => n.phrase === pi)
      const done = phraseNotes.filter((n) => n.judged).length
      this.captionLine = { text: PHRASES[pi], progress: phraseNotes.length ? done / phraseNotes.length : 0 }
    }

    if (this.songTime >= this.songLen) this._finish()
  }

  _currentPhrase() {
    let cur = null
    for (const n of this.notes) {
      if (n.t - this.age.approach <= this.songTime) cur = n.phrase
      else break
    }
    return cur
  }

  _finish() {
    if (this.finished) return
    this.finished = true
    this.state = 'win'
    for (const h of this.activeHolds) h?.voice?.stop?.()
    this.activeHolds.fill(null)
    this.gloom = Math.min(this.gloom, 0.06) // 結尾:惡魔離了他
    const acc = this.notes.length ? this.hits / this.notes.length : 0
    const stars = starsForAccuracy(acc)
    this.audio.fanfare()
    this.beat = {
      kicker: SCRIPTURE.winHead,
      ref: SCRIPTURE.winRef,
      line: `${SCRIPTURE.winBody}\n\n「${SCRIPTURE.winText}」`,
      stars,
      cont: '',
    }
    setTimeout(() => { if (!this.stopped) speakScripture(SCRIPTURE.winText, { ref: SCRIPTURE.winRef }) }, 600)
    setTimeout(() => {
      if (!this.stopped) this.onComplete({ won: true, score: this.score, stars, accuracy: Math.round(acc * 100) })
    }, 900)
  }
}
