import { useEffect, useRef, useState } from 'react'
import { Game as StewardGame } from '../minigames/steward/game'

// 好管家(?demo=steward):經營管理②(太 25 按才幹的比喻)。星等按忠心不按金額;埋藏=溫柔教導,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:太 25:14-15、25:21、林前 4:2),牧者審核通過前不進大廳卡。
export default function StewardDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new StewardGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__steward = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#e8d2a8' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #a08040', background: '#fdf8ec', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
