// 繪製層：只讀 game 狀態、不改狀態。邏輯座標固定 960×540，依畫布父層尺寸等比縮放置中。
// measure() 在每幀更新前被呼叫，存下 fit（scale/位移）供點擊換算成世界座標。
import { WORLD, GRID, ARK, PALETTE } from './config.js'
import { CONTENT } from './content.js'

const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",system-ui'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.fit = null
  }

  // 量父層尺寸 → 設定畫布像素(含 DPR)→ 存 fit（邏輯→CSS px 的縮放與置中位移）。
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
    this._title(ctx, game)
    this._ark(ctx, game)
    for (const c of game.cards) this._card(ctx, c)
    if (game.toast) this._toast(ctx, game.toast)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.h)
    sky.addColorStop(0, PALETTE.skyTop)
    sky.addColorStop(0.7, PALETTE.skyBottom)
    sky.addColorStop(0.701, PALETTE.sea)
    sky.addColorStop(1, PALETTE.seaDeep)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, WORLD.w, WORLD.h)
    // 雨絲（淡）
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    for (let i = 0; i < 26; i++) {
      const x = (i * 53) % WORLD.w
      const y = (i * 91) % 300
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18); ctx.stroke()
    }
  }

  _title(ctx, game) {
    ctx.fillStyle = PALETTE.ink
    ctx.font = `bold 22px ${EMOJI}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(CONTENT.title, GRID.x, 22)
    ctx.font = `15px ${EMOJI}`
    ctx.fillStyle = '#4a3a24'
    ctx.textAlign = 'right'
    ctx.fillText(`已上船 ${game.rooms.length} / ${game.pairs} 對`, ARK.x + ARK.w, 30)
  }

  _card(ctx, card) {
    const { x, y, w, h } = card.cell
    const cx = x + w / 2
    const cy = y + h / 2
    const cosv = Math.cos(card.flip * Math.PI) // >0 背面朝外，<0 正面朝外
    const sx = Math.max(0.02, Math.abs(cosv))
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(sx, 1)
    ctx.translate(-cx, -cy)
    if (cosv > 0) this._cardBack(ctx, x, y, w, h)
    else this._cardFront(ctx, card, x, y, w, h)
    ctx.restore()
    if (card.cardState === 'matched') this._matchedTick(ctx, x, y, w, h)
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  _cardBack(ctx, x, y, w, h) {
    this._roundRect(ctx, x, y, w, h, 12)
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, PALETTE.cardBack)
    g.addColorStop(1, PALETTE.cardBackDark)
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = PALETTE.cardEdge
    ctx.lineWidth = 3
    ctx.stroke()
    // 木板紋
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'
    ctx.lineWidth = 2
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + 8, y + (h * i) / 3); ctx.lineTo(x + w - 8, y + (h * i) / 3); ctx.stroke()
    }
    // 中央小符號
    ctx.fillStyle = 'rgba(255,247,232,0.85)'
    ctx.font = `bold ${Math.round(h * 0.34)}px ${EMOJI}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🌧', cx0(x, w), cy0(y, h))
  }

  _cardFront(ctx, card, x, y, w, h) {
    this._roundRect(ctx, x, y, w, h, 12)
    ctx.fillStyle = card.cardState === 'matched' ? '#eaffe6' : PALETTE.cardFace
    ctx.fill()
    ctx.strokeStyle = card.cardState === 'matched' ? '#5fb96b' : PALETTE.cardEdge
    ctx.lineWidth = 3
    ctx.stroke()
    // 動物 emoji
    ctx.font = `${Math.round(h * 0.42)}px ${EMOJI}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(card.emoji, cx0(x, w), y + h * 0.42)
    // 名稱
    ctx.fillStyle = PALETTE.ink
    ctx.font = `bold ${Math.round(h * 0.13)}px ${EMOJI}`
    ctx.fillText(card.name, cx0(x, w), y + h * 0.78)
    // 公母徽章（右上）
    const male = card.sex === 'm'
    const bx = x + w - 18
    const by = y + 18
    ctx.fillStyle = male ? PALETTE.male : PALETTE.female
    ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `bold 15px ${EMOJI}`
    ctx.fillText(male ? '♂' : '♀', bx, by + 1)
  }

  _matchedTick(ctx, x, y, w, h) {
    ctx.fillStyle = '#3aa64a'
    ctx.beginPath(); ctx.arc(x + 18, y + 18, 12, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 12, y + 18); ctx.lineTo(x + 16, y + 22); ctx.lineTo(x + 24, y + 13)
    ctx.stroke()
  }

  // —— 方舟（配對成功的動物住進房間）——
  _ark(ctx, game) {
    const { x, y, w, h } = ARK
    const roofH = 70
    const hullH = 86
    const hx = x + 14
    const hw = w - 28
    const hy = y + roofH
    const hh = h - roofH - hullH
    // 船身（木箱）
    this._roundRect(ctx, hx, hy, hw, hh, 10)
    const g = ctx.createLinearGradient(hx, hy, hx, hy + hh)
    g.addColorStop(0, PALETTE.arkHouse)
    g.addColorStop(1, '#a87c3f')
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = PALETTE.arkHullDark
    ctx.lineWidth = 3
    ctx.stroke()
    // 屋頂
    ctx.fillStyle = PALETTE.arkRoof
    ctx.beginPath()
    ctx.moveTo(x + 6, hy + 2)
    ctx.lineTo(x + w / 2, y + 6)
    ctx.lineTo(x + w - 6, hy + 2)
    ctx.closePath()
    ctx.fill()
    // 船底（hull）
    ctx.fillStyle = PALETTE.arkHull
    ctx.beginPath()
    ctx.moveTo(hx - 6, hy + hh)
    ctx.lineTo(hx + hw + 6, hy + hh)
    ctx.lineTo(hx + hw - 26, hy + hh + hullH - 14)
    ctx.quadraticCurveTo(x + w / 2, hy + hh + hullH + 6, hx + 26, hy + hh + hullH - 14)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = PALETTE.arkHullDark
    ctx.lineWidth = 3
    ctx.stroke()
    // 方舟標籤
    ctx.fillStyle = '#fff7e8'
    ctx.font = `bold 18px ${EMOJI}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🛕 方舟', x + w / 2, y + roofH / 2 + 14)

    // 房間格（窗）：2 欄、依對數排列；按配對順序填入
    const cols = 2
    const rows = Math.ceil(game.pairs / cols)
    const pad = 16
    const gap = 10
    const gridX = hx + pad
    const gridY = hy + 14
    const gw = hw - pad * 2
    const gh = hh - 26
    const cwd = (gw - (cols - 1) * gap) / cols
    const chd = (gh - (rows - 1) * gap) / rows
    for (let i = 0; i < game.pairs; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const rx = gridX + col * (cwd + gap)
      const ry = gridY + row * (chd + gap)
      const room = game.rooms[i]
      this._roundRect(ctx, rx, ry, cwd, chd, 8)
      ctx.fillStyle = room ? '#fff3d6' : 'rgba(60,40,20,0.32)'
      ctx.fill()
      ctx.strokeStyle = PALETTE.arkHullDark
      ctx.lineWidth = 2
      ctx.stroke()
      if (room) {
        // 一公一母並肩
        ctx.font = `${Math.round(chd * 0.5)}px ${EMOJI}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(room.emoji, rx + cwd * 0.34, ry + chd * 0.42)
        ctx.fillText(room.emoji, rx + cwd * 0.66, ry + chd * 0.42)
        // ♂♀ 小標
        ctx.font = `bold 12px ${EMOJI}`
        ctx.fillStyle = PALETTE.male
        ctx.fillText('♂', rx + cwd * 0.34, ry + chd * 0.82)
        ctx.fillStyle = PALETTE.female
        ctx.fillText('♀', rx + cwd * 0.66, ry + chd * 0.82)
      }
    }
  }

  _toast(ctx, toast) {
    const alpha = Math.min(1, toast.t / 0.5)
    ctx.globalAlpha = alpha
    ctx.font = `bold 16px ${EMOJI}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const tw = ctx.measureText(toast.text).width + 36
    const tx = GRID.x + GRID.w / 2
    const ty = WORLD.h - 24
    ctx.fillStyle = toast.kind === 'match' ? 'rgba(58,166,74,0.92)' : 'rgba(180,90,40,0.92)'
    this._roundRect(ctx, tx - tw / 2, ty - 18, tw, 34, 17)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText(toast.text, tx, ty)
    ctx.globalAlpha = 1
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(20,30,40,0.86)'
    const pad = 70
    const bx = pad
    const by = WORLD.h / 2 - 130
    const bw = WORLD.w - pad * 2
    const bh = 260
    this._roundRect(ctx, bx, by, bw, bh, 16)
    ctx.fill()
    ctx.strokeStyle = beat.kind === 'win' ? '#7bd88f' : '#bcd'
    ctx.lineWidth = 3
    this._roundRect(ctx, bx, by, bw, bh, 16)
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    let y = by + 24
    if (beat.kicker) {
      y = this._wrap(ctx, beat.kicker, WORLD.w / 2, y, bw - 80, 32, beat.kind === 'win' ? '#7bd88f' : '#ffd98a', `bold 25px ${EMOJI}`)
      y += 6
    }
    if (beat.ref) {
      ctx.fillStyle = '#ffe1a8'
      ctx.font = `bold 15px ${EMOJI}`
      ctx.textAlign = 'center'
      ctx.fillText(beat.ref, WORLD.w / 2, y)
      y += 24
    }
    if (beat.line) y = this._wrap(ctx, beat.line, WORLD.w / 2, y, bw - 80, 22, '#eef', `15px ${EMOJI}`)
    if (beat.teach) {
      y += 6
      y = this._wrap(ctx, beat.teach, WORLD.w / 2, y, bw - 80, 21, '#cfe', `italic 14px ${EMOJI}`)
    }
    ctx.fillStyle = '#9fb6c6'
    ctx.font = `13px ${EMOJI}`
    ctx.fillText(beat.cont || '點畫面繼續', WORLD.w / 2, by + bh - 26)
  }

  // 中文逐字換行（無空白），回傳結束 y。
  _wrap(ctx, text, cx, y, maxW, lh, color, font) {
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'center'
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

// 小工具：卡片中心（避免每處重算）
function cx0(x, w) { return x + w / 2 }
function cy0(y, h) { return y + h / 2 }
