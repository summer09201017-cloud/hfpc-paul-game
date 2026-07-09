// ⚽ 世界盃足球賽・實況版(football)——憫安製作休閒關第三彈(不掛經文,進「憫安製作闖關合輯」)。
// ⚠ 休閒關,刻意不掛聖經經文(同 goalkick/soccer 前例);無 cuv/tts/送審文案這一套。
//
// 與回合彈射版(soccer)的差別(牧者點名:「真的運球與踢球,不要用撞球的方式」):
//   這版是**即時操作**——你直接操控藍隊 10 號前鋒:跑位、貼身運球(球黏在腳前)、蓄力踢球;
//   隊友與對手全部即時 AI(追球/帶球推進/射門/守門員撲救),真足球的攻防節奏。
// 操作:
//   鍵盤=WASD 或 ←→↑↓ 移動;**按住空白鍵蓄力、放開踢球**(往面向的方向;蓄越久越大力)。
//   觸控=按住畫面往那裡跑;帶球時「點一下」=往點的方向踢(距離=力道)。
//   👥 雙人同機(鍵盤限定):P1 藍=WASD+空白鍵踢;P2 紅=←→↑↓+Enter 踢。
// 規則(溫柔版):90 秒上下半場一次打完(幼 75 秒);時間到比分高者勝、先進 5 球提前結束;
//   無犯規無出界(場邊是牆);輸了=「練習賽結束!好球員都是一球一球練出來的」;onComplete 永遠 won:true。
// 年齡三檔:幼 3v3(AI 慢・門寬・75 秒)/童 4v4/青 5v5(AI 快・門窄)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。

const VW = 960
const VH = 540
const MARGIN = 46
const PR2 = 16 // 球員半徑(碰撞判定仍是圓;畫的是小人)
const BR2 = 9 // 球半徑

// 07-10 使用者拍板:①AI 實力再降(速度慢+射門猶豫+射門變軟)②不限時、先進 N 球獲勝(N 玩家輸入)
// aiShootDelay=AI 進射程後要「醞釀」幾秒才射(給玩家攔截時間);aiShootPow=AI 射門力道
const AGES = {
  young: { label: '🐣 幼', desc: '3v3・AI 很慢・門寬', n: 3, aiSpd: 68, pSpd: 175, gate: 150, aiShootDelay: 0.9, aiShootPow: 0.5, aiShootRange: 175 },
  kid: { label: '🙂 童', desc: '4v4・標準', n: 4, aiSpd: 98, pSpd: 178, gate: 120, aiShootDelay: 0.55, aiShootPow: 0.65, aiShootRange: 215 },
  teen: { label: '🔥 青', desc: '5v5・AI 快・門窄', n: 5, aiSpd: 126, pSpd: 182, gate: 96, aiShootDelay: 0.3, aiShootPow: 0.8, aiShootRange: 250 },
}

