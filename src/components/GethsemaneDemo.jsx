import { useEffect, useRef, useState } from 'react'
import { Game as GethsemaneGame } from '../minigames/gethsemane/game'

// 客西馬尼・警醒(?demo=gethsemane,太 26:36-46):耶穌生平之旅闖關⑥的直達入口。
// 「撐住不睡」——無論撐得多好,經文結局不變;撐不住=溫柔敘事,不會輸。
export default function GethsemaneDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new GethsemaneGame(canvasRef.current, { embed: true, winPoints: 5, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__gethsemane = g
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#141a33' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #6a6a9c', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
