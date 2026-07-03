// 詩篇 100 讚美琴鍵——零音檔 Web Audio(procedural-bgm/sfx-kit 慣例)。
// 設計:旋律「照譜面時間」排程播(漏按歌也不會斷——歌是神的,不是玩家表現的獎品);
// 玩家按對時疊一層明亮撥弦+火花,按住長條時有持續的風琴聲。
export class Psalm100Audio {
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

  // 旋律音(排程):柔和三角波+輕微二倍頻,鋼琴感淡出
  scheduleMelody(freq, when, dur) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.26, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.4) + 0.25)
    const o1 = this.ctx.createOscillator()
    o1.type = 'triangle'; o1.frequency.value = freq
    const o2 = this.ctx.createOscillator()
    o2.type = 'sine'; o2.frequency.value = freq * 2
    const g2 = this.ctx.createGain(); g2.gain.value = 0.18
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.master)
    o1.start(t); o2.start(t)
    const end = t + Math.max(dur, 0.4) + 0.3
    o1.stop(end); o2.stop(end)
  }
  // 低音(每小節):沉穩的根音
  scheduleBass(freq, when) {
    if (!this.ctx) return
    const t = Math.max(when, this.ctx.currentTime)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.14, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    const o = this.ctx.createOscillator()
    o.type = 'sine'; o.frequency.value = freq
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 1.5)
  }
  // 按對:明亮短撥弦(依欄位微變音高,有「彈琴」的參與感)
  hit(lane, perfect) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(perfect ? 0.22 : 0.15, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = 880 + lane * 110 + (perfect ? 220 : 0)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.2)
  }
  // 長條按住中:柔和持續音(開始/停止由 game 控)
  holdStart(freq) {
    if (!this.ctx) return null
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.1, t + 0.05)
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'; o.frequency.value = freq
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 1200
    o.connect(lp); lp.connect(g); g.connect(this.master)
    o.start(t)
    return { stop: () => { try { const e = this.ctx.currentTime; g.gain.linearRampToValueAtTime(0.0001, e + 0.08); o.stop(e + 0.12) } catch {} } }
  }
  // 過關號角感
  fanfare() {
    if (!this.ctx) return
    const seq = [523.25, 659.25, 783.99, 1046.5]
    seq.forEach((f, i) => this.scheduleMelody(f, this.ctx.currentTime + i * 0.16, 0.5))
  }
  stop() {
    try { this.ctx?.close() } catch {}
    this.ctx = null
  }
}
