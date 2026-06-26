import { useEffect, useRef, useState } from 'react'
import { Game as SaulSpearGame } from '../minigames/saul-spear/game'
import { AGE } from '../minigames/saul-spear/config'
import { CONTENT } from '../minigames/saul-spear/content'
import { initSpeech, speakText } from '../speak'
import { getAgePref, setAgePref } from '../agePrefs'

// 掃羅擲槍・大衛閃避的開發預覽（?demo=saul-spear）。閃避關 + 年齡旋鈕（幼/童/青）+ 語音玩法。
// 反向 RPG：大衛不還手，只躲、只信靠神（撒上 18–19、24、26）。
export default function SaulSpearDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)
  const [age, setAge] = useState(getAgePref()) // 跨關記住的年齡（選一次全系列沿用）
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
    const g = new SaulSpearGame(canvasRef.current, {
      embed: true,
      winPoints: 5,
      age, // 幼稚園 kinder / 兒童 kids / 青少年 teen
      onComplete: (r) => setResult(r),
    })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__saulspear = g // 煙霧測試/Playwright 掛勾
    g.boot()
  }

  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])

  const replay = () => {
    if (gameRef.current) gameRef.current.destroy()
    gameRef.current = null
    begin()
  }
  const backToMenu = () => {
    if (gameRef.current) gameRef.current.destroy()
    gameRef.current = null
    setStarted(false)
    setResult(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#15110c', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={toggleFullscreen}
        aria-label="全螢幕"
        title="全螢幕"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 40, height: 40, fontSize: 20, borderRadius: 10, border: '1px solid #5a4630', background: 'rgba(30,22,14,0.7)', color: '#ffe9b8', cursor: 'pointer' }}
      >
        ⛶
      </button>
      {(!started || result) && (
        <div style={{ color: '#ffe9b8', padding: '6px 12px', font: '14px system-ui' }}>
          🗡️ 掃羅擲槍・大衛閃避{result && `　→ 結果：${result.won ? '撐過所有的槍 🛡️' : '被掃羅追上了'}（score ${result.score}）`}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {!started && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
            <div style={{ color: '#fff', font: 'bold 22px system-ui' }}>🗡️ 掃羅擲槍・大衛閃避　選一個年齡</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(AGE).map((a) => {
                const on = age === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => pickAge(a.id)}
                    style={{
                      width: 210, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: on ? '3px solid #ffd98a' : '2px solid #5a4630',
                      background: on ? 'rgba(107,63,160,0.92)' : 'rgba(30,22,14,0.7)',
                      color: '#fff', boxShadow: on ? '0 4px 16px rgba(0,0,0,.4)' : 'none',
                    }}
                  >
                    <div style={{ font: 'bold 20px system-ui' }}>{a.emoji} {a.label}</div>
                    <div style={{ font: '12.5px system-ui', opacity: 0.9, marginTop: 4 }}>{a.sub}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                onClick={hearHowto}
                title="用語音念出怎麼玩(給還不識字的孩子)"
                style={{ padding: '12px 18px', fontSize: 17, borderRadius: 12, border: '2px solid #6aa9c0', background: '#13303c', color: '#cfe3e8', cursor: 'pointer' }}
              >
                🔊 聽玩法
              </button>
              <button
                onClick={begin}
                style={{ padding: '12px 28px', fontSize: 18, borderRadius: 12, border: 'none', background: '#6b3fa0', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                開始閃避 →
              </button>
            </div>
            <div style={{ color: '#cdab74', font: '12px system-ui' }}>← → 或左右半邊畫面移動大衛；看準紅色預警閃開</div>
          </div>
        )}

        {result && (
          <div style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 10 }}>
            <button
              onClick={backToMenu}
              style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #6aa9c0', background: '#13303c', color: '#cfe3e8', cursor: 'pointer' }}
            >
              換年齡 ↺
            </button>
            <button
              onClick={replay}
              style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #b9863f', background: '#fffdf7', cursor: 'pointer' }}
            >
              再玩一次 ↻
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
