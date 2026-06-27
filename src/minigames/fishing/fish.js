// fish.js —— 水裡悠游的魚(零相依)。phase1 生在淺處(左)、phase2 生在水深之處(右)居多。
// ★魚分大小三級,顏色/體型/游速都不同,且「魚越大,漁獲分數越高」:小=1 分快、中=2 分、大=3 分慢。
import { WORLD, FISH, DEEP_X } from './config.js'

// 三級魚:[半徑, 漁獲分, 速度倍率, 顏色](小魚快又多但分低;大魚慢又少但分高 → 大魚值得瞄準)
// ★顏色都跟藍海對比(別用藍/青,會跟海融在一起看不清):珊瑚/銀白/金,三級分明。
const TIERS = [
  { r: 10, value: 1, spMul: 1.45, color: '#ff9170' }, // 小魚(珊瑚橘、快)
  { r: 14, value: 2, spMul: 1.0, color: '#eef2f4' },  // 中魚(銀白)
  { r: 19, value: 3, spMul: 0.68, color: '#f4be3d' }, // 大魚(金、慢、3 分)
]
function pickTier() { const x = Math.random(); return x < 0.5 ? TIERS[0] : x < 0.82 ? TIERS[1] : TIERS[2] }

export function makeFish(deep, speedMul) {
  const dir = Math.random() < 0.5 ? 1 : -1
  const x = deep
    ? DEEP_X + Math.random() * (WORLD.w - DEEP_X - 30)   // 水深之處(右)
    : 30 + Math.random() * (DEEP_X - 60)                  // 淺處(左)
  const baseY = FISH.minY + Math.random() * (FISH.maxY - FISH.minY)
  const tier = pickTier()
  return {
    x, baseY, y: baseY, dir,
    sp: (FISH.speedBase + Math.random() * 34) * tier.spMul * speedMul,
    phase: Math.random() * Math.PI * 2,
    r: tier.r + Math.random() * 2,
    value: tier.value,        // 抓到加多少漁獲分(魚越大越多)
    color: tier.color,
    caught: false,
  }
}

// 左右悠游 + 上下小擺;碰邊回頭(留在水裡)。
export function stepFish(f, dt, t) {
  f.x += f.dir * f.sp * dt
  if (f.x < 24) { f.x = 24; f.dir = 1 }
  if (f.x > WORLD.w - 24) { f.x = WORLD.w - 24; f.dir = -1 }
  f.y = f.baseY + Math.sin(t * 2 + f.phase) * FISH.bob
}
