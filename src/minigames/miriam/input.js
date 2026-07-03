// 米利暗擊鼓——太鼓式輸入:鍵盤(F/J=拍鼓紅、D/K=搖鈴藍)+ 觸控(拍鈴鼓中間=鼓、旁邊=鈴)。
// 契約:attach(canvas, { onHit(type), typeAt(x, y) })、detach()。type='don'|'ka'。
import { KEYS } from './config.js'

export class Input {
  constructor() {
    this._down = new Set()
    this._onKeyDown = null
    this._onKeyUp = null
    this._onPointerDown = null
    this._canvas = null
  }
  attach(canvas, { onHit, typeAt }) {
    this._canvas = canvas
    this._onKeyDown = (e) => {
      const type = KEYS[e.code]
      if (!type) return
      e.preventDefault()
      if (this._down.has(e.code)) return // 防 key repeat
      this._down.add(e.code)
      onHit(type)
    }
    this._onKeyUp = (e) => { if (KEYS[e.code]) this._down.delete(e.code) }
    this._onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const type = typeAt(e.clientX - rect.left, e.clientY - rect.top)
      if (!type) return
      e.preventDefault()
      onHit(type)
    }
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    canvas.addEventListener('pointerdown', this._onPointerDown)
  }
  detach() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    if (this._canvas) this._canvas.removeEventListener('pointerdown', this._onPointerDown)
    this._down.clear()
  }
}
