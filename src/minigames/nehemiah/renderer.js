// 繪製層:只讀 game 狀態、不改狀態。邏輯座標固定 960×540,依畫布父層尺寸等比縮放置中(同掃羅閃避)。
// 尼希米修牆換皮:仇敵(弓箭手)在上方放箭,工人(抹刀+建材)在下方閃避;城牆隨「躲過數」升高。
// 美術鐵則(l6-canvas-figure-rules):手臂夠長有手掌、弓握在手、表情到位、對話用真經文。
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
    this._wall(ctx, game)
    this._stuck(ctx, game)
    this._enemy(ctx, game)
    if (game.state === 'dodge') this._telegraphs(ctx, game)
    this._spears(ctx, game)
    this._builder(ctx, game)
    this._hud(ctx, game)
    this._toast(ctx, game)
    if (game.beat) this._beat(ctx, game.beat)

    ctx.restore()
  }

  _scene(ctx) {
    // 天空(白晝耶路撒冷)
    const sky = ctx.createLinearGradient(0, 0, 0, HARP_Y)
    sky.addColorStop(0, '#bcd9ef'); sky.addColorStop(1, '#e7eecb')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.w, HARP_Y)
    // 遠山(仇敵從城外的山地放箭)
    ctx.fillStyle = 'rgba(150,165,140,0.5)'
    ctx.beginPath(); ctx.moveTo(0, 244); ctx.lineTo(220, 150); ctx.lineTo(440, 244); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(520, 252); ctx.lineTo(760, 150); ctx.lineTo(960, 252); ctx.closePath(); ctx.fill()
    // 地(工地)
    ctx.fillStyle = '#9b8455'; ctx.fillRect(0, HARP_Y, WORLD.w, WORLD.h - HARP_Y)
    ctx.fillStyle = '#7e6a43'; ctx.fillRect(0, HARP_Y, WORLD.w, 5)
  }

  // 城牆隨「躲過數 / 總數」升高(進度感)。畫在底部、工人前(builder 之後畫,故工人在牆前)。
  _wall(ctx, game) {
    const prog = Math.min(1, (game.survivedCount || 0) / (game.throwsToWin || 1))
    const baseY = WORLD.h, maxH = 58, h = Math.round(maxH * prog)
    if (h <= 0) return
    const topY = baseY - h
    ctx.fillStyle = '#bda469'; ctx.fillRect(0, topY, WORLD.w, h)
    // 石塊縫(交錯砌)
    ctx.strokeStyle = 'rgba(110,90,52,0.5)'; ctx.lineWidth = 2
    const courseH = 14
    let course = 0
    for (let yy = baseY - courseH; yy > topY - courseH; yy -= courseH, course++) {
      ctx.beginPath(); ctx.moveTo(0, Math.max(topY, yy)); ctx.lineTo(WORLD.w, Math.max(topY, yy)); ctx.stroke()
      const off = (course % 2) * 40
      for (let xx = off; xx < WORLD.w; xx += 80) {
        const sy = Math.max(topY, yy)
        ctx.beginPath(); ctx.moveTo(xx, sy); ctx.lineTo(xx, sy + courseH); ctx.stroke()
      }
    }
    // 城垛(頂端鋸齒)——快完成才長出來
    if (prog > 0.82) {
      ctx.fillStyle = '#bda469'
      for (let xx = 12; xx < WORLD.w; xx += 60) ctx.fillRect(xx, topY - 10, 30, 10)
    }
  }

  _person(ctx, x, y, c) {
    const headR = 15
    ctx.lineCap = 'round'
    ctx.strokeStyle = c.leg || '#5a4630'; ctx.lineWidth = 9
    ctx.beginPath(); ctx.moveTo(x - 9, y - 46); ctx.lineTo(x - 11, y); ctx.moveTo(x + 9, y - 46); ctx.lineTo(x + 11, y); ctx.stroke()
    ctx.fillStyle = c.body || '#b5793f'
    ctx.beginPath(); ctx.moveTo(x - 16, y - 96); ctx.lineTo(x + 16, y - 96); ctx.lineTo(x + 20, y - 44); ctx.lineTo(x - 20, y - 44); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#e9c39a'
    ctx.fillRect(x - 4, y - 104, 8, 10)
    ctx.beginPath(); ctx.arc(x, y - 118, headR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = c.hair || '#4a3322'
    ctx.beginPath(); ctx.arc(x, y - 122, headR, Math.PI, Math.PI * 2); ctx.fill()
    return { shoulderY: y - 92, headTop: y - 133 }
  }

  _arm(ctx, sx, sy, hx, hy, color) {
    ctx.strokeStyle = color || '#e9c39a'; ctx.lineWidth = 7; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke()
    ctx.fillStyle = '#e9c39a'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill()
  }

  // 臉:'angry'=仇敵兇惡、'nervous'=工人緊張(瞪大眼+擔憂眉+冷汗)、'calm'、'ouch'=被擦到。
  _face(ctx, cx, cy, r, mood, lookY = 0) {
    const eyeDX = r * 0.42, eyeY = cy + 1
    const wide = mood === 'nervous'
    if (mood === 'ouch') {
      ctx.strokeStyle = '#26201a'; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - eyeDX - 3, eyeY + 2); ctx.lineTo(cx - eyeDX, eyeY - 1); ctx.lineTo(cx - eyeDX + 3, eyeY + 2)
      ctx.moveTo(cx + eyeDX - 3, eyeY + 2); ctx.lineTo(cx + eyeDX, eyeY - 1); ctx.lineTo(cx + eyeDX + 3, eyeY + 2)
      ctx.stroke()
    } else {
      const ew = (wide ? 2.6 : 1.6), eh = (wide ? 3.2 : 2.2), eR = (wide ? 2.0 : 2.2)
      ctx.fillStyle = '#fbf6ec'
      ctx.beginPath(); ctx.ellipse(cx - eyeDX, eyeY, eR + ew, eR + eh, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(cx + eyeDX, eyeY, eR + ew, eR + eh, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#26201a'
      const pr = wide ? 1.8 : 2.2
      ctx.beginPath(); ctx.arc(cx - eyeDX, eyeY + lookY, pr, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + eyeDX, eyeY + lookY, pr, 0, Math.PI * 2); ctx.fill()
    }
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'
    ctx.beginPath()
    if (mood === 'angry') {
      ctx.moveTo(cx - eyeDX - 4, eyeY - 7); ctx.lineTo(cx - eyeDX + 4, eyeY - 3)
      ctx.moveTo(cx + eyeDX + 4, eyeY - 7); ctx.lineTo(cx + eyeDX - 4, eyeY - 3)
    } else if (mood === 'nervous') {
      ctx.moveTo(cx - eyeDX - 4, eyeY - 7); ctx.lineTo(cx - eyeDX + 4, eyeY - 10)
      ctx.moveTo(cx + eyeDX + 4, eyeY - 7); ctx.lineTo(cx + eyeDX - 4, eyeY - 10)
    } else {
      ctx.moveTo(cx - eyeDX - 4, eyeY - 6); ctx.lineTo(cx - eyeDX + 4, eyeY - 6)
      ctx.moveTo(cx + eyeDX - 4, eyeY - 6); ctx.lineTo(cx + eyeDX + 4, eyeY - 6)
    }
    ctx.stroke()
    if (mood === 'nervous') {
      ctx.fillStyle = 'rgba(120,180,235,0.92)'
      ctx.beginPath(); ctx.ellipse(cx + r * 0.92, cy - r * 0.1, 2.4, 3.4, 0, 0, Math.PI * 2); ctx.fill()
    }
    const my = cy + r * 0.5
    if (mood === 'ouch') {
      ctx.fillStyle = '#7a3b2b'; ctx.beginPath(); ctx.ellipse(cx, my, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill()
      return
    }
    if (mood === 'nervous') {
      ctx.fillStyle = '#7a3b2b'; ctx.beginPath(); ctx.ellipse(cx, my + 1, 3.4, 1.8, 0, 0, Math.PI * 2); ctx.fill()
      return
    }
    ctx.strokeStyle = '#7a3b2b'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.beginPath()
    if (mood === 'angry') ctx.moveTo(cx - 5, my + 2), ctx.quadraticCurveTo(cx, my - 2, cx + 5, my + 2)
    else ctx.moveTo(cx - 5, my - 1), ctx.quadraticCurveTo(cx, my + 3, cx + 5, my - 1)
    ctx.stroke()
  }

  // 仇敵弓箭手(在上方):戴尖頂頭盔、兇惡;放箭(telegraph)時雙手張弓。
  _enemy(ctx, game) {
    const x = SAUL.x, y = SAUL.y + 70
    const winding = game.spears && game.spears.some((s) => s.phase === 'telegraph')
    const p = this._person(ctx, x, y, { body: '#7a4030', leg: '#523026', hair: '#2e231a' })
    this._face(ctx, x, y - 118, 15, 'angry', 1.4)
    // 尖頂頭盔(非皇冠)
    ctx.fillStyle = '#9aa3ad'
    ctx.beginPath(); ctx.arc(x, y - 120, 16, Math.PI, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(x, y - 150); ctx.lineTo(x - 5, y - 134); ctx.lineTo(x + 5, y - 134); ctx.closePath(); ctx.fill()
    if (winding) { // 張弓搭箭
      const bx = x + 30
      ctx.strokeStyle = '#6b4a24'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(bx, y - 92, 30, -1.1, 1.1); ctx.stroke()
      ctx.strokeStyle = 'rgba(240,240,230,0.9)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(bx + 13, y - 92 - 27); ctx.lineTo(x + 4, y - 92); ctx.lineTo(bx + 13, y - 92 + 27); ctx.stroke()
      this._arm(ctx, x + 14, p.shoulderY, bx + 8, y - 92, '#7a4030')
      this._arm(ctx, x - 14, p.shoulderY, x + 4, y - 92, '#7a4030')
    } else {
      this._arm(ctx, x + 14, p.shoulderY, x + 24, y - 64, '#7a4030')
      this._arm(ctx, x - 14, p.shoulderY, x - 24, y - 64, '#7a4030')
    }
    ctx.fillStyle = 'rgba(20,12,6,0.55)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('仇敵', x, y + 18)
  }

  // 修牆的人(在下方):右手抹刀做工、左手抱建材(一手做工一手拿兵器,尼 4:17);閃避時緊張。
  _builder(ctx, game) {
    const x = game.david.x, y = DAVID.y + 64
    const tilt = game.david.flinch > 0 ? Math.sin(game.david.flinch * 30) * 0.12 : 0
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.translate(-x, -y)
    const p = this._person(ctx, x, y, { body: '#7a6a3a', leg: '#4a3f25', hair: '#3a2a1a' })
    const mood = game.david.flinch > 0 ? 'ouch' : game.state === 'dodge' ? 'nervous' : 'calm'
    this._face(ctx, x, y - 118, 15, mood, -1.4)
    // 右手抹刀(做工)
    this._arm(ctx, x + 14, p.shoulderY, x + 26, y - 78, '#7a6a3a')
    ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(x + 26, y - 78); ctx.lineTo(x + 38, y - 86); ctx.stroke()
    ctx.fillStyle = '#cfd8e3'
    ctx.beginPath(); ctx.moveTo(x + 36, y - 82); ctx.lineTo(x + 49, y - 90); ctx.lineTo(x + 40, y - 93); ctx.closePath(); ctx.fill()
    // 左手抱建材(磚)
    this._arm(ctx, x - 14, p.shoulderY, x - 24, y - 74, '#7a6a3a')
    ctx.fillStyle = '#b9794a'; ctx.fillRect(x - 36, y - 82, 18, 12)
    ctx.strokeStyle = 'rgba(80,50,30,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x - 36, y - 82, 18, 12)
    ctx.restore()
    ctx.fillStyle = 'rgba(20,40,30,0.5)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('修牆的人', x, y + 16)
  }

  _telegraphs(ctx, game) {
    for (const s of game.spears) {
      if (s.phase !== 'telegraph') continue
      const k = Math.min(1, s.t / game.telegraphSec)
      const a = 0.25 + 0.55 * k
      ctx.strokeStyle = `rgba(224,72,60,${a})`; ctx.lineWidth = 3; ctx.setLineDash([8, 8])
      ctx.beginPath(); ctx.moveTo(s.launchX, SPEAR_START_Y); ctx.lineTo(s.targetX, HARP_Y); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = `rgba(224,72,60,${0.5 + 0.5 * k})`
      ctx.beginPath(); ctx.moveTo(s.targetX - 9, HARP_Y - 18); ctx.lineTo(s.targetX + 9, HARP_Y - 18); ctx.lineTo(s.targetX, HARP_Y - 4); ctx.closePath(); ctx.fill()
    }
  }

  // 箭:細桿 + 箭頭(朝行進方向) + 尾羽。直射 uy=1,斜射就是斜的。
  _spear(ctx, x, y, len, ux = 0, uy = 1) {
    const tailX = x - ux * len, tailY = y - uy * len
    ctx.strokeStyle = '#7a5a2b'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke()
    const px = -uy, py = ux
    ctx.fillStyle = '#cfd8e3' // 箭頭
    ctx.beginPath()
    ctx.moveTo(x + ux * 11, y + uy * 11)
    ctx.lineTo(x + px * 6 - ux * 1, y + py * 6 - uy * 1)
    ctx.lineTo(x - px * 6 - ux * 1, y - py * 6 - uy * 1)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 2 // 尾羽
    ctx.beginPath()
    ctx.moveTo(tailX, tailY); ctx.lineTo(tailX + px * 7 - ux * 8, tailY + py * 7 - uy * 8)
    ctx.moveTo(tailX, tailY); ctx.lineTo(tailX - px * 7 - ux * 8, tailY - py * 7 - uy * 8)
    ctx.stroke()
  }

  _spears(ctx, game) {
    for (const s of game.spears) if (s.phase === 'fly') this._spear(ctx, s.x, s.y, SPEAR.len, s.ux, s.uy)
  }

  _stuck(ctx, game) {
    for (const s of game.stuck) { // 躲過的箭插在地/牆上,保留入射角度
      const ux = s.ux || 0, uy = s.uy || 1
      ctx.strokeStyle = '#7a4f26'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.globalAlpha = 0.85
      ctx.beginPath(); ctx.moveTo(s.x - ux * 36, s.y - uy * 36); ctx.lineTo(s.x, s.y); ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  _hud(ctx, game) {
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(20,12,6,0.6)'; ctx.fillRect(14, 12, 224, 34)
    ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 16px system-ui'
    ctx.fillText(`城牆 ${game.survivedCount} / ${game.throwsToWin} 段`, 24, 35)
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
