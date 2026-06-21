import { useEffect } from 'react'
import { initSpeech, speakScripture, stopSpeech } from '../speak.js'

// 動作關「結束畫面」共用:顯示經文 + 自動朗讀(含經文出處) + 🔊再聽一次。
// 不論過關或失敗都顯示並朗讀——得勝靠倚靠神、不靠輸贏;沒中文語音的裝置會安靜略過(靜默 fallback)。
// 用法:在各動作關 Demo 的結束畫面放 <ActionScripture verse refLabel refSpoken />。
export default function ActionScripture({ verse, refLabel, refSpoken }) {
  const spoken = `${verse}。${refSpoken || ''}`
  useEffect(() => {
    initSpeech()
    const id = setTimeout(() => speakScripture(spoken), 350) // 略延遲,等結束畫面出現
    return () => { clearTimeout(id); stopSpeech() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="action-scripture">
      <div className="mgcard__verse mgcard__verse--win">
        {refLabel && <span className="mgcard__ref">{refLabel}</span>}
        {verse}
      </div>
      <button type="button" className="btn mgcard__replay" onClick={() => speakScripture(spoken)}>
        🔊 再聽一次
      </button>
    </div>
  )
}
