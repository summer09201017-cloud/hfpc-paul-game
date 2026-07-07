import { useEffect, useRef, useState } from 'react'
import { Game as ArkMatchGame } from '../minigames/arkmatch/game'

// 各從其類・動物歸艙(?demo=arkmatch):系列第一個「彈珠配對」關(新類型⑭,泡泡龍反向化)。
// 配對 3+=同類一起進方舟(非爆破消除);懸空=神親自招聚;結尾=耶和華關門(創 7:16);永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:創 6:20、7:8-9、7:14-16),牧者審核通過前不進大廳卡。
export default function ArkMatchDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new ArkMatchGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__arkmatch = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#b8c8b8' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #5a8a68', background: '#f2faf0', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
