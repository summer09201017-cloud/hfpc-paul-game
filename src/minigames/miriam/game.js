// 米利暗擊鼓——太鼓型主迴圈。嵌入契約:new Game(canvas,{embed,winPoints,age,onComplete})、boot()、destroy()。
// ★慶祝關鐵則(rhythm skill 選題表):不會輸、不扣命;「歡慶」條只影響眾婦女跳多高。
// ★太鼓判定:單軌找窗內最近音符;紅(don)要拍鼓、藍(ka)要搖鈴——打錯邊不吃音符、不懲罰,
//   顯示「換另一邊!」讓孩子在窗內還來得及補打;幼稚園檔 anyKey=不分紅藍。
import { getAge, starsForAccuracy, JOY } from './config.js'
import { SCRIPTURE, PHRASES, buildChart, MELODY_LOOP, BEAT_SEC } from './content.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { TimbrelAudio } from './audio.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
const LOOKAHEAD = 0.4
const END_PAD = 2.2

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.age = getAge(opts.age)
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new TimbrelAudio()

    this.notes = buildChart()
    this.songLen = Math.max(...this.notes.map((n) => n.t)) + END_PAD
    this.songTime = -0.0001
    this.state = 'intro'
    this.stopped = false
    this.finished = false

    this.score = 0
    this.combo = 0
    this.hits = 0
    this.judgedCount = 0
    this.joy = JOY.start
    this.lastHitAt = -9
    this.lastHitType = 'don'
    this.effects = []
    this._scheduled = 0
    this._melBeat = 0
    this.captionLine = null

    this.beat = {
      kicker: SCRIPTURE.title,
      ref: SCRIPTURE.introRef,
      line: `${SCRIPTURE.intro}\n${SCRIPTURE.how}`,
      cont: '點畫面 / 按任意鍵　開始擊鼓',
    }
    this._loop = this._loop.bind(this)
  }

  boot() {
    initSpeech()
    this.audio.unlock()
    this.input.attach(this.canvas, {
      onHit: (type) => this._onHit(type),
      typeAt: (x, y) => this.renderer.typeAt(x, y),
    })
    this._keyStart = (e) => { if (this.state === 'intro' && !e.repeat) this._start() }
    window.addEventListener('keydown', this._keyStart)
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
    window.removeEventListener('keydown', this._keyStart)
    this.canvas.removeEventListener('pointerdown', this._tapToStart)
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

  _joyAdd(d) {
    this.joy = Math.min(JOY.max, Math.max(JOY.min, this.joy + d))
  }

  _onHit(type) {
    if (this.state === 'intro') { this._start(); return }
    if (this.state !== 'play') return
    const win = this.age.window
    // 單軌:找窗內最近的未判定音符
    let best = null
    let bestAbs = Infinity
    for (const n of this.notes) {
      if (n.judged) continue
      const d = this.songTime - n.t
      if (Math.abs(d) <= win && Math.abs(d) < bestAbs) { best = n; bestAbs = Math.abs(d) }
      if (n.t - this.songTime > win) break
    }
    // 打鼓的視覺/聲音回饋照給(空打也有鼓聲,像真的鈴鼓——但不影響判定)
    this.lastHitAt = this.renderer.t
    this.lastHitType = type
    if (!best) { this.audio.hit(type, false); return } // 空打不懲罰
    // 型別要對(幼稚園 anyKey 不分)
    if (!this.age.anyKey && best.type !== type) {
      this.audio.hit(type, false)
      this.effects.push({ age: 0, life: 0.5, perfect: false, label: best.type === 'don' ? '換紅色:拍鼓面!' : '換藍色:搖鈴!' })
      return // 不吃音符——窗內還來得及打對邊
    }
    const perfect = bestAbs <= win * 0.5
    best.judged = true
    best.hit = true
    this.judgedCount++
    this.hits++
    this.combo++
    this.score += perfect ? 100 : 50
    this._joyAdd(JOY.perHit)
    this.audio.hit(best.type, perfect)
    this.effects.push({ age: 0, life: 0.5, perfect, label: perfect ? '完美!' : '好!' })
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

    // 譜面鼓點(伴奏)與旋律墊底排程
    const horizon = this.songTime + LOOKAHEAD
    while (this._scheduled < this.notes.length && this.notes[this._scheduled].t <= horizon) {
      const n = this.notes[this._scheduled]
      this.audio.scheduleNote(n.type, this._anchor + n.t)
      this._scheduled++
    }
    while (this._melBeat * BEAT_SEC * 2 <= horizon && this._melBeat * BEAT_SEC * 2 <= this.songLen - END_PAD) {
      this.audio.scheduleMelody(MELODY_LOOP[this._melBeat % MELODY_LOOP.length], this._anchor + this._melBeat * BEAT_SEC * 2)
      this._melBeat++
    }

    // 漏拍:過窗標 judged、斷連擊、歡慶小降(不扣命)
    for (const n of this.notes) {
      if (n.judged) continue
      if (this.songTime - n.t > this.age.window) {
        n.judged = true
        this.judgedCount++
        this.combo = 0
        this._joyAdd(JOY.perMiss)
      }
      if (n.t > this.songTime) break
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
    this.joy = JOY.max // 結尾:全隊歡呼
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
