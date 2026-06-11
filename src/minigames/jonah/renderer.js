import { VIEW, GROUND_Y, PLAYER, RUN, STORM, FARE, FISH, PREACH, GOURD } from './config.js'

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
    // 第六關「蓖麻樹」也是另一個畫面
    if (game.level === 6) {
      this._drawGourd(game)
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

    // 衝刺中(撿到 ⚡ 或按住衝刺):約拿身後拖出速度線,跑出「風馳」感
    if ((game.boostLeft > 0 || game.sprinting) && game.speed > 1) {
      ctx.strokeStyle = 'rgba(255,214,90,0.55)'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      for (let i = 0; i < 6; i++) {
        const ly = GROUND_Y - 14 - i * 9 - Math.sin(dist * 0.05 + i) * 3
        const lx = game.player.x - 34 - ((dist * 0.9 + i * 53) % 70)
        ctx.beginPath()
        ctx.moveTo(lx, ly)
        ctx.lineTo(lx - 30, ly)
        ctx.stroke()
      }
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

    // 沿途零星聚落(曠野不是城,房子要少;到了終點另有尼尼微大城門)
    this._buildings(dist * 0.25, 0.28)

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

  // 第二關「暴風雨」畫面:烏雲密布的天空、暴風大雨、起伏的海、大船與一群水手、
  // 閃電、撐住/危險條;結尾 cast(等拋約拿)/ thrown(約拿入海、海平息)。
  _drawStorm(game) {
    const ctx = this.ctx
    const s = game.storm
    const t = s.time
    // thrown 階段:海與雨隨進度平息(「海的狂浪就平息了」拿 1:15)
    const calm = s.phase === 'thrown' ? 1 - 0.8 * Math.min(1, s.thrownT / 1.4) : 1

    // 烏雲密布的暴風天空(thrown 末段微微透光)
    const lift = (1 - calm) * 0.5
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    sky.addColorStop(0, lift > 0.2 ? '#2c3b49' : '#141d26')
    sky.addColorStop(0.6, lift > 0.2 ? '#41505e' : '#2c3a47')
    sky.addColorStop(1, '#44535f')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    // 低垂的烏雲(兩層團塊,緩慢漂移;用雜湊定形不閃爍)
    const cloudLayer = (speed, y0, rgba, scale) => {
      ctx.fillStyle = rgba
      for (let i = 0; i < 8; i++) {
        const w = (90 + ((i * 53) % 70)) * scale
        const x = ((i * 173 + t * speed) % (VIEW.W + 260)) - 130
        const y = y0 + ((i * 37) % 26)
        ctx.beginPath()
        ctx.ellipse(x, y, w, 26 * scale, 0, 0, Math.PI * 2)
        ctx.ellipse(x + w * 0.55, y + 8, w * 0.7, 20 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    cloudLayer(14, 26, 'rgba(16,24,32,0.85)', 1.15)
    cloudLayer(26, 64, 'rgba(30,40,50,0.7)', 0.9)

    // 暴風大雨(密、斜、快;thrown 時隨海平息漸停)
    if (calm > 0.15) {
      ctx.strokeStyle = `rgba(185,205,225,${0.42 * calm})`
      ctx.lineWidth = 2.5
      for (let i = 0; i < 130; i++) {
        const x = ((i * 137 + t * 860) % (VIEW.W + 60)) - 30
        const y = ((i * 89 + t * 1150) % (VIEW.H + 60)) - 30
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - 9, y + 24)
        ctx.stroke()
      }
    }

    // 海(深色、起伏的浪;thrown 時浪高漸平)
    const seaY = GROUND_Y - 40
    ctx.fillStyle = '#23506e'
    ctx.fillRect(0, seaY, VIEW.W, VIEW.H - seaY)
    ctx.strokeStyle = 'rgba(220,235,245,0.5)'
    ctx.lineWidth = 3
    for (let k = 0; k < 4; k++) {
      const yy = seaY + 18 + k * 30
      ctx.beginPath()
      for (let x = 0; x <= VIEW.W; x += 16) {
        const off = Math.sin(x * 0.02 + t * 3 + k) * 10 * calm
        if (x === 0) ctx.moveTo(x, yy + off)
        else ctx.lineTo(x, yy + off)
      }
      ctx.stroke()
    }

    // 大船(以海面中央為軸,隨浪上下 + 依傾角旋轉;S=放大倍率)
    const S = 1.5
    const cx = VIEW.W / 2
    const cy = seaY + 6 + Math.sin(t * 2) * 6 * calm
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(s.tilt)
    // 船身
    ctx.fillStyle = '#7a4a22'
    ctx.beginPath()
    ctx.moveTo(-122 * S, 0)
    ctx.lineTo(122 * S, 0)
    ctx.lineTo(86 * S, 56 * S)
    ctx.lineTo(-86 * S, 56 * S)
    ctx.closePath()
    ctx.fill()
    // 船身木板紋
    ctx.strokeStyle = 'rgba(60,35,16,0.5)'
    ctx.lineWidth = 2
    for (let k = 1; k <= 2; k++) {
      ctx.beginPath()
      ctx.moveTo((-122 + 12 * k) * S, 18 * k)
      ctx.lineTo((122 - 12 * k) * S, 18 * k)
      ctx.stroke()
    }
    ctx.fillStyle = '#5e3717'
    ctx.fillRect(-122 * S, -9, 244 * S, 11) // 甲板邊
    // 船尾欄杆(右舷,給抓欄杆的水手抓;兩根立柱+橫杆)
    ctx.strokeStyle = '#4a2c12'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(168, -9)
    ctx.lineTo(168, -42)
    ctx.moveTo(138, -9)
    ctx.lineTo(138, -42)
    ctx.moveTo(130, -40)
    ctx.lineTo(176, -40)
    ctx.stroke()
    // 桅杆 + 帆(被風吹得鼓脹)
    ctx.fillStyle = '#5e3717'
    ctx.fillRect(-6, -180, 12, 180)
    ctx.fillStyle = '#e8e2d0'
    ctx.beginPath()
    ctx.moveTo(6, -172)
    ctx.quadraticCurveTo(112, -120, 7, -42)
    ctx.closePath()
    ctx.fill()
    // 一群驚惶的水手(向量小人,古代短衣;拿 1:5 水手便懼怕、將貨物拋在海中;1:6 船主來)
    this._sailor(-150, -9, 'kneel', t) // 跪下、雙手朝天哀求
    this._sailor(-95, -9, 'pray', t) // 俯伏在甲板上禱告
    this._sailor(-50, -9, 'toss', t) // 把貨物拋進海裡(1:5)
    this._sailor(112, -9, 'grip', t) // 雙手死抓欄杆、身體被浪甩
    this._sailor(62, -9, 'captain', t) // 古代船主:深紅長袍+頭巾,朝約拿焦急揮手(1:6)
    // 約拿:ride/cast 站船中間;thrown 已被拋出,不畫在甲板上
    if (s.phase !== 'thrown') {
      this._prophet(0, 2, t * 0.05, false)
      if (s.phase === 'cast') {
        // 等拋:約拿身上一圈呼吸光暈,標示「就是他」
        const pr = 40 + Math.sin(t * 5) * 6
        ctx.strokeStyle = 'rgba(255,224,140,0.85)'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(0, -28, pr, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.restore()

    // thrown:約拿從船上劃出拋物線落海 + 水花漣漪(他沉下去——大魚在下一關等他)
    if (s.phase === 'thrown') {
      const f = Math.min(1, s.thrownT / 1.1) // 飛行進度
      const x0 = cx
      const y0 = cy - 36
      const x1 = cx + 235
      const y1 = seaY + 46
      const jx = x0 + (x1 - x0) * f
      const jy = y0 + (y1 - y0) * f - 120 * Math.sin(Math.PI * f)
      if (f < 1) {
        ctx.save()
        ctx.translate(jx, jy)
        ctx.rotate(f * 2.4) // 翻滾著落下
        this._prophet(0, 28, 0, true)
        ctx.restore()
      } else {
        // 落水:水花 + 擴散漣漪
        const k = Math.min(1, (s.thrownT - 1.1) / 0.8)
        if (k < 0.55) this._emoji('💦', x1, y1 - 8, 44 + k * 30, 'middle')
        ctx.strokeStyle = `rgba(220,240,250,${0.7 * (1 - k)})`
        ctx.lineWidth = 3
        for (let r = 0; r < 2; r++) {
          ctx.beginPath()
          ctx.ellipse(x1, y1 + 6, 26 + k * 90 + r * 18, 7 + k * 18, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    // 閃電白光
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.4})`
      ctx.fillRect(0, 0, VIEW.W, VIEW.H)
    }

    // ---- 結尾階段的提示 ----
    if (s.phase === 'cast') {
      // 等玩家把約拿拋進海:經文 + 大提示(脈動)
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(8,20,30,0.55)'
      roundRect(ctx, VIEW.W / 2 - 330, 30, 660, 92, 14)
      ctx.fill()
      ctx.fillStyle = '#ffe9b0'
      ctx.font = '700 22px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText('「你們將我抬起來,拋在海中,海就平靜了。」(拿 1:12)', VIEW.W / 2, 58)
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 4))
      ctx.fillStyle = '#fff'
      ctx.font = '800 24px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText('👉 輕點畫面(或按 空白鍵)把約拿拋進海裡', VIEW.W / 2, 98)
      ctx.globalAlpha = 1
      return
    }
    if (s.phase === 'thrown') {
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(235,244,255,0.9)'
      ctx.font = '700 24px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText('海的狂浪,就平息了。(拿 1:15)', VIEW.W / 2, 54)
      return
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

  // 第六關「蓖麻樹」畫面:城東的山坡,五幕場景——棚下發怒 / 蓖麻長高 / 蟲咬枯槁 /
  // 東風曝曬 / 神的心(城發光)。蓖麻的生長與枯萎跟著本幕動畫進度 t 演;約拿用蹲姿當坐姿。
  _drawGourd(game) {
    const ctx = this.ctx
    const f = game.gourd || { idx: 0, done: 0, total: 1, t: 0, phase: 'intro' }
    const total = f.total || 1
    const idx = f.idx || 0
    // 本幕動畫進度 0..1;作答/結束時固定為 1(維持該幕的結束畫面)
    const p = f.phase === 'scene' ? Math.min(1, (f.t || 0) / GOURD.sceneTime) : 1
    this._gourdT = (this._gourdT || 0) + 1 / 60 // renderer 自己的環境動畫時鐘(氣氛用)
    const t = this._gourdT
    const lerp = (a, b, k) => a + (b - a) * k

    // 每一幕的天空(0 黃昏的悶氣 / 1 舒服的蔭涼 / 2 黎明 / 3 烈日 / 4 神的晨光)
    const SKIES = [
      ['#e8a96a', '#f3cf9b', '#f7e7c8'], // 0 棚下:黃昏悶熱
      ['#8fc8e8', '#cde9f3', '#eaf7f0'], // 1 蓖麻:清爽
      ['#f0b2c0', '#f7d6c2', '#fbeed8'], // 2 蟲子:黎明
      ['#f2a040', '#f6c468', '#fce69a'], // 3 東風:烈日當空,天色發燙
      ['#ffd9a0', '#ffe9c4', '#fff7e6'], // 4 神的心:金色晨光
    ]
    const sk = SKIES[Math.min(idx, SKIES.length - 1)]
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
    sky.addColorStop(0, sk[0])
    sky.addColorStop(0.6, sk[1])
    sky.addColorStop(1, sk[2])
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW.W, VIEW.H)

    // 烈日:第 1 幕(悶熱的午後——約拿正是因為很曬才搭棚遮蔭,拿 4:5)與第 4 幕(日頭曝曬)都有;
    // 第 4 幕(hard)另加炎熱的東風、更強的熱浪與灼熱色調。
    if (idx === 0 || idx === 3) {
      const hard = idx === 3 // 第 4 幕:最毒的那種曬
      const sx = VIEW.W * (hard ? 0.72 : 0.8)
      const sy = VIEW.H * 0.2
      const R = hard ? 44 : 38 // 日輪大小
      const pulse = 1 + Math.sin(t * 3) * 0.06 // 烈日灼熱脈動
      // 大光暈
      const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, hard ? 210 : 170)
      halo.addColorStop(0, 'rgba(255,238,180,0.95)')
      halo.addColorStop(0.5, 'rgba(255,210,120,0.45)')
      halo.addColorStop(1, 'rgba(255,210,120,0)')
      ctx.fillStyle = halo
      ctx.fillRect(sx - 210, sy - 210, 420, 420)
      // 光芒(12 道,緩慢旋轉)
      ctx.fillStyle = 'rgba(255,214,110,0.65)'
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.25
        ctx.save()
        ctx.translate(sx, sy)
        ctx.rotate(a)
        ctx.beginPath()
        ctx.moveTo((R + 8) * pulse, -7)
        ctx.lineTo((R + 42) * pulse, 0)
        ctx.lineTo((R + 8) * pulse, 7)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      // 日輪
      ctx.fillStyle = '#fff1c0'
      ctx.beginPath()
      ctx.arc(sx, sy, R * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe28a'
      ctx.beginPath()
      ctx.arc(sx, sy, (R - 10) * pulse, 0, Math.PI * 2)
      ctx.fill()
      // 地面附近的熱浪(扭動的細波,往上飄;第 1 幕較淡、第 4 幕較強)
      ctx.strokeStyle = hard ? 'rgba(255,235,190,0.4)' : 'rgba(255,235,190,0.28)'
      ctx.lineWidth = 2
      const waves = hard ? 5 : 3
      for (let i = 0; i < waves; i++) {
        const hy = GROUND_Y - 8 - ((t * 26 + i * 22) % 70)
        ctx.beginPath()
        for (let x = 0; x <= VIEW.W; x += 18) {
          const off = Math.sin(x * 0.05 + t * 5 + i * 2) * 3.5
          if (x === 0) ctx.moveTo(x, hy + off)
          else ctx.lineTo(x, hy + off)
        }
        ctx.stroke()
      }
      if (hard) {
        // 炎熱的東風(風線由右往左)
        ctx.strokeStyle = 'rgba(214,150,80,0.55)'
        ctx.lineWidth = 3
        for (let i = 0; i < 7; i++) {
          const wy = 90 + i * 52 + Math.sin(t * 2 + i) * 6
          const wx = VIEW.W - (((t * 260 * p + i * 170) % (VIEW.W + 200)) - 100)
          ctx.beginPath()
          ctx.moveTo(wx, wy)
          ctx.quadraticCurveTo(wx - 40, wy - 8, wx - 84, wy)
          ctx.stroke()
        }
      }
      // 整體加一層灼熱色調(第 4 幕較重)
      ctx.fillStyle = hard ? 'rgba(255,140,60,0.08)' : 'rgba(255,160,80,0.05)'
      ctx.fillRect(0, 0, VIEW.W, VIEW.H)
    }
    // 第 5 幕:從天而下的柔光(神的憐憫照著大城)
    if (idx === 4) {
      ctx.fillStyle = 'rgba(255,236,180,0.30)'
      for (let i = 0; i < 4; i++) {
        const bx = 60 + i * 70
        ctx.beginPath()
        ctx.moveTo(bx, 0)
        ctx.lineTo(bx + 46, 0)
        ctx.lineTo(bx - 30 + 30, GROUND_Y - 40)
        ctx.lineTo(bx - 60 + 30, GROUND_Y - 40)
        ctx.closePath()
        ctx.fill()
      }
    }

    // 遠方的尼尼微城(左邊地平線的剪影;第 5 幕微微發亮)
    const base = GROUND_Y - 4
    ctx.fillStyle = idx === 4 ? 'rgba(196,150,92,0.85)' : 'rgba(120,95,66,0.55)'
    for (let i = 0; i < 7; i++) {
      const bw = 34 + ((i * 37) % 28)
      const bh = 26 + ((i * 53) % 40)
      const bx = 28 + i * 44
      ctx.fillRect(bx, base - bh, bw, bh)
    }
    ctx.fillRect(16, base - 14, 7 * 44 + 40, 14) // 城牆

    // 地面(城東乾旱的山坡)
    ctx.fillStyle = '#d3b377'
    ctx.fillRect(0, GROUND_Y, VIEW.W, VIEW.H - GROUND_Y)
    ctx.fillStyle = 'rgba(150,115,60,0.4)'
    for (let i = 0; i < 9; i++) ctx.fillRect(40 + i * 110, GROUND_Y + 26 + (i % 3) * 14, 22, 4)

    const jx = VIEW.W * 0.56 // 約拿(坐在棚下,面向左邊的城)
    const gx = jx + 96 // 蓖麻長在棚旁

    // 棚(兩根木柱 + 枝條棚頂,拿 4:5)
    ctx.strokeStyle = '#8a5a2a'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(jx - 46, GROUND_Y)
    ctx.lineTo(jx - 40, GROUND_Y - 86)
    ctx.moveTo(jx + 46, GROUND_Y)
    ctx.lineTo(jx + 40, GROUND_Y - 86)
    ctx.stroke()
    ctx.strokeStyle = '#a8743c'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(jx - 52, GROUND_Y - 86)
    ctx.lineTo(jx + 52, GROUND_Y - 86)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(140,160,90,0.8)'
    ctx.lineWidth = 3
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(jx + i * 20 - 8, GROUND_Y - 90)
      ctx.lineTo(jx + i * 20 + 10, GROUND_Y - 83)
      ctx.stroke()
    }

    // 蓖麻:第 2 幕隨 p 長高;第 3 幕起枯萎(綠→褐、下垂)。第 1 幕還沒有。
    let grow = 0
    let wither = 0
    if (idx === 1) grow = p
    else if (idx === 2) {
      grow = 1
      wither = p
    } else if (idx >= 3) {
      grow = 1
      wither = 1
    }
    if (grow > 0) {
      const H = 150 * grow
      const droop = wither * 26 // 枯萎下垂
      const leafCol = `rgb(${lerp(86, 150, wither) | 0},${lerp(150, 110, wither) | 0},${lerp(70, 58, wither) | 0})`
      ctx.strokeStyle = `rgb(${lerp(96, 140, wither) | 0},${lerp(130, 104, wither) | 0},${lerp(60, 56, wither) | 0})`
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.beginPath() // 主莖(枯萎時頂端垂下)
      ctx.moveTo(gx, GROUND_Y)
      ctx.quadraticCurveTo(gx + 6, GROUND_Y - H * 0.6, gx + 2 + droop * 0.4, GROUND_Y - H + droop)
      ctx.stroke()
      ctx.fillStyle = leafCol
      const leaves = Math.max(1, Math.round(4 * grow))
      for (let i = 0; i < leaves; i++) {
        const ly = GROUND_Y - H * (0.4 + i * 0.18) + droop * (0.4 + i * 0.2)
        const side = i % 2 === 0 ? 1 : -1
        ctx.save()
        ctx.translate(gx + side * 16, ly)
        ctx.rotate(side * (0.5 + wither * 0.7))
        ctx.beginPath()
        ctx.ellipse(0, 0, 26 * grow, 11 * grow * (1 - wither * 0.4), 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      // 頂葉(遮蔭的「影兒」:健康時在約拿頭上方畫一片淡蔭)
      if (wither < 0.5 && grow > 0.7) {
        ctx.fillStyle = 'rgba(86,150,70,0.25)'
        ctx.beginPath()
        ctx.ellipse(jx, GROUND_Y - 96, 70, 16, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 第 3 幕:神安排的蟲子 🐛 從右邊爬向蓖麻根部
    if (idx === 2) {
      const wx = lerp(VIEW.W - 40, gx + 14, Math.min(1, p * 1.15))
      this._emoji('🐛', wx, GROUND_Y + 4, 30)
    }

    // 約拿:蹲姿當坐姿,面向左(望著城)。
    // 第 1 幕:生氣 💢;第 4 幕:大大發怒(拿 4:9「我發怒以至於死」)——
    // 比第一幕更氣:怒氣泡泡更大更多、跳更快,人氣到發抖,還被烈日曬出汗 💦
    const furious = idx === 3
    const shake = furious ? Math.sin(t * 16) * 1.6 : 0 // 氣到發抖
    this._prophet(jx + shake, GROUND_Y, 0, false, true, true)
    const moodBob = Math.sin(t * (furious ? 6 : 3)) * (furious ? 5 : 3)
    if (idx === 0) this._emoji('💢', jx + 26, GROUND_Y - 78 + moodBob, 26, 'middle')
    if (furious) {
      this._emoji('💢', jx + 30, GROUND_Y - 86 + moodBob, 38, 'middle')
      this._emoji('💢', jx - 26, GROUND_Y - 72 - moodBob, 24, 'middle')
      this._emoji('💦', jx + 4, GROUND_Y - 56 + moodBob * 0.5, 20, 'middle')
    }

    // 頂端:五幕進度(完成=🌿,未完成=淡色)
    for (let i = 0; i < total; i++) {
      const lx = VIEW.W / 2 + (i - (total - 1) / 2) * 70
      if (i < (f.done || 0)) {
        this._emoji('🌿', lx, 54, 30, 'middle')
      } else {
        ctx.globalAlpha = 0.3
        this._emoji('🌿', lx, 54, 26, 'middle')
        ctx.globalAlpha = 1
      }
    }

    // 底部提示
    ctx.fillStyle = 'rgba(80,60,35,0.8)'
    ctx.font = '600 18px "Noto Sans TC","Microsoft JhengHei",sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    if (f.phase === 'scene') {
      ctx.fillText('看著神的「安排」發生……(輕點可跳過)', VIEW.W / 2, VIEW.H - 12)
    } else {
      ctx.fillText(`第 ${Math.min(idx + 1, total)} / ${total} 幕`, VIEW.W / 2, VIEW.H - 12)
    }
  }

  // 暴風雨中的水手(向量小人,古代短衣/長袍,動作隨時間慌張擺動)。
  // pose: kneel=跪下雙手朝天哀求 / pray=俯伏禱告 / grip=雙手抓欄杆被浪甩 /
  //       toss=把貨物拋進海(拿 1:5) / captain=古代船主長袍頭巾朝約拿揮手喊叫(拿 1:6)
  _sailor(x, footY, pose, t) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, footY)
    const SKIN = '#e2b48c'
    const BEARD = '#4a3520'
    const limb = (x1, y1, x2, y2, color, w = 5) => {
      ctx.strokeStyle = color
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    const hand = (hx, hy) => {
      ctx.fillStyle = SKIN
      ctx.beginPath()
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
    const head = (hx, hy, r = 6, wrap = null) => {
      ctx.fillStyle = SKIN
      ctx.beginPath()
      ctx.arc(hx, hy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = BEARD // 鬍子(下半圈)
      ctx.beginPath()
      ctx.arc(hx, hy + 2, r - 1, 0.25 * Math.PI, 0.75 * Math.PI)
      ctx.closePath()
      ctx.fill()
      if (wrap) {
        ctx.fillStyle = wrap // 頭巾(上半圈)
        ctx.beginPath()
        ctx.arc(hx, hy, r + 1.4, Math.PI, 2 * Math.PI)
        ctx.closePath()
        ctx.fill()
      }
    }
    // 短衣軀幹(四邊形):肩(sx,sy)到臀(hx,hy),寬 w
    const tunic = (sx, sy, hx, hy, color, wTop = 11, wBot = 14) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(sx - wTop / 2, sy)
      ctx.lineTo(sx + wTop / 2, sy)
      ctx.lineTo(hx + wBot / 2, hy)
      ctx.lineTo(hx - wBot / 2, hy)
      ctx.closePath()
      ctx.fill()
    }

    if (pose === 'kneel') {
      // 跪在甲板上,雙手朝天用力揮(哀求各人的神,拿 1:5)
      const wave = Math.sin(t * 7) * 5
      const COL = '#b0703a'
      limb(2, -13, 9, -2, SKIN, 6) // 大腿(跪)
      limb(9, -2, -4, 0, SKIN, 5) // 小腿折在地上
      tunic(0, -30, 1, -12, COL)
      limb(-1, -28, -11, -45 + wave, COL, 5) // 左臂高舉
      hand(-11, -45 + wave)
      limb(1, -28, 11, -47 - wave, COL, 5) // 右臂高舉
      hand(11, -47 - wave)
      head(0, -36)
    } else if (pose === 'pray') {
      // 俯伏低頭,雙手伏地禱告(身體隨禱告前後輕擺)
      const rock = Math.sin(t * 4) * 2
      const COL = '#6e8aa8'
      limb(-4, -12, 3, -2, SKIN, 6)
      limb(3, -2, -9, 0, SKIN, 5)
      tunic(8 + rock, -20, -4, -11, COL, 10, 13) // 軀幹前傾
      limb(8 + rock, -20, 19, -4, COL, 5) // 雙臂伏向甲板
      limb(7 + rock, -19, 17, -3, COL, 5)
      hand(19, -4)
      hand(17, -3)
      head(13 + rock, -22, 6) // 頭低低的
    } else if (pose === 'grip') {
      // 雙腳張開撐住、身體被浪甩、雙手死抓欄杆(欄杆橫杆在世界座標 y≈-40,相對這裡≈-31)
      const sway = Math.sin(t * 6) * 4
      const COL = '#7d8f55'
      limb(0, -16, -9, 0, SKIN, 6) // 雙腿張開撐住
      limb(0, -16, 9, 0, SKIN, 6)
      tunic(-6 - sway, -32, 0, -14, COL) // 軀幹向左被甩
      limb(-5 - sway, -30, 22, -31, COL, 5) // 雙臂拼命伸向右邊欄杆
      limb(-6 - sway, -28, 30, -30, COL, 5)
      hand(22, -31)
      hand(30, -30)
      head(-8 - sway, -38)
    } else if (pose === 'toss') {
      // 把貨物拋進海裡(拿 1:5):身體前傾朝左舷,貨箱循環飛出去
      const COL = '#9a6a3c'
      limb(0, -15, -9, 0, SKIN, 6)
      limb(0, -15, 8, 0, SKIN, 6)
      tunic(-7, -30, 0, -13, COL)
      limb(-7, -29, -20, -27, COL, 5) // 雙臂伸向左前方(剛出手)
      limb(-6, -27, -19, -23, COL, 5)
      hand(-20, -27)
      hand(-19, -23)
      head(-9, -37)
      // 飛出去的貨箱:從手邊拋物線落向左舷外(循環)
      const p = (t * 0.9) % 1.4
      if (p < 1) {
        const bx = -24 - p * 52
        const by = -28 + 44 * p * p
        ctx.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1
        ctx.fillStyle = '#8a5a2a'
        ctx.fillRect(bx - 6, by - 6, 12, 12)
        ctx.strokeStyle = '#5e3a16'
        ctx.lineWidth = 2
        ctx.strokeRect(bx - 6, by - 6, 12, 12)
        ctx.globalAlpha = 1
      }
    } else if (pose === 'captain') {
      // 古代船主(拿 1:6):深紅長袍 + 白頭巾,朝約拿(左邊)焦急揮手喊「起來,求告你的神!」
      const urge = Math.sin(t * 8) * 4
      const ROBE = '#7b3b3b'
      // 長袍(蓋到腳,看不到腿)
      ctx.fillStyle = ROBE
      ctx.beginPath()
      ctx.moveTo(-6, -38)
      ctx.lineTo(6, -38)
      ctx.lineTo(11, 0)
      ctx.lineTo(-11, 0)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#c8a35a' // 腰帶
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-8, -22)
      ctx.lineTo(8, -22)
      ctx.stroke()
      limb(-2, -34, -17, -42 + urge, ROBE, 5) // 朝約拿揮的手臂
      hand(-17, -42 + urge)
      limb(2, -34, 9, -24, ROBE, 5) // 另一手扠在腰邊
      hand(9, -24)
      head(0, -44, 6.5, '#ece5d3') // 白頭巾
      // 急喊的「!」氣泡
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 5))
      ctx.fillStyle = '#ffd9b0'
      ctx.font = '700 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('❗', -22, -56)
      ctx.globalAlpha = 1
    }
    ctx.restore()
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
  // density 0..1:出現機率(1=連綿大城;0.3≈曠野零星聚落,同一位置永遠一致不閃爍)。
  _buildings(off, density = 1) {
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
      if (density < 1 && hash(key * 3.7 + 11) > density) continue // 曠野:大多數格子留空
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

    // 衝刺剩餘秒數(撿到 ⚡ 時顯示在金幣旁)
    if (game.boostLeft > 0) {
      ctx.fillStyle = '#c47f0a'
      ctx.font = '700 22px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const bx0 = (game.mode === 'run' ? 156 : 28) + 150
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(game.boostLeft * 6))
      ctx.fillText(`⚡ ${game.boostLeft.toFixed(1)}s`, bx0, 46)
      ctx.globalAlpha = 1
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
