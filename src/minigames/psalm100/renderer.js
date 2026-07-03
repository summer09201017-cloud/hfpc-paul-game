// 詩篇 100 讚美琴鍵——Canvas 渲染(零美術檔)。
// 場景:黎明的聖殿外院——判定線=聖殿的門(詩 100:4 當稱謝進入他的門),
// 琴鍵落進門口被按對=一聲稱謝進了殿門(光芒迸發)。
import { LANES, LANE_COLORS, LANE_KEYCAP, LAYOUT } from './config.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.w = 0
    this.h = 0
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
  // 四欄幾何(置中)
  lanes() {
    const totalW = Math.min(this.w * 0.92, LAYOUT.lanesMaxW, LANES * LAYOUT.laneMaxW)
    const laneW = totalW / LANES
    const x0 = (this.w - totalW) / 2
    const judgeY = this.h * (1 - LAYOUT.judgeFromBottom)
    return { x0, laneW, totalW, judgeY, top: LAYOUT.capH }
  }
  laneAt(x) {
    const { x0, laneW, totalW } = this.lanes()
    if (x < x0 || x > x0 + totalW) return null
    return Math.min(LANES - 1, Math.max(0, Math.floor((x - x0) / laneW)))
  }

  draw(g) {
    if (!this.size()) return
    const ctx = this.ctx
    const { w, h } = this
    const L = this.lanes()

    // —— 背景:黎明天空(上深藍→地平線金黃) ——
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#25355e')
    sky.addColorStop(0.55, '#4a5a8a')
    sky.addColorStop(0.82, '#c98d4e')
    sky.addColorStop(1, '#e8b76a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    // 晨光光暈(判定線後方,像門後透出的光)
    const glow = ctx.createRadialGradient(w / 2, L.judgeY + 40, 10, w / 2, L.judgeY + 40, w * 0.5)
    glow.addColorStop(0, 'rgba(255,232,170,0.5)')
    glow.addColorStop(1, 'rgba(255,232,170,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)

    // —— 欄位軌道 ——
    for (let i = 0; i < LANES; i++) {
      const x = L.x0 + i * L.laneW
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'
      ctx.fillRect(x, L.top, L.laneW, L.judgeY - L.top)
      // 按住時整欄微亮
      if (g.laneHeld[i]) {
        ctx.fillStyle = 'rgba(255,244,200,0.14)'
        ctx.fillRect(x, L.top, L.laneW, L.judgeY - L.top)
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    for (let i = 0; i <= LANES; i++) {
      const x = L.x0 + i * L.laneW
      ctx.beginPath(); ctx.moveTo(x, L.top); ctx.lineTo(x, L.judgeY); ctx.stroke()
    }

    // —— 判定線=聖殿的門(兩柱+橫楣,門檻發光帶) ——
    this._gate(ctx, L)

    // —— 音符(琴鍵) ——
    const appr = g.age.approach
    for (const n of g.notes) {
      if (n.judged && !n.holding) continue
      const dt = n.t - g.songTime // 還有幾秒到判定線
      if (dt > appr) continue
      const headY = L.judgeY - (dt / appr) * (L.judgeY - L.top)
      if (n.dur > 0) {
        // 長條:頭到尾
        const tailDt = n.t + n.dur - g.songTime
        const tailY = L.judgeY - (Math.min(tailDt, appr) / appr) * (L.judgeY - L.top)
        const x = L.x0 + n.lane * L.laneW + 6
        const bw = L.laneW - 12
        const yTop = Math.max(tailY, L.top)
        const yBot = n.holding ? L.judgeY : headY
        if (yBot > yTop) {
          ctx.fillStyle = this._alpha(LANE_COLORS[n.lane], n.holding ? 0.95 : 0.55)
          this._rr(ctx, x + bw * 0.18, yTop, bw * 0.64, yBot - yTop, 8)
          ctx.fill()
        }
        if (!n.holding) this._noteHead(ctx, L, n.lane, headY, false)
        else this._noteHead(ctx, L, n.lane, L.judgeY, true)
      } else if (headY >= L.top - LAYOUT.noteH) {
        this._noteHead(ctx, L, n.lane, headY, false)
      }
    }

    // —— 命中特效(門口光芒) ——
    for (const fx of g.effects) {
      const p = fx.age / fx.life
      const x = L.x0 + fx.lane * L.laneW + L.laneW / 2
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = fx.perfect ? '#fff3c4' : '#ffe9a8'
      for (let r = 0; r < 6; r++) {
        const a = (r / 6) * Math.PI * 2 + p * 2
        const d = 8 + p * (fx.perfect ? 46 : 30)
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * d, L.judgeY + Math.sin(a) * d * 0.5, 3.4 - p * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (fx.label) {
        ctx.font = 'bold 15px system-ui'
        ctx.textAlign = 'center'
        ctx.fillStyle = fx.perfect ? '#fff8dc' : '#ffe9a8'
        ctx.globalAlpha = 1 - p
        ctx.fillText(fx.label, x, L.judgeY - 26 - p * 22)
        ctx.globalAlpha = 1
      }
    }

    // —— 鍵帽提示(門檻下) ——
    ctx.textAlign = 'center'
    for (let i = 0; i < LANES; i++) {
      const x = L.x0 + i * L.laneW + L.laneW / 2
      ctx.fillStyle = g.laneHeld[i] ? '#fff3c4' : 'rgba(255,255,255,0.75)'
      ctx.font = 'bold 13px system-ui'
      ctx.fillText(LANE_KEYCAP[i], x, L.judgeY + 26)
    }

    // —— 上方經文字幕帶 ——
    this._caption(ctx, g, L)

    // —— HUD:分數/連擊 ——
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px system-ui'
    ctx.fillText(`🎵 ${g.score}`, 12, h - 14)
    if (g.combo >= 4) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffe9a8'
      ctx.fillText(`${g.combo} 連擊!`, w - 12, h - 14)
    }

    // —— 疊層卡(intro / win) ——
    if (g.state === 'intro') this._card(ctx, g.beat, w, h)
    else if (g.state === 'win') this._card(ctx, g.beat, w, h)
  }

  _noteHead(ctx, L, lane, y, glowing) {
    const x = L.x0 + lane * L.laneW + 6
    const bw = L.laneW - 12
    ctx.fillStyle = glowing ? '#fff3c4' : LANE_COLORS[lane]
    this._rr(ctx, x, y - LAYOUT.noteH / 2, bw, LAYOUT.noteH, 9)
    ctx.fill()
    // 琴鍵高光
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    this._rr(ctx, x + 3, y - LAYOUT.noteH / 2 + 3, bw - 6, 5, 3)
    ctx.fill()
  }

  _gate(ctx, L) {
    const y = L.judgeY
    // 門檻發光帶
    const band = ctx.createLinearGradient(0, y - 8, 0, y + 8)
    band.addColorStop(0, 'rgba(255,236,170,0)')
    band.addColorStop(0.5, 'rgba(255,236,170,0.85)')
    band.addColorStop(1, 'rgba(255,236,170,0)')
    ctx.fillStyle = band
    ctx.fillRect(L.x0 - 26, y - 8, L.totalW + 52, 16)
    // 兩根門柱 + 橫楣(聖殿門的意象)
    ctx.fillStyle = '#8a6238'
    ctx.fillRect(L.x0 - 22, y - 64, 14, 78)
    ctx.fillRect(L.x0 + L.totalW + 8, y - 64, 14, 78)
    ctx.fillRect(L.x0 - 28, y - 72, L.totalW + 56, 12)
    ctx.fillStyle = '#a87f45'
    ctx.fillRect(L.x0 - 22, y - 64, 4, 78)
    ctx.fillRect(L.x0 + L.totalW + 8, y - 64, 4, 78)
    // 楣上小字
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffe9a8'
    ctx.font = 'bold 12px system-ui'
    ctx.fillText('稱 謝 之 門', L.x0 + L.totalW / 2, y - 62)
  }

  _caption(ctx, g, L) {
    const line = g.captionLine
    if (!line) return
    ctx.fillStyle = 'rgba(20,26,48,0.55)'
    this._rr(ctx, this.w / 2 - Math.min(this.w * 0.46, 330), 10, Math.min(this.w * 0.92, 660), LAYOUT.capH - 18, 12)
    ctx.fill()
    ctx.textAlign = 'center'
    const fs = Math.min(22, Math.max(15, this.w / 28))
    ctx.font = `bold ${fs}px system-ui`
    // 已唱到的字亮金色、未到的淡白(依句內進度)
    const chars = [...line.text]
    const lit = Math.round(line.progress * chars.length)
    const totalW = ctx.measureText(line.text).width
    let x = this.w / 2 - totalW / 2
    ctx.textAlign = 'left'
    chars.forEach((c, i) => {
      ctx.fillStyle = i < lit ? '#ffd75e' : 'rgba(255,255,255,0.82)'
      ctx.fillText(c, x, 42)
      x += ctx.measureText(c).width
    })
  }

  _card(ctx, beat, w, h) {
    if (!beat) return
    ctx.fillStyle = 'rgba(16,20,38,0.62)'
    ctx.fillRect(0, 0, w, h)
    const cw = Math.min(w * 0.88, 560)
    const ch = Math.min(h * 0.62, 330)
    const cx = (w - cw) / 2
    const cy = (h - ch) / 2
    ctx.fillStyle = '#fffdf7'
    this._rr(ctx, cx, cy, cw, ch, 18)
    ctx.fill()
    ctx.strokeStyle = '#b9863f'
    ctx.lineWidth = 3
    this._rr(ctx, cx + 6, cy + 6, cw - 12, ch - 12, 14)
    ctx.stroke()
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
        ctx.fillText(line, cx, y)
        y += lh
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
