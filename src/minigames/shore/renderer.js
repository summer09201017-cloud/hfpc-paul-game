// 繪製層:只讀狀態、不改狀態。邏輯座標 960×540,等比縮放置中(letterbox)。
import { WORLD, SEA_Y, ROUNDS } from './config.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this._t = { scale: 1, ox: 0, oy: 0 }
  }

  _fit() {
    const parent = this.canvas.parentElement || this.canvas
    const cw = parent.clientWidth || WORLD.w
    const ch = parent.clientHeight || WORLD.h
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (this.canvas.width !== Math.round(cw * dpr) || this.canvas.height !== Math.round(ch * dpr)) {
      this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr)
    }
    const scale = Math.min(cw / WORLD.w, ch / WORLD.h)
    const ox = (cw - WORLD.w * scale) / 2, oy = (ch - WORLD.h * scale) / 2
    this._t = { scale, ox, oy }
    return { dpr, scale, ox, oy }
  }

  toWorld(cx, cy) {
    const { scale, ox, oy } = this._t
    return { x: (cx - ox) / scale, y: (cy - oy) / scale }
  }

  draw(game) {
    const { ctx } = this
    const { dpr, scale, ox, oy } = this._fit()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#10202c'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale)
    ctx.beginPath(); ctx.rect(0, 0, WORLD.w, WORLD.h); ctx.clip()

    this._scene(ctx, game)
    this._fire(ctx, game)
    this._jesus(ctx)
    for (const s of game.sheep) this._sheep(ctx, s)
    for (const b of game.breads) { ctx.fillStyle = '#e7c98a'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 6, 4, 0, 0, Math.PI * 2); ctx.fill() }
    this._hud(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx, game) {
    // 黎明天空
    const sky = ctx.createLinearGradient(0, 0, 0, SEA_Y)
    sky.addColorStop(0, '#f6d7a8'); sky.addColorStop(1, '#fbe8cf')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.w, SEA_Y)
    // 朝陽
    ctx.fillStyle = '#ffcf7a'; ctx.beginPath(); ctx.arc(740, SEA_Y - 34, 30, 0, Math.PI * 2); ctx.fill()
    // 海
    const sea = ctx.createLinearGradient(0, SEA_Y, 0, SEA_Y + 90)
    sea.addColorStop(0, '#4f9ec0'); sea.addColorStop(1, '#3b7fa3')
    ctx.fillStyle = sea; ctx.fillRect(0, SEA_Y, WORLD.w, 90)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2
    for (let k = 0; k < 2; k++) {
      const yy = SEA_Y + 14 + k * 10
      ctx.beginPath(); for (let x = 0; x <= WORLD.w; x += 24) ctx.lineTo(x, yy + Math.sin((x + game.t * 50 + k * 30) / 38) * 2); ctx.stroke()
    }
    // 沙岸
    const sand = ctx.createLinearGradient(0, SEA_Y + 80, 0, WORLD.h)
    sand.addColorStop(0, '#e3cf9b'); sand.addColorStop(1, '#cdb478')
    ctx.fillStyle = sand; ctx.fillRect(0, SEA_Y + 80, WORLD.w, WORLD.h - SEA_Y - 80)
  }

  _fire(ctx, game) {
    const fx = 150, fy = SEA_Y + 70
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.ellipse(fx, fy + 12, 32, 9, 0, 0, Math.PI * 2); ctx.fill() // 炭
    ctx.fillStyle = '#b3400a'; ctx.beginPath(); ctx.ellipse(fx, fy + 9, 25, 6, 0, 0, Math.PI * 2); ctx.fill() // 火紅炭
    const fl = Math.sin(game.t * 9) * 3
    for (const [dx, h, c] of [[-9, 20, '#f59e0b'], [1, 30 + fl, '#fb923c'], [11, 19, '#fbbf24']]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx + dx - 7, fy + 6); ctx.quadraticCurveTo(fx + dx, fy + 6 - h, fx + dx + 7, fy + 6); ctx.closePath(); ctx.fill()
    }
    // 烤架 + 餅和魚(約21:9)
    ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 2
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(fx - 26, fy - 8 + i * 4); ctx.lineTo(fx + 26, fy - 8 + i * 4); ctx.stroke() }
    ctx.fillStyle = '#bfd0d8'; ctx.beginPath(); ctx.ellipse(fx - 12, fy - 10, 10, 4, -0.2, 0, Math.PI * 2); ctx.fill() // 魚
    ctx.fillStyle = '#e7c98a'; ctx.beginPath(); ctx.arc(fx + 12, fy - 10, 6, 0, Math.PI * 2); ctx.fill() // 餅
    ctx.fillStyle = '#7a5a2e'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('炭火・餅和魚', fx, fy + 30)
  }

  _jesus(ctx) {
    const x = 86, footY = SEA_Y + 78
    ctx.fillStyle = '#f2ece0'; ctx.beginPath() // 白袍
    ctx.moveTo(x - 12, footY); ctx.lineTo(x + 12, footY); ctx.lineTo(x + 8, footY - 46); ctx.lineTo(x - 8, footY - 46); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#c9b27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, footY - 44); ctx.lineTo(x, footY - 4); ctx.stroke() // 衣褶
    ctx.fillStyle = '#e8b887'; ctx.beginPath(); ctx.arc(x, footY - 57, 11, 0, Math.PI * 2); ctx.fill() // 頭
    ctx.fillStyle = '#6b4a2c'; ctx.beginPath(); ctx.arc(x, footY - 58, 11, Math.PI * 1.0, Math.PI * 2.05); ctx.fill() // 髮
    ctx.fillStyle = '#5a3c20'; ctx.beginPath(); ctx.arc(x, footY - 50, 5, 0.1, Math.PI - 0.1); ctx.fill() // 鬍
    ctx.strokeStyle = 'rgba(255,210,120,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, footY - 57, 15, 0, Math.PI * 2); ctx.stroke() // 光環
    // 伸手(招呼/託付)
    ctx.strokeStyle = '#e8b887'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x + 7, footY - 38); ctx.lineTo(x + 28, footY - 44); ctx.stroke()
    ctx.fillStyle = '#3a2c1a'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('復活的主', x, footY + 12)
  }

  _sheep(ctx, s) {
    const r = s.lamb ? 13 : 17
    ctx.fillStyle = s.fed ? '#ffffff' : '#efece2'
    for (const [dx, dy, rr] of [[-r * 0.5, 0, r * 0.62], [0, -r * 0.32, r * 0.7], [r * 0.5, 0, r * 0.62], [0, r * 0.22, r * 0.6]]) {
      ctx.beginPath(); ctx.arc(s.x + dx, s.y + dy, rr, 0, Math.PI * 2); ctx.fill()
    }
    ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    for (const lx of [-r * 0.45, r * 0.4]) { ctx.beginPath(); ctx.moveTo(s.x + lx, s.y + r * 0.6); ctx.lineTo(s.x + lx, s.y + r * 0.6 + 8); ctx.stroke() }
    const hx = s.x + s.dir * r * 0.92, hy = s.y - r * 0.18
    ctx.fillStyle = '#cfc6b6'; ctx.beginPath(); ctx.ellipse(hx, hy, r * 0.44, r * 0.52, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#bdb3a0'; ctx.beginPath(); ctx.ellipse(hx - s.dir * 3, hy - r * 0.3, 3.2, 2.2, 0, 0, Math.PI * 2); ctx.fill() // 耳
    ctx.fillStyle = '#2a241c'; ctx.beginPath(); ctx.arc(hx + s.dir * 2, hy, 1.7, 0, Math.PI * 2); ctx.fill() // 眼
    if (s.fed) { ctx.fillStyle = '#e05a6a'; ctx.font = '15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('❤', s.x, s.y - r - 7) }
    else { ctx.fillStyle = 'rgba(110,80,40,0.85)'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.fillText('…', s.x, s.y - r - 5) }
  }

  _hud(ctx, game) {
    const R = ROUNDS[Math.min(game.r, ROUNDS.length - 1)]
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 19px system-ui'; ctx.fillStyle = '#5a3c1a'
    ctx.fillText(`🔥 第 ${R.n}/3 次託付`, 16, 22)
    if (game.state === 'feed') {
      ctx.textAlign = 'center'; ctx.font = 'bold 18px system-ui'; ctx.fillStyle = '#5a3c1a'
      ctx.fillText(`${R.commission}　餵養 ${game.fed}/${game.sheep.length}`, WORLD.w / 2, 22)
    }
    ctx.textAlign = 'right'; ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#5a3c1a'
    ctx.fillText(`${game.age.emoji} ${game.age.label}`, WORLD.w - 16, 22)
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(20,16,10,0.84)'
    const pad = 56, bx = pad, by = WORLD.h / 2 - 110, bw = WORLD.w - pad * 2, bh = 220
    ctx.fillRect(bx, by, bw, bh)
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : beat.kind === 'reflect' ? '#ffd98a' : '#f3c177'
    ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh)
    ctx.textAlign = 'center'
    ctx.fillStyle = beat.kind === 'win' ? '#7bd88f' : '#ffe1a8'; ctx.font = 'bold 22px system-ui'
    ctx.fillText(beat.kicker || '', WORLD.w / 2, by + 36)
    let yy = by + 62
    if (beat.ref) { ctx.fillStyle = '#ffe1a8'; ctx.font = 'bold 13px system-ui'; ctx.fillText(beat.ref, WORLD.w / 2, yy); yy += 24 }
    if (beat.line) { ctx.fillStyle = '#fef'; ctx.font = '14px system-ui'; yy = this._wrap(ctx, beat.line, WORLD.w / 2, yy, bw - 80, 20) + 28 }
    if (beat.teach) { ctx.fillStyle = '#fde9c8'; ctx.font = 'italic 13px system-ui'; this._wrap(ctx, beat.teach, WORLD.w / 2, yy, bw - 80, 19) }
    ctx.fillStyle = '#f3c177'; ctx.font = '13px system-ui'
    ctx.fillText(beat.cont || '點畫面繼續', WORLD.w / 2, by + bh - 16)
  }

  _wrap(ctx, text, cx, y, maxW, lh) {
    const chars = String(text).split(''); let line = ''; let yy = y
    for (const ch of chars) {
      if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lh }
      else line += ch
    }
    if (line) ctx.fillText(line, cx, yy)
    return yy
  }
}
