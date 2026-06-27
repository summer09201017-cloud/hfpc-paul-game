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
    sky.addColorStop(0, '#cfe3ef'); sky.addColorStop(1, '#f1e6c4') // 曠野晨光
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.w, GROUND_Y)
    // 棕櫚樹(耶利哥=棕樹城,申 34:3)
    for (const px of [300, 470]) {
      ctx.strokeStyle = '#7a5a2e'; ctx.lineWidth = 6; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(px, GROUND_Y); ctx.lineTo(px - 4, GROUND_Y - 70); ctx.stroke()
      ctx.fillStyle = '#5a8a3a'
      for (const a of [-0.9, -0.4, 0.1, 0.6, 1.1]) { ctx.beginPath(); ctx.ellipse(px - 4, GROUND_Y - 72, 30, 7, a, 0, Math.PI * 2); ctx.fill() }
    }
    ctx.fillStyle = '#cbb079'; ctx.fillRect(0, GROUND_Y, WORLD.w, WORLD.h - GROUND_Y) // 曠野沙地
    ctx.fillStyle = '#a98f5a'; ctx.fillRect(0, GROUND_Y, WORLD.w, 6)
  }

  _sling(ctx, game) {
    const x = SLING.x, topY = SLING.y, footY = GROUND_Y
    // 約書亞/祭司:吹角呼喊的人(站在左邊;向量人 + 五官表情 + 真羊角)
    const hy = topY - 6
    ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = 8; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, footY); ctx.lineTo(x, topY + 18); ctx.stroke() // 身/腿
    ctx.fillStyle = '#cd7f3a'; ctx.beginPath(); ctx.moveTo(x - 13, footY); ctx.lineTo(x + 13, footY); ctx.lineTo(x + 9, topY + 16); ctx.lineTo(x - 9, topY + 16); ctx.closePath(); ctx.fill() // 袍
    // 手臂:雙手把號角舉到嘴邊
    ctx.strokeStyle = '#cd7f3a'; ctx.lineWidth = 6; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x - 2, topY + 22); ctx.lineTo(x + 16, hy + 10); ctx.stroke()
    ctx.fillStyle = '#e8b887'; ctx.beginPath(); ctx.arc(x + 16, hy + 10, 4, 0, Math.PI * 2); ctx.fill() // 手掌
    // 頭 + 髮
    ctx.fillStyle = '#e8b887'; ctx.beginPath(); ctx.arc(x, hy, 13, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#3a2716'; ctx.beginPath(); ctx.arc(x, hy - 2, 13, Math.PI * 1.02, Math.PI * 2.05); ctx.fill() // 髮
    ctx.fillStyle = '#6b4a28'; ctx.beginPath(); ctx.arc(x - 2, hy + 9, 5, 0, Math.PI); ctx.fill() // 短鬍(下巴)
    // —— 五官(臉朝右、朝城牆)——
    // 眉毛:微微下壓(用力吹角的神情)
    ctx.strokeStyle = '#3a2716'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x + 1, hy - 7); ctx.lineTo(x + 6, hy - 5); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 8, hy - 5.5); ctx.lineTo(x + 12, hy - 7); ctx.stroke()
    // 眼睛(兩顆,看向城牆)
    ctx.fillStyle = '#2a1c10'
    ctx.beginPath(); ctx.arc(x + 4, hy - 1.5, 1.9, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 10, hy - 1.5, 1.9, 0, Math.PI * 2); ctx.fill()
    // 鼓起的腮幫子(吹氣)
    ctx.fillStyle = '#f0c79a'; ctx.beginPath(); ctx.arc(x + 7, hy + 4, 4.5, 0, Math.PI * 2); ctx.fill()
    // 張開的嘴(對著號角吹)
    ctx.fillStyle = '#7a3b2e'; ctx.beginPath(); ctx.ellipse(x + 9, hy + 6, 2.4, 3, 0, 0, Math.PI * 2); ctx.fill()
    // —— 羊角(shofar):嘴邊起、由窄漸寬、尾端外翻成喇叭口,往右上吹(明顯是號角,不是長鼻子)——
    ctx.fillStyle = '#e9d6a8'
    ctx.beginPath()
    ctx.moveTo(x + 11, hy + 6)                                 // 嘴端(窄)
    ctx.quadraticCurveTo(x + 42, hy + 8, x + 57, hy - 12)      // 下緣往上彎
    ctx.lineTo(x + 71, hy - 19)                                // 喇叭口外翻(下唇)
    ctx.lineTo(x + 63, hy - 31)                                // 喇叭口(上唇)
    ctx.quadraticCurveTo(x + 40, hy - 10, x + 12, hy - 2)      // 上緣彎回嘴端
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#b89a5e'; ctx.lineWidth = 1.5; ctx.stroke()
    // 角身紋路 + 喇叭口開孔
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x + 18, hy + 2); ctx.quadraticCurveTo(x + 42, hy + 3, x + 58, hy - 15); ctx.stroke()
    ctx.fillStyle = '#9c7b4a'; ctx.beginPath(); ctx.ellipse(x + 67, hy - 25, 4.5, 8, 0.6, 0, Math.PI * 2); ctx.fill()
    // 蓄力中:號角口冒出聲波(拉越遠越亮);待發的吶喊核心在 pull 點,否則在喇叭口
    if (game.state === 'aim') {
      const px = game.pull ? game.pull.px : x + 67, py = game.pull ? game.pull.py : hy - 25
      this._drawShout(ctx, px, py, AMMO.r)
    }
    ctx.fillStyle = '#3a2c1a'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('約書亞與百姓', x, footY + 16)
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

  // 吶喊/號角聲波:亮核心 + 兩圈同心聲波(不是石頭——城牆是神震塌的,玩家發的是順服的呼喊)
  _drawShout(ctx, x, y, r) {
    ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(255,217,138,0.85)'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(x, y, r, -0.9, 0.9); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,217,138,0.5)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(x, y, r + 6, -0.8, 0.8); ctx.stroke()
  }

  _ammo(ctx, a) {
    if (a.trail) { ctx.fillStyle = 'rgba(255,217,138,0.22)'; for (const p of a.trail) { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill() } }
    this._drawShout(ctx, a.x, a.y, a.r)
  }

  _blocks(ctx, game) {
    for (const b of game.blocks) {
      if (b.popped) continue // 被擊飛的目標不再畫
      ctx.save()
      ctx.translate(b.x, b.y); ctx.rotate(b.angle)
      if (b.type === 'target') {
        // 城垛(battlement):砂石色 + 頂部兩個垛口缺角(看就知道是城牆頂)
        ctx.fillStyle = '#c9a96a'; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.strokeStyle = '#9c7b4a'; ctx.lineWidth = 2; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.fillStyle = '#b5894f' // 垛口(頂緣挖兩個缺)
        ctx.fillRect(-b.w / 2 + 4, -b.h / 2, b.w / 4, 6)
        ctx.fillRect(b.w / 2 - 4 - b.w / 4, -b.h / 2, b.w / 4, 6)
      } else {
        // 城牆石塊:灰砂石 + 磚縫
        ctx.fillStyle = '#bfa878'; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.strokeStyle = '#8f7550'; ctx.lineWidth = 2; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 1
        for (let yy = -b.h / 2 + 12; yy < b.h / 2; yy += 14) { ctx.beginPath(); ctx.moveTo(-b.w / 2, yy); ctx.lineTo(b.w / 2, yy); ctx.stroke() }
        for (let xx = -b.w / 2 + 24; xx < b.w / 2; xx += 40) { ctx.beginPath(); ctx.moveTo(xx, -b.h / 2); ctx.lineTo(xx, b.h / 2); ctx.stroke() }
      }
      ctx.restore()
    }
  }

  _hud(ctx, game) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '20px system-ui'; ctx.fillStyle = '#3a2c1a'
    let s = '吶喊：'; for (let i = 0; i < game.age.ammo; i++) s += i < game.ammoLeft ? '🎺' : '·'
    ctx.fillText(s, 16, 24)
    // 繞城進度(書 6:15 繞城七次):⭕=已繞、◦=還沒
    ctx.textAlign = 'center'; ctx.font = 'bold 18px system-ui'; ctx.fillStyle = '#7a5a1e'
    let lap = '繞城 '; for (let i = 0; i < game.lapsToWin; i++) lap += i < game.laps ? '⭕' : '◦'
    lap += ` ${game.laps}/${game.lapsToWin}`
    ctx.fillText(lap, WORLD.w / 2, 24)
    ctx.textAlign = 'right'; ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#5a4a2a'
    ctx.fillText(`${game.age.emoji} ${game.age.label}`, WORLD.w - 16, 22)
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(20,30,40,0.82)'
    const pad = 56, bx = pad, by = WORLD.h / 2 - 110, bw = WORLD.w - pad * 2, bh = 220
    ctx.fillRect(bx, by, bw, bh)
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : beat.kind === 'lose' ? '#e4a14f' : '#bcd'
    ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh)
    ctx.textAlign = 'center'
    ctx.fillStyle = beat.kind === 'win' ? '#7bd88f' : '#ffd98a'; ctx.font = 'bold 22px system-ui'
    ctx.fillText(beat.kicker || '', WORLD.w / 2, by + 36)
    let yy = by + 60
    if (beat.ref) { ctx.fillStyle = '#ffd98a'; ctx.font = 'bold 13px system-ui'; ctx.fillText(beat.ref, WORLD.w / 2, yy); yy += 24 }
    if (beat.line) { ctx.fillStyle = '#eef'; ctx.font = '14px system-ui'; yy = this._wrap(ctx, beat.line, WORLD.w / 2, yy, bw - 80, 20) + 28 }
    if (beat.teach) { ctx.fillStyle = '#cfe'; ctx.font = 'italic 13px system-ui'; this._wrap(ctx, beat.teach, WORLD.w / 2, yy, bw - 80, 19) }
    ctx.fillStyle = '#bcd'; ctx.font = '13px system-ui'
    ctx.fillText(beat.cont || '點畫面繼續', WORLD.w / 2, by + bh - 16)
  }

  _wrap(ctx, text, cx, y, maxW, lh) {
    const chars = String(text).split(''); let line = ''; let yy = y
    for (const ch of chars) {
      if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lh }
      else line += ch
    }
    if (line) ctx.fillText(line, cx, yy)
    return yy // 回傳最後一行的 y(讓呼叫端往下接)
  }
}
