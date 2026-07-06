import { useEffect, useRef, useState } from 'react'
import { Game as EzraGame } from '../minigames/ezra/game'

// 以斯拉護送(?demo=ezra):系列第一個「護送」關(新類型⑥)。點暗影,以斯拉去舉手禱告退散之;沒有武器,保護是神施恩的手。永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核),牧者審核通過前不進大廳卡。
export default function EzraDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new EzraGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__ezra = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#c9a870' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a6a33', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
