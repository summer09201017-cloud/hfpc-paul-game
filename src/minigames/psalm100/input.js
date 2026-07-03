// 詩篇 100 讚美琴鍵——鍵盤(DFJK/方向鍵)+ 多點觸控(每欄一指,可按住)輸入。
// 契約:attach(canvas, { onLane(lane, isDown), laneAt(x) })、detach()。
import { KEYS } from './config.js'

export class Input {
  constructor() {
    this._down = new Set() // 已按下的鍵(防 key repeat)
    this._pointers = new Map() // pointerId → lane
    this._onKeyDown = null
    this._onKeyUp = null
    this._onPointerDown = null
    this._onPointerUp = null
    this._canvas = null
  }
  attach(canvas, { onLane, laneAt }) {
    this._canvas = canvas
    this._onKeyDown = (e) => {
      const lane = KEYS[e.code]
      if (lane == null) return
      e.preventDefault()
      if (this._down.has(e.code)) return
      this._down.add(e.code)
      onLane(lane, true)
    }
    this._onKeyUp = (e) => {
      const lane = KEYS[e.code]
      if (lane == null) return
      this._down.delete(e.code)
      onLane(lane, false)
    }
    this._onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const lane = laneAt(e.clientX - rect.left)
      if (lane == null) return
      e.preventDefault()
      try { canvas.setPointerCapture(e.pointerId) } catch {}
      this._pointers.set(e.pointerId, lane)
      onLane(lane, true)
    }
    this._onPointerUp = (e) => {
      const lane = this._pointers.get(e.pointerId)
      if (lane == null) return
      this._pointers.delete(e.pointerId)
      onLane(lane, false)
    }
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    canvas.addEventListener('pointerdown', this._onPointerDown)
    canvas.addEventListener('pointerup', this._onPointerUp)
    canvas.addEventListener('pointercancel', this._onPointerUp)
  }
  detach() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    if (this._canvas) {
      this._canvas.removeEventListener('pointerdown', this._onPointerDown)
      this._canvas.removeEventListener('pointerup', this._onPointerUp)
      this._canvas.removeEventListener('pointercancel', this._onPointerUp)
    }
    this._down.clear()
    this._pointers.clear()
  }
}
