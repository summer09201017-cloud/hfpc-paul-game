// ⚾ 棒球打擊王(baseball)——憫安製作休閒關(不掛經文,進大廳「休閒運動合輯」)。
// ⚠ 休閒關,刻意不掛聖經經文(同 goalkick/soccer/football 前例);無 cuv/tts/送審文案這一套。
//
// ★ 2026-07-09 大改(使用者實玩點名,交接第一優先):
//   ① 主審視角——你站在本壘板後,球從遠方投手丘朝鏡頭飛來、由小變大(不再是側視橫飛)。
//   ② 分好壞球——虛線「好球帶」,球進帶=好球、帶外=壞球;壞球可以不揮,四壞=🚶 保送上壘 +1;
//      累積好球數/壞球數(B/S 燈號);三好球=溫柔換打席(不扣分,沒有出局懲罰)。
//   ③ 時機窗放寬——原本完美窗只有 ~0.03 秒(13px@470px/s,一直揮空),改成以「秒」計:
//      幼 0.16/童 0.11/青 0.085 秒,寬 3~5 倍;界外窗再外擴一段。
//   ④ 界外球也要看到球飛出去——擦棒後球真的高飛斜出邊線(不再只有文字)。
//
// 兩種模式(使用者拍板 A+B 都要):
//   A. 🤖 打擊練習:阿福教練站遠方投手丘投 10 球(快速球/慢速球/變化球),抓時機揮棒——
//      時機完美=🎆 全壘打(飛越中外野牆+距離)、不錯=安打、差一點=界外、太早太晚=揮空;看總分拿星。
//   B. 👥 投打對決(雙人同機):P1 當投手(W/S 五檔高低含壞球、A/D 選球種、空白鍵投球)、P2 打擊(Enter 揮棒);
//      6 球後攻守交換,打擊得分高者勝。壞球引誘不揮=朝保送前進,投打鬥智。
// 操作:打者=空白鍵/Enter/點畫面 揮棒;投手(對決)=W/S 高低、A/D 球種、空白鍵投出。
// 溫柔規則:揮空/界外不扣分、三好球只是換打席——每一球都是新的機會;onComplete 永遠 won:true。
// 年齡三檔:幼(全慢速球・時機窗超寬)/童(快慢混・標準)/青(含變化球・時機窗窄)。
// 嵌入契約:new Game(canvas,{embed,winPoints,onComplete}) + boot()/destroy();零相依、零美術檔、可離線。

const VW = 960
const VH = 540
const PITCHES_A = 10 // 練習模式球數
const PITCHES_B = 6 // 對決模式每人打擊球數

// ── 主審視角幾何(0~1 的 prog:0=投手出手、1=到本壘)──
const REL = { x: VW / 2, y: 232 } // 投手放球點(遠、小)
const HORIZON = 205 // 地平線/全壘打牆
const PLATE = { x: VW / 2, y: 506 } // 本壘板(近、大)
// 好球帶(本壘上方的虛線框;球的落點在框內=好球)
const ZONE = { x: VW / 2 - 55, y: 312, w: 110, h: 112 }
const BALL_R0 = 3.5 // 出手時球半徑
const BALL_R1 = 17 // 到本壘時球半徑(大一點,主審視角的「衝過來」感)

// aiBat=投球挑戰模式的 AI 打者(阿福):chase=追打壞球率(追打必打不好)、swingStrike=好球出棒率、
// dist=出棒結果機率(homer/hit/foul,其餘=揮空)——年齡檔越高阿福越會打,投手越難壓制。
const AGES = {
  young: { label: '🐣 幼', desc: '全慢速球・時機窗超寬', kinds: ['slow'], win: { perfect: 0.16, good: 0.34 }, ballRate: 0.2, aiBat: { chase: 0.35, swingStrike: 0.85, dist: { homer: 0.1, hit: 0.28, foul: 0.32 } } },
  kid: { label: '🙂 童', desc: '快慢+曲球・標準', kinds: ['fast', 'slow', 'curve'], win: { perfect: 0.11, good: 0.24 }, ballRate: 0.3, aiBat: { chase: 0.22, swingStrike: 0.92, dist: { homer: 0.16, hit: 0.34, foul: 0.3 } } },
  teen: { label: '🔥 青', desc: '五種球路・時機窗窄', kinds: ['fast', 'slow', 'curve', 'slider', 'sinker'], win: { perfect: 0.085, good: 0.19 }, ballRate: 0.35, aiBat: { chase: 0.12, swingStrike: 0.96, dist: { homer: 0.24, hit: 0.38, foul: 0.26 } } },
}
// dur=飛行秒數(由遠而近);brkX/brkY=軌跡彎曲幅度、late=晚破(快到本壘才折)——
// 彎的是「途中的路徑」,終點仍是選定落點(好壞球判定不變,難在讀球)。07-10 使用者點名加曲球/滑球。
const PITCH_KINDS = {
  fast: { label: '🔥 快速球', dur: 0.9, brkX: 0, brkY: 0, late: false },
  slow: { label: '🐢 慢速球', dur: 1.5, brkX: 0, brkY: 0, late: false },
  curve: { label: '🌜 曲球', dur: 1.25, brkX: 34, brkY: 20, late: false },
  slider: { label: '⚡ 滑球', dur: 1.0, brkX: 42, brkY: 0, late: true },
  sinker: { label: '⤵️ 伸卡球', dur: 1.05, brkX: 0, brkY: 36, late: true },
}
// ★好球帶=九宮格(07-10 使用者點名):投手用 W/S(列)×A/D(欄)選格,內 3×3=九個好球格、
//   外圈(列/欄 0 或 4)=引誘壞球位——5×5 網格,中央九格落在好球帶三等分的格心。
const GRID_R = [
  { label: '⬆⬆ 高壞球(引誘)', ty: 282 },
  { label: '上格', ty: ZONE.y + ZONE.h / 6 },
  { label: '中格', ty: ZONE.y + ZONE.h / 2 },
  { label: '下格', ty: ZONE.y + (ZONE.h * 5) / 6 },
  { label: '⬇⬇ 低壞球(引誘)', ty: 452 },
]
const GRID_C = [
  { label: '⬅⬅ 左壞球(引誘)', tx: ZONE.x - 36 },
  { label: '左格', tx: ZONE.x + ZONE.w / 6 },
  { label: '中格', tx: ZONE.x + ZONE.w / 2 },
  { label: '右格', tx: ZONE.x + (ZONE.w * 5) / 6 },
  { label: '➡➡ 右壞球(引誘)', tx: ZONE.x + ZONE.w + 36 },
]

