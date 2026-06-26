// 繪製層:只讀 game 狀態、不改狀態。邏輯座標固定 960×540,依畫布父層尺寸等比縮放置中(同甩石)。
// 美術鐵則(l6-canvas-figure-rules):王戴華麗皇冠、手臂夠長有手掌、槍握在手裡、對話用真經文。
import { WORLD, SAUL, HARP_Y, LANE, DAVID, SPEAR } from './config.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

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
    ctx.fillStyle = '#15110c'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)
    ctx.beginPath(); ctx.rect(0, 0, WORLD.w, WORLD.h); ctx.clip()

    this._scene(ctx)
    this._stuck(ctx, game)
    this._saul(ctx, game)
    if (game.state === 'dodge') this._telegraphs(ctx, game)
    this._spears(ctx, game)
    this._david(ctx, game)
    this._hud(ctx, game)
    this._toast(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx) {
    // 王宮石牆
    const wall = ctx.createLinearGradient(0, 0, 0, HARP_Y)
    wall.addColorStop(0, '#cdab74')
    wall.addColorStop(1, '#b3905a')
    ctx.fillStyle = wall
    ctx.fillRect(0, 0, WORLD.w, HARP_Y)
    // 石磚紋
    ctx.strokeStyle = 'rgba(120,92,52,0.45)'; ctx.lineWidth = 2
    for (let y = 60; y < HARP_Y; y += 56) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke() }
    for (let x = 70; x < WORLD.w; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HARP_Y); ctx.stroke() }
    // 兩側立柱
    ctx.fillStyle = '#9c7d4c'
    ctx.fillRect(28, 0, 40, HARP_Y); ctx.fillRect(WORLD.w - 68, 0, 40, HARP_Y)
    // 寶座台(掃羅在前)
    ctx.fillStyle = '#7a3b3b'
    ctx.fillRect(SAUL.x - 96, 44, 192, 150)
    ctx.fillStyle = '#8f4747'; ctx.fillRect(SAUL.x - 96, 44, 192, 18)
    ctx.fillStyle = '#e8c34a'; ctx.fillRect(SAUL.x - 96, 60, 192, 4)
    // 地板
    ctx.fillStyle = '#8a6f44'; ctx.fillRect(0, HARP_Y, WORLD.w, WORLD.h - HARP_Y)
    ctx.fillStyle = '#6f5836'; ctx.fillRect(0, HARP_Y, WORLD.w, 6)
  }

  _person(ctx, x, y, c, opts = {}) {
    // y = 腳底;畫一個簡單但比例正常的人(頭/身/兩臂有手掌/兩腿)。
    const headR = 15
    ctx.lineCap = 'round'
    // 腿
    ctx.strokeStyle = c.leg || '#5a4630'; ctx.lineWidth = 9
    ctx.beginPath(); ctx.moveTo(x - 9, y - 46); ctx.lineTo(x - 11, y); ctx.moveTo(x + 9, y - 46); ctx.lineTo(x + 11, y); ctx.stroke()
    // 身體(袍)
    ctx.fillStyle = c.body || '#b5793f'
    ctx.beginPath(); ctx.moveTo(x - 16, y - 96); ctx.lineTo(x + 16, y - 96); ctx.lineTo(x + 20, y - 44); ctx.lineTo(x - 20, y - 44); ctx.closePath(); ctx.fill()
    // 頭 + 脖子
    ctx.fillStyle = '#e9c39a'
    ctx.fillRect(x - 4, y - 104, 8, 10)
    ctx.beginPath(); ctx.arc(x, y - 118, headR, 0, Math.PI * 2); ctx.fill()
    // 頭髮/鬍(簡)
    ctx.fillStyle = c.hair || '#4a3322'
    ctx.beginPath(); ctx.arc(x, y - 122, headR, Math.PI, Math.PI * 2); ctx.fill()
    return { shoulderY: y - 92, headTop: y - 133 }
  }

  _arm(ctx, sx, sy, hx, hy, color) {
    ctx.strokeStyle = color || '#e9c39a'; ctx.lineWidth = 7; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke()
    ctx.fillStyle = '#e9c39a'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill() // 手掌
  }

  // 臉:眼睛(眼白+眼珠,眼珠可朝 lookY 方向看)+ 眉毛 + 嘴,依 mood 表情。
  //   'angry'=嫉妒動怒(掃羅)、'calm'=平靜信靠(大衛)、'ouch'=被擦到皺一下(不血腥)。
  //   cx,cy=頭中心;r=頭半徑;lookY 正=往下看、負=往上看。
  _face(ctx, cx, cy, r, mood, lookY = 0) {
    const eyeDX = r * 0.42, eyeY = cy + 1, eyeR = 2.2
    if (mood === 'ouch') { // 緊閉的眼(兩條 ^ 線)
      ctx.strokeStyle = '#26201a'; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - eyeDX - 3, eyeY + 2); ctx.lineTo(cx - eyeDX, eyeY - 1); ctx.lineTo(cx - eyeDX + 3, eyeY + 2)
      ctx.moveTo(cx + eyeDX - 3, eyeY + 2); ctx.lineTo(cx + eyeDX, eyeY - 1); ctx.lineTo(cx + eyeDX + 3, eyeY + 2)
      ctx.stroke()
    } else {
      ctx.fillStyle = '#fbf6ec' // 眼白
      ctx.beginPath(); ctx.ellipse(cx - eyeDX, eyeY, eyeR + 1.6, eyeR + 2.2, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(cx + eyeDX, eyeY, eyeR + 1.6, eyeR + 2.2, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#26201a' // 眼珠(朝 lookY)
      ctx.beginPath(); ctx.arc(cx - eyeDX, eyeY + lookY, eyeR, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + eyeDX, eyeY + lookY, eyeR, 0, Math.PI * 2); ctx.fill()
    }
    // 眉毛
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'
    ctx.beginPath()
    if (mood === 'angry') { // 內低外高(怒/嫉妒)
      ctx.moveTo(cx - eyeDX - 4, eyeY - 6); ctx.lineTo(cx - eyeDX + 4, eyeY - 2)
      ctx.moveTo(cx + eyeDX + 4, eyeY - 6); ctx.lineTo(cx + eyeDX - 4, eyeY - 2)
    } else { // 平靜:平眉
      ctx.moveTo(cx - eyeDX - 4, eyeY - 6); ctx.lineTo(cx - eyeDX + 4, eyeY - 6)
      ctx.moveTo(cx + eyeDX - 4, eyeY - 6); ctx.lineTo(cx + eyeDX + 4, eyeY - 6)
    }
    ctx.stroke()
    // 嘴
    const my = cy + r * 0.5
    if (mood === 'ouch') { // 小張口
      ctx.fillStyle = '#7a3b2b'; ctx.beginPath(); ctx.ellipse(cx, my, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill()
      return
    }
    ctx.strokeStyle = '#7a3b2b'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.beginPath()
    if (mood === 'angry') ctx.moveTo(cx - 5, my + 2), ctx.quadraticCurveTo(cx, my - 2, cx + 5, my + 2) // 下撇怒嘴(∩)
    else ctx.moveTo(cx - 5, my - 1), ctx.quadraticCurveTo(cx, my + 3, cx + 5, my - 1) // 平靜微笑(∪)
    ctx.stroke()
  }

  _saul(ctx, game) {
    const x = SAUL.x, y = SAUL.y + 70
    const winding = game.spears && game.spears.some((s) => s.phase === 'telegraph')
    const p = this._person(ctx, x, y, { body: '#6b3fa0', leg: '#4a2d70', hair: '#3a2a1c' })
    // 臉:嫉妒動怒(撒上 18:8-9),向下盯著大衛
    this._face(ctx, x, y - 118, 15, 'angry', 1.4)
    // 華麗皇冠(王)
    ctx.fillStyle = '#e8c34a'
    ctx.beginPath()
    ctx.moveTo(x - 17, y - 130)
    ctx.lineTo(x - 17, y - 142); ctx.lineTo(x - 9, y - 134); ctx.lineTo(x, y - 148)
    ctx.lineTo(x + 9, y - 134); ctx.lineTo(x + 17, y - 142); ctx.lineTo(x + 17, y - 130)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x, y - 138, 3, 0, Math.PI * 2); ctx.fill()
    // 手臂持槍:有 telegraph 在揮、有 fly 收手;否則自然下垂
    const hx = winding ? x + 40 : x + 26
    const hy = winding ? y - 118 : y - 86
    this._arm(ctx, x + 14, p.shoulderY, hx, hy, '#6b3fa0')
    if (winding) { // 手上那支待擲的槍
      ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 26); ctx.lineTo(hx + 8, hy + 22); ctx.stroke()
      ctx.fillStyle = '#cfd8e3'; ctx.beginPath()
      ctx.moveTo(hx - 6, hy - 26); ctx.lineTo(hx - 12, hy - 16); ctx.lineTo(hx - 2, hy - 16); ctx.closePath(); ctx.fill()
    }
    this._arm(ctx, x - 14, p.shoulderY, x - 24, y - 64, '#6b3fa0')
    // 名牌
    ctx.fillStyle = 'rgba(20,12,6,0.55)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('掃羅王', x, y + 18)
  }

  _david(ctx, game) {
    const x = game.david.x, y = DAVID.y + 64
    const tilt = game.david.flinch > 0 ? Math.sin(game.david.flinch * 30) * 0.12 : 0
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.translate(-x, -y)
    const p = this._person(ctx, x, y, { body: '#3a7d5a', leg: '#2c5d44', hair: '#5a3a22' })
    // 臉:平靜信靠地仰望掃羅;被擦到時皺一下(不血腥)
    this._face(ctx, x, y - 118, 15, game.david.flinch > 0 ? 'ouch' : 'calm', -1.4)
    // 抱著豎琴(lyre)在左臂
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(x - 30, y - 78, 16, -0.4, Math.PI + 0.4); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,250,230,0.8)'; ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - 30 + i * 5, y - 92); ctx.lineTo(x - 30 + i * 5, y - 66); ctx.stroke() }
    // 右手撥弦
    this._arm(ctx, x + 14, p.shoulderY, x - 18, y - 80, '#3a7d5a')
    this._arm(ctx, x - 14, p.shoulderY, x - 30, y - 80, '#3a7d5a')
    ctx.restore()
    // 移動提示(僅 dodge 開頭幾秒不另畫,保持乾淨)
    ctx.fillStyle = 'rgba(20,40,30,0.5)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('大衛', x, y + 16)
  }

  _telegraphs(ctx, game) {
    for (const s of game.spears) {
      if (s.phase !== 'telegraph') continue
      const k = Math.min(1, s.t / game.telegraphSec)
      const a = 0.25 + 0.55 * k
      ctx.strokeStyle = `rgba(224,72,60,${a})`; ctx.lineWidth = 3; ctx.setLineDash([8, 8])
      ctx.beginPath(); ctx.moveTo(s.x, SAUL.y + 30); ctx.lineTo(s.x, HARP_Y); ctx.stroke()
      ctx.setLineDash([])
      // 落點 ▼
      ctx.fillStyle = `rgba(224,72,60,${0.5 + 0.5 * k})`
      ctx.beginPath(); ctx.moveTo(s.x - 9, HARP_Y - 18); ctx.lineTo(s.x + 9, HARP_Y - 18); ctx.lineTo(s.x, HARP_Y - 4); ctx.closePath(); ctx.fill()
    }
  }

  _spear(ctx, x, y, len) {
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, y - len); ctx.lineTo(x, y); ctx.stroke()
    ctx.fillStyle = '#dfe7ee' // 槍頭(朝下)
    ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.lineTo(x + 7, y - 4); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill()
  }

  _spears(ctx, game) {
    for (const s of game.spears) if (s.phase === 'fly') this._spear(ctx, s.x, s.y, SPEAR.len)
  }

  _stuck(ctx, game) {
    for (const s of game.stuck) { // 躲過的槍插在牆/地上(撒上 19:10)
      ctx.strokeStyle = '#7a4f26'; ctx.lineWidth = 4; ctx.globalAlpha = 0.85
      ctx.beginPath(); ctx.moveTo(s.x, s.y - 40); ctx.lineTo(s.x, s.y); ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  _hud(ctx, game) {
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(20,12,6,0.6)'; ctx.fillRect(14, 12, 224, 34)
    ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 16px system-ui'
    ctx.fillText(`躲過 ${game.survivedCount} / ${game.throwsToWin} 支`, 24, 35)
    // 容錯(愛心),maxHits>=99 視為無限不顯示
    if (game.maxHits < 99) {
      const left = Math.max(0, game.maxHits - game.hits + 1)
      ctx.textAlign = 'right'; ctx.font = '18px system-ui'; ctx.fillStyle = '#ff8d8d'
      ctx.fillText('❤'.repeat(left) || '—', WORLD.w - 24, 36)
      ctx.textAlign = 'left'
    }
  }

  _toast(ctx, game) {
    if (!game.toast) return
    const a = Math.min(1, game.toast.t / 0.6)
    ctx.globalAlpha = a
    ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'
    const w = ctx.measureText(game.toast.text).width + 36
    ctx.fillStyle = game.toast.good ? 'rgba(40,120,70,0.92)' : 'rgba(190,120,40,0.92)'
    this._rr(ctx, WORLD.w / 2 - w / 2, 58, w, 38, 12); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.fillText(game.toast.text, WORLD.w / 2, 83)
    ctx.globalAlpha = 1
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

  _wrap(ctx, text, maxW) {
    const out = []
    let line = ''
    for (const ch of String(text || '')) {
      if (ch === '\n') { out.push(line); line = ''; continue }
      if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch } else line += ch
    }
    if (line) out.push(line)
    return out
  }

  _beat(ctx, beat) {
    ctx.fillStyle = 'rgba(10,8,5,0.66)'; ctx.fillRect(0, 0, WORLD.w, WORLD.h)
    const pw = 680, px = WORLD.w / 2 - pw / 2
    const lines = []
    ctx.font = '17px system-ui'
    if (beat.line) for (const l of this._wrap(ctx, '「' + beat.line + '」', pw - 64)) lines.push({ t: l, f: '17px system-ui', c: '#fff5dc' })
    ctx.font = '15px system-ui'
    if (beat.teach) for (const l of this._wrap(ctx, beat.teach, pw - 64)) lines.push({ t: l, f: '15px system-ui', c: '#d9c9a8' })
    const ph = 150 + lines.length * 24
    const py = WORLD.h / 2 - ph / 2
    ctx.fillStyle = 'rgba(28,20,12,0.96)'; this._rr(ctx, px, py, pw, ph, 18); ctx.fill()
    ctx.strokeStyle = '#b9863f'; ctx.lineWidth = 2; this._rr(ctx, px, py, pw, ph, 18); ctx.stroke()
    let y = py + 44
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffd98a'; ctx.font = 'bold 22px system-ui'; ctx.fillText(beat.kicker || '', WORLD.w / 2, y); y += 30
    if (beat.ref) { ctx.fillStyle = '#9ec5d6'; ctx.font = '14px system-ui'; ctx.fillText(beat.ref, WORLD.w / 2, y); y += 26 }
    for (const l of lines) { ctx.fillStyle = l.c; ctx.font = l.f; ctx.fillText(l.t, WORLD.w / 2, y); y += 24 }
    y += 8
    ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 15px system-ui'; ctx.fillText(beat.cont || '', WORLD.w / 2, y)
  }
}
