// 極簡 Web Audio 合成音效（零音檔、可離線、跨專案可重用）。複製自 sling/audio 的合成法。
// 音訊要在使用者手勢中解鎖，所以 unlock() 在「開始」點擊時呼叫。
export class PairsAudio {
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
  _beep(freq, dur, type = 'sine', gain = 0.1, slideTo = null) {
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
  flip() { this._beep(440, 0.08, 'triangle', 0.06, 620) } // 翻牌：短「啪」
  match() { // 配對成功：兩聲上行 + 一點亮
    this._beep(523, 0.12, 'sine', 0.12)
    setTimeout(() => this._beep(784, 0.18, 'sine', 0.12), 110)
  }
  miss() { this._beep(240, 0.2, 'sawtooth', 0.07, 150) } // 翻錯：下滑悶音
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._beep(f, 0.22, 'sine', 0.12), i * 130)) }
  destroy() { try { this.ctx && this.ctx.close() } catch {} this.ctx = null }
}