const T = {
  title: '⚾ 棒球打擊王',
  sub: '憫安製作・主審視角!看清好壞球',
  how: '你站在本壘板後,球會「由遠而近」朝你飛來!球進虛線好球帶才是好球——壞球別揮,四壞=🚶 保送上壘得 1 分;球飛到最大(快到本壘)時揮棒(空白鍵/Enter/點畫面):完美=🎆 全壘打、不錯=安打、差一點=界外。三好球只是換個打席,沒有出局——每一球都是新的機會!',
  how2p: '🎯 投球挑戰:你當投手(W/S 高低、A/D 左右、Q/E 換球種、空白鍵/點畫面投球),阿福打擊——用九宮格落點和五種球路騙過他!👥 投打對決:P1 投手、P2 打者(Enter 揮棒),攻守交換比打擊分。這兩種模式可以自己選要比幾球!',
  pickMode: '選模式:',
  pickCount: '比幾球(每人):',
  pickAge: '選難度:',
  modeAI: '🤖 打擊練習',
  modeAIDesc: '阿福投 10 球你打',
  modePitch: '🎯 投球挑戰',
  modePitchDesc: '你投球,阿福打擊',
  mode2P: '👥 投打對決',
  mode2PDesc: '投打輪流 PK',
  homer: '🎆 全壘打!',
  hit: '⚾ 安打!',
  foul: '😅 界外!',
  whiff: '💨 揮空…',
  strikeTake: '👀 好球!要出棒喔',
  ballTake: '👌 壞球,看得好!',
  walk: '🚶 四壞保送!上壘',
  strikeout: '😌 三好球,換個打席',
  pitcherHint: 'P1 投手:W/S 高低 ・ A/D 左右 ・ Q/E 球種 ・ 空白鍵投球',
  pitcherHintSolo: '你是投手:W/S 高低 ・ A/D 左右 ・ Q/E 球種 ・ 空白鍵/點畫面投',
  batterHint: '球飛到最大時揮棒!壞球別揮!',
  swapMsg: '⇄ 攻守交換!',
  endWin: (s) => `🏆 打擊王!${s} 分!`,
  endGood: (s) => `🎉 好打者!${s} 分!`,
  endOk: (s) => `⚾ 練習完成!${s} 分!`,
  end2p: (w) => (w === 0 ? '🤝 平手,好比賽!' : `🏆 ${w === 1 ? 'P1' : 'P2'} 打擊獲勝!`),
  endPitch3: (s) => `🏆 王牌投手!只讓阿福得 ${s} 分!`,
  endPitch2: (s) => `🎉 好投手!阿福得 ${s} 分`,
  endPitch1: (s) => `⚾ 投球練習完成!阿福得 ${s} 分`,
  teach: '打擊率三成就是好打者——十次有七次沒打中也沒關係。看清好壞球、抓好時機,下一球永遠是新的機會!',
  teachPitch: '控球跟打擊一樣是本事——好球搶好球數、壞球引誘出棒,跟阿福鬥智。被打出去也沒關係,下一球重新來!',
}

export class Game {
  constructor(canvas, opts = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.embed = !!opts.embed
    this.winPoints = opts.winPoints ?? 3
    this.onComplete = opts.onComplete || (() => {})
    this.state = 'intro' // intro → ready → pitching → result → done(對決多 half 交換)
    this.stopped = false
    this._raf = 0
    this._t = 0
    this._btns = []
    this._modeBtns = []
    this._countBtns = []
    this.mode = 'ai' // ai=打擊練習 / pitch=投球挑戰(你投阿福打) / 2p=投打對決
    this.pitchTotal = 6 // pitch/2p 模式的球數(使用者在開場選 3/6/9/12)
    this.aiPlan = null // 投球挑戰:阿福這球的出棒計畫 {swing, at}
    this._batFace = 'focus' // 打者表情:focus/happy/sad(swing 動畫中=張嘴)
    this._pitFace = 'calm' // 投手表情:calm/oh(驚)/smile(得意)
    this._onKeyDown = (e) => this._key(e)
    this._onDown = (e) => this._down(e)
    this._onResize = () => this._resize()
    this.ball = null // {t,dur,kind,tx,ty,brkX,brkY,late,isStrike,swung}
    this.pitchCount = 0
    this.score = { 1: 0, 2: 0 } // 對決=兩人打擊分;練習只用 [1]
    this.half = 1 // 對決:1=P1投/P2打,2=交換
    this.balls = 0 // 本打席壞球數(B)
    this.strikes = 0 // 本打席好球數(S)
    this.pitchSel = { row: 2, col: 2, kind: 'fast' } // 投手選球(高低/左右/球種)
    this.aiT = 0
    this.swing = 0 // 揮棒動畫計時
    this.hitFly = null // 打出去的球(fair:{t,dur,x1,y1,peak,dist} / foul:{x,y,vx,vy})
    this.resultT = 0
    this.bubble = ''
    this.toasts = []
    this._audio = null
  }

  boot() {
    addEventListener('keydown', this._onKeyDown)
    this.cv.addEventListener('pointerdown', this._onDown)
    addEventListener('resize', this._onResize)
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
    this.cv.removeEventListener('pointerdown', this._onDown)
    removeEventListener('resize', this._onResize)
    try { this._audio && this._audio.close() } catch {}
  }

  _total() { return this.mode === 'ai' ? PITCHES_A : this.pitchTotal }
  // 現在打擊的人記在哪個分數欄:練習=玩家[1];投球挑戰=阿福[2];對決上半 P2 打[2]、下半 P1 打[1]
  _batter() { return this.mode === 'ai' ? 1 : this.mode === 'pitch' ? 2 : this.half === 1 ? 2 : 1 }

  _start(age) {
    this.age = age
    this.cfg = AGES[age]
    this.pitchCount = 0
    this.score = { 1: 0, 2: 0 }
    this.half = 1
    this.balls = 0
    this.strikes = 0
    this.toasts = []
    this.bubble = ''
    this._ready()
    this.state = 'ready'
  }

  _ready() {
    this.ball = null
    this.hitFly = null
    this.swing = 0
    this.aiPlan = null
    this._batFace = 'focus'
    this._pitFace = 'calm'
    this.pitchSel = { row: 2, col: 2, kind: this.cfg.kinds[0] }
    if (this.mode === 'ai') {
      this.aiT = 1.0 + Math.random() * 0.9 // 阿福醞釀
      this.bubble = ['接好囉!', '看清楚是不是好球!', '看仔細!'][Math.floor(Math.random() * 3)]
    } else if (this.mode === 'pitch') {
      this.bubble = ['來吧,投好球!', '我等著打全壘打!', '你騙不到我的!'][Math.floor(Math.random() * 3)]
    }
  }

  _resetCount() { this.balls = 0; this.strikes = 0 }

  _inZone(tx, ty) {
    const g = 6 // 球半徑的寬容
    return tx >= ZONE.x - g && tx <= ZONE.x + ZONE.w + g && ty >= ZONE.y - g && ty <= ZONE.y + ZONE.h + g
  }

