import { useEffect, useRef, useState } from 'react'
import { Game as SowerGame } from '../minigames/sower/game'

// 護住好種子(?demo=sower):守護反應(打地鼠家族)第一式・驅趕型(新類型⑦a)。點飛鳥拍手趕走,護種子長成小苗;被啄只倒退,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:太 13:4、13:19、路 8:15),牧者審核通過前不進大廳卡。
export default function SowerDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new SowerGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__sower = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#c9d8a8' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #6a8a33', background: '#fbfff2', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
