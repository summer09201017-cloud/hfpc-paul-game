import { useEffect, useRef, useState } from 'react'
import { Game as ArmorGame } from '../minigames/armor/game'

// 穿戴全副軍裝(?demo=armor):系列第一個「拖曳裝備/換裝」關(新類型⑧)。六件軍裝拖到士兵正確部位;青年檔穿完加意義配對。全程無敵人不揮砍,永不會輸。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核:弗 6:11、6:13-17),牧者審核通過前不進大廳卡。
export default function ArmorDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new ArmorGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__armor = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#b0a284' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a6a33', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
