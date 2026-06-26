// 原始輸入:閃避關要「持續的左右移動」+「一次性確認(開始/繼續)」。
//   左右:← → / A D 持續按住;觸控=按住畫面左半/右半。
//   確認:空白鍵 / Enter / 點畫面(intro、win、lose 用)。
// attach() 存具名參考、提供 detach(),嵌入卸載時移得乾淨(嵌入契約)。
export class Input {
  constructor() {
    this.left = false
    this.right = false
    this.confirmed = false // 邊緣旗標:被讀一次就清掉
    this._target = null
    this._onDown = this._onUp = this._onPointerDown = this._onPointerUp = null
  }
  attach(target) {
    this._target = target
    this._onDown = (e) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { this.left = true; e.preventDefault() }
      else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') { this.right = true; e.preventDefault() }
      else if (e.code === 'Space' || e.key === 'Enter') { this.confirmed = true; e.preventDefault() }
    }
    this._onUp = (e) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = false
      else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = false
    }
    // 觸控/滑鼠:按住左半=左、右半=右;同時也算一次 confirm(intro/結算畫面要用)。
    this._onPointerDown = (e) => {
      this.confirmed = true
      const r = target.getBoundingClientRect()
      const x = (e.clientX ?? (r.left + r.width / 2)) - r.left
      if (x < r.width / 2) this.left = true
      else this.right = true
      e.preventDefault()
    }
    this._onPointerUp = () => { this.left = false; this.right = false }
    window.addEventListener('keydown', this._onDown)
    window.addEventListener('keyup', this._onUp)
    target.addEventListener('pointerdown', this._onPointerDown)
    window.addEventListener('pointerup', this._onPointerUp)
    window.addEventListener('pointercancel', this._onPointerUp)
  }
  // 方向:-1 左、+1 右、0 不動(兩邊同按互相抵消)。
  dir() { return (this.right ? 1 : 0) - (this.left ? 1 : 0) }
  // 讀「這一拍有沒有確認」,讀完即清(邊緣觸發)。
  consumeConfirm() {
    if (this.confirmed) { this.confirmed = false; return true }
    return false
  }
  detach() {
    if (this._onDown) window.removeEventListener('keydown', this._onDown)
    if (this._onUp) window.removeEventListener('keyup', this._onUp)
    if (this._target && this._onPointerDown) this._target.removeEventListener('pointerdown', this._onPointerDown)
    if (this._onPointerUp) { window.removeEventListener('pointerup', this._onPointerUp); window.removeEventListener('pointercancel', this._onPointerUp) }
    this._onDown = this._onUp = this._onPointerDown = this._onPointerUp = this._target = null
  }
}
