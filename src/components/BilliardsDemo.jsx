import { useEffect, useRef, useState } from 'react'
import { Game as BilliardsGame } from '../minigames/billiards/game'

// 🎱 花式撞球(?demo=billiards):憫安休閒關,無經文免送審;真物理入袋,🤖 對戰阿福/👥 雙人同機。
export default function BilliardsDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new BilliardsGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__billiards = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#2a2033' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #2e7d4f', background: '#f2f8f0', cursor: 'pointer' }}>再來一場 ↻</button>
      )}
    </div>
  )
}
