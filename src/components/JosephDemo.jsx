import { useEffect, useRef, useState } from 'react'
import { Game as JosephGame } from '../minigames/joseph/game'

// 約瑟的彩衣(?demo=joseph,創 37→50):系列第一個「滑塊拼圖」關的直達入口(新類型③)。
// 點空格旁的碎塊把彩衣拼回;永不會輸(只有還沒拼完),卡住有 💡 提示。主題:神把破碎拼回(創 50:20)。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核),牧者審核通過前不進大廳卡。
export default function JosephDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new JosephGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__joseph = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#c9a06a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a6a33', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
