import { useState, useEffect } from 'react'

// 「安裝到主畫面」按鈕（PWA 安裝引導，跨平台、自給自足，不依賴任何狀態）。
//   • Android / Chrome / Edge：攔截瀏覽器的 beforeinstallprompt 事件存起來，
//     使用者點按鈕時直接叫出「原生安裝」對話框（最順、一鍵裝）。
//   • iOS Safari：Apple 不開放程式化安裝 → 改顯示「分享 → 加入主畫面」圖文步驟。
//   • 已經是安裝後開啟的（standalone 顯示模式）：整顆按鈕不顯示（已經裝了）。
//   • 桌機既沒有 beforeinstallprompt、又不是 iOS（例如已可用網址列安裝鈕）：不硬塞按鈕。
// 裝好之後（已預快取全部靜態資源）即使沒有網路也能直接打開來玩。
export default function InstallButton() {
  const [deferred, setDeferred] = useState(null) // 暫存 beforeinstallprompt 事件
  const [installed, setInstalled] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  // 是否「已安裝後開啟」：display-mode standalone（多數平台）或 iOS 的 navigator.standalone。
  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator.standalone === true)

  // iOS 上只有「真正的 Safari」能加入主畫面（Chrome/Firefox on iOS 不行）。
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIosSafari = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault() // 攔下瀏覽器自己的迷你提示，改由我們的按鈕觸發
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (standalone || installed) return null
  if (!deferred && !isIosSafari) return null // 沒有可用的安裝途徑就不顯示

  const onClick = async () => {
    if (deferred) {
      deferred.prompt()
      try {
        const { outcome } = await deferred.userChoice
        if (outcome === 'accepted') setInstalled(true)
      } catch {
        /* 使用者取消，忽略 */
      }
      setDeferred(null)
    } else if (isIosSafari) {
      setShowIosHelp(true)
    }
  }

  return (
    <>
      <button className="btn install-btn" onClick={onClick}>
        📲 安裝到手機（裝好離線也能玩）
      </button>

      {showIosHelp && (
        <div className="install-ios" onClick={() => setShowIosHelp(false)}>
          <div className="install-ios__card" onClick={(e) => e.stopPropagation()}>
            <h3 className="install-ios__title">安裝到 iPhone / iPad</h3>
            <ol className="install-ios__steps">
              <li>點下方（或瀏覽器右上角）的「分享」按鈕（方框內一個向上箭頭 ⬆️）。</li>
              <li>把選單往下捲，選「加入主畫面」。</li>
              <li>右上角按「加入」——桌面就會多一個 App 圖示。</li>
            </ol>
            <p className="install-ios__note">裝好後即使沒有網路，也能直接打開來玩。</p>
            <button className="btn btn--primary" onClick={() => setShowIosHelp(false)}>
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  )
}
