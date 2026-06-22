// ===========================================================================
// sync-paulsilas-engine — 一鍵把「保羅西拉」節奏關引擎同步進保羅大富翁的嵌入小遊戲
// ---------------------------------------------------------------------------
// 保羅西拉(hfpc-paul-silas-game)是即時 vanilla Canvas 節奏關(徒16 半夜監牢唱詩);
// 保羅大富翁把它當「腓立比監牢」站(?journey=paul2)的挑戰關嵌入。
// src/minigames/paulsilas/ 是保羅西拉引擎的一份 copy。獨立版那邊改完(加經文出處
// 朗讀 spokenRef、多首曲、調手感…),在保羅這邊跑這支腳本,就把最新引擎同步過來。
//
// 為什麼可以「純複製」而不必手動重套 embed 改動:
//   保羅西拉引擎已是「嵌入感知 + 向後相容」——
//     • new Game(canvas, { embed:true, mode, onComplete }) 走嵌入分支(跳過標題/選曲、
//       過關呼叫 onComplete({won,score,stars}));單機 main.js 不傳 embed 則走完整流程。
//     • 引擎模組(game/renderer/audio/...)不 import 任何 DOM 外殼,ui/HUD 全畫在 Canvas。
//   只要獨立版守住這個契約,這支腳本就只是安全的逐檔複製。
//
// 做法:從 game.js 出發,沿著 import './x.js' 把會被用到的本地模組全找出來
//       (自動含括未來新增的模組),逐一複製到 src/minigames/paulsilas/。
//       一律排除 DOM 外殼(main.js / ui.js)。
//
// 用法:
//   node scripts/sync-paulsilas-engine.mjs                 (自動尋找保羅西拉 src)
//   node scripts/sync-paulsilas-engine.mjs --from=<保羅西拉的 src 路徑>
//   PAULSILAS_SRC=<保羅西拉的 src 路徑> node scripts/sync-paulsilas-engine.mjs
//   node scripts/sync-paulsilas-engine.mjs --check         (只報告會變動什麼,不寫檔)
//
// ⚠️ 同步前先在獨立版 `git pull` 確保是最新;這支腳本讀的是「本機那份 checkout」。
// ⚠️ 這台 Windows + Node 24:用逐檔 copyFileSync,不用遞迴 cpSync/rmSync(會無聲被殺)。
// ===========================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const DEST_DIR = path.join(PROJECT_ROOT, 'src', 'minigames', 'paulsilas')

// 從這個檔開始追 import(保羅的 MiniGameModal 就是 import 它的 Game)。
const ENTRY = 'game.js'
// 永遠不要複製過來的「app 外殼」(嵌入由 React MiniGameModal / PaulSilasDemo 取代)。
const NEVER_COPY = new Set(['main.js', 'main.jsx', 'ui.js'])

const args = process.argv.slice(2)
const CHECK_ONLY = args.includes('--check') || args.includes('--dry-run')
const fromArg = args.find((a) => a.startsWith('--from='))

// --- 找出保羅西拉的 src 目錄 ---------------------------------------------
function resolvePaulSilasSrc() {
  const candidates = []
  if (fromArg) candidates.push(fromArg.slice('--from='.length))
  if (process.env.PAULSILAS_SRC) candidates.push(process.env.PAULSILAS_SRC)
  // 本團隊常見擺法:獨立版放在桌面「保羅西拉」
  candidates.push(path.join(os.homedir(), 'Desktop', '保羅西拉', 'src'))
  // 或當成 paul-game 的姊妹 repo
  candidates.push(path.resolve(PROJECT_ROOT, '..', 'hfpc-paul-silas-game', 'src'))
  candidates.push(path.resolve(PROJECT_ROOT, '..', '..', 'hfpc-paul-silas-game', 'src'))
  for (const c of candidates) {
    if (!c) continue
    const abs = path.resolve(c)
    if (existsSync(path.join(abs, ENTRY))) return abs
  }
  console.error('✗ 找不到保羅西拉引擎的 src 目錄(裡面要有 game.js)。試過:')
  for (const c of candidates) if (c) console.error('    ' + path.resolve(c))
  console.error('  請用 --from=<保羅西拉的 src 路徑> 或設環境變數 PAULSILAS_SRC 指定。')
  process.exit(1)
}

