import { useEffect, useRef, useState } from 'react'
import { Game as SamuelGame } from '../minigames/samuel/game'

// 撒母耳聽呼喚(?demo=samuel,撒上 3):系列第一個「記憶序列(Simon 型)」關的直達入口。
// 四盞油燈依序亮,照順序點回來;聽錯溫柔重聽、永不會輸。主題:聽與順服。
// ⚠ WIP:過關句撒上 3:10 的 mp3 尚未烤(朗讀鐵則)——烤完+實測後才可併 main。
// ⚠ 文案 AI 草擬(引文已 cuv 逐字核),牧者審核通過前不進大廳卡。
export default function SamuelDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const g = new SamuelGame(canvasRef.current, { embed: true, winPoints: 3, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__samuel = g // 開發/測試掛勾
    g.boot()
    return () => g.destroy()
  }, [])
  const replay = () => window.location.reload()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#141a33' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {result && (
        <button onClick={replay} style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #8a6a33', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
      )}
    </div>
  )
}
