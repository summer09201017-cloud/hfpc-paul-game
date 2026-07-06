import { useEffect, useRef, useState } from 'react'
import { Game as FoxesGame } from '../minigames/foxes/game'

// 擒拿小狐狸(?demo=foxes):守護反應(打地鼠家族)第二式・分辨型擒拿(新類型⑦b)。點狐狸網子擒走(經文動詞「擒拿」,不打死);蝴蝶瓢蟲無害別抓錯。永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:歌 2:15),牧者審核通過前不進大廳卡。
export default function FoxesDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new FoxesGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__foxes = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#a8b070' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #a06a2a', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
