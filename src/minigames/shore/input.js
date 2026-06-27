// input.js —— 點畫面回應/餵羊(pointer)+ 空白鍵/Enter。座標交給 renderer.toWorld() 轉世界座標。
// 守嵌入:canvas 上監聽 pointerdown,window 上監聽 up/key,detach 全清。
export class Input {
  constructor() {
    this.cx = 480; this.cy = 360
    this._tap = null        // 待處理的點擊點 {cx,cy}
    this._released = false   // 這一幀有點一下(給 beat 繼續)
  }

  attach(canvas) {
    this.canvas = canvas
    const pt = (e) => { const r = canvas.getBoundingClientRect(); this.cx = e.clientX - r.left; this.cy = e.clientY - r.top }
    this._onDown = (e) => { pt(e) }
    this._onUp = (e) => { pt(e); this._tap = { cx: this.cx, cy: this.cy }; this._released = true }
    this._onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this._tap = { cx: this.cx, cy: this.cy }; this._released = true } }
    canvas.addEventListener('pointerdown', this._onDown)
    window.addEventListener('pointerup', this._onUp)
    window.addEventListener('keydown', this._onKey)
  }

  consumeTap() { const t = this._tap; this._tap = null; return t }
  consumeReleased() { const r = this._released; this._released = false; return r }

  detach() {
    if (this.canvas) this.canvas.removeEventListener('pointerdown', this._onDown)
    window.removeEventListener('pointerup', this._onUp)
    window.removeEventListener('keydown', this._onKey)
  }
}