  // 投球:kind=球種,落點(tx,ty)——框內=好球、框外=壞球
  _pitch(kind, tx, ty) {
    const spec = PITCH_KINDS[kind]
    this.ball = {
      t: 0,
      dur: spec.dur,
      kind,
      tx, ty,
      // 軌跡彎曲:左右隨機一邊,幅度照球種;late=快到本壘才折(滑球/伸卡難讀)
      brkX: spec.brkX ? (Math.random() < 0.5 ? -spec.brkX : spec.brkX) : 0,
      brkY: spec.brkY || 0,
      late: spec.late,
      isStrike: this._inZone(tx, ty),
      swung: false,
      judged: false,
    }
    this.state = 'pitching'
    this._tone(240, 0.06, 0, 'sine', 0.07)
    // 投球挑戰:阿福這球的出棒計畫——先擲「揮不揮」,再擲結果、換算成揮棒時間點
    if (this.mode === 'pitch') {
      const ai = this.cfg.aiBat
      const b = this.ball
      const swings = b.isStrike ? Math.random() < ai.swingStrike : Math.random() < ai.chase
      if (!swings) { this.aiPlan = { swing: false } }
      else {
        // 追打壞球=多半打不好;好球照年齡檔的結果分布
        const roll = Math.random()
        const d = b.isStrike ? ai.dist : { homer: 0, hit: 0.1, foul: 0.4 }
        const w = this.cfg.win
        let adt // 距完美時機幾秒(照結果反推,動畫與判定同步)
        if (roll < d.homer) adt = Math.random() * w.perfect
        else if (roll < d.homer + d.hit) adt = w.perfect + Math.random() * (w.good - w.perfect)
        else if (roll < d.homer + d.hit + d.foul) adt = w.good + Math.random() * w.good * 0.9
        else adt = w.good * 1.9 + 0.05 + Math.random() * 0.2 // 揮空
        this.aiPlan = { swing: true, at: b.dur - adt } // 一律提早揮(晚揮會撞上主審宣判)
      }
    }
  }

  // AI(阿福)選球:strike 率依年齡,壞球投在帶外邊緣引誘
  _aiPick() {
    const kind = this.cfg.kinds[Math.floor(Math.random() * this.cfg.kinds.length)]
    if (Math.random() < this.cfg.ballRate) {
      // 壞球:上下或左右帶外
      const side = Math.floor(Math.random() * 4)
      let tx, ty
      if (side === 0) { tx = ZONE.x + Math.random() * ZONE.w; ty = ZONE.y - 30 - Math.random() * 18 }
      else if (side === 1) { tx = ZONE.x + Math.random() * ZONE.w; ty = ZONE.y + ZONE.h + 26 + Math.random() * 18 }
      else if (side === 2) { tx = ZONE.x - 28 - Math.random() * 16; ty = ZONE.y + Math.random() * ZONE.h }
      else { tx = ZONE.x + ZONE.w + 28 + Math.random() * 16; ty = ZONE.y + Math.random() * ZONE.h }
      this._pitch(kind, tx, ty)
    } else {
      // 好球:帶內隨機
      const tx = ZONE.x + 12 + Math.random() * (ZONE.w - 24)
      const ty = ZONE.y + 12 + Math.random() * (ZONE.h - 24)
      this._pitch(kind, tx, ty)
    }
  }

  // 球此刻的畫面位置與大小(prog 可 >1:過本壘往鏡頭外飛)
  // 彎曲剖面:一般=sin(πp)中段最彎;late=sin(π·p^2.2)快到本壘才折——終點都回到選定落點
  _ballPos(b) {
    const p = Math.min(1.35, b.t / b.dur)
    const pp = Math.min(1, p)
    const prof = Math.sin(Math.PI * (b.late ? Math.pow(pp, 2.2) : pp))
    const x = REL.x + (b.tx - REL.x) * p + prof * (b.brkX || 0)
    let arc = prof * (b.brkY || 0)
    if (b.kind === 'slow') arc -= Math.sin(pp * Math.PI) * 26
    const y = REL.y + (b.ty - REL.y) * p + arc
    const r = BALL_R0 + (BALL_R1 - BALL_R0) * p
    return { x, y, r, p }
  }

  // 揮棒:按「球離到達本壘還差幾秒」判品質(時機窗以秒計,已放寬)
  _swing() {
    if (this.state !== 'pitching' || !this.ball || this.ball.swung) return
    const b = this.ball
    b.swung = true
    this.swing = 0.3 // 揮棒動畫
    const adt = Math.abs(b.t - b.dur) // 距完美時機幾秒
    const batter = this._batter()
    let pts = 0, msg
    if (adt <= this.cfg.win.perfect) { pts = 3; msg = T.homer }
    else if (adt <= this.cfg.win.good) { pts = 1; msg = T.hit }
    else if (adt <= this.cfg.win.good * 1.9) { msg = T.foul }
    else { msg = T.whiff }
    // 追打壞球:碰得到但打不好(最多安打)——溫柔教「壞球別揮」
    if (!b.isStrike && pts === 3) { pts = 1; msg = T.hit }
    this.score[batter] += pts
    this.lastPts = pts
    this.toasts.push({ text: msg + (pts ? ` +${pts}` : ''), t: this._t })
    const pos = this._ballPos(b)
    if (pts >= 3) {
      // 全壘打:球朝中外野飛遠變小、越過全壘打牆,距離跟時機準度
      const dist = 96 + Math.round((1 - adt / Math.max(0.001, this.cfg.win.perfect)) * 30)
      this.hitFly = {
        kind: 'fair', t: 0, dur: 1.15,
        x0: pos.x, y0: pos.y,
        x1: VW / 2 + (Math.random() * 2 - 1) * 130, y1: HORIZON - 14,
        peak: 190, dist, homer: true,
      }
      this.ball = null
      this._tone(523, 0.1, 0, 'triangle', 0.12); this._tone(659, 0.12, 0.09, 'triangle', 0.12); this._tone(784, 0.24, 0.18, 'triangle', 0.12)
      if (this.mode === 'ai') this.bubble = '哇——飛出去了!'
      else if (this.mode === 'pitch') this.bubble = '被我扛出去啦!'
      this._batFace = 'happy'; this._pitFace = 'oh'
      this._resetCount()
    } else if (pts > 0) {
      // 安打:朝外野落地(飛遠變小,沒過牆)
      this.hitFly = {
        kind: 'fair', t: 0, dur: 1.0,
        x0: pos.x, y0: pos.y,
        x1: VW / 2 + (Math.random() * 2 - 1) * 230, y1: HORIZON + 60 + Math.random() * 40,
        peak: 130, dist: 0, homer: false,
      }
      this.ball = null
      this._tone(494, 0.1, 0, 'triangle', 0.11); this._tone(659, 0.16, 0.09, 'triangle', 0.1)
      if (this.mode === 'ai') this.bubble = '好球!'
      else if (this.mode === 'pitch') this.bubble = '安打!'
      this._batFace = 'happy'; this._pitFace = 'oh'
      this._resetCount()
    } else if (msg === T.foul) {
      // ★ 界外球也要看到球飛出去:擦棒高飛斜出邊線
      const dir = Math.random() < 0.5 ? -1 : 1
      this.hitFly = { kind: 'foul', x: pos.x, y: pos.y, vx: dir * (260 + Math.random() * 200), vy: -(400 + Math.random() * 140) }
      this.ball = null
      // 界外算好球,但不會變成第三好球(棒球規則)
      if (this.strikes < 2) this.strikes += 1
      this._tone(330, 0.07, 0, 'square', 0.05)
      if (this.mode === 'ai') this.bubble = '擦到了!再來!'
      else if (this.mode === 'pitch') this.bubble = '差一點點!'
      this._batFace = 'sad'
    } else {
      // 揮空=好球;球繼續飛進捕手手套(result 階段續畫)
      this.strikes += 1
      this._tone(190, 0.1, 0, 'sine', 0.06)
      if (this.mode === 'ai') this.bubble = '穩住,下一球!'
      else if (this.mode === 'pitch') this.bubble = '哎呀,揮空了!'
      this._batFace = 'sad'; this._pitFace = 'smile'
    }
    this._afterCount()
    this._endPitch()
  }

