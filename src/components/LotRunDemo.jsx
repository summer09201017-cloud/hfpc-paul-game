import { useEffect, useRef, useState } from 'react'
import { Game as LotRunGame } from '../minigames/lotrun/game'

// 羅得紅綠燈(?demo=lotrun):系列第一個「忍住誘惑・向前跑」關(創 19 不可回頭看)。
// 按了回頭鈕=鹽柱驚險一刻,但天使拉住(創 19:16 憐恤),永不會輸;星等=忍住幾次。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:創 19:15-17、路 17:32),牧者審核通過前不進大廳卡。
export default function LotRunDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new LotRunGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__lotrun = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#7a5060' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a5060', background: '#fdf4f0', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
