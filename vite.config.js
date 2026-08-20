import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // 用相對路徑，方便部署到任何子目錄（GitHub Pages、教會自架等）。
  base: './',
  plugins: [
    /* 🏷️ 版號徽章(0820 全艦隊批次)workbox 家族做法:建置時間烙進 index.html 佔位符,
       被 workbox 預快取 ⇒ 頁面顯示的就是這台裝置執行中的那次建置(不會說謊)。
       ⚠ 用 split/join 不用 replace(0820 ledger 實測 html.replace 在這條管線裡沒生效)。 */
    {
      name: 'stamp-build-version',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
          return html.split('%%BUILD%%').join(stamp)
        },
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '保羅宣教之旅',
        short_name: '保羅之旅',
        description: '互動式聖經地圖關卡遊戲 — 跟著使徒保羅走過第一次宣教旅程',
        lang: 'zh-Hant',
        theme_color: '#2e86ab',
        background_color: '#cfe3e8',
        display: 'standalone',
        // 跟約拿引擎一致：手機一律橫式（iOS 不支援網頁全螢幕 API，靠「加入主畫面」+ 這裡的 landscape 達成）
        orientation: 'landscape',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 把所有靜態資源都快取起來 → 裝好之後可離線遊玩。
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2,mp3}'],
      },
    }),
  ],
  server: {
    host: true, // 開發模式：讓同網段的平板 / 投影電腦也能用區網 IP 連進來
    port: 5173,
  },
  preview: {
    host: true, // 正式預覽（啟動遊戲.bat 用）：同樣開放區網連線
    port: 4173,
  },
})
