import { useEffect, useRef, useState } from 'react'
import { Game as MannaGame } from '../minigames/manna/game'

// 🍞 嗎哪收取(出 16:14-18,?demo=manna):永不會輸;⚠ 文案 AI 草擬(引文已 cuv 逐字核),牧者審核通過前不進大廳卡。
export default function MannaDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new MannaGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__manna = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#c8b48e' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #7a6a4a', background: '#fdf8ec', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
