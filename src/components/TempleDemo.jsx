import { useEffect, useRef, useState } from 'react'
import { Game as TempleGame } from '../minigames/temple/game'

// 活石蓋聖殿(?demo=temple):系列第一個「落石砌合」關(新類型⑩,俄羅斯方塊反向化:砌合非消除)。
// 消行=砌合發光非爆炸;堆到頂=歇口氣沉降,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:王上 6:7、彼前 2:5),牧者審核通過前不進大廳卡。
export default function TempleDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new TempleGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__temple = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#e8d6b4' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #a08040', background: '#fdf8ec', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
