// ===========================================================================
// 保羅宣教之旅 — 純規則引擎 (pure rules engine)
// ---------------------------------------------------------------------------
// 這個檔案「不」匯入任何 React / DOM 的東西，只處理遊戲規則：
//   建立遊戲、擲骰、移動、結算停留格、結束回合、判斷遊戲結束。
// 好處：邏輯可以單獨測試（見 scripts/selfplay.mjs），
//       畫面（React / 之後想換 Phaser）可以隨時抽換而不動到規則。
//
// 核心不變量 (engine invariants)：
//   1. 所有函式都「回傳新的 state」，不修改傳進來的 state（immutable）。
//   2. 骰子的隨機值由外部傳入（roll(state, value)），方便用固定種子做自我對戰測試。
//   3. 只有一個函式回答「遊戲結束了嗎」：getGameStatus()，同時涵蓋勝利與回合上限。
// ===========================================================================

export const PLAYER_COLORS = ['#e4572e', '#2e86ab', '#3a9d23', '#f3a712', '#8e44ad', '#16a085']

/** 深拷貝玩家陣列，保持 immutability。 */
function clonefPlayers(players) {
  return players.map((p) => ({ ...p, companions: [...p.companions] }))
}

/**
 * 建立一場新遊戲。
 * @param {Array<{name:string}>} playerConfigs 玩家設定（1~4 人）
 * @param {object} board journeyX.json 的內容（含 stations）
 */
export function createGame(playerConfigs, board) {
  const startStation = board.stations[0]
  const startCompanions = startStation.startCompanions || []

  const players = playerConfigs.map((cfg, i) => ({
    id: i,
    name: cfg.name && cfg.name.trim() ? cfg.name.trim() : `玩家 ${i + 1}`,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    position: 0, // station index
    gospelPoints: 0,
    companions: [...startCompanions],
    skipNext: false, // 下一回合是否要暫停（被石頭打傷之類）
    finished: false, // 是否已抵達終點
  }))

  return {
    board,
    players,
    currentPlayerIndex: 0,
    diceValue: null,
    turnCount: 0,
    lastMoverId: null,
    pendingStationId: null, // 剛停留、待結算的格子
    pendingQuizIndex: null, // 這一輪從該格題庫抽中的題目索引（外部注入隨機值，見 advance）
    lastResult: null, // 上一次結算的結果（給畫面顯示用）
    phase: 'idle', // idle | rolled | resolving | turnEnd | gameover
    log: [],
  }
}

function pushLog(log, message) {
  return [...log, message]
}

/** 擲骰：value 由外部產生（1~6），引擎保持純函式以利測試。 */
export function roll(state, value) {
  if (state.phase !== 'idle') return state
  return { ...state, diceValue: value, phase: 'rolled' }
}

/**
 * 取得某站的「問答題庫」：優先用 quizzes 陣列（多題隨機抽），
 * 否則退回單一 quiz（向後相容舊資料），都沒有就回空陣列。
 */
export function getQuizPool(station) {
  if (station && Array.isArray(station.quizzes) && station.quizzes.length > 0) return station.quizzes
  if (station && station.quiz) return [station.quiz]
  return []
}

/** 從題庫長度與注入的隨機值 [0,1) 算出要抽第幾題（夾在合法範圍內）。 */
function pickQuizIndex(poolLength, quizRoll) {
  if (poolLength <= 0) return null
  const r = Number.isFinite(quizRoll) ? quizRoll : 0
  return Math.min(poolLength - 1, Math.max(0, Math.floor(r * poolLength)))
}

/**
 * 依骰子點數把目前玩家往前移動，並從停留格的題庫抽出這一輪要答的題。
 * 終點會「卡住」（不會超過最後一格），停在最後一格即視為抵達。
 * @param {object} state
 * @param {number} quizRoll 抽題用的隨機值 [0,1)，由外部注入（保持引擎純函式、可重現）。
 */
