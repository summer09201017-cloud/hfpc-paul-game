// 大衛彈琴——零音檔 Web Audio。音色主打「撥弦」(kinnor 七弦琴感):
// 三角波快速衰減+五度泛音,低音撥弦墊底;按對疊明亮琴音;歌照譜面排程播(漏按不斷)。
export class HarpAudio {
  constructor() {
    this.ctx = null
    this.master = null
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return }
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    } catch { this.ctx = null }
  }
  now() { return this.ctx ? this.ctx.currentTime : 0 }

  // 撥弦(排程旋律):快起音、指數衰減、加一點五度泛音=古琴感
  scheduleMelody(freq, when, dur) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.3, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.6) + 0.35)
    const o1 = this.ctx.createOscillator()
    o1.type = 'triangle'; o1.frequency.value = freq
    const o2 = this.ctx.createOscillator()
    o2.type = 'sine'; o2.frequency.value = freq * 1.5 // 五度泛音
    const g2 = this.ctx.createGain(); g2.gain.value = 0.12
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.master)
    o1.start(t); o2.start(t)
    const end = t + Math.max(dur, 0.6) + 0.4
    o1.stop(end); o2.stop(end)
  }
  scheduleBass(freq, when) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.13, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    const o = this.ctx.createOscillator()
    o.type = 'triangle'; o.frequency.value = freq
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 1.7)
  }
  hit(lane, perfect) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(perfect ? 0.2 : 0.14, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    const o = this.ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = 660 + lane * 130 + (perfect ? 200 : 0)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.25)
  }
  holdStart(freq) {
    if (!this.ctx) return null
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.09, t + 0.05)
    const o = this.ctx.createOscillator()
    o.type = 'triangle'; o.frequency.value = freq
    const v = this.ctx.createOscillator() // 輕顫音(弦的持續振動感)
    v.type = 'sine'; v.frequency.value = 5.2
    const vg = this.ctx.createGain(); vg.gain.value = 3
    v.connect(vg); vg.connect(o.frequency)
    o.connect(g); g.connect(this.master)
    o.start(t); v.start(t)
    return { stop: () => { try { const e = this.ctx.currentTime; g.gain.linearRampToValueAtTime(0.0001, e + 0.08); o.stop(e + 0.12); v.stop(e + 0.12) } catch {} } }
  }
  fanfare() {
    if (!this.ctx) return
    const seq = [293.66, 369.99, 440.0, 587.33] // D 大調琶音(舒暢的收尾)
    seq.forEach((f, i) => this.scheduleMelody(f, this.ctx.currentTime + i * 0.18, 0.7))
  }
  stop() {
    try { this.ctx?.close() } catch {}
    this.ctx = null
  }
}
