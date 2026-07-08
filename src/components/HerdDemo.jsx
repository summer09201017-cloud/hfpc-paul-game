import { useEffect, useRef, useState } from 'react'
import { Game as HerdGame } from '../minigames/herd/game'

// 趕羊入圈(?demo=herd):系列第一個「撞球物理」關(新類型⑯,撞球反向化)。
// 拖曳牧羊犬撞羊入圈=歸聚(非落袋消失);犬進門汪汪跑回不扣桿;永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:約 10:16、詩 23:1-2),牧者審核通過前不進大廳卡。
export default function HerdDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new HerdGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__herd = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#6a8a4a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #5a8a3a', background: '#f2faf0', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
