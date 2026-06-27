// 拖曳彈弓輸入（2026-06-27 升級）：按住機弦往後拉(drag)→ 放開發射。pointer 事件涵蓋滑鼠+觸控。
// down + cx/cy = 拖曳中的指標(canvas 相對座標;世界座標換算交給 renderer.toWorld,由 game 呼叫)。
// consumeFire() = 邊緣旗標：放手(pointerup) 或 空白鍵/Enter → 用來「發射」與「推進 intro/過關/落空畫面」。
export class Input {
  constructor() {
    this.down = false
    this.cx = 0
    this.cy = 0
    this.fired = false
    this._target = null
  }
  attach(canvas) {
    this._target = canvas
    const rel = (e) => {
      const r = canvas.getBoundingClientRect()
      this.cx = e.clientX - r.left
      this.cy = e.clientY - r.top
    }
    this._onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); this.fired = true
      }
    }
    this._onDown = (e) => { e.preventDefault(); rel(e); this.down = true }
    this._onMove = (e) => { if (this.down) rel(e) }
    this._onUp = (e) => { if (this.down) { rel(e); this.down = false; this.fired = true } } // 放手 = 發射/推進
    window.addEventListener('keydown', this._onKey)
    canvas.addEventListener('pointerdown', this._onDown)
    window.addEventListener('pointermove', this._onMove)
    window.addEventListener('pointerup', this._onUp)
  }
  consumeFire() {
    if (this.fired) { this.fired = false; return true }
    return false
  }
  detach() {
    window.removeEventListener('keydown', this._onKey)
    if (this._target) this._target.removeEventListener('pointerdown', this._onDown)
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerup', this._onUp)
    this._target = null
  }
}
