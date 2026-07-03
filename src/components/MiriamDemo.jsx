import { useEffect, useRef, useState } from 'react'
import { Game as MiriamGame } from '../minigames/miriam/game'
import { AGE } from '../minigames/miriam/config'
import { SCRIPTURE } from '../minigames/miriam/content'
import { initSpeech, speakText } from '../speak'
import { getAgePref, setAgePref } from '../agePrefs'

// 米利暗擊鼓(?demo=miriam,出 15:20-21):太鼓達人型節奏關——單軌雙打點,
// 紅=拍鼓面(F/J)、藍=搖鈴(D/K);觸控拍鈴鼓中間=鼓、旁邊=鈴。
// ★過紅海後的得勝慶祝關:不會輸、不扣命;打得越準,眾婦女跳得越高。
export default function MiriamDemo() {
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
    const g = new MiriamGame(canvasRef.current, { embed: true, winPoints: 5, age, onComplete: (r) => setResult(r) })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__miriam = g
    g.boot()
  }
  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])
  const replay = () => { if (gameRef.current) gameRef.current.destroy(); gameRef.current = null; begin() }
  const backToMenu = () => { if (gameRef.current) gameRef.current.destroy(); gameRef.current = null; setStarted(false); setResult(null) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#7db3d9', display: 'flex', flexDirection: 'column' }}>
      <button onClick={toggleFs} aria-label="全螢幕" title="全螢幕"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 40, height: 40, fontSize: 20, borderRadius: 10, border: '1px solid #4a7a9c', background: 'rgba(20,40,58,0.7)', color: '#e8f0f5', cursor: 'pointer' }}>⛶</button>
      {(!started || result) && (
        <div style={{ color: '#1d3a52', padding: '6px 12px', font: 'bold 14px system-ui' }}>
          🥁 米利暗擊鼓(出 15){result && `　→ ${'⭐'.repeat(result.stars)}（${result.accuracy}%，${result.score} 分）`}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
        {!started && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
            <div style={{ color: '#1d3a52', font: 'bold 22px system-ui', textAlign: 'center' }}>🥁 米利暗擊鼓 · 得勝的讚美　選一個年齡</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(AGE).map((a) => {
                const on = age === a.id
                return (
                  <button key={a.id} onClick={() => pickAge(a.id)}
                    style={{ width: 200, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: on ? '3px solid #d9483d' : '2px solid #4a7a9c',
                      background: on ? 'rgba(217,72,61,0.9)' : 'rgba(20,40,58,0.72)', color: '#fff' }}>
                    <div style={{ font: 'bold 20px system-ui' }}>{a.emoji} {a.label}</div>
                    <div style={{ font: '12.5px system-ui', opacity: 0.9, marginTop: 4 }}>{a.sub}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={hearHowto} style={{ padding: '12px 18px', fontSize: 17, borderRadius: 12, border: '2px solid #4a7a9c', background: '#14283a', color: '#e8f0f5', cursor: 'pointer' }}>🔊 聽玩法</button>
              <button onClick={begin} style={{ padding: '12px 28px', fontSize: 18, borderRadius: 12, border: 'none', background: '#d9483d', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>開始 →</button>
            </div>
          </div>
        )}
        {result && (
          <div style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 10 }}>
            <button onClick={backToMenu} style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #4a7a9c', background: '#14283a', color: '#e8f0f5', cursor: 'pointer' }}>換年齡 ↺</button>
            <button onClick={replay} style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}>再玩一次 ↻</button>
          </div>
        )}
      </div>
    </div>
  )
}
