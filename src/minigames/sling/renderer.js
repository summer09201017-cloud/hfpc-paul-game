// 繪製層：只讀 game 狀態、不改狀態。邏輯座標固定 960×540，依畫布父層尺寸等比縮放置中。
import { WORLD, GROUND_Y, DAVID, GOLIATH, AIM } from './config.js'
import { deg2rad } from './projectile.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  // 量父層尺寸 → 設定畫布像素(含 DPR)→ 回傳邏輯→實際的縮放與置中位移。
  _fit() {
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
    return { dpr, scale, ox, oy }
  }

  draw(game) {
    const { ctx } = this
    const { dpr, scale, ox, oy } = this._fit()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 邊框外的底色（letterbox）
    ctx.fillStyle = '#1b2a36'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)
    ctx.beginPath()
    ctx.rect(0, 0, WORLD.w, WORLD.h)
    ctx.clip()

    this._scene(ctx)
    this._goliath(ctx, game)
    this._david(ctx, game)
    if (game.state === 'aim') this._aim(ctx, game)
    if (game.stone) this._stone(ctx, game)
    this._hud(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx) {
    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    sky.addColorStop(0, '#bfe0ef')
    sky.addColorStop(1, '#eaf4d9')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, WORLD.w, GROUND_Y)
    // 以拉谷地面
    ctx.fillStyle = '#c9b178'
    ctx.fillRect(0, GROUND_Y, WORLD.w, WORLD.h - GROUND_Y)
    ctx.fillStyle = '#a98f5a'
    ctx.fillRect(0, GROUND_Y, WORLD.w, 6)
    // 遠山
    ctx.fillStyle = 'rgba(150,170,150,0.5)'
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(240, 300)
    ctx.lineTo(480, GROUND_Y)
    ctx.lineTo(720, 320)
    ctx.lineTo(960, GROUND_Y)
    ctx.closePath()
    ctx.fill()
  }

  _david(ctx, game) {
    const { x, y } = DAVID
    // 身體
    ctx.fillStyle = '#7a5230'
    ctx.fillRect(x - 12, y, 24, 70)
    ctx.fillStyle = '#caa15a'
    ctx.beginPath()
    ctx.arc(x, y - 6, 16, 0, Math.PI * 2) // 頭
    ctx.fill()
    ctx.font = '22px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧒', x, y - 6)
    // 甩石的機弦：瞄準時畫一條繞動的弦＋石袋
    if (game.state === 'aim') {
      const a = deg2rad(game.aimDeg)
      const sx = x + Math.cos(a) * 30
      const sy = y - 6 - Math.sin(a) * 30
      ctx.strokeStyle = '#5a4326'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, y - 6)
      ctx.lineTo(sx, sy)
      ctx.stroke()
      ctx.fillStyle = '#444'
      ctx.beginPath()
      ctx.arc(sx, sy, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#3a2c1a'
    ctx.font = 'bold 14px system-ui'
    ctx.fillText('大衛', x, y + 86)
  }

  _goliath(ctx, game) {
    const g = GOLIATH
    const w = 70
    const bodyTop = g.topY + 40
    // 倒下（勝利）時把巨人放平
    const fallen = game.state === 'win'
    ctx.save()
    if (fallen) {
      ctx.translate(g.x, g.groundY)
      ctx.rotate(-Math.PI / 2.1)
      ctx.translate(-g.x, -g.groundY)
    }
    // 身體
    ctx.fillStyle = '#5b6b57'
    ctx.fillRect(g.x - w / 2, bodyTop, w, g.groundY - bodyTop)
    // 盔甲線
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 2
    for (let yy = bodyTop + 18; yy < g.groundY; yy += 22) {
      ctx.beginPath()
      ctx.moveTo(g.x - w / 2, yy)
      ctx.lineTo(g.x + w / 2, yy)
      ctx.stroke()
    }
    // 頭
    ctx.fillStyle = '#8a7a5a'
    ctx.beginPath()
    ctx.arc(g.x, g.topY + 20, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '30px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(fallen ? '😵' : '😠', g.x, g.topY + 20)
    ctx.restore()

    // 額頭命中區提示（瞄準時微微發亮，幫小孩知道要打哪）
    if (!fallen && (game.state === 'aim' || game.state === 'flying')) {
      const f = g.forehead
      ctx.strokeStyle = 'rgba(228,87,46,0.85)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 2
      ctx.strokeRect(f.x, f.y, f.w, f.h)
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(228,87,46,0.12)'
      ctx.fillRect(f.x, f.y, f.w, f.h)
      ctx.fillStyle = '#c0392b'
      ctx.font = 'bold 12px system-ui'
      ctx.fillText('額頭', f.x + f.w / 2, f.y - 8)
    }
    ctx.fillStyle = '#3a2c1a'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    if (!fallen) ctx.fillText('歌利亞', g.x, g.groundY + 16)
  }

  _aim(ctx, game) {
    // 虛線瞄準軌跡（淡）：幫玩家預判石子會往哪飛
    const a = deg2rad(game.aimDeg)
    ctx.strokeStyle = 'rgba(46,134,171,0.6)'
    ctx.setLineDash([6, 6])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(DAVID.x, DAVID.y - 6)
    ctx.lineTo(DAVID.x + Math.cos(a) * 120, DAVID.y - 6 - Math.sin(a) * 120)
    ctx.stroke()
    ctx.setLineDash([])
    // 角度標
    ctx.fillStyle = '#2e86ab'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round(game.aimDeg)}°`, DAVID.x + 30, DAVID.y - 40)
  }

  _stone(ctx, game) {
    if (game.trail) {
      ctx.fillStyle = 'rgba(80,80,80,0.25)'
      for (const p of game.trail) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.fillStyle = '#3a3a3a'
    ctx.beginPath()
    ctx.arc(game.stone.x, game.stone.y, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  _hud(ctx, game) {
    // 剩餘石子（● 滿 ○ 空）
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = '20px system-ui'
    let s = '石子：'
    for (let i = 0; i < game.totalStones; i++) s += i < game.stonesLeft ? '🪨' : '◻'
    ctx.fillStyle = '#3a2c1a'
    ctx.fillText(s, 16, 24)
  }

  _beat(ctx, beat) {
    // 半透明面板 + 經文 + 教導 + 繼續提示
    ctx.fillStyle = 'rgba(20,30,40,0.82)'
    const pad = 60
    const bx = pad
    const by = WORLD.h / 2 - 110
    const bw = WORLD.w - pad * 2
    ctx.fillRect(bx, by, bw, 220)
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : beat.kind === 'lose' ? '#e4a14f' : '#bcd'
    ctx.lineWidth = 3
    ctx.strokeRect(bx, by, bw, 220)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    let y = by + 22
    if (beat.kicker) {
      ctx.fillStyle = beat.kind === 'win' ? '#7bd88f' : '#ffd98a'
      ctx.font = 'bold 26px system-ui'
      ctx.fillText(beat.kicker, WORLD.w / 2, y)
      y += 38
    }
    if (beat.ref) {
      ctx.fillStyle = '#ffe1a8'
      ctx.font = 'bold 15px system-ui'
      ctx.fillText(beat.ref, WORLD.w / 2, y)
      y += 24
    }
    if (beat.line) y = this._wrap(ctx, beat.line, WORLD.w / 2, y, bw - 70, 22, '#eef', '15px system-ui')
    if (beat.teach) {
      y += 6
      y = this._wrap(ctx, beat.teach, WORLD.w / 2, y, bw - 70, 21, '#cfe', 'italic 14px system-ui')
    }
    ctx.fillStyle = '#9fb6c6'
    ctx.font = '13px system-ui'
    ctx.fillText(beat.cont || '點畫面 / 按空白鍵繼續', WORLD.w / 2, by + 220 - 24)
  }

  // 中文逐字換行（無空白），回傳結束 y。
  _wrap(ctx, text, cx, y, maxW, lh, color, font) {
    ctx.fillStyle = color
    ctx.font = font
    let line = ''
    for (const ch of text) {
      const test = line + ch
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, y)
        y += lh
        line = ch
      } else line = test
    }
    if (line) {
      ctx.fillText(line, cx, y)
      y += lh
    }
    return y
  }
}
