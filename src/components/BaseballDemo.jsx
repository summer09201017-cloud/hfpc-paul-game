import { useEffect, useRef, useState } from 'react'
import { Game as BaseballGame } from '../minigames/baseball/game'

// ⚾ 棒球打擊王(?demo=baseball):憫安休閒關,無經文免送審;時機揮棒,🤖 打擊練習/👥 投打對決。
export default function BaseballDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new BaseballGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__baseball = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#3a4a7a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #4a7a3e', background: '#f4faf0', cursor: 'pointer' }}>再來一場 ↻</button>
      )}
    </div>
  )
}