  // 沒揮棒,球過本壘=主審判定好壞球
  _take() {
    const b = this.ball
    b.swung = true
    b.judged = true
    if (b.isStrike) {
      this.strikes += 1
      this.toasts.push({ text: T.strikeTake, t: this._t })
      if (this.mode === 'ai') this.bubble = '那顆是好球喔!'
      else if (this.mode === 'pitch') this.bubble = '唔,好球…'
      this._batFace = 'sad'; this._pitFace = 'smile'
      this._tone(210, 0.08, 0, 'sine', 0.05)
    } else {
      this.balls += 1
      this.toasts.push({ text: T.ballTake, t: this._t })
      if (this.mode === 'ai') this.bubble = '眼光好!'
      else if (this.mode === 'pitch') this.bubble = '我才不上當!'
      this._tone(392, 0.08, 0, 'sine', 0.05)
    }
    this._afterCount()
    this._endPitch()
  }

  // 結算 B/S:四壞=保送 +1、三好=溫柔換打席(不扣分)
  _afterCount() {
    if (this.balls >= 4) {
      const batter = this._batter()
      this.score[batter] += 1
      this.toasts.push({ text: T.walk + ' +1', t: this._t })
      this._tone(523, 0.1, 0, 'triangle', 0.1); this._tone(659, 0.14, 0.1, 'triangle', 0.1)
      if (this.mode === 'ai') this.bubble = '選球也是好本事!'
      else if (this.mode === 'pitch') this.bubble = '謝謝保送~'
      this._batFace = 'happy'; this._pitFace = 'oh'
      this._resetCount()
    } else if (this.strikes >= 3) {
      this.toasts.push({ text: T.strikeout, t: this._t })
      if (this.mode === 'ai') this.bubble = '沒關係,新的打席!'
      else if (this.mode === 'pitch') this.bubble = '好啦,再一個打席!'
      if (this.mode === 'pitch') this._pitFace = 'smile'
      this._resetCount()
    }
  }

  _endPitch() {
    this.pitchCount += 1
    this.state = 'result'
    this.resultT = 1.35
  }

  _update(dt) {
    if (this.state === 'intro' || this.state === 'done') return
    this.swing = Math.max(0, this.swing - dt)
    if (this.state === 'ready') {
      // 阿福自動投球(練習);對決由 P1 按空白鍵投
      if (this.mode === 'ai') {
        this.aiT -= dt
        if (this.aiT <= 0) this._aiPick()
      }
    }
    if (this.state === 'pitching') {
      const b = this.ball
      b.t += dt
      // 投球挑戰:到了阿福的出棒時間點就揮
      if (this.mode === 'pitch' && this.aiPlan?.swing && !b.swung && b.t >= this.aiPlan.at) this._swing()
      // 沒揮棒,球過本壘一小段=主審宣判
      if (b && !b.swung && b.t >= b.dur + 0.05) this._take()
    }
    if (this.state === 'result') {
      // 沒打中/看過去的球:繼續朝鏡頭飛大然後淡出
      if (this.ball) {
        this.ball.t += dt
        if (this.ball.t > this.ball.dur * 1.4) this.ball = null
      }
      // 打飛的球
      if (this.hitFly) {
        const f = this.hitFly
        if (f.kind === 'fair') {
          f.t += dt
          if (f.t > f.dur + 0.6) this.hitFly = null
        } else {
          f.vy += 640 * dt
          f.x += f.vx * dt
          f.y += f.vy * dt
          if (f.y > VH + 60 || f.x < -60 || f.x > VW + 60) this.hitFly = null
        }
      }
      this.resultT -= dt
      if (this.resultT <= 0) {
        const total = this._total()
        if (this.mode === 'ai') {
          if (this.pitchCount >= total) return this._done()
        } else {
          if (this.half === 1 && this.pitchCount >= total) {
            this.half = 2
            this.pitchCount = 0
            this._resetCount()
            this.toasts.push({ text: T.swapMsg, t: this._t })
            this._tone(440, 0.1, 0, 'triangle', 0.1); this._tone(554, 0.14, 0.1, 'triangle', 0.1)
          } else if (this.half === 2 && this.pitchCount >= total) return this._done()
        }
        this._ready()
        this.state = 'ready'
      }
    }
    this.toasts = this.toasts.filter((t) => this._t - t.t < 1.8)
  }

  _done() {
    this.state = 'done'
    if (this.mode === 'ai') {
      const s = this.score[1]
      this.stars = s >= 16 ? 3 : s >= 8 ? 2 : 1
      this.result = s
    } else if (this.mode === 'pitch') {
      // 投球挑戰:你是投手,阿福得分越低=投得越好(門檻隨球數等比)
      const s = this.score[2]
      const n = this.pitchTotal
      this.stars = s <= n * 0.35 ? 3 : s <= n * 0.85 ? 2 : 1
      this.result = s
    } else {
      // 對決:上半 P2 打、下半 P1 打——比打擊分
      this.result = this.score[1] > this.score[2] ? 1 : this.score[2] > this.score[1] ? 2 : 0
      this.stars = 3
    }
    this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
    const doneScore = this.mode === 'ai' ? this.score[1] * 4 + 10
      : this.mode === 'pitch' ? Math.max(0, this.pitchTotal * 3 - this.score[2]) * 3 + 10
      : Math.max(this.score[1], this.score[2]) * 4 + 10
    setTimeout(() => { if (!this.stopped) this.onComplete({ won: true, score: doneScore, level: 'baseball' }) }, 800)
  }

