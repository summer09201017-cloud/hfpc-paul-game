import { useEffect, useRef, useState } from 'react'
import { Game as SlingGame } from '../minigames/sling/game'

// 大衛甩石的開發預覽（不在正式遊戲流程內）：開 ?demo=sling 就能單獨玩這關、調手感。
// 之後做「大衛」旅程時，這關用站點 minigame:{ engine:'sling', winPoints } 接進棋盤即可。
export default function SlingDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)

  const begin = () => {
    if (gameRef.current) return
    setStarted(true)
    setResult(null)
    const g = new SlingGame(canvasRef.current, {
      embed: true,
      winPoints: 5,
      onComplete: (r) => setResult(r),
    })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__sling = g // 開發/測試掛勾：讓煙霧測試讀 aimDeg/state 在命中帶放手
    g.boot()
  }

  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])

  const replay = () => {
    if (gameRef.current) gameRef.current.destroy()
    gameRef.current = null
    begin()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f1922', display: 'flex', flexDirection: 'column' }}>
      <div style={{ color: '#cfe3e8', padding: '6px 12px', font: '14px system-ui' }}>
        大衛甩石・開發預覽（?demo=sling）{result && `　→ 結果：${result.won ? '命中得勝 🎯' : '五顆用完'}（score ${result.score}）`}
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {!started && (
          <button
            onClick={begin}
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', padding: '12px 24px', fontSize: 18, borderRadius: 12, border: 'none', background: '#e4572e', color: '#fff', cursor: 'pointer' }}
          >
            開始甩石 →
          </button>
        )}
        {result && (
          <button
            onClick={replay}
            style={{ position: 'absolute', right: 16, bottom: 16, padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}
          >
            再玩一次 ↻
          </button>
        )}
      </div>
    </div>
  )
}
