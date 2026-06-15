import { VIEW, GROUND_Y } from './config.js'

// 生成曠野障礙與懸空的「餅水」收集物,並讓它們隨世界往左移動。
// 這是約拿 spawner 的「換皮」版(♻️):寶物從金幣/陶罐改成餅🍞與水💧(收集=恢復體力);
// 障礙改成溫和的曠野熱浪/塵霧(碰到只小扣體力、不致命)。障礙間距依速度動態調整,保證跳得過去。

// 溫和的曠野障礙(碰到不扣命,只小扣體力)
const OBSTACLES = ['🪨', '🌵', '💨']

// 懸空的收集物:跳起來收集。
//   kind 'bread'=餅(回補多) / 'water'=水(回補少) / 'boost'=炭火燒的餅(滿補+短暫加速,王上 19:8)。
//   實際回補多少由 game.js 依 config.STAMINA 換算(spawner 不耦合數值)。
//   weight = 相對出現機率(越大越常見)。
const TREASURES = [
  { emoji: '🍞', kind: 'bread', weight: 42, r: 18, size: 34 }, // 餅(最常見)
  { emoji: '💧', kind: 'water', weight: 42, r: 16, size: 30 }, // 水
  { emoji: '🥖', kind: 'boost', weight: 8, r: 18, size: 36 }, // 炭火燒的餅:特別大補(較稀有)
]
const TREASURE_WEIGHT = TREASURES.reduce((s, t) => s + t.weight, 0)

function rand(a, b) {
  return a + Math.random() * (b - a)
}

// 依 weight 加權隨機挑一種收集物
function pickTreasure() {
  let r = Math.random() * TREASURE_WEIGHT
  for (const t of TREASURES) {
    if (r < t.weight) return t
    r -= t.weight
  }
  return TREASURES[0]
}

export class Spawner {
  constructor() {
    this.reset()
  }

  reset() {
    this.obstacles = []
    this.treasures = []
    this.distSinceObstacle = 0
    this.nextObstacleGap = 620
    this.distSinceTreasure = 0
    this.nextTreasureGap = 420 // 開場稍早給第一個餅水,讓玩家很快就開始回補
  }

  update(dt, speed, distanceTraveled, goalDistance) {
    const dx = speed * dt

    // 接近終點時不再生成障礙,留一段乾淨跑道讓以利亞走向何烈山
    const spawning = distanceTraveled < goalDistance - 900

    // ---- 障礙(溫和) ----
    this.distSinceObstacle += dx
    if (spawning && this.distSinceObstacle >= this.nextObstacleGap) {
      this.distSinceObstacle = 0
      // 依速度決定最小安全間距(速度越快,間距越大,保證跳得過)
      const minGap = speed * 0.95 + 260
      this.nextObstacleGap = rand(minGap, minGap + 320)
      const w = rand(32, 46)
      const h = rand(30, 46)
      this.obstacles.push({
        x: VIEW.W + 60,
        w,
        h,
        emoji: OBSTACLES[Math.floor(rand(0, OBSTACLES.length))],
        size: Math.max(w, h) + 10,
      })
    }

    // ---- 懸空餅水 ----
    this.distSinceTreasure += dx
    if (spawning && this.distSinceTreasure >= this.nextTreasureGap) {
      this.distSinceTreasure = 0
      this.nextTreasureGap = rand(440, 760)
      const t = pickTreasure()
      this.treasures.push({
        x: VIEW.W + 60,
        y: GROUND_Y - rand(48, 130), // 跳起來才撿得到的高度
        r: t.r,
        size: t.size,
        emoji: t.emoji,
        kind: t.kind,
        taken: false,
      })
    }

    // ---- 移動 + 移除出界 ----
    for (const o of this.obstacles) o.x -= dx
    for (const c of this.treasures) c.x -= dx
    this.obstacles = this.obstacles.filter((o) => o.x > -80)
    this.treasures = this.treasures.filter((c) => c.x > -80 && !c.taken)
  }
}