const T = {
  title: '⚽ 世界盃足球賽・實況版',
  sub: '憫安製作・真運球真踢球',
  how: '你就是藍隊 10 號!鍵盤 WASD/方向鍵跑位,靠近球就自動帶球(球黏在腳前);按住空白鍵蓄力、放開踢出——面向隊友輕踢=傳球、面向球門大力=射門!Q 鍵=切換成離球最近的隊友(觸控=點隊友);隊友被堵住會回傳給你。沒有時間限制——先進幾球獲勝由你決定!',
  how2p: '雙人同機(鍵盤):P1 藍隊=WASD+空白鍵踢、Q 切換;P2 紅隊=←→↑↓+Enter 踢、Shift 切換。',
  pickMode: '選賽制:',
  pickGoal: '先進幾球獲勝:',
  pickAge: '選場地:',
  modeAI: '🤖 對戰 AI',
  modeAIDesc: '阿福教練帶紅隊',
  mode2P: '👥 雙人同機',
  mode2PDesc: '兩人一台鍵盤 PK',
  goalBlue: '⚽ 藍隊進球!',
  goalRed: '⚽ 紅隊進球!',
  half: '⏱ 比賽進行中',
  endWin: '🏆 藍隊奪冠!',
  endLose: '⚽ 練習賽結束!',
  endDraw: '🤝 握手言和,好比賽!',
  end2pBlue: '🏆 藍隊(P1)奪冠!',
  end2pRed: '🏆 紅隊(P2)奪冠!',
  teach: '好球員都是一球一球練出來的——進了要開心,沒進也要開心,再來一場就是了!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → play → goal → done
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this._countBtns = []
    this.mode = 'ai'
    this.goalTarget = 3 // 先進幾球獲勝(玩家開場輸入,1~10)
    this.dryT = 0 // 太久沒進球的「溫柔保底」計時(守門員會累)
    this.mood = { blue: 'focus', red: 'focus' } // 兩隊表情(進球開心/被進失落)
    this._keys = {}
    // ★卡鍵修正(07-10,與 basketball 同批):字母鍵一律記小寫——不然按住 W 時碰到 Shift,
    //   keyup 收到大寫 W、keydown 記的是小寫 w,_keys.w 永遠 true → 角色卡死/亂走。
    this._normKey = (k) => (k.length === 1 ? k.toLowerCase() : k)
    this._onKeyDown = (e) => { this._keys[this._normKey(e.key)] = true; this._key(e) }
    this._onKeyUp = (e) => { this._keys[this._normKey(e.key)] = false; this._keyUp(e) }
    // 失焦=清空按鍵與蓄力,回來不卡鍵
    this._onBlur = () => { this._keys = {}; this.holding = { 1: false, 2: false }; this.charge = { 1: 0, 2: 0 }; this.touch = null }
    this._switchCd = { 1: 0, 2: 0 } // 切換球員冷卻(防連發狂切)
    this._onDown = (e) => this._down(e)
    this._onMove = (e) => this._movePt(e)
    this._onUp = (e) => this._up(e)
    this._onResize = () => this._resize()
    this.players = [] // {team:'blue'|'red', keeper, human:0|1|null, x,y,vx,vy, fx,fy(面向), homeX,homeY, kickCd}
    this.ball = null // {x,y,vx,vy, owner:player|null, protectT}
    this.scoreB = 0
    this.scoreR = 0
    this.clock = 0
    this.charge = { 1: 0, 2: 0 } // 蓄力(P1 空白鍵/P2 Enter)
    this.holding = { 1: false, 2: false }
    this.touch = null // {x,y} 按住的目標點(P1 觸控)
    this.goalT = 0
    this.goalFor = null
    this.bubble = ''
    this.toasts = []
    this._audio = null
  }

  boot() {
    addEventListener('keydown', this._onKeyDown)
    addEventListener('keyup', this._onKeyUp)
    this.cv.addEventListener('pointerdown', this._onDown)
    addEventListener('pointermove', this._onMove)
    addEventListener('pointerup', this._onUp)
    addEventListener('resize', this._onResize)
    addEventListener('blur', this._onBlur)
    this._resize()
    let last = performance.now()
    const loop = (now) => {
      if (this.stopped) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      this._t += dt
      this._update(dt)
      this._draw()
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  destroy() {
    this.stopped = true
    cancelAnimationFrame(this._raf)
    removeEventListener('keydown', this._onKeyDown)
    removeEventListener('keyup', this._onKeyUp)
    this.cv.removeEventListener('pointerdown', this._onDown)
    removeEventListener('pointermove', this._onMove)
    removeEventListener('pointerup', this._onUp)
    removeEventListener('resize', this._onResize)
    removeEventListener('blur', this._onBlur)
    try { this._audio && this._audio.close() } catch {}
  }

  _gate() {
    const g = this.cfg.gate
    return { y0: VH / 2 - g / 2, y1: VH / 2 + g / 2 }
  }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.scoreB = 0
    this.scoreR = 0
    this.dryT = 0
    this.toasts = []
    this.bubble = ''
    this._kickoff('blue')
    this.state = 'play'
  }

  // 開球陣型;人控的球員標 human(AI 模式=藍前鋒 1;2P 再加紅前鋒 2)
  _kickoff(kickTeam) {
    const n = this.cfg.n
    this.players = []
    const mk = (team) => {
      const sign = team === 'blue' ? 1 : -1
      const gx = team === 'blue' ? MARGIN + 30 : VW - MARGIN - 30
      this.players.push({ team, keeper: true, human: null, x: gx, y: VH / 2, vx: 0, vy: 0, fx: sign, fy: 0, homeX: gx, homeY: VH / 2, kickCd: 0 })
      for (let i = 1; i < n; i++) {
        const hx = VW / 2 - sign * (90 + (i - 1) * 130)
        const hy = VH * (i % 2 ? 0.34 : 0.66)
        this.players.push({ team, keeper: false, human: null, x: hx, y: hy, vx: 0, vy: 0, fx: sign, fy: 0, homeX: hx, homeY: hy, kickCd: 0 })
      }
    }
    mk('blue'); mk('red')
    this.mood = { blue: 'focus', red: 'focus' }
    // 人控:藍隊第一個非守門員=P1;2P 模式紅隊第一個非守門員=P2
    const blueStriker = this.players.find((p) => p.team === 'blue' && !p.keeper)
    blueStriker.human = 1
    blueStriker.x = VW / 2 - 60; blueStriker.y = VH / 2
    if (this.mode === '2p') {
      const redStriker = this.players.find((p) => p.team === 'red' && !p.keeper)
      redStriker.human = 2
      redStriker.x = VW / 2 + 60; redStriker.y = VH / 2
    }
    this.ball = { x: VW / 2, y: VH / 2, vx: 0, vy: 0, owner: null, protectT: 0 }
    // 開球方前鋒站球邊
    const kicker = this.players.find((p) => p.team === kickTeam && !p.keeper)
    kicker.x = VW / 2 + (kickTeam === 'blue' ? -34 : 34); kicker.y = VH / 2
  }

  _update(dt) {
    if (this.state === 'goal') {
      this.goalT -= dt
      if (this.goalT <= 0) {
        if (this.scoreB >= this.goalTarget || this.scoreR >= this.goalTarget) return this._done()
        this._kickoff(this.goalFor === 'blue' ? 'red' : 'blue')
        this.goalFor = null
        this.state = 'play'
      }
      return
    }
    if (this.state !== 'play') return
    // 不限時、先進 N 球獲勝;太久沒進球=守門員漸漸「累了」(溫柔保底防僵局)
    this.dryT += dt
    this._switchCd[1] = Math.max(0, this._switchCd[1] - dt)
    this._switchCd[2] = Math.max(0, this._switchCd[2] - dt)
    const gate = this._gate()
    // —— 人控移動 ——
    for (const p of this.players) {
      if (!p.human) continue
      let mx = 0, my = 0
      if (p.human === 1) {
        mx = (this._keys.a || this._keys.A ? -1 : 0) + (this._keys.d || this._keys.D ? 1 : 0)
        my = (this._keys.w || this._keys.W ? -1 : 0) + (this._keys.s || this._keys.S ? 1 : 0)
        if (this.mode !== '2p') { // 單人時方向鍵也給 P1
          mx += (this._keys.ArrowLeft ? -1 : 0) + (this._keys.ArrowRight ? 1 : 0)
          my += (this._keys.ArrowUp ? -1 : 0) + (this._keys.ArrowDown ? 1 : 0)
        }
        // 觸控:按住=往那裡跑
        if (this.touch) {
          const dx = this.touch.x - p.x, dy = this.touch.y - p.y
          const d = Math.hypot(dx, dy)
          if (d > 10) { mx = dx / d; my = dy / d }
        }
      } else {
        mx = (this._keys.ArrowLeft ? -1 : 0) + (this._keys.ArrowRight ? 1 : 0)
        my = (this._keys.ArrowUp ? -1 : 0) + (this._keys.ArrowDown ? 1 : 0)
      }
      const ml = Math.hypot(mx, my)
      if (ml > 0.01) {
        mx /= ml; my /= ml
        // 蓄力時走慢一點(瞄準感)
        const spd = this.cfg.pSpd * (this.holding[p.human] ? 0.6 : 1)
        p.x += mx * spd * dt
        p.y += my * spd * dt
        p.fx = mx; p.fy = my
      }
      // 蓄力
      if (this.holding[p.human]) this.charge[p.human] = Math.min(1, this.charge[p.human] + dt / 0.85)
    }
    // —— AI 移動 ——
    this._ai(dt)
    // —— 邊界 ——
    for (const p of this.players) {
      p.x = Math.max(MARGIN + PR2, Math.min(VW - MARGIN - PR2, p.x))
      p.y = Math.max(MARGIN + PR2, Math.min(VH - MARGIN - PR2, p.y))
      if (p.keeper) { // 守門員不離門線太遠
        const gx = p.team === 'blue' ? MARGIN + 30 : VW - MARGIN - 30
        p.x = Math.max(gx - 24, Math.min(gx + 42, p.x))
        p.kickCd = Math.max(0, p.kickCd - dt)
      } else p.kickCd = Math.max(0, p.kickCd - dt)
    }
    // —— 球 ——
    const b = this.ball
    b.protectT = Math.max(0, b.protectT - dt)
    if (b.owner) {
      // 運球:球黏在腳前
      const o = b.owner
      const tx = o.x + o.fx * (PR2 + 8), ty = o.y + o.fy * (PR2 + 8)
      b.x += (tx - b.x) * Math.min(1, dt * 14)
      b.y += (ty - b.y) * Math.min(1, dt * 14)
      b.vx = 0; b.vy = 0
    } else {
      b.x += b.vx * dt
      b.y += b.vy * dt
      const decay = Math.exp(-1.1 * dt)
      b.vx *= decay; b.vy *= decay
      // 牆(球門口可穿=進球)
      if (b.y < MARGIN + BR2) { b.y = MARGIN + BR2; b.vy = Math.abs(b.vy) }
      if (b.y > VH - MARGIN - BR2) { b.y = VH - MARGIN - BR2; b.vy = -Math.abs(b.vy) }
      const inMouth = b.y > gate.y0 && b.y < gate.y1
      if (inMouth) {
        if (b.x < MARGIN - 2) return this._goal('red')
        if (b.x > VW - MARGIN + 2) return this._goal('blue')
      } else {
        if (b.x < MARGIN + BR2) { b.x = MARGIN + BR2; b.vx = Math.abs(b.vx) }
        if (b.x > VW - MARGIN - BR2) { b.x = VW - MARGIN - BR2; b.vx = -Math.abs(b.vx) }
      }
    }
    // —— 搶球/得球 ——
    for (const p of this.players) {
      const d = Math.hypot(p.x - b.x, p.y - b.y)
      if (b.owner === p) continue
      const reach = PR2 + BR2 + 4
      if (d < reach && p.kickCd <= 0) {
        if (!b.owner) { this._takeBall(p) }
        else if (b.owner.team !== p.team && b.protectT <= 0) { this._takeBall(p) } // 抄截
      }
    }
    // 球員之間輕推開(不疊圖)
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j]
        const dx = c.x - a.x, dy = c.y - a.y
        const d = Math.hypot(dx, dy)
        if (d > 0 && d < PR2 * 2) {
          const nx = dx / d, ny = dy / d, ov = (PR2 * 2 - d) / 2
          a.x -= nx * ov; a.y -= ny * ov
          c.x += nx * ov; c.y += ny * ov
        }
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
  }

  _takeBall(p) {
    this.ball.owner = p
    this.ball.protectT = 0.5 // 剛得球短暫保護,不被瞬間抄回
    this._tone(360, 0.05, 0, 'sine', 0.05)
  }

  // 踢球(人:蓄力放開;AI:傳/射)
  _kick(p, dirX, dirY, power) {
    const b = this.ball
    if (b.owner !== p) return
    const l = Math.hypot(dirX, dirY) || 1
    const sp = 340 + power * 560
    b.owner = null
    b.vx = (dirX / l) * sp
    b.vy = (dirY / l) * sp
    b.x = p.x + (dirX / l) * (PR2 + BR2 + 4)
    b.y = p.y + (dirY / l) * (PR2 + BR2 + 4)
    p.kickCd = 0.35 // 踢完短暫不回收球
    this._tone(280, 0.08, 0, 'sine', 0.09)
  }

  // —— AI:每隊「最近者追球/持球者推進射門/其他人回站位」;守門員沿門線追球 ——
  _ai(dt) {
    const b = this.ball
    for (const team of ['blue', 'red']) {
      const attackX = team === 'blue' ? VW - MARGIN : MARGIN // 攻的球門
      const aiPlayers = this.players.filter((p) => p.team === team && !p.human)
      const fielders = aiPlayers.filter((p) => !p.keeper)
      // 最近追球者(球沒被自家人拿著才追)
      let chaser = null
      if (!b.owner || b.owner.team !== team) {
        chaser = fielders.reduce((best, p) => {
          const d = Math.hypot(p.x - b.x, p.y - b.y)
          return !best || d < best.d ? { p, d } : best
        }, null)
      }
      for (const p of aiPlayers) {
        let tx = p.homeX, ty = p.homeY
        let spd = this.cfg.aiSpd
        if (b.owner !== p) p.shotT = 0
        if (p.keeper) {
          // 守門員:沿門線追球 y;球衝進禁區且無主=衝出來解圍
          // 溫柔保底:太久沒進球(75 秒)守門員漸漸累了、撲救變慢,比賽不會僵住
          const tired = this.dryT > 75 ? 0.7 : 1
          const gate = this._gate()
          tx = p.homeX
          ty = Math.max(gate.y0 + 10, Math.min(gate.y1 - 10, b.y))
          spd = this.cfg.aiSpd * tired
          const nearGoal = Math.abs(b.x - p.homeX) < 120 && !b.owner
          if (nearGoal) { tx = b.x; ty = b.y; spd = this.cfg.aiSpd * 1.2 * tired }
        } else if (b.owner === p) {
          // 持球:帶向對方球門;進射程後要「醞釀」一下才射(AI 弱化,給玩家攔截時間)
          tx = attackX; ty = VH / 2
          const dist = Math.abs(attackX - p.x)
          if (dist < this.cfg.aiShootRange) {
            p.shotT = (p.shotT || 0) + dt
            if (p.shotT >= this.cfg.aiShootDelay) {
              const gate = this._gate()
              const aimY = gate.y0 + 14 + Math.random() * (gate.y1 - gate.y0 - 28)
              this._kick(p, attackX - p.x, aimY - p.y, this.cfg.aiShootPow + Math.random() * 0.2)
              continue
            }
          }
          // 有人堵路:先想「回傳」——優先傳給人控隊友(把主控還給玩家),沒有就傳給附近隊友;傳不了才往旁邊帶
          const blocker = this.players.find((q) => q.team !== team && !q.keeper && Math.abs(q.x - p.x) < 70 && Math.abs(q.y - p.y) < 46)
          if (blocker) {
            const human = this.players.find((q) => q.team === team && q.human && q !== p)
            const mate = human && Math.hypot(human.x - p.x, human.y - p.y) < 320 ? human
              : this.players.find((q) => q.team === team && !q.keeper && q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 260)
            if (mate && p.kickCd <= 0) { this._kick(p, mate.x - p.x, mate.y - p.y, 0.45); continue }
            ty = p.y + (p.y < VH / 2 ? 90 : -90)
          }
        } else if (chaser && chaser.p === p) {
          tx = b.x; ty = b.y
        } else {
          // 回站位+朝球那側微偏
          tx = p.homeX + (b.x - p.homeX) * 0.18
          ty = p.homeY + (b.y - p.homeY) * 0.25
        }
        const dx = tx - p.x, dy = ty - p.y
        const d = Math.hypot(dx, dy)
        if (d > 4) {
          p.x += (dx / d) * spd * dt
          p.y += (dy / d) * spd * dt
          p.fx = dx / d; p.fy = dy / d
        }
      }
    }
    // 守門員拿到球=立刻大腳解圍給前場
    if (b.owner && b.owner.keeper) {
      const p = b.owner
      const sign = p.team === 'blue' ? 1 : -1
      this._kick(p, sign, (Math.random() - 0.5) * 0.8, 0.9)
    }
  }

  _goal(who) {
    if (who === 'blue') { this.scoreB += 1; this.toasts.push({ text: T.goalBlue, t: this._t }) }
    else { this.scoreR += 1; this.toasts.push({ text: T.goalRed, t: this._t }) }
    this.dryT = 0
    this.mood = { blue: who === 'blue' ? 'happy' : 'sad', red: who === 'red' ? 'happy' : 'sad' }
    this.goalFor = who
    this.state = 'goal'
    this.goalT = 1.6
    if (this.mode === 'ai') this.bubble = who === 'red' ? '進啦!' : '好球!'
    this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(784, 0.22, 0.1, 'triangle', 0.11)
  }

  _done() {
    this.state = 'done'
    const win = this.scoreB > this.scoreR ? 'blue' : this.scoreR > this.scoreB ? 'red' : 'draw'
    this.result = win
    this.stars = win === 'blue' ? 3 : win === 'draw' ? 2 : 1
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: this.scoreB * 25 + 10, level: 'football' }) }, 800)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
      if (e.key === '1') return this._start('young')
      if (e.key === '2') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    if (this.state !== 'play') return
    if (e.key === ' ') { e.preventDefault && e.preventDefault(); if (!this.holding[1]) { this.holding[1] = true; this.charge[1] = 0.15 } }
    if (e.key === 'Enter' && this.mode === '2p') { if (!this.holding[2]) { this.holding[2] = true; this.charge[2] = 0.15 } }
    // ★防狂切(07-10,與 basketball 同批):擋 keydown 自動連發+冷卻
    if ((e.key === 'q' || e.key === 'Q') && !e.repeat) this._switchPlayer(1)
    if (e.key === 'Shift' && this.mode === '2p' && !e.repeat) this._switchPlayer(2)
  }

  // 切換球員(Q=P1/Shift=P2,使用者點名):主控跳到「離球最近」的非守門員隊友;帶球或蓄力中不切
  _switchPlayer(pid) {
    if (this._switchCd[pid] > 0) return // 冷卻中(防連發狂切)
    const cur = this.players.find((p) => p.human === pid)
    if (!cur || this.ball.owner === cur || this.holding[pid]) return
    const cands = this.players.filter((p) => p.team === cur.team && !p.keeper && p !== cur && !p.human)
    if (!cands.length) return
    const b = this.ball
    const best = cands.reduce((m, p) => {
      const d = Math.hypot(p.x - b.x, p.y - b.y)
      return !m || d < m.d ? { p, d } : m
    }, null)
    cur.human = null
    best.p.human = pid
    this._switchCd[pid] = 0.3
    this._tone(520, 0.05, 0, 'sine', 0.06)
  }

  _keyUp(e) {
    if (this.state !== 'play') return
    if (e.key === ' ' && this.holding[1]) {
      this.holding[1] = false
      const p = this.players.find((q) => q.human === 1)
      if (p) this._kick(p, p.fx, p.fy, this.charge[1])
      this.charge[1] = 0
    }
    if (e.key === 'Enter' && this.holding[2]) {
      this.holding[2] = false
      const p = this.players.find((q) => q.human === 2)
      if (p) this._kick(p, p.fx, p.fy, this.charge[2])
      this.charge[2] = 0
    }
  }

  _pt(e) {
    const r = this.cv.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * this.W
    const py = ((e.clientY - r.top) / r.height) * this.H
    const { s, ox, oy } = this._view()
    return { x: (px - ox) / s, y: (py - oy) / s }
  }

  _down(e) {
    const { x, y } = this._pt(e)
    if (this.state === 'intro') {
      for (const b of this._modeBtns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.mode = b.key
        this._tone(500, 0.05, 0, 'sine', 0.06)
        return
      }
      for (const b of this._countBtns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.act === 'dec') this.goalTarget = Math.max(1, this.goalTarget - 1)
        else if (b.act === 'inc') this.goalTarget = Math.min(10, this.goalTarget + 1)
        else { // 點數字=直接輸入
          const v = parseInt(prompt('先進幾球獲勝?(1~10)', this.goalTarget), 10)
          if (v >= 1) this.goalTarget = Math.min(10, v)
        }
        this._tone(520, 0.05, 0, 'sine', 0.06)
        return
      }
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    if (this.state !== 'play') return
    const p = this.players.find((q) => q.human === 1)
    if (!p) return
    // 帶球時點一下=往那裡踢(距離=力道);沒帶球=按住往那裡跑
    if (this.ball.owner === p) {
      const dx = x - p.x, dy = y - p.y
      const d = Math.hypot(dx, dy)
      this._kick(p, dx, dy, Math.min(1, d / 320))
      p.fx = dx / (d || 1); p.fy = dy / (d || 1)
    } else {
      // 沒帶球時點自己隊的隊友=切換主控(觸控版的 Q 鍵)
      const mate = this.players.find((q) => q.team === p.team && !q.keeper && q !== p && !q.human && Math.hypot(q.x - x, q.y - y) < PR2 * 2)
      if (mate) {
        p.human = null
        mate.human = 1
        this._tone(520, 0.05, 0, 'sine', 0.06)
        return
      }
    }
    this.touch = { x, y }
  }

  _movePt(e) {
    if (this.touch) { const { x, y } = this._pt(e); this.touch = { x, y } }
  }

  _up() { this.touch = null }

  _tone(freq, dur, delay = 0, type = 'triangle', vol = 0.14) {
    try {
      if (!this._audio) this._audio = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._audio
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = type; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
      g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + delay + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + dur + 0.03)
    } catch {}
  }

  _resize() {
    const r = this.cv.getBoundingClientRect()
    const s = Math.min(devicePixelRatio || 1, 2)
    this.cv.width = Math.round(r.width * s)
    this.cv.height = Math.round(r.height * s)
    this.W = this.cv.width; this.H = this.cv.height
  }

  _view() {
    const s = Math.min(this.W / VW, this.H / VH)
    return { s, ox: (this.W - VW * s) / 2, oy: (this.H - VH * s) / 2 }
  }

  _draw() {
    const { ctx, W, H } = this
    if (!W) return
    ctx.fillStyle = '#3f7a34'
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    const gate = this._gate()
    // 草皮+白線(同 soccer)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#4a8a3e' : '#458238'
      ctx.fillRect(MARGIN + ((VW - MARGIN * 2) / 8) * i, MARGIN, (VW - MARGIN * 2) / 8, VH - MARGIN * 2)
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3
    ctx.strokeRect(MARGIN, MARGIN, VW - MARGIN * 2, VH - MARGIN * 2)
    ctx.beginPath(); ctx.moveTo(VW / 2, MARGIN); ctx.lineTo(VW / 2, VH - MARGIN); ctx.stroke()
    ctx.beginPath(); ctx.arc(VW / 2, VH / 2, 64, 0, 7); ctx.stroke()
    for (const side of [MARGIN, VW - MARGIN]) {
      const dir = side === MARGIN ? 1 : -1
      ctx.strokeRect(Math.min(side, side + dir * 86), VH / 2 - 110, 86, 220)
    }
    // 球門網
    for (const side of ['L', 'R']) {
      const x0 = side === 'L' ? MARGIN - 34 : VW - MARGIN
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.fillRect(x0, gate.y0, 34, gate.y1 - gate.y0)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5
      for (let gx = x0; gx <= x0 + 34; gx += 8) { ctx.beginPath(); ctx.moveTo(gx, gate.y0); ctx.lineTo(gx, gate.y1); ctx.stroke() }
      for (let gy = gate.y0; gy <= gate.y1; gy += 8) { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + 34, gy); ctx.stroke() }
    }
    // 球員
    for (const p of this.players) this._player(p)
    // 球
    this._soccerBall(this.ball.x, this.ball.y)
    // 蓄力環(人控踢球)
    for (const pid of [1, 2]) {
      if (!this.holding[pid]) continue
      const p = this.players.find((q) => q.human === pid)
      if (!p) continue
      ctx.strokeStyle = this.charge[pid] > 0.85 ? '#e05040' : '#ffe070'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(p.x, p.y, PR2 + 9, -Math.PI / 2, -Math.PI / 2 + this.charge[pid] * Math.PI * 2); ctx.stroke()
      // 踢向指示
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([7, 7])
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.fx * (40 + this.charge[pid] * 90), p.y + p.fy * (40 + this.charge[pid] * 90)); ctx.stroke()
      ctx.setLineDash([])
    }
    // 阿福教練(AI 模式)
    if (this.mode === 'ai' && this.bubble) {
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      const w = ctx.measureText(this.bubble).width + 20
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rFb(ctx, VW - 60 - w, 52, w, 26, 10); ctx.fill()
      ctx.fillStyle = '#3a2c14'
      ctx.textAlign = 'center'
      ctx.fillText(this.bubble, VW - 60 - w / 2, 70)
    }
    // 漂浮字
    for (const t of this.toasts) {
      const k = (this._t - t.t) / 1.8
      if (k >= 1) continue
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,40,10,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${30 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.fillText(t.text, VW / 2, VH * 0.4 - k * 24)
      ctx.globalAlpha = 1
    }
    // HUD:比分+目標(不限時,先進 N 球獲勝)
    ctx.fillStyle = 'rgba(16,36,10,0.66)'
    rFb(ctx, VW * 0.3, 6, VW * 0.4, 32, 12); ctx.fill()
    ctx.fillStyle = '#eef8e2'
    ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🔵 ${this.scoreB} : ${this.scoreR} 🔴 ・ 先進 ${this.goalTarget} 球獲勝`, VW / 2, 29)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  // 一名球員——★07-10 使用者拍板:圓盤改「小人」,且人物都要有眼睛表情嘴巴(系列鐵則)。
  // 碰撞判定仍是圓(PR2 不變、物理零改動),只換畫法:小人站著面向鏡頭,瞳孔會看球,
  // 走動時雙腳交替;進球隊全體大笑、被進隊扁嘴;守門員戴黃帽。
  _player(p) {
    const { ctx } = this
    const c1 = p.team === 'blue' ? '#2a5ac8' : '#c83a3a'
    const c2 = p.team === 'blue' ? '#183a86' : '#7a2020'
    const x = p.x, y = p.y
    // 有沒有在移動(畫腳步用;比對上一幀位置)
    const moving = Math.hypot(x - (p._lx ?? x), y - (p._ly ?? y)) > 0.25
    p._lx = x; p._ly = y
    if (p.human) { // 人控光圈
      ctx.strokeStyle = p.human === 1 ? '#ffe070' : '#ffb0e0'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(x, y, PR2 + 5, 0, 7); ctx.stroke()
    }
    // 影子
    ctx.fillStyle = 'rgba(10,30,6,0.25)'
    ctx.beginPath(); ctx.ellipse(x, y + 13, 11, 4, 0, 0, 7); ctx.fill()
    // 腿(走動=前後擺)
    const swing = moving ? Math.sin(this._t * 11 + (p.homeY || 0)) * 3.5 : 0
    ctx.strokeStyle = '#3a3f52'; ctx.lineWidth = 4.5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x - 4 + swing, y + 13); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 4 - swing, y + 13); ctx.stroke()
    // 身體(球衣+短褲)
    ctx.fillStyle = c2
    rFb(ctx, x - 8, y + 1, 16, 7, 3); ctx.fill() // 短褲
    ctx.fillStyle = c1
    rFb(ctx, x - 9, y - 8, 18, 11, 4); ctx.fill() // 球衣
    // 手臂
    ctx.strokeStyle = c1; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(x - 8, y - 5); ctx.lineTo(x - 12, y + 1 - swing * 0.4); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 8, y - 5); ctx.lineTo(x + 12, y + 1 + swing * 0.4); ctx.stroke()
    // 頭+髮/帽
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, y - 14, 7, 0, 7); ctx.fill()
    if (p.keeper) { // 守門員黃帽
      ctx.fillStyle = '#ffe070'
      ctx.beginPath(); ctx.arc(x, y - 16, 7, Math.PI, 0); ctx.fill()
      ctx.fillRect(x - 8, y - 16.5, 16, 3)
    } else {
      ctx.fillStyle = '#4a3220'
      ctx.beginPath(); ctx.arc(x, y - 16, 7, Math.PI * 1.05, Math.PI * 1.95); ctx.fill()
    }
    // ★臉:眼睛(瞳孔看向球)+表情嘴巴
    const bdx = this.ball.x - x, bdy = this.ball.y - y
    const bl = Math.hypot(bdx, bdy) || 1
    const px2 = (bdx / bl) * 1.2, py2 = (bdy / bl) * 0.9
    const mood = this.mood[p.team]
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.ellipse(x - 2.8, y - 14.5, 2.2, mood === 'happy' ? 1.5 : 2.3, 0, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(x + 2.8, y - 14.5, 2.2, mood === 'happy' ? 1.5 : 2.3, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2018'
    ctx.beginPath(); ctx.arc(x - 2.8 + px2, y - 14.5 + py2, 1.1, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 2.8 + px2, y - 14.5 + py2, 1.1, 0, 7); ctx.fill()
    ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'
    if (mood === 'happy') { ctx.beginPath(); ctx.arc(x, y - 11, 2.6, 0.15, Math.PI - 0.15); ctx.stroke() }
    else if (mood === 'sad') { ctx.beginPath(); ctx.arc(x, y - 8.2, 2.4, Math.PI + 0.35, Math.PI * 2 - 0.35); ctx.stroke() }
    else { ctx.beginPath(); ctx.moveTo(x - 1.6, y - 10.2); ctx.lineTo(x + 1.6, y - 10.2); ctx.stroke() }
    if (p.human) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.human === 1 ? '10' : '9', x, y + PR2 + 13)
    }
  }

  _soccerBall(x, y) {
    const { ctx } = this
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x, y, BR2, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath(); ctx.arc(x, y, BR2 * 0.36, 0, 7); ctx.fill()
    for (let i = 0; i < 5; i++) {
      const a = this._t * 0.8 + (i / 5) * 6.28
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * BR2 * 0.66, y + Math.sin(a) * BR2 * 0.66, BR2 * 0.18, 0, 7); ctx.fill()
    }
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.3
    ctx.beginPath(); ctx.arc(x, y, BR2, 0, 7); ctx.stroke()
  }

  _drawIntro() {
    const { ctx } = this
    cardFb(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1e4a16'
    ctx.font = 'bold 32px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.15)
    ctx.fillStyle = '#5a7a48'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.215)
    ctx.fillStyle = '#243a1c'
    wrapFb(ctx, T.how, VW / 2, VH * 0.28, VW * 0.7, 22)
    wrapFb(ctx, T.how2p, VW / 2, VH * 0.47, VW * 0.7, 21)
    ctx.fillStyle = '#5a7a48'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.545)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.26, mh = VH * 0.088, mgap = VW * 0.04
    mDefs.forEach((m, i) => {
      const x = VW / 2 - mw - mgap / 2 + i * (mw + mgap), y = VH * 0.565
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(90,140,70,0.35)'
      rFb(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rFb(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#2c4424'
      ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.44)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    // 先進幾球獲勝(玩家自由輸入:−/+ 步進、點數字直接鍵入)
    this._countBtns = []
    ctx.fillStyle = '#5a7a48'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(T.pickGoal, VW / 2 - VW * 0.1, VH * 0.712)
    ctx.textAlign = 'center'
    drawStepperFb(ctx, this._countBtns, VW / 2 - VW * 0.07, VH * 0.672, this.goalTarget)
    ctx.fillStyle = '#5a7a48'
    ctx.font = '12px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('(點數字可直接輸入 1~10)', VW / 2 + VW * 0.13, VH * 0.712)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5a7a48'
    ctx.font = '15px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.765)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.11, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.78
      ctx.fillStyle = '#6ab04c'
      rFb(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#10280a'
      ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
      ctx.fillText(a.label, x + bw / 2, y + bh * 0.42)
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.fillText(a.desc, x + bw / 2, y + bh * 0.78)
      this._btns.push({ x, y, w: bw, h: bh, key })
    })
  }

  _drawDone() {
    const { ctx, W, H } = this
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const x = W * 0.12, y = H * 0.1, w = W * 0.76, h = H * 0.8
    ctx.fillStyle = '#f4faf0'
    ctx.strokeStyle = '#6ab04c'; ctx.lineWidth = 3
    rFb(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1e4a16'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p'
      ? (this.result === 'blue' ? T.end2pBlue : this.result === 'red' ? T.end2pRed : T.endDraw)
      : (this.result === 'blue' ? T.endWin : this.result === 'draw' ? T.endDraw : T.endLose)
    ctx.fillText(title, W / 2, H * 0.22)
    ctx.font = `bold ${Math.max(26, H * 0.09)}px "Noto Sans TC",sans-serif`
    ctx.fillStyle = '#243a1c'
    ctx.fillText(`🔵 ${this.scoreB} : ${this.scoreR} 🔴`, W / 2, H * 0.38)
    if (this.mode === 'ai') {
      ctx.font = `${Math.max(24, H * 0.07)}px "Noto Sans TC",sans-serif`
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.5)
    }
    ctx.fillStyle = '#2c4424'
    wrapFb(ctx, T.teach, W / 2, H * 0.6, W * 0.6, H * 0.05)
    ctx.restore()
  }
}

function rFb(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
// 「− 數字 +」步進器(數字可點=直接輸入);把三顆熱區推進 btns
function drawStepperFb(ctx, btns, x, y, val) {
  const bw = 40, bh = 34, nw = 66, gap = 8
  const defs = [
    { act: 'dec', w: bw, label: '−' },
    { act: 'edit', w: nw, label: String(val) },
    { act: 'inc', w: bw, label: '+' },
  ]
  let xx = x
  for (const d of defs) {
    ctx.fillStyle = d.act === 'edit' ? '#ffe070' : 'rgba(90,140,70,0.35)'
    rFb(ctx, xx, y, d.w, bh, 9); ctx.fill()
    if (d.act === 'edit') { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2; rFb(ctx, xx, y, d.w, bh, 9); ctx.stroke() }
    ctx.fillStyle = d.act === 'edit' ? '#3a2c06' : '#2c4424'
    ctx.font = `bold ${d.act === 'edit' ? 18 : 20}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(d.label, xx + d.w / 2, y + bh * 0.68)
    btns.push({ x: xx, y, w: d.w, h: bh, act: d.act })
    xx += d.w + gap
  }
}
function cardFb(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(246,252,240,0.96)'
  ctx.strokeStyle = '#6ab04c'; ctx.lineWidth = 3
  rFb(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
}
function wrapFb(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
