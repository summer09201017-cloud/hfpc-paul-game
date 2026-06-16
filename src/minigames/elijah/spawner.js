import { VIEW, GROUND_Y, ANGEL } from './config.js'

// 生成曠野障礙與「天使」,並讓它們隨世界往左移動。
// 本關核心:一路上「常常遇到天使」(ANGEL.gap),走到天使面前才停下對話、領受餅水恢復體力。
// (這是約拿 spawner 的換皮:把懸空寶物換成『地上的天使遭遇點』。)
// 障礙是溫和的曠野熱浪/塵霧(碰到只小扣體力、不致命),間距依速度動態調整,保證跳得過去。

// 溫和的曠野障礙(碰到不扣命,只小扣體力)
const OBSTACLES = ['🪨', '🌵', '💨']

function rand(a, b) {
  return a + Math.random() * (b - a)
}

export class Spawner {
  constructor() {
    this.reset()
  }

  reset() {
    this.obstacles = []
    this.angels = []
    this.pickups = [] // 天使來過後撒在空中的餅🍞水💧(跳起來吃,恢復體力)
    this.distSinceObstacle = 0
    this.nextObstacleGap = 700
    this.distSinceAngel = 0
    this.nextAngelGap = ANGEL.firstAt // 第一位天使很快出現
    this._firstAngelDone = false
  }

  // 遇到天使後呼叫:在前方空中撒下幾個餅🍞水💧,排成「跳起來才吃得到」的高度。
  dropMeal() {
    for (let i = 0; i < 4; i++) {
      this.pickups.push({
        x: VIEW.W + 40 + i * 84, // 在畫面右側外,隨世界往左進場
        y: GROUND_Y - (62 + (i % 2) * 40), // 高低交錯(跳起來吃)
        kind: i % 2 === 0 ? 'bread' : 'water',
        r: 16,
        got: false,
      })
    }
  }

  update(dt, speed, distanceTraveled, goalDistance) {
    const dx = speed * dt

    // 接近終點時不再生成障礙/天使,留一段乾淨跑道讓以利亞走向何烈山
    const spawning = distanceTraveled < goalDistance - 900

    // ---- 障礙(溫和) ----
    this.distSinceObstacle += dx
    if (spawning && this.distSinceObstacle >= this.nextObstacleGap) {
      this.distSinceObstacle = 0
      // 依速度決定最小安全間距(速度越快,間距越大,保證跳得過)
      const minGap = speed * 0.95 + 300
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

    // ---- 天使(常常遇到;站在地上,走近觸發對話)----
    this.distSinceAngel += dx
    if (spawning && this.distSinceAngel >= this.nextAngelGap) {
      this.distSinceAngel = 0
      this.nextAngelGap = rand(ANGEL.gapMin, ANGEL.gapMax)
      this._firstAngelDone = true
      this.angels.push({
        x: VIEW.W + 60,
        met: false, // 已觸發過對話 = true(不重複觸發)
      })
    }

    // ---- 移動 + 移除出界 ----
    for (const o of this.obstacles) o.x -= dx
    for (const a of this.angels) a.x -= dx
    for (const p of this.pickups) p.x -= dx
    this.obstacles = this.obstacles.filter((o) => o.x > -80)
    this.angels = this.angels.filter((a) => a.x > -80)
    this.pickups = this.pickups.filter((p) => p.x > -60 && !p.got)
  }
}
