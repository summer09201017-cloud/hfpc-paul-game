import { useEffect, useRef, useState } from 'react'
import { Game as BasketGame } from '../minigames/basket/game'

// 摩西的籃子(?demo=basket):系列第一個「縱向捲軸漂流閃避」關(新類型⑨,雷電骨架反向化:只躲不打)。碰到障礙只被輕推,嬰孩永遠平安;永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:出 2:3-4、2:10;詩 121:4),牧者審核通過前不進大廳卡。
export default function BasketDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new BasketGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__basket = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#4a88ac' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #2a6a8a', background: '#f4fbff', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
