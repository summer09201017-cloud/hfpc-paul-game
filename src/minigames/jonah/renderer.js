import { VIEW, GROUND_Y, PLAYER, RUN, STORM, FARE, FISH, PREACH } from './config.js'

// 所有畫面繪製集中在這裡。背景用 Canvas 圖形畫,角色/物件用 emoji 當圖示
// (零美術檔即可運行,日後可換成真圖)。採邏輯解析度 960×540,等比縮放置中。

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.cssW = VIEW.W
    this.cssH = VIEW.H
    this.dpr = 1
  }

  resize() {
    const stage = this.canvas.parentElement
    const w = stage.clientWidth
    const h = stage.clientHeight
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.cssW = w
    this.cssH = h
    this.canvas.width = Math.floor(w * this.dpr)
    this.canvas.height = Math.floor(h * this.dpr)
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
  }

  // 設定本影格的座標系:清空 + 等比縮放 + 黑邊置中
  _begin() {
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, this.cssW, this.cssH)
    const scale = Math.min(this.cssW / VIEW.W, this.cssH / VIEW.H)
    const ox = (this.cssW - VIEW.W * scale) / 2
    const oy = (this.cssH - VIEW.H * scale) / 2
    ctx.setTransform(this.dpr * scale, 0, 0, this.dpr * scale, this.dpr * ox, this.dpr * oy)
  }

  _emoji(e, x, y, size, baseline = 'alphabetic') {
    const ctx = this.ctx
    ctx.font = `${size}px "Segoe UI Emoji","Apple Color Emoji",serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = baseline
    ctx.fillText(e, x, y)
  }

  draw(game) {
    const ctx = this.ctx
    this._begin()

    // 第二關「暴風雨」是另一個畫面
    if (game.level === 2) {
      this._drawStorm(game)
      return
    }
    // 第三關「大魚肚內」也是另一個畫面
    if (game.level === 3) {
      this._drawFish(game)
      return
    }
    // 第五關「尼尼微傳道」也是另一個畫面
    if (game.level === 5) {
      this._drawPreach(game)
      return
    }

    const dist = game.distance || 0
    const nineveh = game.level === 4

    // 背景:第一關=約帕港口(海+碼頭木板);第四關=曠野路 → 尼尼微大城(沙地)
    if (nineveh) this._bgNineveh(dist)
    else this._bgHarbor(dist)

    // 空中寶物(船價/陶罐/經卷/鴿子/愛心)
    for (const c of game.spawner.treasures) {
      const bob = Math.sin((dist + c.x) * 0.02) * 4
      this._emoji(c.emoji, c.x, c.y + bob, c.size || 30, 'middle')
    }

    // 障礙
    for (const o of game.spawner.obstacles) {
      this._emoji(o.emoji, o.x, GROUND_Y + 4, o.size)
    }

    // 小敵人(爬行時左右輕微擺動)
    for (const e of game.spawner.enemies) {
      const wob = Math.sin((dist + e.x) * 0.05) * 2
      this._emoji(e.emoji, e.x + wob, GROUND_Y + 4, e.size)
    }

    // NPC(漫步模式:碼頭長者,走近觸發聖經問答;頭上有 ❓/✅ 提示氣泡)
    for (const n of game.spawner.npcs) {
      this._emoji(n.emoji, n.x, GROUND_Y + 6, n.size)
      const bob = Math.sin((dist + n.x) * 0.04) * 3
      this._emoji(n.done ? '✅' : '❓', n.x, GROUND_Y - 66 + bob, 30, 'middle')
    }

    // 終點目標(接近終點時滑入):第一關=往他施的船 ⛵,第四關=尼尼微城門
    const goalX = game.goalPos(dist)
    if (goalX !== null) {
      if (nineveh) this._ninevehGate(goalX)
      else this._emoji('⛵', goalX, GROUND_Y + 8, 120)
    }

    // 約拿(向先知,向右奔跑;受擊無敵時閃爍)
    const p = game.player
    const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0
    if (!blink) {
      // 步伐相位綁定移動距離:跑越快、步頻越快。
      // 停下時 speed≈0 → phase 設 0,呈自然站立姿勢;往後退(speed<0)時面向左。
      const moving = Math.abs(game.speed) > 1
      const phase = moving ? dist * 0.05 : 0
      this._prophet(p.x, p.y, phase, !p.onGround, game.speed < -1)
    }

    // HUD
    this._hud(game)
  }

  // 第一關背景:約帕港口(藍天 + 遠景泥磚城 + 海 + 碼頭木板)
  _bgHarbor(dist) {
    const ctx = this.ctx
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    sky.addColorStop(0, '#8fd3ff')
    sky.addColorStop(0.6, '#cfeeff')
    sky.addColorStop(1, '#e9f7ff')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    this._buildings(dist * 0.25) // 遠景建築(視差,捲動較慢)

    // 海
    ctx.fillStyle = '#3a86c8'
    ctx.fillRect(0, GROUND_Y - 8, VIEW.W, VIEW.H - (GROUND_Y - 8))
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 3
    for (let i = 0; i < 3; i++) {
      const yy = GROUND_Y + 20 + i * 26
      ctx.beginPath()
      for (let x = 0; x <= VIEW.W; x += 20) {
        const off = Math.sin((x + dist * 0.5 + i * 40) * 0.03) * 4
        if (x === 0) ctx.moveTo(x, yy + off)
        else ctx.lineTo(x, yy + off)
      }
      ctx.stroke()
    }

    // 碼頭木板(地面)
    ctx.fillStyle = '#b07a43'
    ctx.fillRect(0, GROUND_Y, VIEW.W, 18)
    ctx.fillStyle = '#8a5e30'
    const plankW = 56
    const shift = -(dist % plankW)
    for (let x = shift; x < VIEW.W; x += plankW) {
      ctx.fillRect(x, GROUND_Y, 3, 18)
    }
  }

  // 第四關背景:曠野路 → 尼尼微大城(暖色晨光天空 + 遠方沙丘 + 遠景城 + 沙地土路)
  _bgNineveh(dist) {
    const ctx = this.ctx
    // 晨光天空(順服神的新一天)
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    sky.addColorStop(0, '#f5b96a')
    sky.addColorStop(0.5, '#fbdca6')
    sky.addColorStop(1, '#fcefd3')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    // 低空暖陽 + 光暈
    const sunX = VIEW.W * 0.78
    const sunY = VIEW.H * 0.26
    const halo = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 120)
    halo.addColorStop(0, 'rgba(255,243,210,0.95)')
    halo.addColorStop(1, 'rgba(255,243,210,0)')
    ctx.fillStyle = halo
    ctx.fillRect(sunX - 120, sunY - 120, 240, 240)
    ctx.fillStyle = 'rgba(255,250,235,0.95)'
    ctx.beginPath()
    ctx.arc(sunX, sunY, 26, 0, Math.PI * 2)
    ctx.fill()

    // 遠方沙丘(視差,最慢)
    const duneBase = GROUND_Y - 6
    const doff = dist * 0.12
    ctx.fillStyle = '#e8cf98'
    ctx.beginPath()
    ctx.moveTo(0, duneBase)
    for (let x = 0; x <= VIEW.W; x += 24) {
      const y = duneBase - 24 - Math.sin((x + doff) * 0.006) * 22 - Math.sin((x + doff) * 0.013 + 1) * 9
      ctx.lineTo(x, y)
    }
    ctx.lineTo(VIEW.W, duneBase)
    ctx.closePath()
    ctx.fill()

    // 遠景泥磚城(重用第一關城屋,作沿途聚落與遠處的尼尼微)
    this._buildings(dist * 0.25)

    // 沙地(地面)
    const sand = ctx.createLinearGradient(0, GROUND_Y - 6, 0, VIEW.H)
    sand.addColorStop(0, '#dcc081')
    sand.addColorStop(1, '#c8a766')
    ctx.fillStyle = sand
    ctx.fillRect(0, GROUND_Y - 6, VIEW.W, VIEW.H - (GROUND_Y - 6))

    // 土路 + 隨前進往左捲動的小石子刻痕(製造前進感)
    ctx.fillStyle = '#b6925a'
    ctx.fillRect(0, GROUND_Y, VIEW.W, 16)
    ctx.fillStyle = 'rgba(120,92,52,0.55)'
    const tick = 64
    const tshift = -(dist % tick)
    for (let x = tshift; x < VIEW.W; x += tick) {
      ctx.fillRect(x, GROUND_Y + 6, 14, 3)
    }
  }

  // 尼尼微大城城門:兩座泥磚塔樓 + 中央拱門 + 城垛(用第一關城屋的泥磚色,讀作「極大的城」)
  _ninevehGate(x) {
    const ctx = this.ctx
    const base = GROUND_Y + 8
    const WALL = '#cdb892'
    const SHADE = 'rgba(95,70,40,0.20)'
    const DARK = 'rgba(60,42,22,0.85)'
    const towerH = 150
    const towerW = 40
    const gap = 56 // 中央門洞寬
    const top = base - towerH

    // 左右塔樓
    for (const side of [-1, 1]) {
      const tx = x + side * (gap / 2 + towerW / 2) - towerW / 2
      ctx.fillStyle = WALL
      ctx.fillRect(tx, top, towerW, towerH)
      ctx.fillStyle = SHADE
      ctx.fillRect(tx + towerW * 0.62, top, towerW * 0.38, towerH)
      // 塔頂城垛(鋸齒)
      ctx.fillStyle = WALL
      for (let k = 0; k < 3; k++) ctx.fillRect(tx + k * (towerW / 3), top - 10, towerW / 3 - 3, 10)
      // 高窗
      ctx.fillStyle = DARK
      ctx.fillRect(tx + towerW / 2 - 4, top + 28, 8, 14)
    }

    // 中央門楣(連接兩塔)
    const lintelY = top + 40
    ctx.fillStyle = WALL
    ctx.fillRect(x - gap / 2 - 2, lintelY, gap + 4, base - lintelY)
    ctx.fillStyle = SHADE
    ctx.fillRect(x - gap / 2 - 2, lintelY, gap + 4, 6)

    // 拱形門洞(暗)
    const doorTop = lintelY + 20
    ctx.fillStyle = DARK
    ctx.fillRect(x - gap / 2 + 6, doorTop, gap - 12, base - doorTop)
    ctx.beginPath()
    ctx.arc(x, doorTop, (gap - 12) / 2, Math.PI, 2 * Math.PI)
    ctx.fill()
  }

  // 第二關「暴風雨」畫面:暗色天空、雨、起伏的海、隨傾角搖晃的船、閃電,以及撐住/危險條。
  _drawStorm(game) {
    const ctx = this.ctx
    const s = game.storm
    const t = s.time

    // 暗色暴風天空
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    sky.addColorStop(0, '#1b2733')
    sky.addColorStop(0.6, '#33414f')
    sky.addColorStop(1, '#44535f')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    // 雨
    ctx.strokeStyle = 'rgba(185,205,225,0.35)'
    ctx.lineWidth = 2
    for (let i = 0; i < 70; i++) {
      const x = ((i * 137 + t * 640) % (VIEW.W + 40)) - 20
      const y = ((i * 89 + t * 920) % (VIEW.H + 40)) - 20
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 6, y + 16)
      ctx.stroke()
    }

    // 海(深色、起伏的浪)
    const seaY = GROUND_Y - 40
    ctx.fillStyle = '#23506e'
    ctx.fillRect(0, seaY, VIEW.W, VIEW.H - seaY)
    ctx.strokeStyle = 'rgba(220,235,245,0.5)'
    ctx.lineWidth = 3
    for (let k = 0; k < 4; k++) {
      const yy = seaY + 18 + k * 30
      ctx.beginPath()
      for (let x = 0; x <= VIEW.W; x += 16) {
        const off = Math.sin(x * 0.02 + t * 3 + k) * 10
        if (x === 0) ctx.moveTo(x, yy + off)
        else ctx.lineTo(x, yy + off)
      }
      ctx.stroke()
    }

    // 船(以海面中央為軸,隨浪上下 + 依傾角旋轉)
    const cx = VIEW.W / 2
    const cy = seaY + 6 + Math.sin(t * 2) * 6
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(s.tilt)
    // 船身
    ctx.fillStyle = '#7a4a22'
    ctx.beginPath()
    ctx.moveTo(-122, 0)
    ctx.lineTo(122, 0)
    ctx.lineTo(86, 56)
    ctx.lineTo(-86, 56)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#5e3717'
    ctx.fillRect(-122, -9, 244, 11) // 甲板邊
    // 桅杆 + 帆
    ctx.fillStyle = '#5e3717'
    ctx.fillRect(-4, -122, 8, 122)
    ctx.fillStyle = '#e8e2d0'
    ctx.beginPath()
    ctx.moveTo(4, -116)
    ctx.quadraticCurveTo(74, -82, 8, -30)
    ctx.closePath()
    ctx.fill()
    // 船員 + 約拿
    this._emoji('🧎', -64, -6, 36)
    this._emoji('🙏', 66, -4, 34, 'alphabetic')
    this._prophet(0, 2, t * 0.05, false) // 約拿站中間
    ctx.restore()

    // 閃電白光
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.4})`
      ctx.fillRect(0, 0, VIEW.W, VIEW.H)
    }

    // 撐過風暴進度條
    const barW = 380
    const barH = 16
    const bx = (VIEW.W - barW) / 2
    const by = 26
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    roundRect(ctx, bx, by, barW, barH, 8)
    ctx.fill()
    const prog = Math.min(1, s.survival / STORM.duration)
    ctx.fillStyle = '#7ec8ff'
    roundRect(ctx, bx, by, barW * prog, barH, 8)
    ctx.fill()
    ctx.fillStyle = '#eaf4ff'
    ctx.font = '600 16px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textBaseline = 'bottom'
    ctx.textAlign = 'center'
    ctx.fillText('撐過風暴', VIEW.W / 2, by - 4)

    // 翻船危險條
    if (s.capsize > 0.02) {
      const dw = 300
      const dh = 14
      const dxb = (VIEW.W - dw) / 2
      const dyb = VIEW.H - 58
      ctx.fillStyle = 'rgba(0,0,0,0.32)'
      roundRect(ctx, dxb, dyb, dw, dh, 7)
      ctx.fill()
      ctx.fillStyle = '#e05a4a'
      roundRect(ctx, dxb, dyb, dw * s.capsize, dh, 7)
      ctx.fill()
      if (s.capsize > 0.5) {
        ctx.fillStyle = '#ffd2cc'
        ctx.font = '700 15px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText('⚠ 快翻船了!', VIEW.W / 2, dyb - 3)
      }
    }

    // 動態方向提示:大箭頭指出「現在該往哪邊施力」;翻船值高時轉紅、脈動加快
    const dir = s.suggestDir ? s.suggestDir() : 0
    if (dir !== 0) {
      const urgent = s.capsize > 0.4
      const pulse = 0.4 + 0.4 * Math.abs(Math.sin(t * (urgent ? 9 : 5)))
      const ax = dir < 0 ? 96 : VIEW.W - 96
      const ay = VIEW.H * 0.46
      ctx.save()
      ctx.globalAlpha = pulse
      ctx.fillStyle = urgent ? '#ff7a6a' : '#cfe7ff'
      ctx.translate(ax, ay)
      ctx.scale(dir, 1) // dir=-1 時水平翻轉成左箭頭
      ctx.beginPath() // 粗胖的右向箭頭(柄 + 三角頭)
      ctx.moveTo(-34, -16)
      ctx.lineTo(6, -16)
      ctx.lineTo(6, -32)
      ctx.lineTo(42, 0)
      ctx.lineTo(6, 32)
      ctx.lineTo(6, 16)
      ctx.lineTo(-34, 16)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // 操作提示(常駐文字)
    ctx.fillStyle = 'rgba(235,244,255,0.85)'
    ctx.font = '600 18px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText('順著亮起的箭頭按 ← → (或點畫面左右兩側) 扶正船身', VIEW.W / 2, VIEW.H - 14)
  }

  // 第三關「大魚肚內」畫面:漆黑的魚腹(肋骨、水、氣泡、禱告的約拿),
  // 每點亮一盞燈就漸漸變亮。背景動畫(氣泡)用 renderer 自己的時間計數。
  _drawFish(game) {
    const ctx = this.ctx
    const f = game.fish || { lit: 0, total: 1, dist: 0, idx: 0, phase: 'intro' }
    this._fishT = (this._fishT || 0) + 1 / 60
    const t = this._fishT
    const total = f.total || 1
    const bright = Math.min(1, (f.lit || 0) / total)
    const lerp = (a, b, k) => a + (b - a) * k
    const scroll = (f.idx || 0) * FISH.segment + (f.dist || 0) // 累計前進,用於視差

    // 魚腹內壁(暗紅,隨點燈漸暖亮)
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    g.addColorStop(0, `rgb(${lerp(46, 130, bright) | 0},${lerp(20, 46, bright) | 0},${lerp(28, 44, bright) | 0})`)
    g.addColorStop(1, `rgb(${lerp(20, 78, bright) | 0},${lerp(9, 26, bright) | 0},${lerp(15, 28, bright) | 0})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    // 肋骨(隨前進往左捲動,像穿過魚的胸腔)
    ctx.strokeStyle = `rgba(255,205,185,${0.12 + 0.22 * bright})`
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    const ribGap = 175
    const off = scroll * 0.5 - Math.floor((scroll * 0.5) / ribGap) * ribGap
    for (let i = -1; i <= Math.ceil(VIEW.W / ribGap) + 1; i++) {
      const x = i * ribGap - off
      ctx.beginPath()
      ctx.moveTo(x, VIEW.H)
      ctx.quadraticCurveTo(x - 46, VIEW.H * 0.26, x + 8, -20)
      ctx.stroke()
    }

    const footY = GROUND_Y

    // 魚腹底(走道)
    ctx.fillStyle = 'rgba(58,28,32,0.62)'
    ctx.fillRect(0, footY, VIEW.W, VIEW.H - footY)
    ctx.strokeStyle = 'rgba(190,150,150,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, footY)
    ctx.lineTo(VIEW.W, footY)
    ctx.stroke()

    // 上升的氣泡
    ctx.fillStyle = 'rgba(200,225,235,0.25)'
    for (let i = 0; i < 16; i++) {
      const bx = (i * 127 + Math.sin(i + t) * 16) % VIEW.W
      const by = VIEW.H - ((t * (28 + (i % 5) * 7) + i * 80) % VIEW.H)
      ctx.beginPath()
      ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }

    const jx = PLAYER.x
    const p = game.player

    // 懸吊的骨頭(站著過不去,要蹲下鑽過);出現在這一段中間
    const boneDist = FISH.segment * FISH.boneAt
    const boneX = jx + (boneDist - (f.dist || 0))
    if ((f.phase === 'walk' || f.phase === 'pray') && boneX > -50 && boneX < VIEW.W + 50) {
      ctx.strokeStyle = 'rgba(235,225,210,0.45)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(boneX, 0)
      ctx.lineTo(boneX, footY - 52)
      ctx.stroke()
      this._emoji('🦴', boneX, footY - 70, 48, 'middle')
    }

    // 禱告蠟燭:懸在空中;走到底時就在約拿頭頂——要跳起來碰到它才能禱告
    const candleX = f.phase === 'walk' ? jx + Math.max(0, FISH.segment - (f.dist || 0)) : jx
    const candleY = FISH.candleY
    const halo = ctx.createRadialGradient(candleX, candleY, 3, candleX, candleY, 62)
    halo.addColorStop(0, 'rgba(255,224,150,0.78)')
    halo.addColorStop(1, 'rgba(255,224,150,0)')
    ctx.fillStyle = halo
    ctx.fillRect(candleX - 62, candleY - 62, 124, 124)
    this._emoji('🕯️', candleX, candleY, 40, 'middle')

    // 約拿:用 Player 的 y(跳躍)與蹲下姿勢
    const py = p ? p.y : footY
    const airborne = p ? !p.onGround : false
    const crouching = p ? p.crouching : false
    const moving = f.phase === 'walk' && f.moving && !airborne
    this._prophet(jx, py, moving ? scroll * 0.05 : 0, airborne, false, crouching)

    // 頂端:已點亮的禱告之光(進度)
    for (let i = 0; i < total; i++) {
      const lx = VIEW.W / 2 + (i - (total - 1) / 2) * 70
      if (i < (f.lit || 0)) {
        this._emoji('🔥', lx, 54, 32, 'middle')
      } else {
        ctx.globalAlpha = 0.4
        this._emoji('🕯️', lx, 54, 26, 'middle')
        ctx.globalAlpha = 1
      }
    }

    // 底部提示 / 進度
    ctx.fillStyle = 'rgba(245,235,220,0.85)'
    ctx.font = '600 18px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    if (f.phase === 'walk') {
      ctx.fillText(
        '→/右側 走　↑/空白/輕點 跳起來碰蠟燭　↓/左側 蹲下鑽過骨頭',
        VIEW.W / 2,
        VIEW.H - 12
      )
    } else {
      ctx.fillText(`禱告之光  ${f.lit || 0} / ${total}`, VIEW.W / 2, VIEW.H - 12)
    }
  }

  // 第五關「尼尼微傳道」畫面:大城街道(白日天空 + 兩層泥磚城屋顯出「極大的城」+ 石板路),
  // 往前走、走到居民面前停下對話;頂端顯示「悔改」進度(🙇)。
  _drawPreach(game) {
    const ctx = this.ctx
    const f = game.preach || { repented: 0, total: 1, dist: 0, idx: 0, phase: 'intro' }
    const total = f.total || 1
    const scroll = (f.idx || 0) * PREACH.segment + (f.dist || 0) // 累計前進,用於視差

    // 白日的大城天空
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    sky.addColorStop(0, '#9fd0e8')
    sky.addColorStop(0.6, '#e9e2c8')
    sky.addColorStop(1, '#f4ecd6')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    // 兩層城屋(遠慢近快;近層加偏移讓兩層長相不同)——「尼尼微是極大的城」(拿 3:3)
    this._buildings(scroll * 0.18)
    this._buildings(scroll * 0.45 + 4000)

    // 石板街道
    ctx.fillStyle = '#c9b48a'
    ctx.fillRect(0, GROUND_Y - 6, VIEW.W, VIEW.H - (GROUND_Y - 6))
    ctx.fillStyle = '#b09a6e'
    ctx.fillRect(0, GROUND_Y, VIEW.W, 16)
    ctx.fillStyle = 'rgba(95,75,45,0.5)'
    const slab = 72
    const shift = -(scroll % slab)
    for (let x = shift; x < VIEW.W; x += slab) ctx.fillRect(x, GROUND_Y, 3, 16)

    const jx = PLAYER.x
    const p = game.player

    // 這一站的居民:站在這段路的盡頭,走近就會開始對話;未悔改頭上有 💬,悔改後變 🙇
    const st = (f.stations && f.stations[f.idx]) || null
    if (st && f.phase !== 'done') {
      const nx = f.phase === 'walk' ? jx + Math.max(0, PREACH.segment - (f.dist || 0)) : jx + 64
      if (nx < VIEW.W + 60) {
        const repentedHere = (f.repented || 0) > f.idx
        this._emoji(repentedHere ? '🙇' : st.emoji, nx, GROUND_Y + 6, 56)
        if (!repentedHere) {
          const bob = Math.sin((scroll + nx) * 0.04) * 3
          this._emoji('💬', nx, GROUND_Y - 70 + bob, 30, 'middle')
        }
      }
    }

    // 約拿
    const py = p ? p.y : GROUND_Y
    const airborne = p ? !p.onGround : false
    const moving = f.phase === 'walk' && f.moving && !airborne
    this._prophet(jx, py, moving ? scroll * 0.05 : 0, airborne, false)

    // 頂端:悔改進度(已悔改=🙇,還沒=淡色 👤)
    for (let i = 0; i < total; i++) {
      const lx = VIEW.W / 2 + (i - (total - 1) / 2) * 70
      if (i < (f.repented || 0)) {
        this._emoji('🙇', lx, 54, 30, 'middle')
      } else {
        ctx.globalAlpha = 0.35
        this._emoji('👤', lx, 54, 26, 'middle')
        ctx.globalAlpha = 1
      }
    }

    // 底部提示 / 進度
    ctx.fillStyle = 'rgba(60,50,35,0.8)'
    ctx.font = '600 18px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    if (f.phase === 'walk') {
      ctx.fillText('按住 →/右側 往前走　·　走到居民面前就停下對話、宣告神的話', VIEW.W / 2, VIEW.H - 12)
    } else {
      ctx.fillText(`悔改的人  ${f.repented || 0} / ${total}`, VIEW.W / 2, VIEW.H - 12)
    }
  }

  // 用 Canvas 直接畫一個「面向右、奔跑中的先知」。
  // phase = 步伐相位(弧度);airborne = 是否在跳躍中;faceLeft = 是否面向左(後退時)。
  _prophet(x, footY, phase, airborne, faceLeft = false, crouch = false) {
    const ctx = this.ctx
    const sw = Math.sin(phase) * 0.6 // 擺動幅度(弧度)
    const bob = airborne ? 0 : -Math.abs(Math.sin(phase)) * 2.5

    const COL = {
      robe: '#f6f3ec', // 白袍
      robeDark: '#dcd5c6', // 袍身陰影
      belt: '#9c7a3a', // 腰帶
      skin: '#e8bb8d',
      beard: '#5a4326',
      wrap: '#f6f3ec', // 白頭巾
      band: '#b23b3b',
      sandal: '#6b4a26',
      staff: '#8a5a2a', // 木杖
      knob: '#6f4720',
    }

    // 腿:跑步前後擺;跳躍時躍起姿勢;蹲下時雙腿外張、屈膝下蹲
    const legF = crouch ? 0.85 : airborne ? 0.95 : sw
    const legB = crouch ? -0.85 : airborne ? -0.35 : -sw
    // 後手臂:跑步擺動;跳躍時向後上方甩起;蹲下時自然垂在身前
    const armB = crouch ? 0.5 : airborne ? -1.3 : sw * 0.9

    // 蹲下:髖部下降、上半身整體下沉(腳仍踩在地上),做出屈膝下蹲的樣子,而不是整個人縮小
    const sink = crouch ? 15 : 0
    const kneeY = -17 + (crouch ? 9 : 0)
    const shin = 17
    const shoulderY = -45 + sink
    const armLen = 16
    const headY = -53 + sink
    const headR = 7

    const drawLeg = (ang) => {
      const fx = Math.sin(ang) * shin
      const fy = kneeY + Math.cos(ang) * shin
      ctx.strokeStyle = COL.skin
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, kneeY)
      ctx.lineTo(fx, fy)
      ctx.stroke()
      ctx.fillStyle = COL.sandal // 涼鞋
      ctx.beginPath()
      ctx.ellipse(fx + 3, fy + 1, 6, 3.2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawArm = (ang) => {
      const hx = Math.sin(ang) * armLen
      const hy = shoulderY + Math.cos(ang) * armLen
      ctx.strokeStyle = COL.robe // 長袖
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, shoulderY)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.fillStyle = COL.skin // 手
      ctx.beginPath()
      ctx.arc(hx, hy, 3.6, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.save()
    ctx.translate(x, footY + bob)
    if (faceLeft) ctx.scale(-1, 1) // 後退時水平翻轉,讓先知面向左

    // 後側手腳(先畫,被身體蓋住,略透明做出前後層次)
    ctx.globalAlpha = 0.82
    drawArm(armB)
    drawLeg(legB)
    ctx.globalAlpha = 1

    // 袍子(跑步時下襬隨步伐輕擺;跳躍時不擺)
    const swish = airborne ? 1 : Math.sin(phase) * 2
    ctx.fillStyle = COL.robe
    ctx.beginPath()
    ctx.moveTo(-8, shoulderY + 2)
    ctx.lineTo(8, shoulderY + 2)
    ctx.lineTo(13 + swish, -19)
    ctx.quadraticCurveTo(0, -15, -13 + swish, -19)
    ctx.closePath()
    ctx.fill()
    // 袍身陰影(右側=向光面對側)
    ctx.fillStyle = COL.robeDark
    ctx.beginPath()
    ctx.moveTo(2, shoulderY + 3)
    ctx.lineTo(8, shoulderY + 2)
    ctx.lineTo(13 + swish, -19)
    ctx.lineTo(4, -18)
    ctx.closePath()
    ctx.fill()
    // 腰帶
    ctx.strokeStyle = COL.belt
    ctx.lineWidth = 4
    ctx.lineCap = 'butt'
    ctx.beginPath()
    ctx.moveTo(-8.5, -28)
    ctx.lineTo(9, -28)
    ctx.stroke()

    // 前腿
    drawLeg(legF)

    // 木杖 + 握杖的前手(跳躍時整支往上抬,呈躍起持杖)
    const sTopX = airborne ? 17 : 14
    const sTopY = airborne ? -72 : -63
    const sBotX = airborne ? 11 : 9
    const sBotY = airborne ? -8 : 5
    const gx = airborne ? 14 : 12 // 握點 x
    const gy = airborne ? -42 : -33 // 握點 y
    ctx.strokeStyle = COL.staff
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(sTopX, sTopY)
    ctx.lineTo(sBotX, sBotY)
    ctx.stroke()
    ctx.fillStyle = COL.knob // 杖頭握把
    ctx.beginPath()
    ctx.arc(sTopX, sTopY, 3.4, 0, Math.PI * 2)
    ctx.fill()
    // 前手臂(白袖,手握在握點)
    ctx.strokeStyle = COL.robe
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, shoulderY)
    ctx.lineTo(gx, gy)
    ctx.stroke()
    ctx.fillStyle = COL.skin // 握杖的手
    ctx.beginPath()
    ctx.arc(gx, gy, 3.9, 0, Math.PI * 2)
    ctx.fill()

    // 脖子
    ctx.strokeStyle = COL.skin
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, shoulderY)
    ctx.lineTo(0, headY + headR - 1)
    ctx.stroke()

    // 臉
    ctx.fillStyle = COL.skin
    ctx.beginPath()
    ctx.arc(0, headY, headR, 0, Math.PI * 2)
    ctx.fill()

    // 鬍子(垂在臉下、略朝前)
    ctx.fillStyle = COL.beard
    ctx.beginPath()
    ctx.moveTo(-headR + 1.5, headY + 1)
    ctx.quadraticCurveTo(1, headY + headR + 8, headR - 0.5, headY + 2.5)
    ctx.quadraticCurveTo(headR - 4, headY + headR - 1, -headR + 1.5, headY + 1)
    ctx.closePath()
    ctx.fill()

    // 頭巾(蓋住頭頂)
    ctx.fillStyle = COL.wrap
    ctx.beginPath()
    ctx.arc(0, headY, headR + 1.6, Math.PI, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
    // 頭巾後垂帶
    ctx.beginPath()
    ctx.moveTo(-headR, headY - 3)
    ctx.lineTo(-headR - 4, headY + 9)
    ctx.lineTo(-headR + 1.5, headY + 6)
    ctx.closePath()
    ctx.fill()
    // 紅頭帶
    ctx.strokeStyle = COL.band
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(0, headY, headR + 0.8, Math.PI * 1.08, Math.PI * 1.95)
    ctx.stroke()

    // 五官畫在右側 → 清楚面向右
    ctx.fillStyle = COL.skin
    ctx.beginPath() // 鼻子
    ctx.arc(headR - 0.5, headY + 1.5, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3a2a18'
    ctx.beginPath() // 眼睛
    ctx.arc(headR - 3, headY - 0.5, 1.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // 古代(約三千年前)近東港城的房子:平頂、女兒牆、曬乾的泥磚/砂岩色,
  // 窗戶很少(0–2 個小高窗)、底部一個拱門,偶爾一座圓頂。用雜湊讓外觀穩定不閃爍。
  _buildings(off) {
    const ctx = this.ctx
    const base = GROUND_Y - 8
    const WALL = ['#d8c5a0', '#cdb892', '#e2d4b2', '#c9b48a'] // 陽光曬過的泥磚色
    const SHADE = 'rgba(95,70,40,0.16)' // 右側陰影
    const DARK = 'rgba(70,50,28,0.72)' // 門窗的暗處
    const step = 128
    const hash = (n) => {
      const v = Math.sin(n * 127.1) * 43758.5453
      return v - Math.floor(v) // 0..1,對同一棟永遠相同
    }
    const start = -((((off % step) + step) % step))
    for (let x = start; x < VIEW.W + step; x += step) {
      const key = Math.round((x + off) / step)
      const r = hash(key)
      const r2 = hash(key * 2.3 + 7)
      const r3 = hash(key * 5.1 + 3)
      const bw = 84 + Math.floor(r * 36) // 寬 84..120
      const h = 60 + Math.floor(r2 * 66) // 高 60..126
      const top = base - h
      const idx = ((key % WALL.length) + WALL.length) % WALL.length

      // 牆身
      ctx.fillStyle = WALL[idx]
      ctx.fillRect(x, top, bw, h)
      // 右側陰影(立體感)
      ctx.fillStyle = SHADE
      ctx.fillRect(x + bw * 0.66, top, bw * 0.34, h)

      // 平頂女兒牆(頂部一道矮邊)
      ctx.fillStyle = 'rgba(70,50,28,0.30)'
      ctx.fillRect(x - 2, top - 5, bw + 4, 6)

      if (r3 > 0.82) {
        // 偶爾一座圓頂(會堂/重要建築)
        ctx.fillStyle = WALL[idx]
        ctx.beginPath()
        ctx.arc(x + bw / 2, top - 4, bw * 0.3, Math.PI, 2 * Math.PI)
        ctx.fill()
      }

      // 小高窗:很少,0–2 個
      ctx.fillStyle = DARK
      const winCount = r < 0.32 ? 0 : r < 0.72 ? 1 : 2
      for (let k = 0; k < winCount; k++) {
        const wx = x + bw * (winCount === 1 ? 0.5 : 0.34 + k * 0.32) - 5
        ctx.fillRect(wx, top + 16, 10, 13)
      }

      // 底部拱門
      const dw = 15
      const dh = 24
      const dx = x + bw / 2 - dw / 2
      const dy = base - dh
      ctx.fillStyle = DARK
      ctx.fillRect(dx, dy, dw, dh)
      ctx.beginPath()
      ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 2 * Math.PI)
      ctx.fill()
    }
  }

  _hud(game) {
    const ctx = this.ctx

    // 生命(愛心)— 只在闖關模式顯示(漫步模式無傷害)
    if (game.mode === 'run') {
      for (let i = 0; i < game.player.lives; i++) {
        this._emoji('❤️', 34 + i * 38, 46, 30, 'middle')
      }
    }

    // 收集到的 🪙:第一關顯示「/ 船價門檻」(湊夠變綠);第四關無船價,只顯示分數
    ctx.font = '600 26px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const coinX = game.mode === 'run' ? 156 : 28
    if (game.fareEnabled) {
      const fareNeed = game.mode === 'walk' ? FARE.walk : FARE.run
      ctx.fillStyle = game.coinsCollected >= fareNeed ? '#2f7a32' : '#5a3a16'
      ctx.fillText(`🪙 ${game.coinsCollected} / ${fareNeed}`, coinX, 46)
    } else {
      ctx.fillStyle = '#7a5320'
      ctx.fillText(`🪙 ${game.coinsCollected}`, coinX, 46)
    }

    // 漫步模式 / 回頭收集船價:底部操作提示(終點用語由 hudLabels.short 決定,別寫死)
    if (game.mode === 'walk' || game.collectingFare) {
      ctx.fillStyle = 'rgba(40,50,64,0.75)'
      ctx.font = '600 18px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const goalWord = (game.hudLabels && game.hudLabels.short) || '終點'
      ctx.fillText(
        `按住 →/右半 前進　·　←/左半 後退　·　輕點一下 跳　·　走到${goalWord}過關`,
        VIEW.W / 2,
        VIEW.H - 12
      )
    }

    // 進度條(起點 → 終點)——兩端文字由 game.hudLabels 決定:
    //   單機=「約帕 → 往他施的船 ⛵」;嵌入(保羅大富翁)可傳通用「起點 → 終點 ⛵」,讓同一關卡被任何旅程重用。
    const hud = game.hudLabels || { start: '約帕', goal: '往他施的船 ⛵' }
    const barW = 360
    const barH = 16
    const bx = (VIEW.W - barW) / 2
    const by = 36
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    roundRect(ctx, bx, by, barW, barH, 8)
    ctx.fill()
    const prog = Math.min(1, game.distance / (game.goalDistance || RUN.goalDistance))
    ctx.fillStyle = '#2f9e44'
    roundRect(ctx, bx, by, barW * prog, barH, 8)
    ctx.fill()
    ctx.fillStyle = '#33485a'
    ctx.font = '600 16px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textBaseline = 'bottom'
    ctx.textAlign = 'left'
    ctx.fillText(hud.start, bx, by - 4)
    ctx.textAlign = 'right'
    ctx.fillText(hud.goal, bx + barW, by - 4)

    // 到了船邊但船價不足:紅色提示橫幅,引導回頭收集
    if (game.shortFare) {
      const need = game.mode === 'walk' ? FARE.walk : FARE.run
      const msg = `船價不足!需要 ${need}(目前 ${game.coinsCollected})— 回頭(←)多撿一些 🪙 再回船邊上船`
      ctx.font = '700 19px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const w = ctx.measureText(msg).width + 36
      ctx.fillStyle = 'rgba(196,75,75,0.94)'
      roundRect(ctx, (VIEW.W - w) / 2, 72, w, 38, 10)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillText(msg, VIEW.W / 2, 91)
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
