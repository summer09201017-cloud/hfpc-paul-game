import { useEffect, useRef, useState } from 'react'
import { Game as LostCoinGame } from '../minigames/lostcoin/game'

// 失錢找物(?demo=lostcoin):系列第一個「找物/找碴」關(路 15:8-10 點燈細細地找)。沒有時間失敗,直到找著,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:路 15:8-10),牧者審核通過前不進大廳卡。
export default function LostCoinDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new LostCoinGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__lostcoin = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#8a7050' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a6a30', background: '#fdf8ec', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
