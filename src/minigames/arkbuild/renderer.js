// 繪製層：只讀 game 狀態、不改狀態。邏輯座標固定 960×540，等比縮放置中。
import { WORLD, BOX, WALL_TOP, RULES, PALETTE } from './config.js'
import { CONTENT } from './content.js'

const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",system-ui'
const SEA_Y = 430 // 海平面（方舟船底浸到這裡，像浮在水上）

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.fit = null
  }

  measure() {
    const parent = this.canvas.parentElement || this.canvas
    const cw = parent.clientWidth || WORLD.w
    const ch = parent.clientHeight || WORLD.h
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (this.canvas.width !== Math.round(cw * dpr) || this.canvas.height !== Math.round(ch * dpr)) {
      this.canvas.width = Math.round(cw * dpr)
      this.canvas.height = Math.round(ch * dpr)
    }
    const scale = Math.min(cw / WORLD.w, ch / WORLD.h)
    const ox = (cw - WORLD.w * scale) / 2
    const oy = (ch - WORLD.h * scale) / 2
    this.fit = { dpr, scale, ox, oy }
    return this.fit
  }

  draw(game) {
    const { ctx } = this
    const { dpr, scale, ox, oy } = this.fit || this.measure()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#16242e'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)
    ctx.beginPath()
    ctx.rect(0, 0, WORLD.w, WORLD.h)
    ctx.clip()

    this._scene(ctx)
    // 方舟：按建造順序（陣列順序＝z 序）畫已放的木板
    for (const p of game.planks) if (p.placed) this._plank(ctx, p)
    this._sea(ctx) // 海水蓋過船底下緣，做出「浮起來」
    // ghost：下一塊要放的木板（放置中才顯示）
    if (game.state === 'placing') {
      const next = game._nextPlank()
      if (next) this._ghost(ctx, next, game.tAccum || 0)
    }
    this._hud(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.h)
    sky.addColorStop(0, PALETTE.skyTop)
    sky.addColorStop(1, PALETTE.skyBottom)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, WORLD.w, WORLD.h)
    // 遠雲
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    for (const [cx, cy, r] of [[140, 90, 30], [180, 100, 38], [820, 70, 34], [860, 86, 26]]) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
    }
  }

  _sea(ctx) {
    const g = ctx.createLinearGradient(0, SEA_Y, 0, WORLD.h)
    g.addColorStop(0, PALETTE.sea)
    g.addColorStop(1, PALETTE.seaDeep)
    ctx.fillStyle = g
    ctx.fillRect(0, SEA_Y, WORLD.w, WORLD.h - SEA_Y)
    // 波紋
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const y = SEA_Y + 14 + i * 20
      ctx.beginPath()
      for (let x = 0; x <= WORLD.w; x += 40) ctx.lineTo(x, y + (x % 80 === 0 ? 0 : 4))
      ctx.stroke()
    }
  }

  // 落板動畫：從上方 40px 滑入、淡入
  _drop(p) {
    const e = p.drop
    return { oy: -(1 - e) * 40, alpha: 0.45 + 0.55 * e }
  }

  _plank(ctx, p) {
    const { oy, alpha } = this._drop(p)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(0, oy)
    if (p.kind === 'hull') this._hull(ctx)
    else if (p.kind === 'wall') this._wall(ctx, p)
    else if (p.kind === 'door') this._door(ctx, p.rect)
    else if (p.kind === 'window') this._window(ctx, p.rect)
    else if (p.kind === 'roof') this._roof(ctx)
    ctx.restore()
  }

  _hull(ctx) {
    const yTop = BOX.wallBottom
    const yBot = BOX.wallBottom + BOX.hullH
    ctx.fillStyle = PALETTE.hull
    ctx.beginPath()
    ctx.moveTo(BOX.left - 18, yTop)
    ctx.lineTo(BOX.right + 18, yTop)
    ctx.lineTo(BOX.right - 30, yBot - 16)
    ctx.quadraticCurveTo(WORLD.w / 2, yBot + 14, BOX.left + 30, yBot - 16)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = PALETTE.hullDark
    ctx.lineWidth = 3
    ctx.stroke()
    // 龍骨板紋
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 2
    for (let i = 1; i <= 2; i++) {
      const y = yTop + (BOX.hullH * i) / 3
      ctx.beginPath(); ctx.moveTo(BOX.left - 8, y); ctx.lineTo(BOX.right + 8, y); ctx.stroke()
    }
  }

  _wall(ctx, p) {
    const r = p.rect
    ctx.fillStyle = PALETTE.deck[p.deck] || PALETTE.deck[0]
    ctx.fillRect(r.x, r.y, r.w, r.h)
    // 板間溝縫
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'
    ctx.lineWidth = 2
    ctx.strokeRect(r.x, r.y, r.w, r.h)
    // 木紋短線
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    for (let x = r.x + 40; x < r.x + r.w; x += 70) {
      ctx.beginPath(); ctx.moveTo(x, r.y + 4); ctx.lineTo(x + 24, r.y + r.h - 4); ctx.stroke()
    }
  }

  _door(ctx, r) {
    ctx.fillStyle = PALETTE.doorDark
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.strokeStyle = PALETTE.doorFrame
    ctx.lineWidth = 6
    ctx.strokeRect(r.x, r.y, r.w, r.h)
    // 門板直紋
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 2
    for (let x = r.x + r.w / 3; x < r.x + r.w; x += r.w / 3) {
      ctx.beginPath(); ctx.moveTo(x, r.y + 6); ctx.lineTo(x, r.y + r.h - 6); ctx.stroke()
    }
    // 把手
    ctx.fillStyle = '#caa45a'
    ctx.beginPath(); ctx.arc(r.x + r.w - 14, r.y + r.h / 2, 4, 0, Math.PI * 2); ctx.fill()
  }

  _window(ctx, r) {
    ctx.fillStyle = PALETTE.windowGlow
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.strokeStyle = PALETTE.windowFrame
    ctx.lineWidth = 5
    ctx.strokeRect(r.x, r.y, r.w, r.h)
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(r.x + r.w / 2, r.y); ctx.lineTo(r.x + r.w / 2, r.y + r.h); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2); ctx.stroke()
  }

  _roof(ctx) {
    ctx.fillStyle = PALETTE.roof
    ctx.beginPath()
    ctx.moveTo(BOX.left - 24, WALL_TOP + 2)
    ctx.lineTo(WORLD.w / 2, BOX.roofApexY)
    ctx.lineTo(BOX.right + 24, WALL_TOP + 2)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = PALETTE.roofDark
    ctx.lineWidth = 3
    ctx.stroke()
    // 屋脊
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 2
    for (let i = 1; i <= 3; i++) {
      const t = i / 4
      ctx.beginPath()
      ctx.moveTo(BOX.left - 24 + (WORLD.w / 2 - (BOX.left - 24)) * t, WALL_TOP + 2 - (WALL_TOP + 2 - BOX.roofApexY) * t)
      ctx.lineTo(BOX.right + 24 - (BOX.right + 24 - WORLD.w / 2) * t, WALL_TOP + 2 - (WALL_TOP + 2 - BOX.roofApexY) * t)
      ctx.stroke()
    }
  }

  _ghost(ctx, p, t) {
    const pulse = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 5))
    ctx.save()
    ctx.globalAlpha = pulse
    ctx.fillStyle = PALETTE.ghost
    ctx.strokeStyle = PALETTE.ghostEdge
    ctx.lineWidth = 3
    ctx.setLineDash([8, 6])
    if (p.kind === 'wall' || p.kind === 'door' || p.kind === 'window') {
      const r = p.rect
      ctx.fillRect(r.x, r.y, r.w, r.h)
      ctx.strokeRect(r.x, r.y, r.w, r.h)
    } else if (p.kind === 'hull') {
      const yTop = BOX.wallBottom
      const yBot = BOX.wallBottom + BOX.hullH
      ctx.beginPath()
      ctx.moveTo(BOX.left - 18, yTop)
      ctx.lineTo(BOX.right + 18, yTop)
      ctx.lineTo(BOX.right - 30, yBot - 16)
      ctx.quadraticCurveTo(WORLD.w / 2, yBot + 14, BOX.left + 30, yBot - 16)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
    } else if (p.kind === 'roof') {
      ctx.beginPath()
      ctx.moveTo(BOX.left - 24, WALL_TOP + 2)
      ctx.lineTo(WORLD.w / 2, BOX.roofApexY)
      ctx.lineTo(BOX.right + 24, WALL_TOP + 2)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
    }
    ctx.setLineDash([])
    // 提示「點這裡放木板」
    ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'
    ctx.font = `bold 15px ${EMOJI}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cy = p.kind === 'roof' ? BOX.roofApexY + 36 : p.kind === 'hull' ? BOX.wallBottom + 30 : p.rect.y + p.rect.h / 2
    ctx.fillText('👆 點一下放上去', WORLD.w / 2, cy)
    ctx.restore()
  }

  _hud(ctx, game) {
    ctx.fillStyle = PALETTE.ink
    ctx.font = `bold 22px ${EMOJI}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(CONTENT.title, 24, 20)
    // 進度 + 年數
    ctx.textAlign = 'right'
    ctx.font = `bold 16px ${EMOJI}`
    ctx.fillText(`🔨 已蓋約 ${game.years} 年`, WORLD.w - 24, 22)
    ctx.font = `14px ${EMOJI}`
    ctx.fillText(`木板 ${game.placedCount} / ${game.total}`, WORLD.w - 24, 46)
    // 進度條
    const bw = 220
    const bx = WORLD.w - 24 - bw
    const by = 68
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(bx, by, bw, 10)
    ctx.fillStyle = '#5fb96b'
    ctx.fillRect(bx, by, (bw * game.placedCount) / game.total, 10)
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(20,30,40,0.86)'
    const pad = 70
    const bx = pad
    const bw = WORLD.w - pad * 2
    const bh = 250
    const by = WORLD.h / 2 - bh / 2
    this._round(ctx, bx, by, bw, bh, 16)
    ctx.fill()
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : beat.kind === 'section' ? '#e9c46a' : '#bcd'
    ctx.lineWidth = 3
    this._round(ctx, bx, by, bw, bh, 16)
    ctx.stroke()

    let y = by + 24
    if (beat.kicker) y = this._wrap(ctx, beat.kicker, WORLD.w / 2, y, bw - 80, 32, beat.kind === 'win' ? '#7bd88f' : '#ffd98a', `bold 24px ${EMOJI}`) + 6
    if (beat.ref) {
      ctx.fillStyle = '#ffe1a8'; ctx.font = `bold 15px ${EMOJI}`; ctx.textAlign = 'center'
      ctx.fillText(beat.ref, WORLD.w / 2, y); y += 24
    }
    if (beat.line) y = this._wrap(ctx, beat.line, WORLD.w / 2, y, bw - 80, 22, '#eef', `15px ${EMOJI}`)
    if (beat.teach) { y += 6; y = this._wrap(ctx, beat.teach, WORLD.w / 2, y, bw - 80, 21, '#cfe', `italic 14px ${EMOJI}`) }
    ctx.fillStyle = '#9fb6c6'; ctx.font = `13px ${EMOJI}`; ctx.textAlign = 'center'
    ctx.fillText(beat.cont || '點畫面繼續', WORLD.w / 2, by + bh - 26)
  }

  _round(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  _wrap(ctx, text, cx, y, maxW, lh, color, font) {
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    let line = ''
    for (const ch of text) {
      const test = line + ch
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, y); y += lh; line = ch
      } else line = test
    }
    if (line) { ctx.fillText(line, cx, y); y += lh }
    return y
  }
}
