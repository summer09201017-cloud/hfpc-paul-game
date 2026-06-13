// 大衛甩石「物理」測試（純函式、不開瀏覽器）：掃描可瞄準角度範圍，
// 確認存在「打得到歌利亞額頭」的角度帶，且寬度合理（小孩 5 顆內學得會、又不是隨便都中）。
// 執行：node scripts/sling-physics-test.mjs
import { PHYSICS, AIM, GROUND_Y, DAVID, GOLIATH, WORLD } from '../src/minigames/sling/config.js'
import { simulateShot, deg2rad } from '../src/minigames/sling/projectile.js'

const opts = (deg) => ({
  origin: DAVID,
  angleRad: deg2rad(deg),
  power: PHYSICS.power,
  gravity: PHYSICS.gravity,
  target: GOLIATH.forehead,
  groundY: GROUND_Y,
  worldW: WORLD.w,
})

const hits = []
for (let deg = AIM.minDeg; deg <= AIM.maxDeg; deg += 0.5) {
  if (simulateShot(opts(deg)).hit) hits.push(deg)
}

const bandWidth = hits.length ? hits[hits.length - 1] - hits[0] : 0
console.log(`可瞄準範圍：${AIM.minDeg}°–${AIM.maxDeg}°`)
console.log(`命中角度：${hits.length ? hits[0] + '°–' + hits[hits.length - 1] + '°（共 ' + hits.length + ' 個取樣點、帶寬 ' + bandWidth.toFixed(1) + '°）' : '無 ❌'}`)

let ok = true
if (hits.length === 0) { console.error('❌ 沒有任何角度能命中——調 PHYSICS.power / GOLIATH 位置'); ok = false }
else if (bandWidth < 4) { console.error(`❌ 命中帶太窄(${bandWidth.toFixed(1)}°)，小孩會挫折——放寬命中區或降擺動速度`); ok = false }
else if (bandWidth > 40) { console.error(`❌ 命中帶太寬(${bandWidth.toFixed(1)}°)，太好中沒挑戰——縮小命中區`); ok = false }
// 擺動一個來回的秒數，確認節奏不會快到抓不到那條帶
const sweepSec = ((AIM.maxDeg - AIM.minDeg) / AIM.sweepDegPerSec)
const bandSec = bandWidth / AIM.sweepDegPerSec
console.log(`擺動單程 ${sweepSec.toFixed(2)}s；命中帶停留約 ${bandSec.toFixed(2)}s（放手時機的容錯窗）`)
if (bandSec < 0.12) { console.error('❌ 容錯窗 <0.12s，手機點按來不及——降 sweepDegPerSec 或放寬命中區'); ok = false }

if (!ok) process.exit(1)
console.log('✅ 拋射手感參數合理（有可學會、不過寬的命中帶）')
