import { useEffect, useRef, useState } from 'react'
import { Game as HoopShotGame } from '../minigames/hoopshot/game'

// 🏀 投籃大賽(?demo=hoopshot):憫安休閒關,無經文免送審;甜蜜區蓄力投籃,輪流對決阿福教練/雙人同機。
export default function HoopShotDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new HoopShotGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__hoopshot = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#2c3242' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #a06a3a', background: '#faf6f0', cursor: 'pointer' }}>再來一場 ↻</button>
      )}
    </div>
  )
}
