// 臨時：對線上站確認挪亞兩關已部署可玩。
import { chromium } from 'playwright'
const BASE = 'https://hfpc-paul-game.netlify.app'
const browser = await chromium.launch()
const errors = []
async function check(demo, startBtn, key) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } })
  page.on('pageerror', (e) => errors.push(`[${demo}] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${demo}] ${m.text()}`) })
  await page.goto(`${BASE}/?demo=${demo}`, { waitUntil: 'networkidle' })
  const hasBtn = (await page.getByRole('button', { name: startBtn }).count()) > 0
  if (hasBtn) await page.getByRole('button', { name: startBtn }).click()
  await page.waitForTimeout(600)
  const up = await page.evaluate((k) => !!window[k], key)
  await page.close()
  return { demo, hasBtn, up }
}
const r1 = await check('arkpairs', /開始配對/, '__arkpairs')
const r2 = await check('arkbuild', /開始動工/, '__arkbuild')
await browser.close()
for (const r of [r1, r2]) console.log(`${(r.hasBtn && r.up) ? '✅' : '❌'} ${r.demo} — 有開始鈕:${r.hasBtn} 引擎啟動:${r.up}`)
if (errors.length) errors.forEach((e) => console.log('  ' + e))
const ok = r1.hasBtn && r1.up && r2.hasBtn && r2.up && errors.length === 0
console.log(ok ? '\n✅ 線上站兩關都可玩、無錯誤。' : '\n⚠ 線上檢查有狀況（可能 CDN 快取，稍後重試）。')
process.exit(ok ? 0 : 1)
