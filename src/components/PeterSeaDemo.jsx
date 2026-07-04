import { useEffect, useRef, useState } from 'react'
import { Game as PeterSeaGame } from '../minigames/petersea/game'

// 彼得走海節拍音樂關的開發預覽（?demo=petersea）：太 14 夜四更天,定睛看耶穌走海面。
// 正式遊戲流程裡，這關由「加利利海・夜四更天」站點(?journey=jesus) minigame:{ engine:'petersea' } 接進耶穌生平之旅棋盤。
export default function PaulSilasDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)

  const enterFullscreenLandscape = () => {
    try {
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) {
        const p = el.requestFullscreen()
        if (p && p.then) p.then(() => { try { screen.orientation?.lock?.('landscape') } catch {} }).catch(() => {})
        else { try { screen.orientation?.lock?.('landscape') } catch {} }
      }
    } catch {}
  }
  const toggleFullscreen = () => {
    try { document.fullscreenElement ? document.exitFullscreen() : enterFullscreenLandscape() } catch {}
  }

  const begin = () => {
    if (gameRef.current) return
    enterFullscreenLandscape()
    setStarted(true)
    setResult(null)
    const g = new PeterSeaGame(canvasRef.current, {
      embed: true,
      mode: 'run',
      winPoints: 4,
      onComplete: (r) => setResult(r),
    })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__game = g
    g.boot()
  }

  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])

  const replay = () => {
    if (gameRef.current) gameRef.current.destroy()
    gameRef.current = null
    begin()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#100b07', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={toggleFullscreen}
        aria-label="全螢幕"
        title="全螢幕"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 40, height: 40, fontSize: 20, borderRadius: 10, border: '1px solid #5a4a3a', background: 'rgba(30,22,14,0.7)', color: '#e8dcc0', cursor: 'pointer' }}
      >
        ⛶
      </button>
      {(!started || result) && (
        <div style={{ color: '#e8dcc0', padding: '6px 12px', font: '14px system-ui' }}>
          🌊 彼得走海 · 定睛看耶穌{result && `　→ ${result.won ? '你真是神的兒子 🎉' : ''}（score ${result.score}）`}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {!started && (
          <button
            onClick={begin}
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', padding: '12px 24px', fontSize: 18, borderRadius: 12, border: 'none', background: '#5a3a8a', color: '#fff', cursor: 'pointer' }}
          >
            開始走海 →
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
