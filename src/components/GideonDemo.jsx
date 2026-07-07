import { useEffect, useRef, useState } from 'react'
import { Game as GideonGame } from '../minigames/gideon/game'

// 基甸拆祭壇(?demo=gideon):系列第一個「打磚塊」關(新類型⑪,士 6:25-27 夜裡奉命拆巴力壇)。
// ⚠ 絕不可換皮成耶利哥(牆是神拆的不是人砸的);球掉出=僕人撿回不扣命,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:士 6:25-27、約翰一書 5:21),牧者審核通過前不進大廳卡。
export default function GideonDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new GideonGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__gideon = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1c2440' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #4a5a88', background: '#f0f4ff', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
