import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SlingDemo from './components/SlingDemo.jsx'
import ElijahDemo from './components/ElijahDemo.jsx'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

// 註冊 Service Worker：安裝後可離線遊玩，並在有新版時自動更新。
registerSW({ immediate: true })

// 開發預覽 / 大廳深連結（不影響正式桌遊流程）：
//   ?demo=sling          → 大衛甩石（拋射動作關）
//   ?demo=elijah-action  → 盼望·以利亞重得力（收集/恢復動作關，王上 19）
const demo = (() => {
  try {
    return new URLSearchParams(window.location.search).get('demo')
  } catch {
    return null
  }
})()

function pickRoot() {
  if (demo === 'sling') return <SlingDemo />
  if (demo === 'elijah-action') return <ElijahDemo />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{pickRoot()}</React.StrictMode>,
)
