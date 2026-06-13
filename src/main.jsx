import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SlingDemo from './components/SlingDemo.jsx'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

// 註冊 Service Worker：安裝後可離線遊玩，並在有新版時自動更新。
registerSW({ immediate: true })

// 開發預覽：?demo=sling 單獨開大衛甩石關（調手感／驗證用，不影響正式流程）。
const demo = (() => {
  try {
    return new URLSearchParams(window.location.search).get('demo')
  } catch {
    return null
  }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{demo === 'sling' ? <SlingDemo /> : <App />}</React.StrictMode>,
)
