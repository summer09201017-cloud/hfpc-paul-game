// speak.js —— 經文朗讀(瀏覽器內建 speechSynthesis,零音檔、離線可用、免費)。
// 能用就用,不能用就「安靜略過」——絕不報錯、不卡關。心法見 skill web-speech-scripture。
// 系列預設:每一關過關都自動朗讀經文 + 一顆「🔊 再聽一次」。沒中文語音的裝置會靜默 fallback。
let voicesReady = false

function pickZh() {
  const vs = speechSynthesis.getVoices()
  // 優先 zh-TW,其次任何 zh-*,再不行回 null(=略過)
  return (
    vs.find((v) => /zh[-_]TW/i.test(v.lang)) ||
    vs.find((v) => /^zh/i.test(v.lang)) ||
    null
  )
}

export function initSpeech() {
  if (!('speechSynthesis' in window)) return
  // 預熱語音清單(Chrome 首次為空)
  speechSynthesis.getVoices()
  speechSynthesis.onvoiceschanged = () => {
    voicesReady = true
  }
}

export function speakScripture(text, { isMuted = () => false, rate = 0.92, pitch = 1 } = {}) {
  if (!('speechSynthesis' in window) || !text) return false
  if (isMuted()) return false
  try {
    speechSynthesis.cancel() // 中斷前一段
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ''))
    const v = pickZh()
    if (!v) return false // 沒中文語音 → 安靜略過
    u.voice = v
    u.lang = v.lang
    u.rate = rate
    u.pitch = pitch
    speechSynthesis.speak(u)
    return true
  } catch {
    return false // 任何例外都不可影響遊戲
  }
}

export function stopSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
}
