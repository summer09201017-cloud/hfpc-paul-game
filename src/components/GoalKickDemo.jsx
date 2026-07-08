import { useEffect, useRef, useState } from 'react'
import { Game as GoalKickGame } from '../minigames/goalkick/game'

// 射門練習(?demo=goalkick):憫安製作休閒關(不掛經文,進大廳憫安合輯)。
// 拖球蓄力射門、守門員左右撲救(時機窗);踢 10 球看進幾球,踢偏/被撲不扣血,永不會輸。
export default function GoalKickDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new GoalKickGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__goalkick = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#5a8a3a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #4a8a2a', background: '#f2faf0', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