export function advance(state, quizRoll = 0) {
  if (state.phase !== 'rolled' || state.diceValue == null) return state

  const lastIndex = state.board.stations.length - 1
  const players = clonefPlayers(state.players)
  const player = players[state.currentPlayerIndex]

  const target = Math.min(player.position + state.diceValue, lastIndex)
  player.position = target
  const station = state.board.stations[target]

  // 這一輪從該格題庫抽中哪一題（隨機值外部注入，沒有題目則為 null）。
  const pendingQuizIndex = pickQuizIndex(getQuizPool(station).length, quizRoll)

  return {
    ...state,
    players,
    pendingStationId: station.id,
    pendingQuizIndex,
    lastMoverId: player.id,
    phase: 'resolving',
    log: pushLog(state.log, `${player.name} 擲出 ${state.diceValue}，前進到「${station.name}」。`),
  }
}

/** 取得目前待結算格子「這一輪抽中」的那一題（沒有題目則 null）。畫面與結算都用這一個。 */
export function getActiveQuiz(state) {
  if (!state || !state.pendingStationId) return null
  const station = getStation(state, state.pendingStationId)
  const pool = getQuizPool(station)
  if (!pool.length) return null
  const i = state.pendingQuizIndex == null ? 0 : state.pendingQuizIndex
  return pool[Math.min(pool.length - 1, Math.max(0, i))] || null
}

/**
 * 結算目前停留的格子。
 * @param {object} state
 * @param {object} payload 對問答格而言是 { answerIndex }；其他格忽略。
 */
export function resolve(state, payload = {}) {
  if (state.phase !== 'resolving' || !state.pendingStationId) return state

  const station = state.board.stations.find((s) => s.id === state.pendingStationId)
  const players = clonefPlayers(state.players)
  const player = players[state.currentPlayerIndex]
  const scoreLabel = state.board.scoreLabel || '分數'

  let result = { stationId: station.id, type: station.type, lines: [] }
  let log = state.log

  // 1) 先套用這一格「本身」的效果（事件卡 / 劇情格）。
  //    每一格都可以再附一題問答（見步驟 2）——劇情與答題並存。
  if (station.type === 'event' && station.event) {
    const ev = station.event
    applyEffect(player, ev.effect, result, scoreLabel)
    result.eventTitle = ev.title
    result.eventKind = ev.kind
    if (ev.resultText) result.lines.unshift(ev.resultText)
    log = pushLog(log, `${player.name} 觸發事件「${ev.title}」。`)
  } else if (station.effect) {
    // start / story / end ：直接套用 effect（若有）
    applyEffect(player, station.effect, result, scoreLabel)
  }

  // 2) 不論格子類型，只要這一格有問答題就計分（每座城市都能靠答題賺點數）。
  //    用 getActiveQuiz 取「這一輪抽中的那一題」——和畫面顯示的必定是同一題。
  const q = getActiveQuiz(state)
  if (q) {
    const correct = payload.answerIndex === q.answerIndex
    const reward = q.reward || 1
    result.quiz = true
    result.correct = correct
    result.answerIndex = q.answerIndex
    result.explanation = q.explanation
    if (correct) {
      player.gospelPoints += reward
      result.lines.push(`答對了！${scoreLabel} +${reward}`)
      log = pushLog(log, `${player.name} 答對問答，${scoreLabel} +${reward}。`)
    } else {
      result.lines.push('答錯了，沒關係，再接再厲！')
      log = pushLog(log, `${player.name} 答錯了問答。`)
    }
  }

  // 抵達終點？
  if (player.position === state.board.stations.length - 1) {
    player.finished = true
  }

  return {
    ...state,
    players,
    lastResult: result,
    phase: 'turnEnd',
    log,
  }
}

