import { useEffect, useRef, useState } from 'react'
import { Game as BasketballGame } from '../minigames/basketball/game'

// 🏀 世界盃籃球賽(?demo=basketball):憫安休閒關,無經文免送審;即時運球+甜蜜區投籃,AI/雙人同機。
export default function BasketballDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new BasketballGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__basketball = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#7a5a30' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #a06a3a', background: '#faf6f0', cursor: 'pointer' }}>再來一場 ↻</button>
      )}
    </div>
  )
}
