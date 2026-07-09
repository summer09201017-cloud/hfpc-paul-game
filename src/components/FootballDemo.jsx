import { useEffect, useRef, useState } from 'react'
import { Game as FootballGame } from '../minigames/football/game'

// ⚽ 世界盃足球賽・實況版(?demo=football):憫安休閒關,無經文免送審;真運球+蓄力踢球,AI/雙人同機。
export default function FootballDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new FootballGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__football = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#3f7a34' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #4a7a3a', background: '#f4faf0', cursor: 'pointer' }}>再來一場 ↻</button>
      )}
    </div>
  )
}
