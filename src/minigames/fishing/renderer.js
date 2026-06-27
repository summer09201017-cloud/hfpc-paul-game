// 繪製層:只讀狀態、不改狀態。邏輯座標 960×540,等比縮放置中(letterbox)。
import { WORLD, WATER_Y, NET } from './config.js'

const BOAT = { x: 300, y: WATER_Y }

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
    ctx.fillStyle = '#0e2230'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale)
    ctx.beginPath(); ctx.rect(0, 0, WORLD.w, WORLD.h); ctx.clip()

    this._scene(ctx, game)
    for (const f of game.fish) if (!f.caught || game.net) this._fish(ctx, f)
    this._boat(ctx)
    if (game.net) this._net(ctx, game)
    if (game.state === 'play' && game.input.down && !game.net) this._aimPreview(ctx, game)
    this._hud(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx, game) {
    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y)
    sky.addColorStop(0, '#bfe0ee'); sky.addColorStop(1, '#eaf4e6')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.w, WATER_Y)
    // 朝陽
    ctx.fillStyle = '#ffe7a8'; ctx.beginPath(); ctx.arc(820, 70, 34, 0, Math.PI * 2); ctx.fill()
    // 遠山
    ctx.fillStyle = '#cdbf9a'; ctx.beginPath(); ctx.moveTo(540, WATER_Y); ctx.lineTo(680, WATER_Y - 70); ctx.lineTo(820, WATER_Y); ctx.closePath(); ctx.fill()
    // 左岸沙地 + 耶穌站在岸邊
    ctx.fillStyle = '#d8c089'; ctx.beginPath(); ctx.moveTo(0, WATER_Y); ctx.lineTo(120, WATER_Y); ctx.lineTo(96, WATER_Y - 54); ctx.lineTo(0, WATER_Y - 40); ctx.closePath(); ctx.fill()
    this._jesus(ctx, 52, WATER_Y - 36)
    // 水
    const sea = ctx.createLinearGradient(0, WATER_Y, 0, WORLD.h)
    sea.addColorStop(0, '#3f9bc4'); sea.addColorStop(1, '#1d5b86')
    ctx.fillStyle = sea; ctx.fillRect(0, WATER_Y, WORLD.w, WORLD.h - WATER_Y)
    // 水面波紋
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2
    for (let k = 0; k < 3; k++) {
      const yy = WATER_Y + 8 + k * 7
      ctx.beginPath()
      for (let x = 0; x <= WORLD.w; x += 24) ctx.lineTo(x, yy + Math.sin((x + game.t * 60 + k * 40) / 40) * 2)
      ctx.stroke()
    }
  }

  _jesus(ctx, x, footY) {
    ctx.fillStyle = '#ece3d0'; ctx.beginPath() // 白袍
    ctx.moveTo(x - 11, footY); ctx.lineTo(x + 11, footY); ctx.lineTo(x + 7, footY - 40); ctx.lineTo(x - 7, footY - 40); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#9fb0c4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, footY - 38); ctx.lineTo(x, footY - 4); ctx.stroke() // 衣褶
    ctx.fillStyle = '#e8b887'; ctx.beginPath(); ctx.arc(x, footY - 50, 10, 0, Math.PI * 2); ctx.fill() // 頭
    ctx.fillStyle = '#6b4a2c'; ctx.beginPath(); ctx.arc(x, footY - 51, 10, Math.PI * 1.0, Math.PI * 2.05); ctx.fill() // 髮
    // 光環(柔)
    ctx.strokeStyle = 'rgba(255,231,160,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, footY - 50, 14, 0, Math.PI * 2); ctx.stroke()
    // 伸手指向水深之處
    ctx.strokeStyle = '#e8b887'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x + 6, footY - 34); ctx.lineTo(x + 26, footY - 40); ctx.stroke()
    ctx.fillStyle = '#3a2c1a'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('耶穌', x, footY + 12)
  }

  _boat(ctx) {
    const x = BOAT.x, y = BOAT.y
    // 船身(木色梯形,坐在水面)
    ctx.fillStyle = '#7a5326'; ctx.beginPath()
    ctx.moveTo(x - 74, y); ctx.lineTo(x + 74, y); ctx.lineTo(x + 52, y + 30); ctx.lineTo(x - 52, y + 30); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#5a3c1a'; ctx.lineWidth = 3; ctx.stroke()
    ctx.fillStyle = '#9a6e36'; ctx.fillRect(x - 70, y - 5, 140, 6) // 船舷
    // 彼得站船上(右側,朝水)
    const px = x + 18, footY = y - 4
    ctx.strokeStyle = '#b9542f'; ctx.lineWidth = 7; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(px, footY); ctx.lineTo(px, footY - 22); ctx.stroke() // 身
    ctx.fillStyle = '#c75a33'; ctx.beginPath() // 衣
    ctx.moveTo(px - 11, footY); ctx.lineTo(px + 11, footY); ctx.lineTo(px + 8, footY - 22); ctx.lineTo(px - 8, footY - 22); ctx.closePath(); ctx.fill()
    // 手臂(撒網的姿勢,伸向水)
    ctx.strokeStyle = '#c75a33'; ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(px - 2, footY - 18); ctx.lineTo(px + 20, footY - 26); ctx.stroke()
    ctx.fillStyle = '#e8b887'; ctx.beginPath(); ctx.arc(px + 20, footY - 26, 3.5, 0, Math.PI * 2); ctx.fill() // 手
    ctx.fillStyle = '#e8b887'; ctx.beginPath(); ctx.arc(px, footY - 30, 9, 0, Math.PI * 2); ctx.fill() // 頭
    ctx.fillStyle = '#3a2716'; ctx.beginPath(); ctx.arc(px, footY - 31, 9, Math.PI * 1.0, Math.PI * 2.05); ctx.fill() // 髮
    ctx.fillStyle = '#5a3c1a'; ctx.beginPath(); ctx.arc(px - 1, footY - 25, 4, 0.1, Math.PI - 0.1); ctx.fill() // 短鬍
    ctx.fillStyle = '#2a1c10'; ctx.beginPath(); ctx.arc(px + 3, footY - 31, 1.5, 0, Math.PI * 2); ctx.fill() // 眼
    ctx.fillStyle = '#3a2c1a'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('彼得', x, y + 42)
  }

  _fish(ctx, f) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.dir, 1)
    ctx.fillStyle = f.gold ? '#e8c24e' : '#cfd8de'
    ctx.beginPath(); ctx.ellipse(0, 0, f.r, f.r * 0.6, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(-f.r * 0.8, 0); ctx.lineTo(-f.r * 1.5, -f.r * 0.5); ctx.lineTo(-f.r * 1.5, f.r * 0.5); ctx.closePath(); ctx.fill() // 尾
    ctx.fillStyle = '#22323c'; ctx.beginPath(); ctx.arc(f.r * 0.5, -f.r * 0.12, 1.6, 0, Math.PI * 2); ctx.fill() // 眼
    ctx.restore()
  }

  _netRadius(game) {
    const n = game.net, R = game.age.netR
    if (n.phase === 'sink') return R * Math.min(1, n.t / NET.sinkMs)
    if (n.phase === 'reel') return R * Math.max(0.18, 1 - n.t / NET.reelMs)
    return R
  }

  _net(ctx, game) {
    const n = game.net, r = this._netRadius(game)
    // 收網時把網中心往船上抬
    const reelK = n.phase === 'reel' ? Math.min(1, n.t / NET.reelMs) : 0
    const cx = n.x + (BOAT.x - n.x) * reelK * 0.55
    const cy = n.y + ((BOAT.y - 6) - n.y) * reelK * 0.55
    // 繩(船 → 網)
    ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(BOAT.x + 40, BOAT.y - 26); ctx.lineTo(cx, cy - r); ctx.stroke()
    // 網圈 + 網格
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5])
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1
    for (let a = 0; a < Math.PI; a += Math.PI / 6) {
      ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke()
    }
    // 收網時把抓到的魚集中畫在網裡
    if (n.phase === 'reel') {
      const caught = game.fish.filter((f) => f.caught)
      caught.forEach((f, i) => {
        const a = (i / Math.max(1, caught.length)) * Math.PI * 2
        f.x = cx + Math.cos(a) * r * 0.5; f.y = cy + Math.sin(a) * r * 0.5
      })
    }
    // 漁獲數字飄字
    if (n.caught > 0 && (n.phase === 'hold' || n.phase === 'reel')) {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center'
      ctx.fillText(`+${n.caught}`, cx, cy - r - 10)
    }
  }

  _aimPreview(ctx, game) {
    const p = this.toWorld(game.input.cx, game.input.cy)
    const x = Math.max(30, Math.min(WORLD.w - 30, p.x))
    const y = Math.max(WATER_Y + 16, Math.min(WORLD.h - 24, p.y))
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5])
    ctx.beginPath(); ctx.arc(x, y, game.age.netR, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
  }

  _hud(ctx, game) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 20px system-ui'; ctx.fillStyle = '#0e3a52'
    ctx.fillText(`🐟 漁獲 ${game.caught}/${game.target}`, 16, 24)
    // 網次
    ctx.textAlign = 'center'; ctx.font = '18px system-ui'; ctx.fillStyle = '#0e3a52'
    let s = '網次 '; for (let i = 0; i < game.age.casts; i++) s += i < game.castsLeft ? '🕸' : '·'
    ctx.fillText(s, WORLD.w / 2, 24)
    ctx.textAlign = 'right'; ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#0e3a52'
    ctx.fillText(`${game.age.emoji} ${game.age.label}　${game.phase === 1 ? '整夜勞力' : '水深之處'}`, WORLD.w - 16, 22)
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(10,28,40,0.84)'
    const pad = 56, bx = pad, by = WORLD.h / 2 - 110, bw = WORLD.w - pad * 2, bh = 220
    ctx.fillRect(bx, by, bw, bh)
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : beat.kind === 'lose' ? '#e4a14f' : '#9cd4ea'
    ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh)
    ctx.textAlign = 'center'
    ctx.fillStyle = beat.kind === 'win' ? '#7bd88f' : '#ffe7a8'; ctx.font = 'bold 22px system-ui'
    ctx.fillText(beat.kicker || '', WORLD.w / 2, by + 36)
    let yy = by + 62
    if (beat.ref) { ctx.fillStyle = '#ffe7a8'; ctx.font = 'bold 13px system-ui'; ctx.fillText(beat.ref, WORLD.w / 2, yy); yy += 24 }
    if (beat.line) { ctx.fillStyle = '#eef'; ctx.font = '14px system-ui'; yy = this._wrap(ctx, beat.line, WORLD.w / 2, yy, bw - 80, 20) + 28 }
    if (beat.teach) { ctx.fillStyle = '#cfe'; ctx.font = 'italic 13px system-ui'; this._wrap(ctx, beat.teach, WORLD.w / 2, yy, bw - 80, 19) }
    ctx.fillStyle = '#9cd4ea'; ctx.font = '13px system-ui'
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
