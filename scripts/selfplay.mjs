// ===========================================================================
// 自我對戰測試 (self-play harness)
// ---------------------------------------------------------------------------
// 用固定亂數種子，自動把整場遊戲玩到結束，驗證：
//   1. 每一場都會在合理回合數內「結束」（不會無限迴圈）。
//   2. 結束時一定有合法的勝出者。
//   3. 暫停 (skipNext)、移除同工等效果不會讓流程卡死。
// 執行：  npm run test:selfplay
// 這一層只跑純引擎、完全不碰畫面，是抓「遊戲永遠不結束」這類 bug 最有效的方法。
// ===========================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createGame, roll, advance, resolve, endTurn, getGameStatus, getStation } from '../src/core/engine.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const board = JSON.parse(readFileSync(join(__dirname, '../src/data/journey1.json'), 'utf-8'))

// 簡單可重現的亂數產生器 (mulberry32)，吃一個種子。
function makeRng(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function playOneGame(numPlayers, seed) {
  const rng = makeRng(seed)
  const configs = Array.from({ length: numPlayers }, (_, i) => ({ name: `P${i + 1}` }))
  let state = createGame(configs, board)

  const HARD_CAP = 5000 // 安全上限：超過就算 bug
  let iterations = 0

  while (state.phase !== 'gameover') {
    iterations++
    if (iterations > HARD_CAP) {
      throw new Error(`遊戲在 ${numPlayers} 人 / 種子 ${seed} 下超過 ${HARD_CAP} 步仍未結束 — 可能無限迴圈！`)
    }

    if (state.phase === 'idle') {
      const dice = 1 + Math.floor(rng() * 3) // 跑馬燈 1~3（與畫面一致）
      state = roll(state, dice)
    } else if (state.phase === 'rolled') {
      state = advance(state)
    } else if (state.phase === 'resolving') {
      const station = getStation(state, state.pendingStationId)
      let payload = {}
      // 與引擎一致：只要這一格「有問答題」就作答（不限 type，event/story/end 也可能掛題）。
      if (station.quiz) {
        // 隨機作答，刻意製造答對/答錯兩種情況
        payload = { answerIndex: Math.floor(rng() * station.quiz.options.length) }
      }
      state = resolve(state, payload)
    } else if (state.phase === 'turnEnd') {
      state = endTurn(state)
    } else {
      throw new Error(`未知的 phase: ${state.phase}`)
    }
  }

  const status = getGameStatus(state)
  if (!status.over) throw new Error('phase 是 gameover 但 getGameStatus 卻說沒結束')
  if (status.winnerId == null) throw new Error('遊戲結束卻沒有勝出者')

  return { iterations, turnCount: state.turnCount, status, state }
}

let totalGames = 0
let totalTurns = 0
let maxTurns = 0
const reasons = {}

for (let numPlayers = 1; numPlayers <= 4; numPlayers++) {
  for (let seed = 1; seed <= 300; seed++) {
    const { turnCount, status } = playOneGame(numPlayers, seed)
    totalGames++
    totalTurns += turnCount
    maxTurns = Math.max(maxTurns, turnCount)
    reasons[status.reason] = (reasons[status.reason] || 0) + 1
  }
}

console.log('✅ 自我對戰測試通過')
console.log(`   場數：${totalGames}（1~4 人 × 300 種子）`)
console.log(`   平均回合：${(totalTurns / totalGames).toFixed(1)}，最多回合：${maxTurns}`)
console.log(`   結束原因分布：`, reasons)

// 抽一場 2 人遊戲印出最終名次，肉眼確認結果合理。
const sample = playOneGame(2, 42)
console.log('\n   範例（2 人 / 種子 42）最終名次：')
sample.status.ranking.forEach((p, i) => {
  console.log(
    `     ${i + 1}. ${p.name}  位置=${p.position}  ${board.scoreLabel}=${p.gospelPoints}  ${p.finished ? '✔抵達終點' : ''}`,
  )
})
