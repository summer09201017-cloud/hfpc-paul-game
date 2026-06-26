// 繪製層:只讀狀態、不改狀態。邏輯座標 960×540,等比縮放置中(letterbox)。
import { WORLD, GROUND_Y, SLING, PHYS, AMMO } from './config.js'

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

  // 指標(canvas 相對 CSS px)→ 世界座標(給拖曳瞄準)
  toWorld(cx, cy) {
    const { scale, ox, oy } = this._t
    return { x: (cx - ox) / scale, y: (cy - oy) / scale }
  }

  draw(game) {
    const { ctx } = this
    const { dpr, scale, ox, oy } = this._fit()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#1b2a36'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale)
    ctx.beginPath(); ctx.rect(0, 0, WORLD.w, WORLD.h); ctx.clip()

    this._scene(ctx)
    this._blocks(ctx, game)
    this._sling(ctx, game)
    if (game.ammo) this._ammo(ctx, game.ammo)
    if (game.state === 'aim' && game.pull) this._aimPreview(ctx, game.pull)
    this._hud(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    sky.addColorStop(0, '#bfe0ef'); sky.addColorStop(1, '#eaf4d9')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.w, GROUND_Y)
    ctx.fillStyle = '#c9b178'; ctx.fillRect(0, GROUND_Y, WORLD.w, WORLD.h - GROUND_Y)
    ctx.fillStyle = '#a98f5a'; ctx.fillRect(0, GROUND_Y, WORLD.w, 6)
  }

  _sling(ctx, game) {
    const x = SLING.x, topY = SLING.y, footY = GROUND_Y
    // 木頭 Y 形支架
    ctx.strokeStyle = '#7a4a1c'; ctx.lineWidth = 8; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, footY); ctx.lineTo(x, topY + 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, topY + 14); ctx.lineTo(x - 14, topY - 8); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, topY + 14); ctx.lineTo(x + 14, topY - 8); ctx.stroke()
    // 皮筋:瞄準時拉到彈丸位置;否則鬆弛掛著
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 3
    if (game.state === 'aim' && game.pull) {
      ctx.beginPath(); ctx.moveTo(x - 14, topY - 8); ctx.lineTo(game.pull.px, game.pull.py)
      ctx.lineTo(x + 14, topY - 8); ctx.stroke()
    } else {
      ctx.beginPath(); ctx.moveTo(x - 14, topY - 8); ctx.lineTo(x + 14, topY - 8); ctx.stroke()
    }
    // 待發彈丸(瞄準中顯示在拉弓點;否則停在彈弓上)
    if (game.state === 'aim') {
      const px = game.pull ? game.pull.px : x, py = game.pull ? game.pull.py : topY - 4
      this._drawStone(ctx, px, py, AMMO.r)
    }
  }

  _aimPreview(ctx, pull) {
    // 用發射速度模擬幾步畫拋物線虛點(幫小孩瞄準)
    let vx = pull.vx * SLING.power, vy = pull.vy * SLING.power
    const sp = Math.hypot(vx, vy)
    if (sp > SLING.maxSpeed) { vx = vx / sp * SLING.maxSpeed; vy = vy / sp * SLING.maxSpeed }
    let x = SLING.x, y = SLING.y
    ctx.fillStyle = 'rgba(40,40,40,0.45)'
    for (let i = 0; i < 26; i++) {
      const dt = 1 / 30
      vy += PHYS.gravity * dt; x += vx * dt; y += vy * dt
      if (y > GROUND_Y || x > WORLD.w) break
      if (i % 2 === 0) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill() }
    }
  }

  _drawStone(ctx, x, y, r) {
    ctx.fillStyle = '#5b5550'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill()
  }

  _ammo(ctx, a) {
    if (a.trail) { ctx.fillStyle = 'rgba(90,80,70,0.2)'; for (const p of a.trail) { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill() } }
    this._drawStone(ctx, a.x, a.y, a.r)
  }

  _blocks(ctx, game) {
    for (const b of game.blocks) {
      if (b.popped) continue // 被擊飛的目標不再畫
      ctx.save()
      ctx.translate(b.x, b.y); ctx.rotate(b.angle)
      if (b.type === 'target') {
        // 目標(原型用綠色方塊 + 眼睛;耶利哥換成城垛/偶像)
        ctx.fillStyle = '#5aa84a'; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.strokeStyle = '#3c7a30'; ctx.lineWidth = 2; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, -2, 4, 0, Math.PI * 2); ctx.arc(6, -2, 4, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-6, -2, 1.8, 0, Math.PI * 2); ctx.arc(6, -2, 1.8, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.fillStyle = '#caa472'; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.strokeStyle = '#9c7b4a'; ctx.lineWidth = 2; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(-b.w / 2, 0); ctx.lineTo(b.w / 2, 0); ctx.stroke()
      }
      ctx.restore()
    }
  }

  _hud(ctx, game) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '20px system-ui'; ctx.fillStyle = '#3a2c1a'
    let s = '石頭：'; for (let i = 0; i < game.age.ammo; i++) s += i < game.ammoLeft ? '🪨' : '·'
    ctx.fillText(s, 16, 24)
    const targets = game.blocks.filter((b) => b.type === 'target')
    const down = targets.filter((b) => b.popped || Math.hypot(b.x - b.startX, b.y - b.startY) > 40 || Math.abs(b.angle) >= game.toppleAngle).length
    ctx.textAlign = 'right'; ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#5a4a2a'
    ctx.fillText(`${game.age.emoji} ${game.age.label}　目標 ${down}/${targets.length}`, WORLD.w - 16, 22)
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(20,30,40,0.82)'
    const pad = 60, bx = pad, by = WORLD.h / 2 - 90, bw = WORLD.w - pad * 2, bh = 180
    ctx.fillRect(bx, by, bw, bh)
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : beat.kind === 'lose' ? '#e4a14f' : '#bcd'
    ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh)
    ctx.textAlign = 'center'
    ctx.fillStyle = beat.kind === 'win' ? '#7bd88f' : '#ffd98a'; ctx.font = 'bold 24px system-ui'
    ctx.fillText(beat.kicker || '', WORLD.w / 2, by + 50)
    ctx.fillStyle = '#eef'; ctx.font = '15px system-ui'
    this._wrap(ctx, beat.teach || '', WORLD.w / 2, by + 88, bw - 80, 21)
    ctx.fillStyle = '#cfe'; ctx.font = '14px system-ui'
    ctx.fillText(beat.cont || '點畫面繼續', WORLD.w / 2, by + bh - 20)
  }

  _wrap(ctx, text, cx, y, maxW, lh) {
    const chars = String(text).split(''); let line = ''; let yy = y
    for (const ch of chars) {
      if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lh }
      else line += ch
    }
    if (line) ctx.fillText(line, cx, yy)
  }
}
