import { useEffect, useRef, useState } from 'react'
import { Game as SparksGame } from '../minigames/sparks/game'

// 撲滅小火苗(?demo=sparks):守護反應(打地鼠家族)第三式・蔓延型撲滅(新類型⑦c)。點火苗倒水撲滅;拖久蔓延+天色變暗但永遠救得回來。永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:雅 3:5、箴 21:23),牧者審核通過前不進大廳卡。
export default function SparksDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new SparksGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__sparks = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#b8c890' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #4a7a9a', background: '#f8fcff', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
