// 手機地圖放大「全白」檢查：用 DPR=3 的手機視窗模擬，把地圖放到最大，
// 量「場景的實際裝置像素」有沒有超過行動 GPU 紋理上限(~4096)，並確認地圖仍有畫出來。
// 需先 npm run preview。 執行：node scripts/mobile-zoom-check.mjs
import { chromium } from 'playwright'

const URL = process.env.URL || 'http://localhost:4173/'
const SAFE = 4096
const browser = await chromium.launch()
// 模擬手機橫向 + 高 DPR（白屏的關鍵條件）
const context = await browser.newContext({
  viewport: { width: 740, height: 360 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /開始旅程/ }).click()
await page.locator('.board').waitFor({ timeout: 8000 })

// 放到最大：連點放大鈕直到停用
const zin = page.getByRole('button', { name: '放大' })
for (let i = 0; i < 12; i++) {
  if (!(await zin.isEnabled())) break
  await zin.click()
  await page.waitForTimeout(60)
}

const m = await page.evaluate(() => {
  const dpr = window.devicePixelRatio || 1
  const scene = document.querySelector('.board__scene')
  const mapSvg = document.querySelector('.board__map')
  const r = scene.getBoundingClientRect()
  const mr = mapSvg ? mapSvg.getBoundingClientRect() : { width: 0, height: 0 }
  return {
    dpr,
    sceneCssW: Math.round(r.width),
    sceneCssH: Math.round(r.height),
    sceneDevW: Math.round(r.width * dpr),
    sceneDevH: Math.round(r.height * dpr),
    mapPainted: mr.width > 10 && mr.height > 10,
    pct: document.querySelector('.board__zoom-input')?.value,
  }
})

await context.close()
await browser.close()

const maxDev = Math.max(m.sceneDevW, m.sceneDevH)
console.log(`DPR ${m.dpr}｜最大縮放 ${m.pct}%`)
console.log(`場景 CSS ${m.sceneCssW}×${m.sceneCssH}px → 裝置像素 ${m.sceneDevW}×${m.sceneDevH}px`)
console.log(`地圖底圖有畫出來：${m.mapPainted ? '✅' : '❌'}`)
let ok = true
if (maxDev > SAFE) {
  console.error(`❌ 場景裝置像素 ${maxDev} 超過安全上限 ${SAFE} → 行動 GPU 可能變白`)
  ok = false
} else {
  console.log(`✅ 場景裝置像素 ${maxDev} ≤ ${SAFE}（不會爆紋理上限）`)
}
if (!m.mapPainted) { console.error('❌ 地圖底圖沒畫出來'); ok = false }
if (errors.length) { console.error('❌ 瀏覽器錯誤：', errors.slice(0, 5)); ok = false }
if (!ok) process.exit(1)
console.log('✅ 手機放大不再全白')