// --- 追 import:從 entry 出發,收集所有本地 './x.js' 模組 ------------------
const LOCAL_IMPORT = /\bfrom\s+['"]\.\/([\w.-]+\.js)['"]/g
function collectModules(srcDir) {
  const seen = new Set()
  const queue = [ENTRY]
  while (queue.length) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)
    const full = path.join(srcDir, file)
    if (!existsSync(full)) {
      console.error(`✗ ${file} 被 import 卻不存在於保羅西拉 src:${full}`)
      process.exit(1)
    }
    const code = readFileSync(full, 'utf8')
    for (const m of code.matchAll(LOCAL_IMPORT)) {
      const dep = m[1]
      if (NEVER_COPY.has(dep)) {
        // 嵌入契約:引擎不可 import DOM 外殼(ui/main 必須由 React 注入)。
        console.error(`✗ 嵌入契約被破壞:${file} import 了 ${dep}。`)
        console.error('  保羅西拉引擎必須「ui 畫在 Canvas + 由 MiniGameModal 注入」而非 import 外殼,')
        console.error('  這支同步腳本才能安全純複製。請獨立版改回不 import 外殼。')
        process.exit(1)
      }
      if (!seen.has(dep)) queue.push(dep)
    }
  }
  return [...seen].sort()
}

// --- 主流程 --------------------------------------------------------------
const SRC = resolvePaulSilasSrc()
console.log(`保羅西拉引擎 src:${SRC}`)
console.log(`同步目標       :${DEST_DIR}`)
console.log(CHECK_ONLY ? '模式:--check(只報告,不寫檔)\n' : '')

const modules = collectModules(SRC)

let changed = 0
let same = 0
for (const file of modules) {
  const src = path.join(SRC, file)
  const dst = path.join(DEST_DIR, file)
  const srcBuf = readFileSync(src)
  const dstExists = existsSync(dst)
  const identical = dstExists && Buffer.compare(srcBuf, readFileSync(dst)) === 0
  if (identical) {
    same++
    continue
  }
  changed++
  const tag = dstExists ? '更新' : '新增'
  console.log(`  [${tag}] ${file}  (${srcBuf.length} bytes)`)
  if (!CHECK_ONLY) writeFileSync(dst, srcBuf) // 逐檔寫,避開 Node24 遞迴複製地雷
}

// --- 警告:嵌入資料夾裡有、但獨立版已不再使用的「孤兒」檔 --------------------
const keep = new Set(modules)
const orphans = []
if (existsSync(DEST_DIR)) {
  for (const f of readdirSync(DEST_DIR)) {
    if (!f.endsWith('.js')) continue
    if (statSync(path.join(DEST_DIR, f)).isDirectory()) continue
    if (!keep.has(f)) orphans.push(f)
  }
}

console.log('')
console.log(`同步模組(${modules.length}):${modules.join(', ')}`)
console.log(`變動 ${changed} 檔、相同 ${same} 檔${CHECK_ONLY ? '(未寫入)' : ''}。`)
if (orphans.length) {
  console.log(`⚠ 孤兒檔(獨立版已不 import,可考慮刪掉):${orphans.join(', ')}`)
}
if (!CHECK_ONLY && changed > 0) {
  console.log('\n下一步建議:')
  console.log('  npm run build           # 確認嵌入引擎接得起來、能打包')
  console.log('  npm run test:selfplay   # 確認桌遊流程仍會正常結束')
  console.log('  然後 commit + push main → Netlify 自動部署(paul 是 A 路徑,見 skill deploy-aware)')
}
console.log('✓ 完成。')
