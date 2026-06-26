// 繪製層:只讀 game 狀態、不改狀態。邏輯座標固定 960×540,依畫布父層尺寸等比縮放置中(同甩石)。
// 美術鐵則(l6-canvas-figure-rules):王戴華麗皇冠、手臂夠長有手掌、槍握在手裡、對話用真經文。
import { WORLD, SAUL, HARP_Y, LANE, DAVID, SPEAR, SPEAR_START_Y } from './config.js'

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
  //   'angry'=嫉妒動怒(掃羅)、'nervous'=緊張(大衛閃避中:張大眼+擔憂眉+冷汗)、
  //   'calm'=平靜(intro/結算)、'ouch'=被擦到皺一下(不血腥)。
  //   cx,cy=頭中心;r=頭半徑;lookY 正=往下看、負=往上看。
  _face(ctx, cx, cy, r, mood, lookY = 0) {
    const eyeDX = r * 0.42, eyeY = cy + 1
    const wide = mood === 'nervous' // 緊張=瞪大眼
    if (mood === 'ouch') { // 緊閉的眼(兩條 ^ 線)
      ctx.strokeStyle = '#26201a'; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - eyeDX - 3, eyeY + 2); ctx.lineTo(cx - eyeDX, eyeY - 1); ctx.lineTo(cx - eyeDX + 3, eyeY + 2)
      ctx.moveTo(cx + eyeDX - 3, eyeY + 2); ctx.lineTo(cx + eyeDX, eyeY - 1); ctx.lineTo(cx + eyeDX + 3, eyeY + 2)
      ctx.stroke()
    } else {
      const ew = (wide ? 2.6 : 1.6), eh = (wide ? 3.2 : 2.2), eR = (wide ? 2.0 : 2.2)
      ctx.fillStyle = '#fbf6ec' // 眼白(緊張時更大)
      ctx.beginPath(); ctx.ellipse(cx - eyeDX, eyeY, eR + ew, eR + eh, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(cx + eyeDX, eyeY, eR + ew, eR + eh, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#26201a' // 眼珠(朝 lookY;緊張時瞳孔小一點=更瞪大)
      const pr = wide ? 1.8 : 2.2
      ctx.beginPath(); ctx.arc(cx - eyeDX, eyeY + lookY, pr, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + eyeDX, eyeY + lookY, pr, 0, Math.PI * 2); ctx.fill()
    }
    // 眉毛
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'
    ctx.beginPath()
    if (mood === 'angry') { // 內低外高(怒/嫉妒)
      ctx.moveTo(cx - eyeDX - 4, eyeY - 7); ctx.lineTo(cx - eyeDX + 4, eyeY - 3)
      ctx.moveTo(cx + eyeDX + 4, eyeY - 7); ctx.lineTo(cx + eyeDX - 4, eyeY - 3)
    } else if (mood === 'nervous') { // 內高外低(擔憂/緊張),且抬高離眼
      ctx.moveTo(cx - eyeDX - 4, eyeY - 7); ctx.lineTo(cx - eyeDX + 4, eyeY - 10)
      ctx.moveTo(cx + eyeDX + 4, eyeY - 7); ctx.lineTo(cx + eyeDX - 4, eyeY - 10)
    } else { // 平靜:平眉
      ctx.moveTo(cx - eyeDX - 4, eyeY - 6); ctx.lineTo(cx - eyeDX + 4, eyeY - 6)
      ctx.moveTo(cx + eyeDX - 4, eyeY - 6); ctx.lineTo(cx + eyeDX + 4, eyeY - 6)
    }
    ctx.stroke()
    // 冷汗(緊張)
    if (mood === 'nervous') {
      ctx.fillStyle = 'rgba(120,180,235,0.92)'
      ctx.beginPath(); ctx.ellipse(cx + r * 0.92, cy - r * 0.1, 2.4, 3.4, 0, 0, Math.PI * 2); ctx.fill()
    }
    // 嘴
    const my = cy + r * 0.5
    if (mood === 'ouch') { // 小張口
      ctx.fillStyle = '#7a3b2b'; ctx.beginPath(); ctx.ellipse(cx, my, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill()
      return
    }
    if (mood === 'nervous') { // 緊張:小小張口的扁橢圓(屏息)
      ctx.fillStyle = '#7a3b2b'; ctx.beginPath(); ctx.ellipse(cx, my + 1, 3.4, 1.8, 0, 0, Math.PI * 2); ctx.fill()
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
    // 臉:閃避中緊張地仰望掃羅(瞪大眼+冷汗);被擦到時皺一下(不血腥);intro/結算則平靜信靠
    const mood = game.david.flinch > 0 ? 'ouch' : game.state === 'dodge' ? 'nervous' : 'calm'
    this._face(ctx, x, y - 118, 15, mood, -1.4)
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
      // 紅色預警線:從出手點(launchX,上方)連到落點(targetX,大衛所在);斜射就是斜線。追蹤大衛。
      ctx.strokeStyle = `rgba(224,72,60,${a})`; ctx.lineWidth = 3; ctx.setLineDash([8, 8])
      ctx.beginPath(); ctx.moveTo(s.launchX, SPEAR_START_Y); ctx.lineTo(s.targetX, HARP_Y); ctx.stroke()
      ctx.setLineDash([])
      // 落點 ▼(在大衛當下位置)
      ctx.fillStyle = `rgba(224,72,60,${0.5 + 0.5 * k})`
      ctx.beginPath(); ctx.moveTo(s.targetX - 9, HARP_Y - 18); ctx.lineTo(s.targetX + 9, HARP_Y - 18); ctx.lineTo(s.targetX, HARP_Y - 4); ctx.closePath(); ctx.fill()
    }
  }

  // 沿行進方向(ux,uy)畫槍:tip 在 (x,y),槍身往後 len,槍頭朝行進方向。直射 uy=1。
  _spear(ctx, x, y, len, ux = 0, uy = 1) {
    const tailX = x - ux * len, tailY = y - uy * len
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke()
    // 槍頭(三角形,尖端朝行進方向 (ux,uy);px,py = 垂直方向)
    const px = -uy, py = ux
    ctx.fillStyle = '#dfe7ee'
    ctx.beginPath()
    ctx.moveTo(x + ux * 12, y + uy * 12)
    ctx.lineTo(x + px * 7 - ux * 2, y + py * 7 - uy * 2)
    ctx.lineTo(x - px * 7 - ux * 2, y - py * 7 - uy * 2)
    ctx.closePath(); ctx.fill()
  }

  _spears(ctx, game) {
    for (const s of game.spears) if (s.phase === 'fly') this._spear(ctx, s.x, s.y, SPEAR.len, s.ux, s.uy)
  }

  _stuck(ctx, game) {
    for (const s of game.stuck) { // 躲過的槍插在牆/地上(撒上 19:10),保留入射角度
      const ux = s.ux || 0, uy = s.uy || 1
      ctx.strokeStyle = '#7a4f26'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.globalAlpha = 0.85
      ctx.beginPath(); ctx.moveTo(s.x - ux * 40, s.y - uy * 40); ctx.lineTo(s.x, s.y); ctx.stroke()
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
