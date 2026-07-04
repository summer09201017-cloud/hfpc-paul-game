import { useEffect, useRef, useState } from 'react'
import { Game as HarpToyGame } from '../minigames/harptoy/game'

// 大衛彈琴・自由演奏(?demo=harptoy,撒上 16:23):音樂玩具——沒有音符、沒有錯的音,
// 幼稚園版;與 ?demo=davidharp(節奏判定版)同故事兩玩法(bible-minigame-two-forms)。
export default function HarpToyDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new HarpToyGame(canvasRef.current, { embed: true, winPoints: 5, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__harptoy = g
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1d1a2e' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}>再彈一次 ↻</button>
      )}
    </div>
  )
}
