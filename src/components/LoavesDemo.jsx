import { useEffect, useRef, useState } from 'react'
import { Game as LoavesGame } from '../minigames/loaves/game'

// 五餅二魚・分餅關(?demo=loaves,約 6:1-13):耶穌生平之旅闖關③的直達入口。
// 引擎自帶 intro/win 卡片,掛上即玩;不會輸。
export default function LoavesDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new LoavesGame(canvasRef.current, { embed: true, winPoints: 5, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__loaves = g
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#4d8a45' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
