// 極簡 Web Audio 合成音效(零音檔、可離線)。同甩石 SlingAudio 的結構。
// 音訊要在使用者手勢中解鎖,所以 unlock() 在「開始」按鈕按下時呼叫。
export class SpearAudio {
  constructor() {
    this.ctx = null
    this.muted = false
  }
  unlock() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      if (this.ctx.state === 'suspended') this.ctx.resume()
    } catch {}
  }
  _beep(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
    if (this.muted || !this.ctx) return
    try {
      const t = this.ctx.currentTime
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, t)
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
      g.gain.setValueAtTime(gain, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(this.ctx.destination)
      o.start(t)
      o.stop(t + dur)
    } catch {}
  }
  harp() { this._beep(392, 0.5, 'triangle', 0.05) } // 大衛彈琴:柔和撥弦(背景偶爾)
  warn() { this._beep(300, 0.12, 'sine', 0.05, 360) } // 預警:輕短提示
  throw() { this._beep(520, 0.22, 'sawtooth', 0.07, 160) } // 擲槍:下滑「咻」
  thunk() { this._beep(150, 0.18, 'square', 0.12, 80) } // 槍刺進牆:悶頓「篤」(躲過了)
  ouch() { this._beep(200, 0.22, 'sawtooth', 0.1, 120) } // 被擦到:溫柔下滑(不嚇人、不血腥)
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._beep(f, 0.22, 'sine', 0.12), i * 130)) }
  destroy() { try { this.ctx && this.ctx.close() } catch {} this.ctx = null }
}
