import { GROUND_Y, PHYS, PLAYER } from './config.js'

// 約拿:固定在畫面左側,只負責上下(跳躍與重力)。
// 世界往左捲動,製造他向前奔跑的感覺。

export class Player {
  constructor() {
    this.reset()
  }

  reset() {
    this.x = PLAYER.x
    this.y = GROUND_Y // 腳底基準
    this.vy = 0
    this.onGround = true
    this.invuln = 0 // 無敵剩餘秒數
    this.lives = 0 // 由 Game 設定
  }

  jump() {
    if (this.onGround) {
      this.vy = PHYS.jumpV
      this.onGround = false
      return true
    }
    return false
  }

  update(dt) {
    this.vy += PHYS.gravity * dt
    this.y += this.vy * dt
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y
      this.vy = 0
      this.onGround = true
    }
    if (this.invuln > 0) this.invuln -= dt
  }

  // 命中框(以腳底為基準往上算)
  hitbox() {
    return { x: this.x - PLAYER.w / 2, y: this.y - PLAYER.h, w: PLAYER.w, h: PLAYER.h }
  }
}
