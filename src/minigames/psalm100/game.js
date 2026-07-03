// 詩篇 100 讚美琴鍵——4K 下落式節奏關主迴圈。
// 嵌入契約:new Game(canvas,{embed,winPoints,age,onComplete})、boot()、destroy()。
// 狀態:intro →(點/按鍵)play → win。★不會輸(兒童營守則):歌走完必過關,星等看命中率。
// 時序:歌曲時間 songTime 用固定步長累加;旋律用 Web Audio 提前排程(lookahead 0.4s),
//       漏按歌也照唱(歌是神的,不是玩家表現的獎品)——按對是「加入讚美」不是「製造讚美」。
import { LANES, getAge, starsForAccuracy } from './config.js'
import { SCRIPTURE, buildChart, BASS_FREQ, BEAT_SEC } from './content.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { Psalm100Audio } from './audio.js'
import { PHRASES } from './content.js'
import { initSpeech, speakScripture, speakText, stopSpeech } from '../../speak.js'

const STEP = 1 / 60
const LOOKAHEAD = 0.4 // 排程提前量(秒)
const END_PAD = 2.2 // 最後一顆音符後幾秒進 win

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || (() => {})
    this.winPoints = opts.winPoints || 5
    this.age = getAge(opts.age)
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.audio = new Psalm100Audio()

    this.notes = buildChart(this.age) // { t, dur, durMusic, lane, freq, phrase, judged?, holding?, hit? }
    this.songLen = Math.max(...this.notes.map((n) => n.t + n.durMusic)) + END_PAD
    this.songTime = -0.0001 // intro 時不走
    this.playing = false
    this.state = 'intro'
    this.stopped = false
    this.finished = false

    this.score = 0
    this.combo = 0
    this.hits = 0
    this.judgedCount = 0
    this.effects = [] // { lane, age, life, perfect, label }
    this.laneHeld = new Array(LANES).fill(false)
    this.activeHolds = new Array(LANES).fill(null) // 進行中的長條 { note, voice }
    this._scheduled = 0 // 已排程到第幾顆音符
    this._bassBeat = 0
    this.captionLine = null

    this.beat = {
      kicker: SCRIPTURE.title,
      ref: SCRIPTURE.introRef,
      line: `${SCRIPTURE.intro}\n${SCRIPTURE.how}`,
      cont: '點畫面 / 按任意鍵　開始讚美',
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
    this.playing = true
    this._anchor = this.audio.now() // audio 時鐘錨點:songTime=0 對應這一刻
  }

  _onLane(lane, isDown) {
    if (this.state === 'intro') { if (isDown) this._start(); return }
    if (this.state !== 'play') return
    this.laneHeld[lane] = isDown
    if (isDown) this._judgePress(lane)
    else this._judgeRelease(lane)
  }

  _judgePress(lane) {
    const win = this.age.window
    // 找該欄「未判定、離判定線最近、在窗內」的音符
    let best = null
    let bestAbs = Infinity
    for (const n of this.notes) {
      if (n.lane !== lane || n.judged) continue
      const d = this.songTime - n.t
      if (Math.abs(d) <= win && Math.abs(d) < bestAbs) { best = n; bestAbs = Math.abs(d) }
      if (n.t - this.songTime > win) break // 譜面按時間排序,後面都太遠
    }
    if (!best) return // 空按不懲罰(兒童營守則:溫柔)
    const perfect = bestAbs <= win * 0.5
    best.judged = true
    best.hit = true
    this.judgedCount++
    this.hits++
    this.combo++
    this.score += perfect ? 100 : 50
    this.audio.hit(lane, perfect)
    this.effects.push({ lane, age: 0, life: 0.5, perfect, label: perfect ? '完美!' : '好!' })
    if (best.dur > 0) {
      // 長條:開始按住
      best.holding = true
      const voice = this.audio.holdStart(best.freq)
      this.activeHolds[lane] = { note: best, voice }
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
      // 撐滿(或差一點點):加分
      this.score += 50
      this.effects.push({ lane, age: 0, life: 0.5, perfect: true, label: '撐住了!' })
    }
    // 提早放:已得的 tap 分保留,不倒扣(溫柔)
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
    // 特效老化
    for (const fx of this.effects) fx.age += dt
    this.effects = this.effects.filter((fx) => fx.age < fx.life)
    if (this.state !== 'play') return

    this.songTime += dt

    // —— 音訊排程(旋律照譜面播;低音每兩拍) ——
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

    // —— 漏接:過窗就標 judged(不扣分、斷連擊) ——
    for (const n of this.notes) {
      if (n.judged) continue
      if (this.songTime - n.t > this.age.window) {
        n.judged = true
        this.judgedCount++
        this.combo = 0
      }
      if (n.t > this.songTime) break
    }

    // —— 長條到尾自動結算(還按著就算撐滿) ——
    for (let i = 0; i < LANES; i++) {
      const h = this.activeHolds[i]
      if (h && this.songTime >= h.note.t + h.note.dur) {
        this.activeHolds[i] = null
        h.voice?.stop?.()
        h.note.holding = false
        this.score += 50
        this.effects.push({ lane: i, age: 0, life: 0.5, perfect: true, label: '撐住了!' })
      }
    }

    // —— 字幕(目前句 + 句內進度) ——
    const pi = this._currentPhrase()
    if (pi != null) {
      const phraseNotes = this.notes.filter((n) => n.phrase === pi)
      const done = phraseNotes.filter((n) => n.judged).length
      this.captionLine = { text: PHRASES[pi], progress: phraseNotes.length ? done / phraseNotes.length : 0 }
    }

    // —— 歌完 → 過關 ——
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
    this.playing = false
    for (const h of this.activeHolds) h?.voice?.stop?.()
    this.activeHolds.fill(null)
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
    // 過關自動朗讀經文(web-speech-scripture 系列預設)
    setTimeout(() => { if (!this.stopped) speakScripture(SCRIPTURE.winText, { ref: SCRIPTURE.winRef }) }, 600)
    setTimeout(() => {
      if (!this.stopped) this.onComplete({ won: true, score: this.score, stars, accuracy: Math.round(acc * 100) })
    }, 900)
  }
}
