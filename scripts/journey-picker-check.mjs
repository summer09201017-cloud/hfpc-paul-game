// 首頁「分類卡片」旅程選單檢查：分組數、卡片數、選非預設卡片能正確開局。
// 需先 npm run preview。 執行：node scripts/journey-picker-check.mjs
import { chromium } from 'playwright'

const URL = process.env.URL || 'http://localhost:4173/'
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

await page.goto(URL, { waitUntil: 'networkidle' })
const groups = await page.locator('.jgroup').count()
const cards = await page.locator('.jcard').count()
const groupNames = await page.locator('.jgroup__title').allInnerTexts()
console.log(`分組 ${groups} 區：${groupNames.join('、')}`)
console.log(`旅程卡片 ${cards} 張`)

// 選一張「非預設」的卡片（但以理），開局，確認標題正確
await page.locator('.jcard', { hasText: '但以理' }).click()
await page.getByRole('button', { name: /開始旅程/ }).click()
await page.locator('.board').waitFor({ timeout: 8000 })
const title = await page.locator('.app__title').innerText()
await browser.close()

let ok = groups >= 2 && cards >= 7 && title.includes('但以理') && errors.length === 0
console.log(`開局標題：「${title}」`)
console.log(`選但以理卡 → 正確開局：${title.includes('但以理') ? '✅' : '❌'}`)
if (errors.length) console.error('❌ 瀏覽器錯誤：', errors.slice(0, 5))
if (!ok) { console.error('❌ 分類卡片選單檢查未通過'); process.exit(1) }
console.log('✅ 分類卡片旅程選單正常（分組、選卡、開局都對）')
