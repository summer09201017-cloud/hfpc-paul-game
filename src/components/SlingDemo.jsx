import { useEffect, useRef, useState } from 'react'
import { Game as SlingGame } from '../minigames/sling/game'
import { AGE } from '../minigames/sling/config'
import { CONTENT } from '../minigames/sling/content'
import { initSpeech, speakText } from '../speak'

// 大衛甩石的開發預覽（?demo=sling）。試點:加「年齡旋鈕(幼稚園/兒童/青少年)」+「語音玩法簡介」。
// 回應兒主老師回饋:幼兒不識字→大目標+站著不動+自動語音;7–12 歲嫌太簡單→歌利亞會移動/跳/蹲、命中區小、計時。
export default function SlingDemo() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)
  const [age, setAge] = useState('kids') // 預設兒童

  // 進全螢幕 + 盡量鎖橫向（手機只有在「使用者手勢」中呼叫才有效，所以綁在「開始甩石」點擊裡）。
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
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else enterFullscreenLandscape()
    } catch {}
  }

  // 🔊 聽玩法說明（語音）——點擊本身就是使用者手勢,iOS/Chrome 才允許出聲;沒中文語音→靜默。
  const hearHowto = () => { initSpeech(); speakText(CONTENT.how) }

  const begin = () => {
    if (gameRef.current) return
    enterFullscreenLandscape() // 在點擊手勢中要全螢幕——手機才會生效
    setStarted(true)
    setResult(null)
    const g = new SlingGame(canvasRef.current, {
      embed: true,
      winPoints: 5,
      age, // ★ 把選的年齡檔傳進引擎（幼稚園 kinder / 兒童 kids / 青少年 teen）
      onComplete: (r) => setResult(r),
    })
    gameRef.current = g
    if (typeof window !== 'undefined') window.__sling = g // 煙霧測試/Playwright 掛勾
    g.boot()
  }

  useEffect(() => () => gameRef.current && gameRef.current.destroy(), [])

  const replay = () => {
    if (gameRef.current) gameRef.current.destroy()
    gameRef.current = null
    begin()
  }

  // 回到年齡選單（換難度重選）
  const backToMenu = () => {
    if (gameRef.current) gameRef.current.destroy()
    gameRef.current = null
    setStarted(false)
    setResult(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f1922', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={toggleFullscreen}
        aria-label="全螢幕"
        title="全螢幕"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 40, height: 40, fontSize: 20, borderRadius: 10, border: '1px solid #3a5160', background: 'rgba(20,30,40,0.7)', color: '#cfe3e8', cursor: 'pointer' }}
      >
        ⛶
      </button>
      {(!started || result) && (
        <div style={{ color: '#cfe3e8', padding: '6px 12px', font: '14px system-ui' }}>
          🎯 大衛甩石{result && `　→ 結果：${result.won ? '命中得勝 🎯' : '石子用完了'}（score ${result.score}）`}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* 開始前：年齡旋鈕(大顆觸控友善) + 🔊 聽玩法 + 開始 */}
        {!started && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
            <div style={{ color: '#fff', font: 'bold 22px system-ui' }}>🪨 大衛戰歌利亞　選一個年齡</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(AGE).map((a) => {
                const on = age === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => setAge(a.id)}
                    style={{
                      width: 200, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: on ? '3px solid #ffd98a' : '2px solid #3a5160',
                      background: on ? 'rgba(228,87,46,0.92)' : 'rgba(20,30,40,0.7)',
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
                style={{ padding: '12px 28px', fontSize: 18, borderRadius: 12, border: 'none', background: '#e4572e', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                開始甩石 →
              </button>
            </div>
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
