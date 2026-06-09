import { useEffect, useRef, useState } from 'react'
import { Game } from '../minigames/jonah/game'
import { sound } from '../audio/sound'

// 空殼 UI：約拿引擎會呼叫一堆 ui.xxx()（標題/暫停/過關選單），嵌入在保羅彈窗裡時
// 這些 DOM 選單都不需要，於是用 Proxy 把任何方法呼叫都變成「無動作」。
const NullUI = new Proxy({}, { get: () => () => {} })

// 各關的標題與玩法說明（顯示在開始前的提示卡）。
const LEVELS = {
  1: {
    title: '🏃 上岸趕路',
    how: '空白鍵 / ↑ / 點畫面 = 跳，躲過障礙，跑到終點就過關！',
  },
  2: {
    title: '🌊 海上遇風暴',
    how: '船在風浪中搖晃！用 ← → 方向鍵（或點畫面左右兩側）把船扶正，撐過風暴就過關！',
  },
}

// 把約拿的即時小遊戲嵌進保羅彈窗：掛一個 canvas，啟動引擎（嵌入模式），
// 過關 / 失敗時呼叫 onComplete({ won, score, level })，由外層換算成福音點數。
export default function MiniGameModal({ minigame, onComplete }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)

  const level = minigame.level === 1 ? 1 : 2
  const info = LEVELS[level]

  // 在使用者點「開始挑戰」的手勢中啟動：此時 canvas 已排版好（renderer 量得到尺寸），
  // 音訊也能在手勢中解鎖。
  const begin = () => {
    if (started || gameRef.current) return
    setStarted(true)
    sound.stopBgm() // 暫停保羅背景音樂，避免和小遊戲音效打架
    const game = new Game(canvasRef.current, {
      ui: NullUI,
      embed: true,
      level,
      mode: minigame.mode === 'walk' ? 'walk' : 'run',
      onComplete: (result) => onComplete(result),
    })
    gameRef.current = game
    game.boot()
  }

  // 卸載（小遊戲結束、彈窗關閉）時清理引擎並還原保羅背景音樂。
  useEffect(() => {
    return () => {
      if (gameRef.current) gameRef.current.destroy()
      sound.startBgm() // startBgm 內部會檢查靜音設定
    }
  }, [])

  return (
    <div className="modal__overlay">
      <div className="minigame">
        <div className="minigame__head">
          <span className="minigame__kind">闖關挑戰</span>
          <span className="minigame__title">{info.title}</span>
        </div>
        <div className="minigame__stage">
          <canvas ref={canvasRef} className="minigame__canvas" />
          {!started && (
            <div className="minigame__intro">
              <p className="minigame__how">{info.how}</p>
              <button className="btn btn--primary" onClick={begin}>
                開始挑戰 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
