// 大衛彈琴——Guitar Hero 型透視渲染(零美術檔)。
// 場景:王宮大廳。中央=由遠而近的「琴弦高速公路」(4 弦梯形,判定線=琴橋);
// 左=大衛抱琴撥弦(隨命中撥臂),右=掃羅坐寶座,頭上黑影濃淡=愁煩(彈得好就散開)。
import { LANES, LANE_COLORS, LANE_KEYCAP, VIEW } from './config.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.w = 0
    this.h = 0
    this.t = 0 // 動畫時鐘(僅視覺)
  }
  size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return false
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr)
      this.canvas.height = Math.round(h * dpr)
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.w = w
    this.h = h
    return true
  }
  // 透視:p=0 遠(琴頭)→1 近(琴橋);q=加速曲線
  _q(p) { return Math.pow(Math.max(0, Math.min(1, p)), VIEW.ease) }
  _geom() {
    const cx = this.w / 2
    const nearW = this.w * VIEW.nearWFrac
    const farW = this.w * VIEW.farWFrac
    const nearY = this.h * VIEW.nearYFrac
    const farY = this.h * VIEW.farYFrac
    return { cx, nearW, farW, nearY, farY }
  }
  _laneX(lane, q) {
    const g = this._geom()
    const wAt = g.farW + (g.nearW - g.farW) * q
    return g.cx + ((lane + 0.5) / LANES - 0.5) * wAt
  }
  _yAt(q) {
    const g = this._geom()
    return g.farY + (g.nearY - g.farY) * q
  }
  laneAt(x) {
    // 觸控用近端(琴橋)幾何
    const g = this._geom()
    const left = g.cx - g.nearW / 2
    if (x < left || x > g.cx + g.nearW / 2) return null
    return Math.min(LANES - 1, Math.max(0, Math.floor((x - left) / (g.nearW / LANES))))
  }

  draw(g) {
    if (!this.size()) return
    this.t += 1 / 60
    const ctx = this.ctx
    const { w, h } = this
    const G = this._geom()

    // —— 王宮背景:暗頂→暖地,兩側柱列,火把光 ——
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#1d1a2e')
    bg.addColorStop(0.55, '#3a2f45')
    bg.addColorStop(1, '#5c4632')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    this._pillars(ctx, w, h)
    // 火把光暈(左右)
    for (const fx of [0.06, 0.94]) {
      const gl = ctx.createRadialGradient(w * fx, h * 0.34, 4, w * fx, h * 0.34, 90)
      gl.addColorStop(0, 'rgba(255,180,90,0.5)')
      gl.addColorStop(1, 'rgba(255,180,90,0)')
      ctx.fillStyle = gl
      ctx.fillRect(w * fx - 90, h * 0.34 - 90, 180, 180)
    }

    // —— 琴弦高速公路(梯形+4 弦) ——
    ctx.fillStyle = 'rgba(30,22,40,0.55)'
    ctx.beginPath()
    ctx.moveTo(G.cx - G.farW / 2, G.farY)
    ctx.lineTo(G.cx + G.farW / 2, G.farY)
    ctx.lineTo(G.cx + G.nearW / 2, G.nearY)
    ctx.lineTo(G.cx - G.nearW / 2, G.nearY)
    ctx.closePath()
    ctx.fill()
    // 四條琴弦(按住整條發亮)
    for (let i = 0; i < LANES; i++) {
      ctx.strokeStyle = g.laneHeld[i] ? '#ffe9a8' : 'rgba(230,210,170,0.55)'
      ctx.lineWidth = g.laneHeld[i] ? 2.6 : 1.4 + i * 0.2 // 低音弦略粗
      ctx.beginPath()
      ctx.moveTo(this._laneX(i, 0), G.farY)
      ctx.lineTo(this._laneX(i, 1), G.nearY)
      ctx.stroke()
    }
    // 琴頭(遠端小橫楣)
    ctx.fillStyle = '#7a5a34'
    ctx.fillRect(G.cx - G.farW / 2 - 8, G.farY - 6, G.farW + 16, 6)

    // —— 琴橋=判定線(發光橫杆+每弦接收圈) ——
    const band = ctx.createLinearGradient(0, G.nearY - 7, 0, G.nearY + 7)
    band.addColorStop(0, 'rgba(255,236,170,0)')
    band.addColorStop(0.5, 'rgba(255,236,170,0.9)')
    band.addColorStop(1, 'rgba(255,236,170,0)')
    ctx.fillStyle = band
    ctx.fillRect(G.cx - G.nearW / 2 - 20, G.nearY - 7, G.nearW + 40, 14)
    ctx.fillStyle = '#8a6238'
    ctx.fillRect(G.cx - G.nearW / 2 - 14, G.nearY + 6, G.nearW + 28, 9)
    for (let i = 0; i < LANES; i++) {
      const x = this._laneX(i, 1)
      ctx.strokeStyle = g.laneHeld[i] ? '#fff3c4' : 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(x, G.nearY, VIEW.noteNearR + 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = g.laneHeld[i] ? '#fff3c4' : 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(LANE_KEYCAP[i], x, G.nearY + 34)
    }

    // —— 音符(撥點/長條緞帶,由遠而近) ——
    const appr = g.age.approach
    for (const n of g.notes) {
      if (n.judged && !n.holding) continue
      const dt = n.t - g.songTime
      if (dt > appr) continue
      const pHead = 1 - dt / appr
      const qHead = this._q(pHead)
      if (n.dur > 0) {
        const dtTail = n.t + n.dur - g.songTime
        const pTail = 1 - dtTail / appr
        const qTail = this._q(pTail)
        const qFrom = n.holding ? 1 : Math.min(qHead, 1)
        // 緞帶:沿該弦畫漸窄四邊形
        const x1 = this._laneX(n.lane, qFrom), y1 = this._yAt(qFrom)
        const x2 = this._laneX(n.lane, qTail), y2 = this._yAt(qTail)
        const r1 = (VIEW.noteFarR + (VIEW.noteNearR - VIEW.noteFarR) * qFrom) * 0.62
        const r2 = (VIEW.noteFarR + (VIEW.noteNearR - VIEW.noteFarR) * qTail) * 0.62
        ctx.fillStyle = this._alpha(LANE_COLORS[n.lane], n.holding ? 0.95 : 0.55)
        ctx.beginPath()
        ctx.moveTo(x1 - r1, y1); ctx.lineTo(x1 + r1, y1)
        ctx.lineTo(x2 + r2, y2); ctx.lineTo(x2 - r2, y2)
        ctx.closePath(); ctx.fill()
        this._pluck(ctx, n.lane, n.holding ? 1 : Math.min(qHead, 1), n.holding)
      } else if (pHead >= -0.08) {
        this._pluck(ctx, n.lane, Math.min(qHead, 1), false)
      }
    }

    // —— 命中特效(琴橋光花) ——
    for (const fx of g.effects) {
      const p = fx.age / fx.life
      const x = this._laneX(fx.lane, 1)
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = fx.perfect ? '#fff3c4' : '#ffd98a'
      for (let r = 0; r < 6; r++) {
        const a = (r / 6) * Math.PI * 2 + p * 2.2
        const d = 8 + p * (fx.perfect ? 42 : 26)
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * d, G.nearY + Math.sin(a) * d * 0.5, 3 - p * 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
      if (fx.label) {
        ctx.font = 'bold 15px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(fx.label, x, G.nearY - 30 - p * 20)
      }
      ctx.globalAlpha = 1
    }

    // —— 人物:大衛(左,抱琴) & 掃羅(右,寶座+愁煩黑影) ——
    this._david(ctx, w * 0.10, G.nearY - 8, g)
    this._saul(ctx, w * 0.90, G.nearY - 8, g)

    // —— 字幕 + HUD ——
    this._caption(ctx, g)
    // 愁煩條(右上,越低越好)
    const gw = Math.min(200, w * 0.3)
    ctx.fillStyle = 'rgba(20,16,30,0.6)'
    this._rr(ctx, w - gw - 14, VIEW.capH + 4, gw, 20, 8); ctx.fill()
    ctx.fillStyle = '#5a4a75'
    this._rr(ctx, w - gw - 12, VIEW.capH + 6, (gw - 4) * g.gloom, 16, 6); ctx.fill()
    ctx.fillStyle = '#cfc4e0'
    ctx.font = 'bold 12px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText('掃羅的愁煩', w - 18, VIEW.capH + 38)
    // 分數/連擊
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px system-ui'
    ctx.fillText(`🎵 ${g.score}`, 12, h - 14)
    if (g.combo >= 4) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffe9a8'
      ctx.fillText(`${g.combo} 連擊!`, w - 12, h - 14)
    }

    if (g.state === 'intro' || g.state === 'win') this._card(ctx, g.beat, w, h)
  }

  _pluck(ctx, lane, q, glowing) {
    const x = this._laneX(lane, q)
    const y = this._yAt(q)
    const r = VIEW.noteFarR + (VIEW.noteNearR - VIEW.noteFarR) * q
    ctx.fillStyle = glowing ? '#fff3c4' : LANE_COLORS[lane]
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.34, 0, Math.PI * 2); ctx.fill()
  }

  _pillars(ctx, w, h) {
    ctx.fillStyle = 'rgba(120,100,80,0.30)'
    for (const px of [0.03, 0.17, 0.83, 0.97]) {
      ctx.fillRect(w * px - 10, h * 0.12, 20, h * 0.72)
      ctx.fillRect(w * px - 16, h * 0.12 - 8, 32, 10)
    }
  }

  // 大衛:站姿抱琴,撥弦臂隨最近命中擺動,有臉(眼+微笑)
  _david(ctx, x, groundY, g) {
    const s = Math.min(this.w, this.h) / 420 // 縮放
    const strum = Math.max(0, 1 - (this.t - g.lastHitAt) * 3) // 撥弦動作衰減
    ctx.save()
    ctx.translate(x, groundY)
    ctx.scale(s, s)
    // 身體(袍)
    ctx.fillStyle = '#7a5a9c'
    ctx.beginPath()
    ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(11, -56); ctx.lineTo(-11, -56)
    ctx.closePath(); ctx.fill()
    // 頭+臉
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(0, -68, 12, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#5a3a1e' // 髮
    ctx.beginPath(); ctx.arc(0, -72, 11, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(-4, -69, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(4, -69, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(0, -64, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke() // 微笑
    // 琴(kinnor:雙臂+橫楣+弦)
    ctx.strokeStyle = '#b9863f'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(14, -46); ctx.quadraticCurveTo(30, -52, 32, -30); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(14, -18); ctx.quadraticCurveTo(30, -14, 32, -30); ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(14, -46); ctx.lineTo(14, -18); ctx.stroke()
    ctx.strokeStyle = '#e8d9b0'; ctx.lineWidth = 1
    for (let i = 0; i < 4; i++) {
      const yy = -42 + i * 6.5
      ctx.beginPath(); ctx.moveTo(15, yy); ctx.lineTo(29 + i, yy + (i - 1.5) * 2); ctx.stroke()
    }
    // 左手扶琴、右手撥弦(隨 strum 擺)
    ctx.strokeStyle = '#e8b88a'; ctx.lineWidth = 4.5
    ctx.beginPath(); ctx.moveTo(-8, -50); ctx.lineTo(13, -44); ctx.stroke()
    const a = -0.5 + strum * 0.9
    ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(-6 + Math.cos(a) * 26, -34 + Math.sin(a) * 16); ctx.stroke()
    ctx.restore()
  }

  // 掃羅:寶座上的王;愁煩黑影(隨 gloom 濃淡);gloom 低=抬頭+眉鬆
  _saul(ctx, x, groundY, g) {
    const s = Math.min(this.w, this.h) / 420
    const gloom = g.gloom
    ctx.save()
    ctx.translate(x, groundY)
    ctx.scale(s, s)
    // 寶座
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-24, -70, 48, 70)
    ctx.fillStyle = '#8a6238'
    ctx.fillRect(-20, -66, 40, 62)
    // 身體(王袍)
    ctx.fillStyle = '#a33d3d'
    ctx.beginPath()
    ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(10, -44); ctx.lineTo(-10, -44)
    ctx.closePath(); ctx.fill()
    // 頭(gloom 高=垂頭)
    const headDrop = gloom * 6
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(0, -54 + headDrop, 11, 0, Math.PI * 2); ctx.fill()
    // 華麗皇冠(l6 鐵則:王要戴冠)
    ctx.fillStyle = '#e8c33d'
    ctx.beginPath()
    ctx.moveTo(-10, -62 + headDrop); ctx.lineTo(10, -62 + headDrop)
    ctx.lineTo(8, -70 + headDrop); ctx.lineTo(4, -64 + headDrop); ctx.lineTo(0, -71 + headDrop)
    ctx.lineTo(-4, -64 + headDrop); ctx.lineTo(-8, -70 + headDrop)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#c43d3d'
    ctx.beginPath(); ctx.arc(0, -66 + headDrop, 1.8, 0, Math.PI * 2); ctx.fill()
    // 臉:眉(gloom 高=皺)、眼、嘴(gloom 低=展開)
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.4
    const brow = gloom * 3
    ctx.beginPath(); ctx.moveTo(-7, -57 + headDrop + brow); ctx.lineTo(-2, -58 + headDrop); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(7, -57 + headDrop + brow); ctx.lineTo(2, -58 + headDrop); ctx.stroke()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(-4, -54 + headDrop, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(4, -54 + headDrop, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath()
    if (gloom > 0.5) { ctx.moveTo(-4, -48 + headDrop); ctx.lineTo(4, -48 + headDrop) } // 抿嘴
    else ctx.arc(0, -50 + headDrop, 3.6, 0.15 * Math.PI, 0.85 * Math.PI) // 舒暢微笑
    ctx.stroke()
    // 愁煩黑影(頭上翻騰的暗雲,gloom=透明度與大小)
    if (gloom > 0.04) {
      ctx.globalAlpha = gloom * 0.75
      ctx.fillStyle = '#241a30'
      const cs = 10 + gloom * 16
      for (let i = 0; i < 4; i++) {
        const a = this.t * 1.6 + i * 1.7
        ctx.beginPath()
        ctx.arc(Math.cos(a) * 8, -86 - Math.abs(Math.sin(a)) * 6, cs - i * 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  _caption(ctx, g) {
    const line = g.captionLine
    if (!line) return
    ctx.fillStyle = 'rgba(20,16,30,0.6)'
    this._rr(ctx, this.w / 2 - Math.min(this.w * 0.46, 330), 8, Math.min(this.w * 0.92, 660), VIEW.capH - 16, 12)
    ctx.fill()
    const fs = Math.min(20, Math.max(14, this.w / 30))
    ctx.font = `bold ${fs}px system-ui`
    const chars = [...line.text]
    const lit = Math.round(line.progress * chars.length)
    let x = this.w / 2 - ctx.measureText(line.text).width / 2
    ctx.textAlign = 'left'
    chars.forEach((c, i) => {
      ctx.fillStyle = i < lit ? '#ffd75e' : 'rgba(255,255,255,0.85)'
      ctx.fillText(c, x, 38)
      x += ctx.measureText(c).width
    })
  }

  _card(ctx, beat, w, h) {
    if (!beat) return
    ctx.fillStyle = 'rgba(12,10,22,0.65)'
    ctx.fillRect(0, 0, w, h)
    const cw = Math.min(w * 0.88, 560)
    const ch = Math.min(h * 0.62, 330)
    const cx = (w - cw) / 2
    const cy = (h - ch) / 2
    ctx.fillStyle = '#fffdf7'
    this._rr(ctx, cx, cy, cw, ch, 18); ctx.fill()
    ctx.strokeStyle = '#b9863f'; ctx.lineWidth = 3
    this._rr(ctx, cx + 6, cy + 6, cw - 12, ch - 12, 14); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5c4a28'
    ctx.font = `bold ${Math.min(24, cw / 16)}px system-ui`
    ctx.fillText(beat.kicker, w / 2, cy + 48)
    if (beat.stars) {
      ctx.font = '28px system-ui'
      ctx.fillText('⭐'.repeat(beat.stars), w / 2, cy + 86)
    }
    ctx.fillStyle = '#3d3123'
    const bodyFs = Math.min(17, cw / 24)
    ctx.font = `${bodyFs}px system-ui`
    this._wrap(ctx, beat.line, w / 2, cy + (beat.stars ? 118 : 86), cw - 64, bodyFs * 1.65)
    if (beat.ref) {
      ctx.fillStyle = '#8a6d3b'
      ctx.font = `bold ${bodyFs - 1}px system-ui`
      ctx.fillText(`— ${beat.ref}`, w / 2, cy + ch - 58)
    }
    ctx.fillStyle = '#b04a2f'
    ctx.font = `bold ${bodyFs}px system-ui`
    ctx.fillText(beat.cont || '', w / 2, cy + ch - 26)
  }

  _wrap(ctx, text, cx, y, maxW, lh) {
    const chars = [...(text || '')]
    let line = ''
    for (const c of chars) {
      if (ctx.measureText(line + c).width > maxW || c === '\n') {
        ctx.fillText(line, cx, y); y += lh
        line = c === '\n' ? '' : c
      } else line += c
    }
    if (line) ctx.fillText(line, cx, y)
  }
  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
  _alpha(hex, a) {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
  }
}
