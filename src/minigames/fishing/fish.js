// fish.js —— 水裡悠游的魚(零相依)。phase1 生在淺處(左)、phase2 生在水深之處(右)居多。
import { WORLD, FISH, DEEP_X } from './config.js'

export function makeFish(deep, speedMul) {
  const dir = Math.random() < 0.5 ? 1 : -1
  const x = deep
    ? DEEP_X + Math.random() * (WORLD.w - DEEP_X - 30)   // 水深之處(右)
    : 30 + Math.random() * (DEEP_X - 60)                  // 淺處(左)
  const baseY = FISH.minY + Math.random() * (FISH.maxY - FISH.minY)
  return {
    x, baseY, y: baseY, dir,
    sp: (FISH.speedBase + Math.random() * 30) * speedMul,
    phase: Math.random() * Math.PI * 2,
    r: 11 + Math.random() * 6,
    gold: Math.random() < 0.28,   // 少數金魚(視覺變化)
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