  _key(e) {
    if (this.state === 'intro') {
      if (e.key === 'm' || e.key === 'M') { this.mode = this.mode === 'ai' ? 'pitch' : this.mode === 'pitch' ? '2p' : 'ai'; this._tone(500, 0.05, 0, 'sine', 0.06) }
      if (e.key === '1') return this._start('young')
      if (e.key === '2') return this._start('kid')
      if (e.key === '3') return this._start('teen')
      return
    }
    // 打者揮棒:練習=空白鍵或 Enter;投球挑戰/對決=投手用空白鍵投球
    if (e.key === ' ') {
      e.preventDefault && e.preventDefault()
      if (this.mode === 'ai') this._swing()
      else if (this.state === 'ready') this._humanPitch() // 投球挑戰/對決:投手投球
    }
    if (e.key === 'Enter' && this.mode !== 'pitch') this._swing() // 投球挑戰揮棒的是阿福
    // 投手選球(投球挑戰/對決的 ready 階段)
    if ((this.mode === '2p' || this.mode === 'pitch') && this.state === 'ready') {
      if (e.key === 'w' || e.key === 'W') { this.pitchSel.row = Math.max(0, this.pitchSel.row - 1); this._tone(460, 0.04, 0, 'sine', 0.05) }
      if (e.key === 's' || e.key === 'S') { this.pitchSel.row = Math.min(GRID_R.length - 1, this.pitchSel.row + 1); this._tone(430, 0.04, 0, 'sine', 0.05) }
      // A/D=左右(07-10 使用者點名);球種改 Q/E 循環
      if (e.key === 'a' || e.key === 'A') { this.pitchSel.col = Math.max(0, this.pitchSel.col - 1); this._tone(450, 0.04, 0, 'sine', 0.05) }
      if (e.key === 'd' || e.key === 'D') { this.pitchSel.col = Math.min(GRID_C.length - 1, this.pitchSel.col + 1); this._tone(440, 0.04, 0, 'sine', 0.05) }
      if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
        const ks = this.cfg.kinds
        const i = ks.indexOf(this.pitchSel.kind)
        this.pitchSel.kind = ks[(i + (e.key === 'q' || e.key === 'Q' ? ks.length - 1 : 1)) % ks.length]
        this._tone(460, 0.04, 0, 'sine', 0.05)
      }
    }
  }

  // 人類投手出手(投球挑戰=你;對決=P1):照面板選的高低與球種,加一點左右晃
  _humanPitch() {
    const loc = GRID_R[this.pitchSel.row]
    const locX = GRID_C[this.pitchSel.col]
    this._pitch(this.pitchSel.kind, locX.tx + (Math.random() * 2 - 1) * 8, loc.ty + (Math.random() * 2 - 1) * 8)
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
        if (b.act === 'dec') this.pitchTotal = Math.max(1, this.pitchTotal - 1)
        else if (b.act === 'inc') this.pitchTotal = Math.min(30, this.pitchTotal + 1)
        else { // 點數字=直接輸入(1-30)
          const v = parseInt(prompt('要比幾球?(1~30)', this.pitchTotal), 10)
          if (v >= 1) this.pitchTotal = Math.min(30, v)
        }
        this._tone(520, 0.05, 0, 'sine', 0.06)
        return
      }
      for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return this._start(b.key)
      return
    }
    // 觸控:練習=點畫面揮棒;投球挑戰=點畫面投球(對決用鍵盤)
    if (this.mode === 'ai') this._swing()
    else if (this.mode === 'pitch' && this.state === 'ready') this._humanPitch()
  }

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
    // 傍晚天空
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#3a4a7a'); grad.addColorStop(1, '#7a6a9a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    const { s, ox, oy } = this._view()
    ctx.save()
    ctx.setTransform(s, 0, 0, s, ox, oy)
    if (this.state === 'intro') { this._drawIntro(); ctx.restore(); return }
    this._drawField()
    // 投手(遠、小):練習=阿福紅衣;投球挑戰/對決=玩家(P1)藍衣
    this._pitcherFar(VW / 2, 262, this.mode === 'ai' ? '#c83a3a' : '#2a5ac8', this.state === 'pitching' && this.ball && this.ball.t < 0.25)
    // 好球帶(投球中且還沒揮/宣判時醒目)
    this._drawZone()
    // 打者(近、大,3/4 側身看得到臉):練習=玩家藍衣;投球挑戰=阿福紅衣;對決=輪到誰穿誰的色
    const batColor = this.mode === 'ai' ? '#2a5ac8' : this.mode === 'pitch' ? '#c83a3a' : this.half === 1 ? '#c83a3a' : '#2a5ac8'
    this._batterFig(332, 516, batColor, this.swing > 0)
    // 投來的球(由小變大;過本壘淡出;殘影強化「朝你飛來」)
    if (this.ball) {
      const b = this.ball
      const { x, y, r, p } = this._ballPos(b)
      const fade = p > 1 ? Math.max(0, 1 - (p - 1) / 0.35) : 1
      for (const back of [0.1, 0.05]) {
        if (b.t / b.dur - back <= 0) continue
        const g0 = this._ballPos({ ...b, t: b.t - back * b.dur })
        ctx.globalAlpha = fade * (back === 0.1 ? 0.12 : 0.25)
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(g0.x, g0.y, g0.r, 0, 7); ctx.fill()
      }
      ctx.globalAlpha = fade
      this._ballDraw(x, y, r)
      ctx.globalAlpha = 1
    }
    // 打飛的球
    if (this.hitFly) this._drawHitFly()
    // 投手選球面板(投球挑戰/對決的 ready 時):高低+左右+球種
    if ((this.mode === '2p' || this.mode === 'pitch') && this.state === 'ready') {
      ctx.fillStyle = 'rgba(20,24,48,0.78)'
      rBb(ctx, 24, 60, 372, 122, 12); ctx.fill()
      ctx.fillStyle = '#eef2f8'
      ctx.font = 'bold 14px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(this.mode === 'pitch' ? T.pitcherHintSolo : T.pitcherHint, 38, 84)
      ctx.font = '15px "Noto Sans TC",sans-serif'
      ctx.fillText(`高低:${GRID_R[this.pitchSel.row].label}`, 38, 110)
      ctx.fillText(`左右:${GRID_C[this.pitchSel.col].label}`, 38, 134)
      ctx.fillText(`球種:${PITCH_KINDS[this.pitchSel.kind].label}`, 38, 158)
      // 落點預覽準星:只在投球挑戰畫(對決畫了會洩底給 P2 打者,靠面板文字就好)
      if (this.mode === 'pitch') {
        const px = GRID_C[this.pitchSel.col].tx, py = GRID_R[this.pitchSel.row].ty
        ctx.strokeStyle = 'rgba(255,224,112,0.9)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(px - 13, py); ctx.lineTo(px + 13, py); ctx.moveTo(px, py - 13); ctx.lineTo(px, py + 13); ctx.stroke()
      }
    }
    // B/S 燈號(壞球/好球數)
    this._drawCount()
    // 阿福教練頭像(練習=投手阿福;投球挑戰=打者阿福,右上)
    if (this.mode !== '2p') this._coach(VW - 74, 64, this.state === 'ready')
    // 漂浮字(多則同時=垂直錯開不重疊)
    this.toasts.forEach((t, i) => {
      const k = (this._t - t.t) / 1.8
      if (k >= 1) return
      const yy = VH * 0.3 - k * 24 + i * 40
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,20,50,0.85)'; ctx.lineWidth = 5
      ctx.font = `bold ${30 + (1 - k) * 6}px "Noto Sans TC",sans-serif`
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, VW / 2, yy)
      ctx.fillText(t.text, VW / 2, yy)
      ctx.globalAlpha = 1
    })
    // HUD
    const total = this._total()
    const hudTxt = this.mode === 'ai'
      ? `⚾ 第 ${Math.min(total, this.pitchCount + 1)}/${total} 球 ・ 得分 ${this.score[1]}`
      : this.mode === 'pitch'
        ? `🎯 你投球 ・ 第 ${Math.min(total, this.pitchCount + 1)}/${total} 球 ・ 阿福 ${this.score[2]} 分`
        : `${this.half === 1 ? '上半' : '下半'} ・ 第 ${Math.min(total, this.pitchCount + 1)}/${total} 球 ・ P1 ${this.score[1]} : ${this.score[2]} P2(打者=${this._batter() === 1 ? 'P1' : 'P2'})`
    ctx.fillStyle = 'rgba(20,24,48,0.7)'
    rBb(ctx, VW * 0.18, 6, VW * 0.64, 32, 12); ctx.fill()
    ctx.fillStyle = '#eef2f8'
    ctx.font = 'bold 16px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(hudTxt, VW / 2, 28)
    ctx.restore()
    if (this.state === 'done') this._drawDone()
  }

  // ── 主審視角球場:地平線+全壘打牆+扇形內野+邊線 ──
  _drawField() {
    const { ctx } = this
    // 外野草地(地平線以下)
    ctx.fillStyle = '#4a7a3e'
    ctx.fillRect(0, HORIZON, VW, VH - HORIZON)
    // 全壘打牆(遠方一道深綠帶)
    ctx.fillStyle = '#2c4a2c'
    ctx.fillRect(0, HORIZON - 22, VW, 22)
    ctx.fillStyle = '#ffe070'
    ctx.font = 'bold 12px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('全壘打牆 120m', VW / 2, HORIZON - 7)
    // 球場燈(左右)
    for (const lx of [90, VW - 90]) {
      ctx.fillStyle = '#5a5f72'
      ctx.fillRect(lx - 4, 66, 8, HORIZON - 88)
      ctx.fillStyle = '#ffe9a0'
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(lx - 16 + i * 16, 62, 7, 0, 7); ctx.fill() }
    }
    // 內野土(從本壘往遠方收窄的扇形)
    ctx.fillStyle = '#b08050'
    ctx.beginPath()
    ctx.moveTo(PLATE.x - 250, VH)
    ctx.lineTo(PLATE.x - 60, HORIZON + 34)
    ctx.lineTo(PLATE.x + 60, HORIZON + 34)
    ctx.lineTo(PLATE.x + 250, VH)
    ctx.closePath(); ctx.fill()
    // 投手丘
    ctx.beginPath(); ctx.ellipse(VW / 2, 268, 52, 13, 0, 0, 7); ctx.fillStyle = '#c09060'; ctx.fill()
    // 邊線(白,透視向遠方收攏)
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(PLATE.x - 16, PLATE.y + 8); ctx.lineTo(48, HORIZON + 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PLATE.x + 16, PLATE.y + 8); ctx.lineTo(VW - 48, HORIZON + 6); ctx.stroke()
    // 本壘板(大,畫面正下方)
    ctx.fillStyle = '#f0f0e8'
    ctx.beginPath()
    ctx.moveTo(PLATE.x - 30, PLATE.y); ctx.lineTo(PLATE.x + 30, PLATE.y)
    ctx.lineTo(PLATE.x + 30, PLATE.y + 12); ctx.lineTo(PLATE.x, PLATE.y + 24); ctx.lineTo(PLATE.x - 30, PLATE.y + 12)
    ctx.closePath(); ctx.fill()
  }

  // 好球帶=九宮格虛線框(07-10 使用者點名)+文字;投球挑戰的 ready 時亮選中的格
  _drawZone() {
    const { ctx } = this
    const active = this.state === 'pitching' && this.ball && !this.ball.swung
    // 選中的格(投球挑戰;選外圈壞球位就沒有格好亮,靠準星)
    if (this.mode === 'pitch' && this.state === 'ready') {
      const { row, col } = this.pitchSel
      if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
        ctx.fillStyle = 'rgba(255,224,112,0.22)'
        ctx.fillRect(ZONE.x + ((col - 1) * ZONE.w) / 3, ZONE.y + ((row - 1) * ZONE.h) / 3, ZONE.w / 3, ZONE.h / 3)
      }
    }
    ctx.strokeStyle = active ? 'rgba(255,224,112,0.85)' : 'rgba(255,255,255,0.35)'
    ctx.lineWidth = active ? 3.5 : 2.5
    ctx.setLineDash([7, 7])
    ctx.strokeRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h)
    // 內格線(細一點):切成 3×3 九宮格
    ctx.lineWidth = active ? 1.8 : 1.2
    ctx.setLineDash([5, 6])
    for (let i = 1; i <= 2; i++) {
      const gx = ZONE.x + (ZONE.w * i) / 3, gy = ZONE.y + (ZONE.h * i) / 3
      ctx.beginPath(); ctx.moveTo(gx, ZONE.y); ctx.lineTo(gx, ZONE.y + ZONE.h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ZONE.x, gy); ctx.lineTo(ZONE.x + ZONE.w, gy); ctx.stroke()
    }
    ctx.setLineDash([])
    if (this.state === 'ready' || active) {
      ctx.fillStyle = active ? 'rgba(255,224,112,0.85)' : 'rgba(255,255,255,0.5)'
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('好球帶', ZONE.x + ZONE.w + 10, ZONE.y + 16)
    }
  }

  // B/S 燈號(棒球記分牌樣式:B 三顆綠、S 兩顆黃)
  _drawCount() {
    const { ctx } = this
    const x = 24, y = VH - 106
    ctx.fillStyle = 'rgba(20,24,48,0.72)'
    rBb(ctx, x, y, 150, 78, 12); ctx.fill()
    ctx.font = 'bold 17px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'left'
    const rows = [
      { label: '壞球 B', n: 3, lit: this.balls, color: '#5ad06a' },
      { label: '好球 S', n: 2, lit: this.strikes, color: '#ffd24a' },
    ]
    rows.forEach((row, i) => {
      const yy = y + 26 + i * 32
      ctx.fillStyle = '#eef2f8'
      ctx.fillText(row.label, x + 12, yy + 6)
      for (let d = 0; d < row.n; d++) {
        ctx.beginPath(); ctx.arc(x + 92 + d * 20, yy, 7.5, 0, 7)
        ctx.fillStyle = d < row.lit ? row.color : 'rgba(255,255,255,0.18)'
        ctx.fill()
      }
    })
  }

  // 打出去的球:界內=朝外野飛遠變小(全壘打過牆+距離);界外=高飛斜出邊線
  _drawHitFly() {
    const { ctx } = this
    const f = this.hitFly
    if (f.kind === 'fair') {
      const p = Math.min(1, f.t / f.dur)
      const x = f.x0 + (f.x1 - f.x0) * p
      const y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * f.peak
      const r = BALL_R1 * (1 - 0.75 * p)
      this._ballDraw(x, y, Math.max(3, r))
      if (f.homer && p >= 1) {
        // 過牆煙火+距離
        ctx.fillStyle = '#ffe070'
        ctx.font = 'bold 20px "Noto Sans TC",sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`🎆 ${f.dist} 公尺!`, f.x1, f.y1 - 26)
      }
    } else {
      this._ballDraw(f.x, f.y, BALL_R1 * 0.8)
      // 界外提示箭頭
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('界外', f.x, f.y - 20)
    }
  }

  // 遠方投手(小,面向鏡頭;★系列鐵則:人物都要有眼睛表情嘴巴——遠景小人也要)
  _pitcherFar(x, groundY, color, throwing) {
    const { ctx } = this
    ctx.fillStyle = color
    ctx.fillRect(x - 8, groundY - 40, 16, 22)
    ctx.fillStyle = '#3a3f52'
    ctx.fillRect(x - 7, groundY - 18, 6, 18); ctx.fillRect(x + 1, groundY - 18, 6, 18)
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, groundY - 47, 7.5, 0, 7); ctx.fill()
    ctx.fillStyle = color === '#c83a3a' ? '#c83a3a' : '#183a86' // 帽
    ctx.beginPath(); ctx.arc(x, groundY - 50, 7.5, Math.PI, 0); ctx.fill()
    // 臉:眼睛(擲球時瞇起專注)+嘴巴(calm=抿嘴/oh=驚訝圓嘴/smile=得意)
    const f = this._pitFace
    ctx.fillStyle = '#2a2018'
    if (throwing) { // 專注瞇眼
      ctx.fillRect(x - 3.6, groundY - 48, 2.4, 1.2); ctx.fillRect(x + 1.2, groundY - 48, 2.4, 1.2)
    } else {
      ctx.beginPath(); ctx.arc(x - 2.5, groundY - 47.5, 1.2, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 2.5, groundY - 47.5, 1.2, 0, 7); ctx.fill()
    }
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1; ctx.lineCap = 'round'
    if (f === 'oh') { ctx.beginPath(); ctx.arc(x, groundY - 43.5, 1.6, 0, 7); ctx.stroke() }
    else if (f === 'smile') { ctx.beginPath(); ctx.arc(x, groundY - 44.5, 2, 0.2, Math.PI - 0.2); ctx.stroke() }
    else { ctx.beginPath(); ctx.moveTo(x - 1.6, groundY - 43.5); ctx.lineTo(x + 1.6, groundY - 43.5); ctx.stroke() }
    // 手臂
    ctx.strokeStyle = color; ctx.lineWidth = 4.5; ctx.lineCap = 'round'
    if (throwing) { ctx.beginPath(); ctx.moveTo(x + 6, groundY - 36); ctx.lineTo(x + 15, groundY - 50); ctx.stroke() }
    else { ctx.beginPath(); ctx.moveTo(x + 6, groundY - 36); ctx.lineTo(x + 12, groundY - 26); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(x - 6, groundY - 36); ctx.lineTo(x - 12, groundY - 27); ctx.stroke()
  }

  // 打者(近、大,3/4 側身面朝投手;★系列鐵則:看得到眼睛、眉毛、表情、嘴巴)
  // 表情:focus=專注抿嘴 / swing 動畫中=張嘴用力 / happy=大笑瞇眼 / sad=皺眉扁嘴
  _batterFig(x, groundY, color, swinging) {
    const { ctx } = this
    // 腿
    ctx.fillStyle = '#3a3f52'
    ctx.fillRect(x - 17, groundY - 52, 13, 52); ctx.fillRect(x + 4, groundY - 52, 13, 52)
    // 軀幹
    ctx.fillStyle = color
    ctx.fillRect(x - 20, groundY - 108, 40, 58)
    // 背號
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = 'bold 22px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('7', x, groundY - 68)
    // 頭(3/4 側身,臉朝投手=畫面中央偏右)+頭盔(讓出右下臉)
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, groundY - 124, 16, 0, 7); ctx.fill()
    ctx.fillStyle = '#2c3242'
    ctx.beginPath(); ctx.arc(x, groundY - 126, 16.5, Math.PI * 0.72, Math.PI * 1.98); ctx.fill()
    const f = swinging ? 'swing' : this._batFace
    // 眼睛(兩顆,瞳孔看向投手/來球方向=右上)
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.ellipse(x + 3, groundY - 126, 3.2, f === 'happy' ? 2.2 : 3.4, 0, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.ellipse(x + 11.5, groundY - 125, 3.2, f === 'happy' ? 2.2 : 3.4, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#2a2018'
    ctx.beginPath(); ctx.arc(x + 4.2, groundY - 126.6, 1.7, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 12.7, groundY - 125.6, 1.7, 0, 7); ctx.fill()
    // 眉毛(focus/swing=下壓專注;happy=上揚;sad=內端上挑八字眉)
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
    ctx.beginPath()
    if (f === 'sad') { ctx.moveTo(x, groundY - 131); ctx.lineTo(x + 6, groundY - 132.5); ctx.moveTo(x + 9, groundY - 131.5); ctx.lineTo(x + 15, groundY - 130) }
    else if (f === 'happy') { ctx.moveTo(x + 0.5, groundY - 132); ctx.lineTo(x + 6, groundY - 133); ctx.moveTo(x + 9.5, groundY - 132); ctx.lineTo(x + 15, groundY - 131) }
    else { ctx.moveTo(x + 0.5, groundY - 131.5); ctx.lineTo(x + 6, groundY - 130.5); ctx.moveTo(x + 9.5, groundY - 130); ctx.lineTo(x + 15, groundY - 129) }
    ctx.stroke()
    // 嘴巴
    ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 2
    if (f === 'swing') { // 用力張嘴
      ctx.fillStyle = '#8a4a3a'
      ctx.beginPath(); ctx.ellipse(x + 8, groundY - 114, 3.4, 4.2, 0, 0, 7); ctx.fill()
    } else if (f === 'happy') { // 大笑
      ctx.beginPath(); ctx.arc(x + 8, groundY - 116, 4.5, 0.15, Math.PI - 0.15); ctx.stroke()
    } else if (f === 'sad') { // 扁嘴
      ctx.beginPath(); ctx.arc(x + 8, groundY - 110, 4, Math.PI + 0.35, Math.PI * 2 - 0.35); ctx.stroke()
    } else { // 專注抿嘴
      ctx.beginPath(); ctx.moveTo(x + 5, groundY - 113.5); ctx.lineTo(x + 11.5, groundY - 113.5); ctx.stroke()
    }
    // 球棒:待機=舉在肩上;揮棒=橫掃向好球帶(右)
    ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 9; ctx.lineCap = 'round'
    ctx.beginPath()
    if (swinging) { ctx.moveTo(x + 14, groundY - 96); ctx.lineTo(x + 118, groundY - 130) }
    else { ctx.moveTo(x + 10, groundY - 100); ctx.lineTo(x + 34, groundY - 156) }
    ctx.stroke()
    // 手臂
    ctx.strokeStyle = color; ctx.lineWidth = 8
    ctx.beginPath(); ctx.moveTo(x + 6, groundY - 96); ctx.lineTo(x + (swinging ? 22 : 14), groundY - (swinging ? 98 : 104)); ctx.stroke()
  }

  _ballDraw(x, y, r = BALL_R1) {
    const { ctx } = this
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
    if (r >= 6) {
      ctx.strokeStyle = '#c04040'; ctx.lineWidth = Math.max(1, r * 0.16)
      ctx.beginPath(); ctx.arc(x - r * 0.3, y, r * 0.75, -1.2, 1.2); ctx.stroke()
      ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.75, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke()
    }
  }

  // 阿福教練(擬人化頭像,成套沿用 soccer/football/hoopshot)
  _coach(x, y, thinking) {
    const { ctx } = this
    ctx.fillStyle = 'rgba(20,24,48,0.6)'
    ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill()
    ctx.fillStyle = '#f2d8b0'
    ctx.beginPath(); ctx.arc(x, y + 3, 20, 0, 7); ctx.fill()
    ctx.fillStyle = '#c83a3a'
    ctx.beginPath(); ctx.arc(x, y - 4, 20, Math.PI, 0); ctx.fill()
    ctx.fillRect(x - 22, y - 6, 44, 5)
    ctx.fillStyle = '#2a2018'
    const look = thinking ? -3 + Math.sin(this._t * 3) * 2 : 0
    ctx.beginPath(); ctx.arc(x - 7 + look, y + 3, 2.6, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 7 + look, y + 3, 2.6, 0, 7); ctx.fill()
    ctx.fillStyle = '#8a5a30'
    ctx.beginPath(); ctx.arc(x, y + 12, thinking ? 2.5 : 4, 0, 7); ctx.fill()
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(x + 6, y + 10, 9, 5)
    if (this.bubble) {
      ctx.font = 'bold 13px "Noto Sans TC",sans-serif'
      const w = ctx.measureText(this.bubble).width + 20
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rBb(ctx, x - w, y + 40, w, 26, 10); ctx.fill()
      ctx.fillStyle = '#3a2c14'
      ctx.textAlign = 'center'
      ctx.fillText(this.bubble, x - w / 2, y + 58)
    }
    ctx.fillStyle = '#eef2f8'
    ctx.font = 'bold 11px "Noto Sans TC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('阿福教練', x, y + 32)
  }

  _drawIntro() {
    const { ctx } = this
    ctx.fillStyle = 'rgba(246,248,252,0.96)'
    ctx.strokeStyle = '#4a7a3e'; ctx.lineWidth = 3
    rBb(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c5a1c'
    ctx.font = 'bold 30px "Noto Sans TC",sans-serif'
    ctx.fillText(T.title, VW / 2, VH * 0.12)
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '14px "Noto Sans TC",sans-serif'
    ctx.fillText(T.sub, VW / 2, VH * 0.17)
    ctx.fillStyle = '#2e3c22'
    wrapBb(ctx, T.how, VW / 2, VH * 0.215, VW * 0.74, 19)
    wrapBb(ctx, T.how2p, VW / 2, VH * 0.4, VW * 0.74, 18)
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '14px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickMode, VW / 2, VH * 0.525)
    this._modeBtns = []
    const mDefs = [
      { key: 'ai', label: T.modeAI, desc: T.modeAIDesc },
      { key: 'pitch', label: T.modePitch, desc: T.modePitchDesc },
      { key: '2p', label: T.mode2P, desc: T.mode2PDesc },
    ]
    const mw = VW * 0.22, mh = VH * 0.085, mgap = VW * 0.025
    const mx0 = VW / 2 - mw * 1.5 - mgap
    mDefs.forEach((m, i) => {
      const x = mx0 + i * (mw + mgap), y = VH * 0.545
      const on = this.mode === m.key
      ctx.fillStyle = on ? '#ffe070' : 'rgba(90,140,70,0.3)'
      rBb(ctx, x, y, mw, mh, 12); ctx.fill()
      if (on) { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2.5; rBb(ctx, x, y, mw, mh, 12); ctx.stroke() }
      ctx.fillStyle = on ? '#3a2c06' : '#2c4424'
      ctx.font = 'bold 15px "Noto Sans TC",sans-serif'
      ctx.fillText(`${m.label} ${on ? '✓' : ''}`, x + mw / 2, y + mh * 0.42)
      ctx.font = '11px "Noto Sans TC",sans-serif'
      ctx.fillText(m.desc, x + mw / 2, y + mh * 0.78)
      this._modeBtns.push({ x, y, w: mw, h: mh, key: m.key })
    })
    // 比幾球(投球挑戰/對決才顯示;打擊練習固定 10 球)——玩家自由輸入:−/+ 步進,點數字直接鍵入
    this._countBtns = []
    if (this.mode !== 'ai') {
      ctx.fillStyle = '#5a8a4a'
      ctx.font = '14px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(T.pickCount, VW / 2 - VW * 0.13, VH * 0.695)
      ctx.textAlign = 'center'
      drawStepper(ctx, this._countBtns, VW / 2 - VW * 0.1, VH * 0.655, this.pitchTotal)
      ctx.fillStyle = '#5a8a4a'
      ctx.font = '12px "Noto Sans TC",sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('(點數字可直接輸入 1~30)', VW / 2 + VW * 0.1, VH * 0.695)
      ctx.textAlign = 'center'
    }
    ctx.fillStyle = '#5a8a4a'
    ctx.font = '14px "Noto Sans TC",sans-serif'
    ctx.fillText(T.pickAge, VW / 2, VH * 0.76)
    this._btns = []
    const bw = VW * 0.2, bh = VH * 0.1, gap = VW * 0.04
    const x0 = VW / 2 - bw * 1.5 - gap
    Object.entries(AGES).forEach(([key, a], i) => {
      const x = x0 + i * (bw + gap), y = VH * 0.78
      ctx.fillStyle = '#6aa040'
      rBb(ctx, x, y, bw, bh, 14); ctx.fill()
      ctx.fillStyle = '#12280c'
      ctx.font = 'bold 19px "Noto Sans TC",sans-serif'
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
    ctx.strokeStyle = '#4a7a3e'; ctx.lineWidth = 3
    rBb(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2c5a1c'
    ctx.font = `bold ${Math.max(20, H * 0.06)}px "Noto Sans TC",sans-serif`
    const title = this.mode === '2p' ? T.end2p(this.result)
      : this.mode === 'pitch' ? (this.stars === 3 ? T.endPitch3(this.result) : this.stars === 2 ? T.endPitch2(this.result) : T.endPitch1(this.result))
      : this.stars === 3 ? T.endWin(this.result) : this.stars === 2 ? T.endGood(this.result) : T.endOk(this.result)
    ctx.fillText(title, W / 2, H * 0.24)
    if (this.mode === '2p') {
      ctx.font = `bold ${Math.max(26, H * 0.09)}px "Noto Sans TC",sans-serif`
      ctx.fillStyle = '#2e3c22'
      ctx.fillText(`P1 ${this.score[1]} : ${this.score[2]} P2`, W / 2, H * 0.4)
    } else {
      ctx.font = `${Math.max(24, H * 0.08)}px "Noto Sans TC",sans-serif`
      ctx.fillStyle = '#2e3c22'
      ctx.fillText('⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, H * 0.42)
    }
    ctx.fillStyle = '#3a4a2e'
    wrapBb(ctx, this.mode === 'pitch' ? T.teachPitch : T.teach, W / 2, H * 0.56, W * 0.62, H * 0.05)
    ctx.restore()
  }
}

function rBb(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
// 「− 數字 +」步進器(數字可點=直接輸入);把三顆熱區推進 btns
function drawStepper(ctx, btns, x, y, val) {
  const bw = 40, bh = 34, nw = 66, gap = 8
  const defs = [
    { act: 'dec', w: bw, label: '−' },
    { act: 'edit', w: nw, label: String(val) },
    { act: 'inc', w: bw, label: '+' },
  ]
  let xx = x
  for (const d of defs) {
    ctx.fillStyle = d.act === 'edit' ? '#ffe070' : 'rgba(90,140,70,0.35)'
    rBb(ctx, xx, y, d.w, bh, 9); ctx.fill()
    if (d.act === 'edit') { ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 2; rBb(ctx, xx, y, d.w, bh, 9); ctx.stroke() }
    ctx.fillStyle = d.act === 'edit' ? '#3a2c06' : '#2c4424'
    ctx.font = `bold ${d.act === 'edit' ? 18 : 20}px "Noto Sans TC",sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(d.label, xx + d.w / 2, y + bh * 0.68)
    btns.push({ x: xx, y, w: d.w, h: bh, act: d.act })
    xx += d.w + gap
  }
}
function wrapBb(ctx, text, cx, y, maxW, lineH) {
  ctx.font = `${lineH * 0.72}px "Noto Sans TC",sans-serif`
  let line = '', yy = y
  for (const ch of String(text)) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
    else line += ch
  }
  if (line) ctx.fillText(line, cx, yy)
}