/** 把一個 effect 套用到玩家身上，並把人看得懂的描述寫進 result.lines。 */
function applyEffect(player, effect, result, scoreLabel) {
  if (!effect) return
  if (typeof effect.gospelPoints === 'number' && effect.gospelPoints !== 0) {
    player.gospelPoints += effect.gospelPoints
    const sign = effect.gospelPoints > 0 ? '+' : ''
    result.lines.push(`${scoreLabel} ${sign}${effect.gospelPoints}`)
  }
  if (effect.removeCompanion) {
    const idx = player.companions.indexOf(effect.removeCompanion)
    if (idx >= 0) {
      player.companions.splice(idx, 1)
      result.lines.push(`${effect.removeCompanion} 離隊了`)
    }
  }
  if (effect.addCompanion && !player.companions.includes(effect.addCompanion)) {
    player.companions.push(effect.addCompanion)
    result.lines.push(`${effect.addCompanion} 加入了！`)
  }
  if (effect.skipNext) {
    player.skipNext = true
    result.lines.push('下一回合暫停一次')
  }
}

/**
 * 找出下一個「還沒抵達終點、且不需要暫停」的玩家索引；途中清掉 skipNext 旗標。
 * 注意：finished（已抵達終點，永久出局）與 skipNext（暫停一回合）是兩回事——
 * 只要還有人沒抵達終點就一定要回傳某個人，不能因為大家都在「暫停」就誤判遊戲結束。
 * 最多繞兩圈：第一圈把途中的 skipNext 用掉，第二圈必定找得到可行動者。
 */
function nextActiveIndex(players, fromIndex) {
  const n = players.length
  if (!players.some((p) => !p.finished)) return -1 // 真的全部抵達終點了
  let idx = fromIndex
  for (let step = 0; step < n * 2; step++) {
    idx = (idx + 1) % n
    const p = players[idx]
    if (p.finished) continue
    if (p.skipNext) {
      p.skipNext = false // 用掉這次暫停
      continue
    }
    return idx
  }
  return -1
}

/** 結束目前回合，輪到下一位玩家；同時推進回合數並判斷遊戲是否結束。 */
export function endTurn(state) {
  if (state.phase !== 'turnEnd') return state

  const status = getGameStatus(state)
  if (status.over) {
    return { ...state, phase: 'gameover', diceValue: null, pendingStationId: null, pendingQuizIndex: null }
  }

  const players = clonefPlayers(state.players)
  const nextIndex = nextActiveIndex(players, state.currentPlayerIndex)

  // 沒有人能再行動（全部完成或全部卡住）→ 結束
  if (nextIndex === -1) {
    return { ...state, players, phase: 'gameover', diceValue: null, pendingStationId: null, pendingQuizIndex: null }
  }

  return {
    ...state,
    players,
    currentPlayerIndex: nextIndex,
    diceValue: null,
    pendingStationId: null,
    pendingQuizIndex: null,
    lastResult: null,
    turnCount: state.turnCount + 1,
    phase: 'idle',
  }
}

/**
 * 唯一回答「遊戲結束了嗎」的函式。涵蓋：
 *   - 所有玩家都抵達終點 → 結束（不再是「第一個到的人贏」，而是大家都走完）。
 *   - 超過回合上限（turnCap）→ 強制結束（防止任何理論上的無限迴圈）。
 * 勝負：以「福音點數」最高者為勝 —— 讓答對聖經問答、把握事件真正決定輸贏，
 *       而不是擲骰運氣誰先到終點。同分時才比抵達與否、再比位置。
 * 回傳 { over, winnerId, reason, ranking }。
 */
export function getGameStatus(state) {
  const turnCap = state.board.turnCap || 200

  const everyoneFinished = state.players.every((p) => p.finished)
  let over = false
  let reason = null

  if (everyoneFinished) {
    over = true
    reason = 'all_finished'
  } else if (state.turnCount >= turnCap) {
    over = true
    reason = 'turn_cap'
  }

  // 名次：福音點數最高者獲勝；同分再看是否抵達終點，再看位置。
  const ranking = [...state.players].sort((a, b) => {
    if (b.gospelPoints !== a.gospelPoints) return b.gospelPoints - a.gospelPoints
    if (a.finished !== b.finished) return a.finished ? -1 : 1
    return b.position - a.position
  })

  return {
    over,
    reason,
    winnerId: over && ranking.length > 0 ? ranking[0].id : null,
    ranking,
  }
}

/** 小工具：取得某 station 物件。 */
export function getStation(state, stationId) {
  return state.board.stations.find((s) => s.id === stationId) || null
}
