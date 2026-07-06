import { useEffect, useRef, useState } from 'react'
import { Game as WallguardGame } from '../minigames/wallguard/game'

// 尼希米守望(?demo=wallguard):系列第一個「塔防(佈置守望)」關(新類型⑤)。點牆段佈崗吹角退敵(不殺敵,神為我們爭戰);六段牆修完=過關,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核),牧者審核通過前不進大廳卡。
export default function WallguardDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new WallguardGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__wallguard = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#8a6a44' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a6a33', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
