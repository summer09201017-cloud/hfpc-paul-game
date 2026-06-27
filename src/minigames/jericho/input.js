// 拖曳彈弓輸入:在畫面按下→拖曳(拉弓)→放開(發射)。pointer 事件涵蓋滑鼠+觸控。
// 只回報原始指標狀態(canvas 相對座標 + 邊緣旗標);世界座標換算交給 renderer.toWorld(由 game 呼叫)。
export class Input {
  constructor() {
    this.down = false
    this.cx = 0
    this.cy = 0
    this.released = false // 邊緣:這一拍剛放開(讀一次即清)
    this._target = null
  }
  attach(canvas) {
    this._target = canvas
    const rel = (e) => {
      const r = canvas.getBoundingClientRect()
      this.cx = e.clientX - r.left
      this.cy = e.clientY - r.top
    }
    this._down = (e) => { e.preventDefault(); rel(e); this.down = true }
    this._move = (e) => { if (this.down) { rel(e) } }
    this._up = (e) => { if (this.down) { rel(e); this.down = false; this.released = true } }
    canvas.addEventListener('pointerdown', this._down)
    window.addEventListener('pointermove', this._move)
    window.addEventListener('pointerup', this._up)
  }
  consumeReleased() {
    if (this.released) { this.released = false; return true }
    return false
  }
  detach() {
    if (this._target) this._target.removeEventListener('pointerdown', this._down)
    window.removeEventListener('pointermove', this._move)
    window.removeEventListener('pointerup', this._up)
    this._target = null
  }
}
