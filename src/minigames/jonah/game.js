import { VIEW, GROUND_Y, RUN, WALK, PLAYER, LIVES, INVULN_TIME, FARE } from './config.js'
import { Player } from './player.js'
import { Spawner } from './spawner.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { Audio } from './audio.js'
import { Storm } from './storm.js'
import { LEVEL1, LEVEL2 } from './scripture.js'
import { QUESTIONS, pickQuestions, quizRemark } from './quiz.js'

const STATE = { TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused', WIN: 'win', LOSE: 'lose', QUIZ: 'quiz' }
const STEP = 1 / 60 // 固定時間步長,讓物理在任何更新率下都一致

export class Game {
  // opts（嵌入用）：{ ui, embed, level, mode, onComplete }
  //   ui       —— 嵌入時注入「空殼 UI」（無 DOM 選單）；獨立執行才用真 UI。
  //   embed    —— true 時跳過標題、直接開指定關卡、結束時回呼 onComplete。
  //   level    —— 1=跑酷 / 2=暴風雨；mode —— 'run' / 'walk'。
  //   onComplete({ won, score, level }) —— 過關 / 失敗時呼叫。
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.ui = opts.ui
    this.embed = !!opts.embed
    this.onComplete = opts.onComplete || null
    this.embedLevel = opts.level === 2 ? 2 : 1
    this.embedMode = opts.mode === 'walk' ? 'walk' : 'run'
    this.player = new Player()
    this.spawner = new Spawner()
    this.storm = new Storm(this)
    this.state = STATE.TITLE
    this.level = 1 // 1=約帕港口(跑酷) / 2=暴風雨(平衡)
    this.mode = 'run' // 'run'=闖關(自動跑) / 'walk'=漫步(自由走、無壓力)
    this.quiz = null // 進行中的聖經問答(null=沒有);{list,pos,correct,returnTo,single}
    this.last = 0
    this.acc = 0
    this.stopped = false // 嵌入卸載時設 true，停止 requestAnimationFrame 迴圈
    this._done = false
    this._resetRun()
  }

  boot() {
    this.input.attach(this.canvas)
    this.renderer.resize()
    this._onResize = () => this.renderer.resize()
    window.addEventListener('resize', this._onResize)

    if (this.embed) {
      // 嵌入：跳過標題選單，直接開始指定關卡（UI 是空殼，按鈕回呼用不到）。
      Audio.unlock()
      if (this.embedLevel === 2) this.startStorm()
      else this.start(this.embedMode)
    } else {
      this.ui.onStart((mode) => this.start(mode))
      this.ui.onStorm(() => this.startStorm()) // 標題上直接挑第二關
      this.ui.onRestart(() => this.restartCurrent()) // 重玩目前這一關
      this.ui.onNext(() => this.next()) // 進入下一關
      this.ui.onPause(() => this.pause())
      this.ui.onResume(() => this.resume())
      this.ui.onMute(() => this.toggleMute())
      this.ui.onQuizAction((act, ds) => this.handleQuizAction(act, ds)) // 聖經問答按鈕
      this.ui.setMuteIcon(Audio.muted)
      this.ui.showTitle(LEVEL1)
    }

    requestAnimationFrame((t) => this.loop(t))
  }

  _resetRun() {
    this.player.reset()
    this.player.lives = LIVES
    this.spawner.reset()
    this.distance = 0
    this.speed = RUN.startSpeed
    this.coinsCollected = 0
    this.knockbackLeft = 0 // 漫步模式被敵人撞到後,還要往後退的距離
    this.collectingFare = false // 闖關到船邊但船價不足 → 暫時可自由移動回頭收集
    this.shortFare = false // 在船邊但船價不足(HUD 提示用)
    this.answeredCorrect = new Set() // 這趟已答對的題目索引,不再出給 NPC
  }

  // 手機/平板(觸控)在使用者點擊「開始」時進全螢幕並鎖橫向;桌機不打擾。
  // iOS 不支援網頁全螢幕 API → 由「加入主畫面」(manifest 已設 landscape/standalone)達成。
  _enterImmersive() {
    try {
      if (this.embed) return // 嵌入在保羅彈窗裡：不要全螢幕/鎖方向，否則會接管整頁
      if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) return
      const lockLandscape = () => {
        try {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {})
        } catch {}
      }
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) {
        const p = el.requestFullscreen()
        if (p && p.then) p.then(lockLandscape).catch(() => {})
        else lockLandscape()
      } else {
        lockLandscape()
      }
    } catch {}
  }

  start(mode) {
    this._enterImmersive()
    this.level = 1
    this.mode = mode === 'walk' ? 'walk' : 'run'
    this._resetRun()
    this.ui.hide()
    this.state = STATE.PLAYING
    this.ui.showPauseButton()
    Audio.unlock() // 在使用者手勢(按開始)中解鎖音訊
    Audio.startMusic()
  }

  startStorm() {
    this._enterImmersive()
    this.level = 2
    this.storm.reset()
    this.ui.hide()
    this.state = STATE.PLAYING
    this.ui.showPauseButton()
    Audio.unlock() // 解鎖音訊(雷聲);暴風雨不放輕快旋律
    Audio.stopMusic()
  }

  // 重玩目前這一關(失敗/暫停→重新開始 用)
  restartCurrent() {
    if (this.level === 2) this.startStorm()
    else this.start(this.mode)
  }

  // 進入下一關
  next() {
    if (this.level === 1) this.startStorm()
    // 第二關之後(大魚肚)尚未製作
  }

  loop(t) {
    if (this.stopped) return // 嵌入卸載後停止迴圈
    if (!this.last) this.last = t
    let dt = (t - this.last) / 1000
    this.last = t
    if (dt > 0.1) dt = 0.1 // 分頁切回時避免一次跳太多

    // 靜音切換(M 鍵)— 任何狀態都可
    if (this.input.consumeMute()) this.toggleMute()

    // 暫停切換(P / Esc / 暫停鈕)— 只在遊戲中或暫停中有效
    if (this.input.consumePause()) {
      if (this.state === STATE.PLAYING) this.pause()
      else if (this.state === STATE.PAUSED) this.resume()
    }

    if (this.state === STATE.PLAYING) {
      this.acc += dt
      while (this.acc >= STEP) {
        this.step(STEP)
        if (this.state !== STATE.PLAYING) break // 本步若結束遊戲就停止累積
        this.acc -= STEP
      }
    } else {
      // 標題/失敗畫面:按跳鍵也能開始/重玩(過關畫面不處理,等按鈕)
      this.input.consumePress() // 清掉覆蓋畫面期間的點擊,避免一開始就誤觸
      this.input.consumeTap()
      if (this.input.consumeJump()) {
        if (this.state === STATE.TITLE) this.start('run')
        else if (this.state === STATE.LOSE) this.restartCurrent()
      }
    }

    this.renderer.draw(this)
    requestAnimationFrame((tt) => this.loop(tt))
  }

  step(dt) {
    // 第二關「暴風雨」自成一格,交給 Storm 場景處理
    if (this.level === 2) {
      this.storm.step(dt)
      return
    }

    // ---- 輸入 → 跳躍 / 前進後退(依模式)----
    const press = this.input.consumePress()
    const tapped = this.input.consumeTap()
    let wantJump = this.input.consumeJump()

    if (this.mode === 'run' && !this.collectingFare) {
      // 闖關:點畫面任意處(非暫停區)= 跳;世界自動向前並加速
      if (press) wantJump = true
      const k = Math.min(1, this.distance / RUN.rampDistance)
      this.speed = RUN.startSpeed + (RUN.maxSpeed - RUN.startSpeed) * k
    } else {
      // 漫步,或「闖關到船邊船價不足、暫時自由移動回頭收集」
      // 漫步:按住 →/畫面右半 = 前進,←/畫面左半 = 後退,輕點 = 跳;無時間壓力
      if (tapped) wantJump = true
      if (this.knockbackLeft > 0) {
        // 被敵人撞到:強制往後退(無視輸入),退完才恢復控制
        this.speed = -WALK.knockbackSpeed
      } else {
        const half = this.input.viewW * 0.5
        const forward =
          this.input.right || (this.input.pointerDown && this.input.pointerX >= half)
        const backward =
          this.input.left || (this.input.pointerDown && this.input.pointerX < half)
        this.speed = forward ? WALK.speed : backward ? -WALK.speed : 0
      }
    }

    if (wantJump && this.player.jump()) Audio.sfx('jump')

    // 位移(漫步/回頭收集時擊退用剩餘距離限制,且不可退到起點之前)
    if ((this.mode === 'walk' || this.collectingFare) && this.knockbackLeft > 0) {
      const back = Math.min(this.knockbackLeft, WALK.knockbackSpeed * dt)
      this.distance = Math.max(0, this.distance - back)
      this.knockbackLeft -= back
    } else {
      this.distance += this.speed * dt
      if (this.mode === 'walk' || this.collectingFare) this.distance = Math.max(0, this.distance)
    }

    this.player.update(dt)
    this.spawner.update(dt, this.speed, this.distance, RUN.goalDistance, this.mode === 'walk')

    // 漫步模式:走近 NPC(碼頭長者)就觸發聖經問答——沒有時間壓力,適合停下來作答。
    // (退後途中 knockbackLeft>0 時不觸發,避免答錯被退回後立刻又被同一位問。)
    if (this.mode === 'walk' && this.knockbackLeft <= 0) {
      for (const npc of this.spawner.npcs) {
        if (!npc.done && Math.abs(npc.x - PLAYER.x) < 46) {
          this.startNpcQuiz(npc) // 答對(或試 3 次)才會設 done
          return // 進入問答,本步到此為止
        }
      }
    }

    // 撞到障礙(只有闖關模式會扣命;漫步、回頭收集船價時障礙無害,沒有壓力)
    if (this.mode === 'run' && !this.collectingFare && this.player.invuln <= 0) {
      const pb = this.player.hitbox()
      for (const o of this.spawner.obstacles) {
        const ob = { x: o.x - o.w / 2, y: GROUND_Y - o.h, w: o.w, h: o.h }
        if (aabb(pb, ob)) {
          this.player.lives -= 1
          this.player.invuln = INVULN_TIME
          Audio.sfx('hit')
          if (this.player.lives <= 0) {
            this.gameOver()
            return
          }
          break
        }
      }
    }

    // 小敵人:踩頭上=踩扁+加分+彈起;從側面碰到=漫步溫和擋一下(不扣命)、闖關扣命
    const pbe = this.player.hitbox()
    for (const e of this.spawner.enemies) {
      if (e.dead) continue
      const eb = { x: e.x - e.w / 2, y: GROUND_Y - e.h, w: e.w, h: e.h }
      if (!aabb(pbe, eb)) continue
      const stomp = this.player.vy > 0 && this.player.y <= GROUND_Y - e.h + 16
      if (stomp) {
        e.dead = true
        this.player.vy = -460 // 踩一下彈起
        this.coinsCollected += 2
        Audio.sfx('stomp')
      } else if (this.player.invuln <= 0) {
        Audio.sfx('hit')
        if (this.mode === 'run' && !this.collectingFare) {
          this.player.lives -= 1
          this.player.invuln = INVULN_TIME
          if (this.player.lives <= 0) {
            this.gameOver()
            return
          }
        } else {
          // 漫步:被撞往後退 3 步(平滑後退),短暫無敵,不扣命
          this.player.invuln = 0.8
          this.knockbackLeft = WALK.knockback
        }
      }
    }

    // 撿空中寶物
    const pb2 = this.player.hitbox()
    for (const c of this.spawner.treasures) {
      if (!c.taken) {
        const cb = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 }
        if (aabb(pb2, cb)) {
          c.taken = true
          if (c.kind === 'life') {
            // 愛心:補一條命;已滿血則折算 3 分,不浪費
            if (this.player.lives < LIVES) this.player.lives += 1
            else this.coinsCollected += 3
            Audio.sfx('treasure', { life: true })
          } else {
            this.coinsCollected += c.value
            Audio.sfx('treasure', { value: c.value })
          }
        }
      }
    }

    // 抵達終點 = 嘗試上船(要先湊夠船價)
    if (this.distance >= RUN.goalDistance) {
      // 嵌入保羅大富翁時：抵達終點即過關，不卡船價（確保小遊戲一定會結束、不會卡在船邊）。
      if (this.embed) {
        this.win()
        return
      }
      const need = this.mode === 'walk' ? FARE.walk : FARE.run
      if (this.coinsCollected >= need) {
        this.collectingFare = false
        this.win()
        return
      }
      // 船價不足:停在船邊,提示回頭收集
      this.distance = RUN.goalDistance
      this.shortFare = true
      // 闖關不能自動回頭 → 暫時切成可自由移動,讓玩家回頭收集船價
      if (this.mode === 'run') this.collectingFare = true
    } else {
      this.shortFare = false
    }
  }

  // 船從畫面右側滑入(終點前 1000px 開始),回傳 x;尚未出現則回 null
  shipPos(dist) {
    const startAt = RUN.goalDistance - 1000
    if (dist < startAt) return null
    const t = Math.min(1, (dist - startAt) / 1000)
    const fromX = VIEW.W + 100
    const toX = PLAYER.x + 150
    return fromX + (toX - fromX) * t
  }

  toggleMute() {
    Audio.unlock()
    const m = Audio.toggleMute()
    this.ui.setMuteIcon(m)
  }

  pause() {
    if (this.state !== STATE.PLAYING) return
    this.state = STATE.PAUSED
    this.ui.hidePauseButton()
    this.ui.showPaused()
    Audio.pauseAll()
  }

  resume() {
    if (this.state !== STATE.PAUSED) return
    this.ui.hide()
    this.ui.showPauseButton()
    this.state = STATE.PLAYING
    // 第一關恢復輕快音樂;第二關暴風雨只恢復音訊(不放旋律)
    if (this.level === 1) Audio.resumeAll()
    else Audio.unlock()
  }

  win() {
    this.state = STATE.WIN
    this.ui.hidePauseButton()
    Audio.stopMusic()
    Audio.sfx('win')
    if (this.embed) return this._finish(true)
    if (this.level === 2) {
      // 暴風雨:無寶物分數;下一關(大魚肚)尚未製作
      this.ui.showWin(LEVEL2, null, { showCoins: false, nextLabel: '下一關 · 大魚肚(製作中)', nextEnabled: false })
    } else {
      this.ui.showWin(LEVEL1, this.coinsCollected, {
        showCoins: true,
        nextLabel: '下一關 · 暴風雨',
        nextEnabled: true,
      })
    }
  }

  gameOver() {
    this.state = STATE.LOSE
    this.ui.hidePauseButton()
    Audio.stopMusic()
    Audio.sfx('lose')
    if (this.embed) return this._finish(false)
    this.ui.showLose(this.level === 2 ? LEVEL2 : LEVEL1)
  }

  // 嵌入：把結果回呼給 React 外層（只回一次）。
  _finish(won) {
    if (this._done) return
    this._done = true
    this.stopped = true // 立刻停迴圈，避免結束瞬間 LOSE 畫面誤觸重玩
    if (this.onComplete) this.onComplete({ won, score: this.coinsCollected || 0, level: this.level })
  }

  // 嵌入：React 卸載時呼叫——停迴圈、移除監聽、停音樂，避免殘留。
  destroy() {
    this.stopped = true
    if (this._onResize) window.removeEventListener('resize', this._onResize)
    if (this.input && this.input.detach) this.input.detach()
    Audio.stopMusic()
    Audio.pauseAll()
  }

  // ---- 聖經問答 ----
  // 卡片內所有 quiz-* 按鈕都走這裡
  handleQuizAction(act, ds) {
    if (act === 'quiz-start') this.startQuizPractice()
    else if (act === 'quiz-choice') this.answerQuiz(Number(ds.choice))
    else if (act === 'quiz-continue') this.afterQuizFeedback()
    else if (act === 'quiz-restart') this.startQuizPractice()
    else if (act === 'quiz-home') this.toTitle()
  }

  // 從標題進入的「練習」:隨機抽 5 題
  startQuizPractice() {
    this._enterImmersive()
    this.quiz = { list: pickQuestions(5), pos: 0, correct: 0, returnTo: 'title', single: false }
    this.state = STATE.QUIZ
    this.ui.hidePauseButton()
    Audio.unlock()
    this._showCurrentQuestion()
  }

  // 漫步遇到長者 NPC:單題;答對(或答錯滿 3 次仁慈放行)才算過這位長者。
  // 出題只從「這趟還沒答對」的題目挑,答對過的不再出現。
  startNpcQuiz(npc) {
    const idx = this._pickNpcQuestion(npc)
    this.state = STATE.QUIZ
    this.ui.hidePauseButton()
    if (idx < 0) {
      // 題庫裡還沒答對的題目都答完了 → 長者直接放行
      npc.done = true
      this.quiz = { single: true, npc, allDone: true }
      this.ui.showQuizAllDone()
      return
    }
    this.quiz = { list: [idx], pos: 0, correct: 0, returnTo: 'walk', single: true, npc, lastCorrect: false }
    this._showCurrentQuestion()
  }

  // 從「這趟還沒答對」的題目挑一題(盡量不連續出同一題);沒得出回 -1
  _pickNpcQuestion(npc) {
    const pool = []
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (!this.answeredCorrect.has(i)) pool.push(i)
    }
    if (pool.length === 0) return -1
    let choices = pool
    if (pool.length > 1 && npc._lastQ != null) {
      const f = pool.filter((i) => i !== npc._lastQ)
      if (f.length) choices = f
    }
    const idx = choices[Math.floor(Math.random() * choices.length)]
    npc._lastQ = idx
    return idx
  }

  _showCurrentQuestion() {
    const q = QUESTIONS[this.quiz.list[this.quiz.pos]]
    this.ui.showQuiz(q, this.quiz.pos, this.quiz.list.length, this.quiz.single)
  }

  answerQuiz(choice) {
    if (!this.quiz) return
    const q = QUESTIONS[this.quiz.list[this.quiz.pos]]
    const correct = choice === q.answer
    this.quiz.lastCorrect = correct
    if (correct) {
      this.quiz.correct += 1
      if (this.quiz.single) this.answeredCorrect.add(this.quiz.list[0]) // 答對的不再出給 NPC
      Audio.sfx('treasure', { value: 5 })
    } else {
      Audio.sfx('hit')
    }
    let label
    if (this.quiz.single) {
      const npc = this.quiz.npc
      if (correct) label = '前進!'
      else if ((npc.attempts || 0) + 1 >= 3) label = '長者讓你過了'
      else label = '退後幾步,再答一題'
    } else {
      const last = this.quiz.pos === this.quiz.list.length - 1
      label = last ? '看結果' : '下一題'
    }
    this.ui.showQuizFeedback(q, choice, label)
  }

  afterQuizFeedback() {
    if (!this.quiz) return
    if (this.quiz.allDone) {
      this._endQuizToWalk() // 長者放行提示卡,按繼續回漫步
      return
    }
    if (this.quiz.single) {
      const npc = this.quiz.npc
      if (this.quiz.lastCorrect) {
        npc.done = true // 答對,過這位長者
        this._endQuizToWalk()
      } else {
        npc.attempts = (npc.attempts || 0) + 1
        if (npc.attempts >= 3) {
          npc.done = true // 答錯滿 3 次:仁慈放行,別卡住小孩
          this._endQuizToWalk()
        } else {
          this.knockbackLeft = 5 * WALK.step // 退後 5 步,走回來長者改問別題
          this._endQuizToWalk()
        }
      }
      return
    }
    // 標題練習(多題):往下一題或結算
    this.quiz.pos += 1
    if (this.quiz.pos < this.quiz.list.length) {
      this._showCurrentQuestion()
    } else {
      this.ui.showQuizSummary(
        this.quiz.correct,
        this.quiz.list.length,
        quizRemark(this.quiz.correct, this.quiz.list.length)
      )
    }
  }

  _endQuizToWalk() {
    this.quiz = null
    this.ui.hide()
    this.ui.showPauseButton()
    this.state = STATE.PLAYING
  }

  toTitle() {
    this.quiz = null
    this.level = 1
    this.state = STATE.TITLE
    Audio.stopMusic()
    this.ui.showTitle(LEVEL1)
  }
}

// 軸對齊矩形碰撞
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
