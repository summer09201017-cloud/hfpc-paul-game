// check-jsx.mjs — 血淚教訓(2026-07-08)的機器守門。
// npm test 原本靠 node --check,但它「跳過 .jsx」:當時 GitHub 端合併把 MiniGameModal.jsx 的
// 引擎 if-chain 解成疊套 if(少 2 個 }),160 個測試照樣全綠,vite build 卻 Unexpected EOF →
// Netlify 每次建置失敗、靜默卡在舊 bundle(排查半小時誤以為是快取)。
// 這支用 vite 自帶的 esbuild transform 快掃 src/ 全部 .jsx(不打包,毫秒級),語法錯直接紅燈擋下。
// 已接進 npm test 鏈;合併/解衝突後仍建議跑完整 `npm run build` 雙保險。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { transformSync } from 'esbuild'

const files = []
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (p.endsWith('.jsx')) files.push(p)
  }
}
walk('src')

let bad = 0
for (const f of files) {
  try {
    transformSync(readFileSync(f, 'utf8'), { loader: 'jsx' })
  } catch (e) {
    bad++
    const msg = e.errors && e.errors[0] ? `${e.errors[0].text}(${e.errors[0].location?.line ?? '?'} 行)` : e.message
    console.error(`  🔴 ${f}:${msg}`)
  }
}
if (bad) {
  console.error(`🔴 check-jsx:${bad} 個 .jsx 轉譯失敗(共掃 ${files.length})——vite build 必炸,先修再交。`)
  process.exit(1)
}
console.log(`✓ check-jsx:${files.length} 個 .jsx 全部可轉譯(esbuild)`)
