// input.js —— 點水面下網(pointer)+ 空白鍵/Enter 在目前位置下網。座標是 canvas 相對 CSS px,
//   交給 renderer.toWorld() 轉世界座標。守嵌入:canvas 上監聽 pointerdown,window 上監聽 move/up/key,detach 全清。
export class Input {
  constructor() {
    this.down = false
    this.cx = 480; this.cy = 380   // 目前指標(預設水面中央,供鍵盤下網)
    this._cast = null              // 待處理的下網點 {cx,cy}
    this._released = false         // 這一幀有放開(給 intro/結算 點畫面繼續)
  }

  attach(canvas) {
    this.canvas = canvas
    const pt = (e) => { const r = canvas.getBoundingClientRect(); this.cx = e.clientX - r.left; this.cy = e.clientY - r.top }
    this._onDown = (e) => { pt(e); this.down = true }
    this._onMove = (e) => { pt(e) }
    this._onUp = (e) => { if (this.down) { pt(e) } ; this.down = false; this._cast = { cx: this.cx, cy: this.cy }; this._released = true }
    this._onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this._cast = { cx: this.cx, cy: this.cy }; this._released = true }
    }
    canvas.addEventListener('pointerdown', this._onDown)
    window.addEventListener('pointermove', this._onMove)
    window.addEventListener('pointerup', this._onUp)
    window.addEventListener('keydown', this._onKey)
  }

  consumeCast() { const c = this._cast; this._cast = null; return c }
  consumeReleased() { const r = this._released; this._released = false; return r }

  detach() {
    if (this.canvas) this.canvas.removeEventListener('pointerdown', this._onDown)
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerup', this._onUp)
    window.removeEventListener('keydown', this._onKey)
  }
}
