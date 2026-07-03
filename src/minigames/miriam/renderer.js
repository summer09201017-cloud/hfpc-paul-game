// 米利暗擊鼓——太鼓型渲染(零美術檔)。
// 場景:過紅海後的對岸清晨——背後是合攏的紅海與晨光,沙灘上眾婦女拿鼓跳舞(歡慶越高跳越高),
// 左側米利暗領舞;單軌音符由右向左滑進「鈴鼓」判定圈;左下一面大鈴鼓=觸控打擊區。
import { COLORS, VIEW, JOY } from './config.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.w = 0
    this.h = 0
    this.t = 0
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
  // 大鈴鼓(觸控打擊區)幾何:左下
  _drum() {
    const r = Math.min(this.w, this.h) * 0.13
    return { x: this.w * 0.16, y: this.h * 0.80, r, faceR: r * 0.68 }
  }
  // 觸控分型:拍鼓面(圓心附近)=don;其他任何地方=ka(搖鈴)——大目標,幼兒好打
  typeAt(x, y) {
    const d = this._drum()
    const dist = Math.hypot(x - d.x, y - d.y)
    return dist <= d.faceR ? 'don' : 'ka'
  }

  draw(g) {
    if (!this.size()) return
    this.t += 1 / 60
    const ctx = this.ctx
    const { w, h } = this
    const laneY = h * VIEW.laneYFrac
    const judgeX = w * VIEW.judgeXFrac

    // —— 背景:清晨天空+紅海(已合攏,仇敵沉沒)+對岸沙灘 ——
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#7db3d9')
    sky.addColorStop(0.5, '#c9e0ea')
    sky.addColorStop(0.62, '#3d7ea6') // 海平線
    sky.addColorStop(0.72, '#2e6a92')
    sky.addColorStop(0.78, '#e8d9a8') // 沙灘
    sky.addColorStop(1, '#d9c48a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    // 晨日與光暈
    ctx.fillStyle = '#fff3c4'
    ctx.beginPath(); ctx.arc(w * 0.84, h * 0.16, 26, 0, Math.PI * 2); ctx.fill()
    const gl = ctx.createRadialGradient(w * 0.84, h * 0.16, 10, w * 0.84, h * 0.16, 130)
    gl.addColorStop(0, 'rgba(255,243,196,0.5)')
    gl.addColorStop(1, 'rgba(255,243,196,0)')
    ctx.fillStyle = gl
    ctx.fillRect(w * 0.84 - 130, h * 0.16 - 130, 260, 260)
    // 海面波光
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1.6
    for (let i = 0; i < 6; i++) {
      const wy = h * (0.64 + i * 0.024)
      ctx.beginPath()
      for (let x = 0; x <= w; x += 26) {
        const yy = wy + Math.sin(x * 0.045 + this.t * 1.8 + i) * 2.2
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }

    // —— 跳舞的眾婦女(沙灘上,歡慶越高跳越高、鼓舉越高) ——
    const joy = g.joy
    const dancers = [
      { x: 0.46, c: '#b0577a' }, { x: 0.58, c: '#7a5a9c' }, { x: 0.70, c: '#3d8e7a' }, { x: 0.82, c: '#c48a3d' },
    ]
    dancers.forEach((dcr, i) => {
      const bob = Math.abs(Math.sin(this.t * 5.4 + i * 1.3)) * joy * 16
      this._dancer(ctx, w * dcr.x, h * 0.86 - bob, dcr.c, joy, this.t * 5.4 + i * 1.3)
    })
    // 米利暗(領舞,大一號,在鼓後方)
    const mBob = Math.abs(Math.sin(this.t * 5.4)) * joy * 18
    this._miriam(ctx, w * 0.30, h * 0.88 - mBob, joy)

    // —— 音符軌道(半透明帶) ——
    ctx.fillStyle = 'rgba(30,26,20,0.30)'
    this._rr(ctx, 0, laneY - 34, w, 68, 0)
    ctx.fill()
    // 判定圈(鈴鼓外形:雙圈+鈴點)
    ctx.strokeStyle = '#fff3c4'
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(judgeX, laneY, VIEW.noteR + 8, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,243,196,0.5)'
    ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(judgeX, laneY, VIEW.noteR + 14, 0, Math.PI * 2); ctx.stroke()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + this.t * 0.6
      ctx.fillStyle = '#e8c33d'
      ctx.beginPath()
      ctx.arc(judgeX + Math.cos(a) * (VIEW.noteR + 14), laneY + Math.sin(a) * (VIEW.noteR + 14), 2.4, 0, Math.PI * 2)
      ctx.fill()
    }

    // —— 音符(右→左) ——
    const appr = g.age.approach
    for (const n of g.notes) {
      if (n.judged) continue
      const dt = n.t - g.songTime
      if (dt > appr || dt < -0.12) continue
      const x = judgeX + (dt / appr) * (w - judgeX - 30)
      this._note(ctx, x, laneY, n.type)
    }

    // —— 命中特效 ——
    for (const fx of g.effects) {
      const p = fx.age / fx.life
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = fx.perfect ? '#fff3c4' : '#ffe9a8'
      for (let r = 0; r < 7; r++) {
        const a = (r / 7) * Math.PI * 2 + p * 2.4
        const d = 10 + p * (fx.perfect ? 46 : 30)
        ctx.beginPath()
        ctx.arc(judgeX + Math.cos(a) * d, laneY + Math.sin(a) * d, 3.4 - p * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      if (fx.label) {
        ctx.font = 'bold 16px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(fx.label, judgeX, laneY - 44 - p * 20)
      }
      ctx.globalAlpha = 1
    }

    // —— 大鈴鼓(觸控區;don 拍面閃紅、ka 框閃藍) ——
    this._timbrel(ctx, g)

    // —— 字幕 + HUD ——
    this._caption(ctx, g)
    // 歡慶條(右上)
    const gw = Math.min(200, w * 0.3)
    ctx.fillStyle = 'rgba(30,26,20,0.5)'
    this._rr(ctx, w - gw - 14, VIEW.capH + 4, gw, 20, 8); ctx.fill()
    ctx.fillStyle = '#e8a33d'
    this._rr(ctx, w - gw - 12, VIEW.capH + 6, (gw - 4) * ((joy - JOY.min) / (JOY.max - JOY.min)), 16, 6); ctx.fill()
    ctx.fillStyle = '#5c4a28'
    ctx.font = 'bold 12px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText('歡慶讚美', w - 18, VIEW.capH + 38)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#3d3123'
    ctx.font = 'bold 16px system-ui'
    ctx.fillText(`🎵 ${g.score}`, 12, h - 12)
    if (g.combo >= 4) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#b04a2f'
      ctx.fillText(`${g.combo} 連擊!`, w - 12, h - 12)
    }

    if (g.state === 'intro' || g.state === 'win') this._card(ctx, g.beat, w, h)
  }

  _note(ctx, x, y, type) {
    const r = VIEW.noteR
    ctx.fillStyle = type === 'don' ? COLORS.don : COLORS.ka
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#fffdf7'
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
    if (type === 'ka') {
      // 鈴:圈上小鈴點
      ctx.fillStyle = '#fffdf7'
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, 2.2, 0, Math.PI * 2); ctx.fill()
      }
    } else {
      // 鼓面高光
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.beginPath(); ctx.arc(x - r * 0.26, y - r * 0.26, r * 0.3, 0, Math.PI * 2); ctx.fill()
    }
  }

  // 大鈴鼓:圓框+鈴片+鼓面;flash 由 game 設 lastHitType/lastHitAt
  _timbrel(ctx, g) {
    const d = this._drum()
    const flash = Math.max(0, 1 - (this.t - g.lastHitAt) * 4)
    const isDon = g.lastHitType === 'don'
    // 框(ka 閃藍)
    ctx.strokeStyle = !isDon && flash > 0 ? COLORS.kaHi : '#8a6238'
    ctx.lineWidth = 10
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.stroke()
    // 鈴片(成對小圓)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8
      ctx.fillStyle = !isDon && flash > 0 ? '#dff0ff' : '#e8c33d'
      ctx.beginPath(); ctx.arc(d.x + Math.cos(a) * d.r, d.y + Math.sin(a) * d.r, 4.5, 0, Math.PI * 2); ctx.fill()
    }
    // 鼓面(don 閃紅)
    ctx.fillStyle = isDon && flash > 0 ? COLORS.donHi : '#f2e4c4'
    ctx.beginPath(); ctx.arc(d.x, d.y, d.faceR, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#c4a24a'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(d.x, d.y, d.faceR, 0, Math.PI * 2); ctx.stroke()
    // 打擊提示
    ctx.textAlign = 'center'
    ctx.fillStyle = '#8a3d33'
    ctx.font = 'bold 13px system-ui'
    ctx.fillText('紅:拍鼓面', d.x, d.y - 4)
    ctx.font = 'bold 11px system-ui'
    ctx.fillText('F / J', d.x, d.y + 13)
    ctx.fillStyle = '#2e5f8a'
    ctx.font = 'bold 12px system-ui'
    ctx.fillText('藍:搖鈴(旁邊)　D / K', d.x, d.y + d.r + 22)
  }

  // 跳舞婦女:簡筆但有臉(眼+笑),雙手舉小鈴鼓,裙擺
  _dancer(ctx, x, y, color, joy, phase) {
    const s = Math.min(this.w, this.h) / 480
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    // 裙(隨舞擺)
    const sway = Math.sin(phase) * 4
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(-12 + sway * 0.4, 0)
    ctx.lineTo(12 + sway * 0.4, 0)
    ctx.lineTo(7, -34)
    ctx.lineTo(-7, -34)
    ctx.closePath(); ctx.fill()
    // 頭+臉
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(0, -42, 8.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath(); ctx.arc(0, -45, 8, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(-3, -43, 1.1, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(3, -43, 1.1, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.1
    ctx.beginPath(); ctx.arc(0, -40, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    // 雙臂(joy 越高舉越高)+右手小鈴鼓
    const lift = 10 + joy * 14
    ctx.strokeStyle = '#e8b88a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(-16, -30 - lift + sway); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(6, -30); ctx.lineTo(17, -30 - lift - sway); ctx.stroke()
    ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 2.4
    ctx.beginPath(); ctx.arc(19, -32 - lift - sway, 5.5, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  // 米利暗:大一號,雙手高舉大鈴鼓領舞
  _miriam(ctx, x, y, joy) {
    const s = Math.min(this.w, this.h) / 380
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.fillStyle = '#b0577a'
    ctx.beginPath()
    ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.lineTo(9, -44); ctx.lineTo(-9, -44)
    ctx.closePath(); ctx.fill()
    // 頭巾+臉
    ctx.fillStyle = '#e8b88a'
    ctx.beginPath(); ctx.arc(0, -54, 10.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#7a3d5a'
    ctx.beginPath(); ctx.arc(0, -57, 10.5, Math.PI * 0.95, Math.PI * 0.05); ctx.fill()
    ctx.fillStyle = '#2e2418'
    ctx.beginPath(); ctx.arc(-3.6, -55, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(3.6, -55, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.3
    ctx.beginPath(); ctx.arc(0, -51, 4, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke()
    // 雙手高舉大鈴鼓
    const lift = 16 + joy * 10
    ctx.strokeStyle = '#e8b88a'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-7, -40); ctx.lineTo(-13, -46 - lift); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(7, -40); ctx.lineTo(13, -46 - lift); ctx.stroke()
    ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 3.4
    ctx.beginPath(); ctx.arc(0, -54 - lift, 12, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#e8c33d'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath(); ctx.arc(Math.cos(a) * 12, -54 - lift + Math.sin(a) * 12, 2.6, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  _caption(ctx, g) {
    const line = g.captionLine
    if (!line) return
    ctx.fillStyle = 'rgba(30,26,20,0.55)'
    this._rr(ctx, this.w / 2 - Math.min(this.w * 0.46, 330), 8, Math.min(this.w * 0.92, 660), VIEW.capH - 16, 12)
    ctx.fill()
    const fs = Math.min(20, Math.max(14, this.w / 30))
    ctx.font = `bold ${fs}px system-ui`
    const chars = [...line.text]
    const lit = Math.round(line.progress * chars.length)
    let x = this.w / 2 - ctx.measureText(line.text).width / 2
    ctx.textAlign = 'left'
    chars.forEach((c, i) => {
      ctx.fillStyle = i < lit ? '#ffd75e' : 'rgba(255,255,255,0.9)'
      ctx.fillText(c, x, 38)
      x += ctx.measureText(c).width
    })
  }

  _card(ctx, beat, w, h) {
    if (!beat) return
    ctx.fillStyle = 'rgba(26,20,14,0.62)'
    ctx.fillRect(0, 0, w, h)
    const cw = Math.min(w * 0.88, 560)
    const ch = Math.min(h * 0.64, 340)
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
    const bodyFs = Math.min(16.5, cw / 25)
    ctx.font = `${bodyFs}px system-ui`
    this._wrap(ctx, beat.line, w / 2, cy + (beat.stars ? 116 : 84), cw - 60, bodyFs * 1.6)
    if (beat.ref) {
      ctx.fillStyle = '#8a6d3b'
      ctx.font = `bold ${bodyFs - 1}px system-ui`
      ctx.fillText(`— ${beat.ref}`, w / 2, cy + ch - 54)
    }
    ctx.fillStyle = '#b04a2f'
    ctx.font = `bold ${bodyFs}px system-ui`
    ctx.fillText(beat.cont || '', w / 2, cy + ch - 24)
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
}
