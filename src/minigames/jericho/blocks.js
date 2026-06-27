// blocks.js —— 手刻「簡化剛體」物理(零相依、夠像忿怒鳥;非真物理引擎)。
// 設計重點(避開「穩定堆疊會抖動」的經典難題):
//   · 磚塊預設 settled=true(靜止地基,不跑物理) → 不抖動。
//   · 被彈丸打到(或被甦醒的磚撞到)才 wake(settled=false) → 受衝擊→翻倒→落地→重新 settle。
//   · 碰撞用 AABB 近似(旋轉只是視覺 tumbling),settled 磚是不動的錨;只推「醒著的」磚,撞夠力才喚醒下面的。
//   · 目標(type==='target')掉離原位/翻過門檻角 = 被擊倒。全部目標倒 = 過關。
import { GROUND_Y, PHYS } from './config.js'

export function makeBlocks(defs) {
  return defs.map((d) => ({
    x: d.x, y: d.y, w: d.w, h: d.h, type: d.type || 'wood',
    vx: 0, vy: 0, angle: 0, va: 0,
    settled: true, // 一開始是靜止地基
    popped: false, // 目標被夠力擊中 = 擊飛/消滅(像忿怒鳥打豬;不依賴完美崩塌)
    startX: d.x, startY: d.y,
  }))
}

// 彈丸命中一塊磚:喚醒它,依命中方向與偏移給線速度 + 角速度(偏心→旋轉翻倒)。
export function hitBlock(b, ammo, impactSpeed) {
  b.settled = false
  const k = 0.5
  b.vx += (ammo.vx || 0) * k + (ammo.x < b.x ? 1 : -1) * impactSpeed * 0.12
  b.vy += (ammo.vy || 0) * k - 40 // 略往上彈一下,看得出被打飛
  // 命中點偏離磚中心越多 → 轉得越兇(翻倒感)
  const off = (ammo.y - b.y) / (b.h / 2 || 1)
  b.va += (off) * (impactSpeed * 0.0009) * (ammo.x < b.x ? 1 : -1)
  if (b.type === 'target' && impactSpeed > 180) b.popped = true // 石頭夠力直擊目標 = 擊飛
}

function overlap(a, b) {
  const px = (a.w / 2 + b.w / 2) - Math.abs(a.x - b.x)
  const py = (a.h / 2 + b.h / 2) - Math.abs(a.y - b.y)
  return px > 0 && py > 0 ? { px, py } : null
}

// 推進一步:醒著的磚跑物理 + 與其他磚 AABB 解碰撞(settled 磚不動,撞夠力才喚醒)。
export function stepWorld(blocks, dt) {
  for (const b of blocks) {
    if (b.settled) continue
    b.vy += PHYS.gravity * dt
    b.vx *= PHYS.airDrag
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.angle += b.va * dt
    b.va *= 0.99
    // 地面
    const half = b.h / 2
    if (b.y + half >= GROUND_Y) {
      b.y = GROUND_Y - half
      b.vy = -b.vy * 0.18 // 小反彈
      b.vx *= 0.7 // 摩擦
      b.va *= 0.6
      // 落地且速度小 → 靜止(角度收斂到最近的「躺平/直立」感,避免一直微抖)
      if (Math.abs(b.vy) < 26 && Math.abs(b.vx) < 18 && Math.abs(b.va) < 0.4) {
        b.vy = 0; b.vx = 0; b.va = 0; b.settled = true
      }
    }
  }
  // 碰撞:只處理「醒著的磚 vs 其他磚」;settled 磚當作不動的錨,撞夠力才喚醒
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i]
    if (a.settled) continue
    for (let j = 0; j < blocks.length; j++) {
      if (i === j) continue
      const b = blocks[j]
      const ov = overlap(a, b)
      if (!ov) continue
      const impact = Math.hypot(a.vx, a.vy)
      // 被擊飛的磚撞到目標、夠力 → 目標也被擊飛(連鎖打豬)
      if (impact > 130) { if (b.type === 'target') b.popped = true; if (a.type === 'target') a.popped = true }
      if (ov.px < ov.py) {
        // 從側面推開(沿 x)
        const s = a.x < b.x ? -1 : 1
        a.x += ov.px * s
        if (b.settled) { a.vx *= -0.3 } else { const t = a.vx; a.vx = b.vx * 0.6; b.vx = t * 0.6 }
        if (b.settled && impact > 120) { b.settled = false; b.vx += -s * impact * 0.25; b.va += -s * 0.9 } // 撞倒下面/旁邊的
      } else {
        // 從上下推開(沿 y)——通常是 a 落在 b 上
        const s = a.y < b.y ? -1 : 1
        a.y += ov.py * s
        if (s < 0) { // a 在 b 上面 → 停在上面
          a.vy = 0; a.vx *= 0.8; a.va *= 0.7
          if (Math.abs(a.vx) < 14 && Math.abs(a.va) < 0.4) a.settled = true
        } else { a.vy *= -0.2 }
        if (b.settled && impact > 160) { b.settled = false; b.vy += impact * 0.1; b.va += (a.x < b.x ? 0.8 : -0.8) }
      }
    }
  }
  // ★ 連鎖崩塌:靜止磚若失去支撐(底下沒有靜止磚、也不在地面)就甦醒墜落——
  //    打掉支柱 → 樑失去支撐 → 目標失去支撐,整座塔像忿怒鳥那樣塌下來。
  for (const b of blocks) {
    if (b.settled && !isSupported(b, blocks)) { b.settled = false; b.va += (Math.random() < 0.5 ? -0.4 : 0.4) }
  }
}

// 一塊磚是否有支撐:踩在地面,或正下方有「靜止的」磚頂著(x 有重疊、頂面貼著底面)。
function isSupported(b, blocks) {
  if (b.y + b.h / 2 >= GROUND_Y - 2) return true // 在地面
  for (const c of blocks) {
    if (c === b || !c.settled) continue
    const xov = Math.abs(b.x - c.x) < (b.w / 2 + c.w / 2) - 2 // x 重疊
    const onTop = Math.abs((c.y - c.h / 2) - (b.y + b.h / 2)) < 7 // c 的頂 ≈ b 的底
    if (xov && onTop) return true
  }
  return false
}

// 目標是否被擊倒:掉離原位夠遠,或翻過門檻角度。
export function targetDown(b, toppleAngle) {
  if (b.type !== 'target') return false
  if (b.popped) return true // 被擊飛 = 確定倒
  const fell = Math.hypot(b.x - b.startX, b.y - b.startY) > 40
  const toppled = Math.abs(b.angle) >= toppleAngle
  return fell || toppled
}

// 全部目標都倒了嗎?
export function allTargetsDown(blocks, toppleAngle) {
  const targets = blocks.filter((b) => b.type === 'target')
  return targets.length > 0 && targets.every((b) => targetDown(b, toppleAngle))
}

// 世界是否「大致靜止」(沒有還在飛/滾的磚)——用來判斷一發打完、可換下一發。
export function worldRested(blocks) {
  return blocks.every((b) => b.settled || (Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6 && b.y + b.h / 2 >= GROUND_Y - 1))
}
