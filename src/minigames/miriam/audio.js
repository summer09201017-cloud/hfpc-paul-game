// 米利暗擊鼓——零音檔 Web Audio。鈴鼓雙音色:
// don(拍鼓面)=沉的手鼓(正弦音高快速下滑+噪聲拍擊);ka(搖鈴)=金屬鈴片(高通噪聲+雙金屬泛音)。
// 譜面鼓點照排程播(較輕,當伴奏);玩家打對疊一層較亮的同音色=「你也在隊伍裡打鼓」。
export class TimbrelAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this._noise = null // 預先生成的噪聲 buffer
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return }
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.55
      this.master.connect(this.ctx.destination)
      const len = Math.floor(this.ctx.sampleRate * 0.25)
      this._noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = this._noise.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    } catch { this.ctx = null }
  }
  now() { return this.ctx ? this.ctx.currentTime : 0 }

  _don(when, gain) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    // 鼓皮:音高下滑正弦
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(165, t)
    o.frequency.exponentialRampToValueAtTime(72, t + 0.11)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.24)
    // 拍擊感:短噪聲
    const n = this.ctx.createBufferSource()
    n.buffer = this._noise
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8
    const ng = this.ctx.createGain()
    ng.gain.setValueAtTime(gain * 0.5, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    n.connect(bp); bp.connect(ng); ng.connect(this.master)
    n.start(t); n.stop(t + 0.08)
  }
  _ka(when, gain) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    // 鈴片:高通噪聲
    const n = this.ctx.createBufferSource()
    n.buffer = this._noise
    const hp = this.ctx.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 5200
    const ng = this.ctx.createGain()
    ng.gain.setValueAtTime(gain * 0.8, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    n.connect(hp); hp.connect(ng); ng.connect(this.master)
    n.start(t); n.stop(t + 0.18)
    // 金屬泛音兩枚
    for (const f of [2093, 3136]) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'; o.frequency.value = f
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(gain * 0.28, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
      o.connect(g); g.connect(this.master)
      o.start(t); o.stop(t + 0.14)
    }
  }
  // 譜面排程(伴奏,較輕)
  scheduleNote(type, when) { type === 'don' ? this._don(when, 0.16) : this._ka(when, 0.14) }
  // 玩家打對(較亮)
  hit(type, perfect) { type === 'don' ? this._don(0, perfect ? 0.4 : 0.28) : this._ka(0, perfect ? 0.38 : 0.26) }
  // 輕快旋律墊底
  scheduleMelody(freq, when) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    const o = this.ctx.createOscillator()
    o.type = 'triangle'; o.frequency.value = freq
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.12, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.85)
  }
  fanfare() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    ;[0, 0.14, 0.28, 0.42].forEach((dt, i) => {
      this._don(t + dt, 0.34)
      if (i % 2) this._ka(t + dt + 0.07, 0.3)
      this.scheduleMelody([523.25, 659.25, 783.99, 1046.5][i], t + dt)
    })
  }
  stop() {
    try { this.ctx?.close() } catch {}
    this.ctx = null
  }
}
