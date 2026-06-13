// 安裝按鈕檢查：
//   1) iOS Safari UA → 首頁出現「安裝到主畫面」鈕，點了展開「分享→加入主畫面」教學
//   2) Android → 注入假 beforeinstallprompt 事件 → 出現安裝鈕、點了會呼叫 prompt()
// 需先 npm run preview。 執行：node scripts/install-button-check.mjs
import { chromium, devices } from 'playwright'

const URL = process.env.URL || 'http://localhost:4173/'
const browser = await chromium.launch()
let ok = true

// --- iOS 路徑（橫向：本遊戲一律橫式，直向會被 rotate-hint 蓋版） ---
{
  const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(URL, { waitUntil: 'networkidle' })
  const btn = page.locator('.install-btn')
  const shown = (await btn.count()) > 0
  let tip = false
  if (shown) {
    await btn.click()
    tip = (await page.locator('.install-ios').count()) > 0 // iOS「分享→加入主畫面」教學卡
  }
  console.log(`iOS：安裝鈕顯示 ${shown ? '✅' : '❌'}、教學展開 ${tip ? '✅' : '❌'}`)
  if (!shown || !tip || errs.length) { ok = false; if (errs.length) console.error('  err', errs) }
  await ctx.close()
}

// --- Android 路徑（注入假 beforeinstallprompt；橫向同上） ---
{
  const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'] })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.addInitScript(() => {
    window.__promptCalled = false
    setTimeout(() => {
      const e = new Event('beforeinstallprompt')
      e.prompt = () => { window.__promptCalled = true }
      e.userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(e)
    }, 400)
  })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const btn = page.locator('.install-btn')
  const shown = (await btn.count()) > 0
  let called = false
  if (shown) {
    await btn.click()
    called = await page.evaluate(() => window.__promptCalled)
  }
  console.log(`Android：安裝鈕顯示 ${shown ? '✅' : '❌'}、點擊觸發原生安裝 ${called ? '✅' : '❌'}`)
  if (!shown || !called || errs.length) { ok = false; if (errs.length) console.error('  err', errs) }
  await ctx.close()
}

await browser.close()
if (!ok) { console.error('❌ 安裝按鈕檢查未通過'); process.exit(1) }
console.log('✅ 安裝按鈕（iOS 教學 + Android 原生安裝）皆正常')
