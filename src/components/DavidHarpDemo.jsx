import { useEffect, useRef, useState } from 'react'
import { Game as DavidHarpGame } from '../minigames/davidharp/game'
import { AGE } from '../minigames/davidharp/config'
import { SCRIPTURE } from '../minigames/davidharp/content'
import { initSpeech, speakText } from '../speak'
import { getAgePref, setAgePref } from '../agePrefs'

// 大衛彈琴趕憂(?demo=davidharp,撒上 16:14-23):Guitar Hero 型節奏關——
// 琴弦由遠而近,音符滑到琴橋按對=撥弦;彈得穩,掃羅的愁煩就散開。
// ★反向 RPG:安慰人心的不是武力,是從神而來的琴聲。不會輸,星等看命中率。
export default function DavidHarpDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)
  const [age, setAge] = useState(getAgePref())
  const pickAge = (id) => { setAge(id); setAgePref(id) }

  const enterFs = () => {
    try {
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {})
    } catch {}
  }
  const toggleFs = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else enterFs() } catch {} }
  const hearHowto = () => { initSpeech(); speakText(SCRIPTURE.how) }

  const begin = () => {
    if (gameRef.current) return
    enterFs(); setStarted(true); setResult(null)
    const g = new DavidHarpGame(canvasRef.current, { embed: true, winPoints: 5, age, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__davidharp = g
    g.boot()
  }
  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])
  const replay = () => { if (gameRef.current) gameRef.current.destroy(); gameRef.current = null; begin() }
  const backToMenu = () => { if (gameRef.current) gameRef.current.destroy(); gameRef.current = null; setStarted(false); setResult(null) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1d1a2e', display: 'flex', flexDirection: 'column' }}>
      <button onClick={toggleFs} aria-label="全螢幕" title="全螢幕"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 40, height: 40, fontSize: 20, borderRadius: 10, border: '1px solid #4a3f5e', background: 'rgba(24,20,38,0.7)', color: '#e8e2d0', cursor: 'pointer' }}>⛶</button>
      {(!started || result) && (
        <div style={{ color: '#e8e2d0', padding: '6px 12px', font: '14px system-ui' }}>
          🎻 大衛彈琴(撒上 16){result && `　→ ${'⭐'.repeat(result.stars)}（${result.accuracy}%，${result.score} 分）`}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
        {!started && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
            <div style={{ color: '#fff', font: 'bold 22px system-ui', textAlign: 'center' }}>🎻 大衛彈琴 · 惡魔離了他　選一個年齡</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(AGE).map((a) => {
                const on = age === a.id
                return (
                  <button key={a.id} onClick={() => pickAge(a.id)}
                    style={{ width: 200, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: on ? '3px solid #ffd75e' : '2px solid #4a3f5e',
                      background: on ? 'rgba(122,90,156,0.92)' : 'rgba(24,20,38,0.7)', color: '#fff' }}>
                    <div style={{ font: 'bold 20px system-ui' }}>{a.emoji} {a.label}</div>
                    <div style={{ font: '12.5px system-ui', opacity: 0.9, marginTop: 4 }}>{a.sub}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={hearHowto} style={{ padding: '12px 18px', fontSize: 17, borderRadius: 12, border: '2px solid #7a5a9c', background: '#241f38', color: '#e8e2d0', cursor: 'pointer' }}>🔊 聽玩法</button>
              <button onClick={begin} style={{ padding: '12px 28px', fontSize: 18, borderRadius: 12, border: 'none', background: '#7a5a9c', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>開始 →</button>
            </div>
          </div>
        )}
        {result && (
          <div style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 10 }}>
            <button onClick={backToMenu} style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #7a5a9c', background: '#241f38', color: '#e8e2d0', cursor: 'pointer' }}>換年齡 ↺</button>
            <button onClick={replay} style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
          </div>
        )}
      </div>
    </div>
  )
}
