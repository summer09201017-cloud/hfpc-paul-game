import { useEffect, useRef, useState } from 'react'
import { Game as JoashGame } from '../minigames/joash/game'
import { AGE } from '../minigames/joash/config'
import { CONTENT } from '../minigames/joash/content'
import { initSpeech, speakText } from '../speak'
import { getAgePref, setAgePref } from '../agePrefs'

// 約阿施射得勝箭(?demo=joash)。複製大衛甩石引擎換皮:同瞄準/拋射物理 + 年齡旋鈕 + 會動的靶,
// 但改成「多箭、命中越多次=得勝越完全」(王下13:19 應當射五六次)。年齡跨關共用(agePrefs)。
export default function JoashDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)
  const [age, setAge] = useState(getAgePref())
  const pickAge = (id) => { setAge(id); setAgePref(id) }

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
    try { if (document.fullscreenElement) document.exitFullscreen(); else enterFullscreenLandscape() } catch {}
  }
  const hearHowto = () => { initSpeech(); speakText(CONTENT.how) }

  const begin = () => {
    if (gameRef.current) return
    enterFullscreenLandscape()
    setStarted(true)
    setResult(null)
    const g = new JoashGame(canvasRef.current, {
      embed: true,
      winPoints: 5,
      age,
      onComplete: (r) => setResult(r),
    })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__joash = g
    g.boot()
  }

  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])

  const replay = () => { if (gameRef.current) gameRef.current.destroy(); gameRef.current = null; begin() }
  const backToMenu = () => { if (gameRef.current) gameRef.current.destroy(); gameRef.current = null; setStarted(false); setResult(null) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f1922', display: 'flex', flexDirection: 'column' }}>
      <button onClick={toggleFullscreen} aria-label="全螢幕" title="全螢幕"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 40, height: 40, fontSize: 20, borderRadius: 10, border: '1px solid #3a5160', background: 'rgba(20,30,40,0.7)', color: '#cfe3e8', cursor: 'pointer' }}>⛶</button>
      {(!started || result) && (
        <div style={{ color: '#cfe3e8', padding: '6px 12px', font: '14px system-ui' }}>
          🏹 約阿施射得勝箭{result && `　→ 得勝 ${result.hits}/${result.total} 次（score ${result.score}）`}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {!started && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
            <div style={{ color: '#fff', font: 'bold 22px system-ui' }}>🏹 約阿施射得勝箭　選一個年齡</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(AGE).map((a) => {
                const on = age === a.id
                return (
                  <button key={a.id} onClick={() => pickAge(a.id)}
                    style={{ width: 200, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: on ? '3px solid #ffd98a' : '2px solid #3a5160',
                      background: on ? 'rgba(91,58,138,0.92)' : 'rgba(20,30,40,0.7)', color: '#fff',
                      boxShadow: on ? '0 4px 16px rgba(0,0,0,.4)' : 'none' }}>
                    <div style={{ font: 'bold 20px system-ui' }}>{a.emoji} {a.label}</div>
                    <div style={{ font: '12.5px system-ui', opacity: 0.9, marginTop: 4 }}>{a.sub}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={hearHowto} title="用語音念出怎麼玩(給還不識字的孩子)"
                style={{ padding: '12px 18px', fontSize: 17, borderRadius: 12, border: '2px solid #6aa9c0', background: '#13303c', color: '#cfe3e8', cursor: 'pointer' }}>🔊 聽玩法</button>
              <button onClick={begin}
                style={{ padding: '12px 28px', fontSize: 18, borderRadius: 12, border: 'none', background: '#7a4fb0', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>開始射箭 →</button>
            </div>
          </div>
        )}
        {result && (
          <div style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 10 }}>
            <button onClick={backToMenu}
              style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #6aa9c0', background: '#13303c', color: '#cfe3e8', cursor: 'pointer' }}>換年齡 ↺</button>
            <button onClick={replay}
              style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
          </div>
        )}
      </div>
    </div>
  )
}
