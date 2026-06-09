import { useState, useRef, useCallback, useEffect } from 'react'
import journey from '../data/journey1.json'
import * as engine from '../core/engine'
import { sound } from '../audio/sound'

const ROLL_MS = 5000 // 跑馬燈轉動時間（至少 5 秒，營造期待感）
const MOVE_MS = 850 // 棋子移動動畫時間

// UI 階段：
//   setup    選人數 / 取名
//   idle     等待目前玩家擲骰
//   rolling  骰子轉動中
//   moving   棋子移動中
//   station  停在格子上，顯示劇情 / 問題（尚未結算）
//   result   已結算，顯示結果
//   gameover 遊戲結束
export function useGame() {
  const [game, setGame] = useState(null)
  const [phase, setPhase] = useState('setup')
  const [diceFace, setDiceFace] = useState(1)

  const timeouts = useRef([])
  const rollTimer = useRef(null)

  const clearAll = useCallback(() => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
    if (rollTimer.current) {
      clearInterval(rollTimer.current)
      rollTimer.current = null
    }
  }, [])

  // 元件卸載時清掉所有計時器，避免殘留 timer 在已卸載元件上動作。
  useEffect(() => clearAll, [clearAll])

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timeouts.current.push(id)
    return id
  }, [])

  const startGame = useCallback((playerConfigs) => {
    clearAll()
    sound.unlock() // 由使用者點擊觸發，喚醒音訊
    sound.startBgm()
    setGame(engine.createGame(playerConfigs, journey))
    setPhase('idle')
  }, [clearAll])

  const rollAndMove = useCallback(() => {
    if (phase !== 'idle' || !game) return
    const value = 1 + Math.floor(Math.random() * 3) // 跑馬燈 1~3 步（比骰子 1~6 更不易跳過城市）

    setPhase('rolling')
    // 跑馬燈轉動：每 80ms 換一個隨機數字（1~3），每跳一格響一聲滴答。
    rollTimer.current = setInterval(() => {
      setDiceFace(1 + Math.floor(Math.random() * 3))
      sound.tick()
    }, 80)

    later(() => {
      if (rollTimer.current) {
        clearInterval(rollTimer.current)
        rollTimer.current = null
      }
      setDiceFace(value)
      sound.ding() // 跑馬燈停下
      // 擲骰 → 移動（純引擎運算）；抽題的隨機值在這裡注入，引擎本身保持純函式。
      const quizRoll = Math.random()
      const moved = engine.advance(engine.roll(game, value), quizRoll)
      setGame(moved)
      setPhase('moving')
      sound.move()
      // 等棋子滑到定點，再打開格子內容
      later(() => setPhase('station'), MOVE_MS)
    }, ROLL_MS)
  }, [phase, game, later])

  // 結算目前格子。問答格傳 { answerIndex }；其餘格忽略 payload。
  const resolveStation = useCallback(
    (payload = {}) => {
      if (phase !== 'station' || !game) return
      const next = engine.resolve(game, payload)
      setGame(next)
      setPhase('result')
      // 有問答題才播答對 / 答錯音效。
      if (next.lastResult && next.lastResult.quiz) {
        next.lastResult.correct ? sound.correct() : sound.wrong()
      }
    },
    [phase, game],
  )

  const finishTurn = useCallback(() => {
    if (phase !== 'result' || !game) return
    const next = engine.endTurn(game)
    setGame(next)
    if (next.phase === 'gameover') {
      setPhase('gameover')
      sound.stopBgm()
      sound.win()
    } else {
      setPhase('idle')
    }
  }, [phase, game])

  const restart = useCallback(() => {
    clearAll()
    setGame(null)
    setPhase('setup')
  }, [clearAll])

  const status = game ? engine.getGameStatus(game) : null
  const currentStation =
    game && game.pendingStationId ? engine.getStation(game, game.pendingStationId) : null
  // 這一輪實際抽中、要顯示與計分的那一題（多題隨機抽；舊的單一 quiz 也走這裡）。
  const currentQuiz = game ? engine.getActiveQuiz(game) : null

  return {
    journey,
    game,
    phase,
    diceFace,
    status,
    currentStation,
    currentQuiz,
    currentPlayer: game ? game.players[game.currentPlayerIndex] : null,
    startGame,
    rollAndMove,
    resolveStation,
    finishTurn,
    restart,
  }
}
