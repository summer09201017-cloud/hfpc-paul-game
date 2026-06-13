import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SlingDemo from './components/SlingDemo.jsx'
import CardDemo from './components/CardDemo.jsx'
import { CARD_GAMES } from './minigames/cards/specs'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

// 註冊 Service Worker：安裝後可離線遊玩，並在有新版時自動更新。
registerSW({ immediate: true })

// 單獨玩 / 開發預覽（不影響正式桌遊流程）：
//   ?demo=sling             → 大衛甩石（拋射動作關）
//   ?demo=<卡片關 key>      → 任一卡片關單獨玩，例 ?demo=cornelius（福音奇兵）
const demo = (() => {
  try {
    return new URLSearchParams(window.location.search).get('demo')
  } catch {
    return null
  }
})()

function pickRoot() {
  if (demo === 'sling') return <SlingDemo />
  if (demo && CARD_GAMES[demo]) return <CardDemo specKey={demo} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{pickRoot()}</React.StrictMode>,
)
