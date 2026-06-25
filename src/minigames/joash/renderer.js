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

    // 朝東的晨光（王下 13:17「開朝東的窗戶」）——右方(東)朝陽,點出射箭的方向
    const sun = ctx.createRadialGradient(880, 92, 8, 880, 92, 78)
    sun.addColorStop(0, 'rgba(255,238,176,0.95)')
    sun.addColorStop(1, 'rgba(255,238,176,0)')
    ctx.fillStyle = sun
    ctx.beginPath(); ctx.arc(880, 92, 78, 0, Math.PI * 2); ctx.fill()

    // 王宮「朝東的窗戶」：約阿施站在拱形窗口向東(右)射「耶和華的得勝箭」,亞蘭仇敵在窗外右方遠處。
    const stone = '#b9a989', stoneDk = '#8f7e5e'
    const wl = 104, wr = 248, wtop = 98, wsill = 420, jw = 15
    ctx.fillStyle = stoneDk; ctx.fillRect(wl - jw, wsill, (wr - wl) + jw * 2, 16) // 窗台
    ctx.fillStyle = stone
    ctx.fillRect(wl - jw, wtop, jw, wsill - wtop) // 左窗柱
    ctx.fillRect(wr, wtop, jw, wsill - wtop)      // 右窗柱
    ctx.strokeStyle = stone; ctx.lineWidth = jw; ctx.lineCap = 'butt'
    ctx.beginPath(); ctx.arc((wl + wr) / 2, wtop, (wr - wl) / 2 + jw / 2, Math.PI, 0); ctx.stroke() // 拱頂
    ctx.fillStyle = stoneDk; ctx.fillRect((wl + wr) / 2 - 6, wtop - (wr - wl) / 2 - jw, 12, 11) // 拱心楔石
  }

  _david(ctx, game) {
    const { x } = DAVID
    const shoulderY = DAVID.y - 6 // 肩/甩石手樞紐（與物理發射點、瞄準線同高）
    const hipY = 414
    const footY = GROUND_Y
    const skin = '#e8b887'
    const tunic = '#5b3a8a' // 約阿施是王：紫袍

    // 腿
    ctx.strokeStyle = '#6b4a28'
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x - 6, hipY); ctx.lineTo(x - 9, footY - 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 6, hipY); ctx.lineTo(x + 10, footY - 2); ctx.stroke()
    // 鞋
    ctx.fillStyle = '#5a3d22'
    ctx.fillRect(x - 16, footY - 4, 13, 6)
    ctx.fillRect(x + 4, footY - 4, 13, 6)
    // 短袍（身體）
    ctx.fillStyle = tunic
    ctx.beginPath()
    ctx.moveTo(x - 13, shoulderY + 6)
    ctx.lineTo(x + 13, shoulderY + 6)
    ctx.lineTo(x + 16, hipY)
    ctx.lineTo(x - 16, hipY)
    ctx.closePath()
    ctx.fill()
    // 腰帶
    ctx.fillStyle = '#5a3d22'
    ctx.fillRect(x - 16, hipY - 8, 32, 6)
    // (後手＝拉弦手,改由下面「弓」區塊一起畫)
    // 脖子 + 頭
    const hy = shoulderY - 20
    ctx.fillStyle = skin
    ctx.fillRect(x - 4, shoulderY - 8, 8, 8) // 脖子
    ctx.beginPath(); ctx.arc(x, hy, 15, 0, Math.PI * 2); ctx.fill()
    // 頭髮
    ctx.fillStyle = '#3a2716'
    ctx.beginPath(); ctx.arc(x, hy - 2, 15, Math.PI * 1.02, Math.PI * 2.0); ctx.fill()
    // 臉（側面朝右、勇敢專注）：眼、眉、嘴
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath(); ctx.arc(x + 6, hy - 1, 1.8, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 11, hy - 1, 1.8, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#3a2716'
    ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(x + 3, hy - 6); ctx.lineTo(x + 8, hy - 5); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 9, hy - 5); ctx.lineTo(x + 13, hy - 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 6, hy + 6); ctx.lineTo(x + 12, hy + 6); ctx.stroke() // 堅定小抿嘴

    // 王冠（約阿施是以色列王）——金色冠帶 + 三尖 + 紅寶石
    {
      const cy = hy - 12
      ctx.fillStyle = '#e8c14a'
      ctx.fillRect(x - 13, cy - 4, 26, 5)
      ctx.beginPath()
      ctx.moveTo(x - 13, cy - 4); ctx.lineTo(x - 9, cy - 13); ctx.lineTo(x - 5, cy - 4)
      ctx.moveTo(x - 4, cy - 4); ctx.lineTo(x, cy - 15); ctx.lineTo(x + 4, cy - 4)
      ctx.moveTo(x + 5, cy - 4); ctx.lineTo(x + 9, cy - 13); ctx.lineTo(x + 13, cy - 4)
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x, cy - 1, 2, 0, Math.PI * 2); ctx.fill()
    }

    // 弓 + 箭（約阿施真的拿弓拉弓）：前手握弓沿瞄準角伸出、後手拉弦搭箭；非瞄準時弓持身前微張。
    {
      const a = game.state === 'aim' ? deg2rad(game.aimDeg) : deg2rad(18)
      const dx = Math.cos(a), dy = -Math.sin(a)              // 瞄準方向（螢幕 y 向下）
      const px = -dy, py = dx                                 // 垂直＝弓臂方向
      const gripX = x + dx * 32, gripY = shoulderY + dy * 32  // 弓握把（前手；手臂加長,別太短）
      const limb = 20
      const tX = gripX + px * limb, tY = gripY + py * limb    // 弓上端
      const bX = gripX - px * limb, bY = gripY - py * limb    // 弓下端
      const cX = gripX + dx * 11, cY = gripY + dy * 11        // 弓弧控制點（往前凸）
      ctx.strokeStyle = '#7a4a1c'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(tX, tY); ctx.quadraticCurveTo(cX, cY, bX, bY); ctx.stroke() // 弓臂（木）
      const pull = game.state === 'aim' ? 15 : 4              // 拉弦量（瞄準時拉滿）
      const nX = gripX - dx * pull, nY = gripY - dy * pull    // 搭箭/拉弦點（後手）
      ctx.strokeStyle = '#efe9da'; ctx.lineWidth = 1.3
      ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(nX, nY); ctx.lineTo(bX, bY); ctx.stroke() // 弦
      const tipX = gripX + dx * 16, tipY = gripY + dy * 16
      ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(nX, nY); ctx.lineTo(tipX, tipY); ctx.stroke()                // 搭在弦上的箭
      ctx.fillStyle = '#9aa0a6'
      ctx.beginPath(); ctx.moveTo(tipX + dx * 5, tipY + dy * 5); ctx.lineTo(tipX + px * 3, tipY + py * 3); ctx.lineTo(tipX - px * 3, tipY - py * 3); ctx.closePath(); ctx.fill() // 箭頭
      ctx.strokeStyle = skin; ctx.lineWidth = 6.5; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(x + 7, shoulderY + 1); ctx.lineTo(gripX, gripY); ctx.stroke() // 前臂→握把(加長)
      ctx.beginPath(); ctx.moveTo(x - 7, shoulderY + 3); ctx.lineTo(nX, nY); ctx.stroke()        // 後臂→拉弦(加長)
      ctx.fillStyle = skin
      ctx.beginPath(); ctx.arc(gripX, gripY, 4.5, 0, Math.PI * 2); ctx.fill() // 前手掌(握弓)
      ctx.beginPath(); ctx.arc(nX, nY, 4.5, 0, Math.PI * 2); ctx.fill()       // 後手掌(拉弦)
    }

    ctx.fillStyle = '#3a2c1a'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('約阿施王', x, footY + 16)
  }

  _goliath(ctx, game) {
    const g = GOLIATH
    const fallen = game.state === 'win'
    // 頭對齊「額頭命中區」：命中框落在他前額（眼睛上方），玩家瞄哪打哪一致。
    const foreheadCY = g.forehead.y + g.forehead.h / 2
    const headY = foreheadCY + 16 // 頭中心（前額在頭的上段）
    const headR = 27
    const shoulderY = headY + headR + 10
    const hipY = 360
    const footY = g.groundY
    const skin = '#b59b6e'
    const armor = '#3f7c79' // 亞蘭兵:青銅綠松色甲(別於歌利亞墨綠)

    ctx.save()
    // 歌利亞動作位移（前後移動 gx／跳起或蹲下 gy）；命中框與「額頭」標記都在這個位移內畫，
    // 與 game.forehead（= 同一組 gx/gy 平移）保持同步 → 看到哪打哪一致。
    ctx.translate(game.gx || 0, game.gy || 0)
    if (fallen) {
      // 倒下（勝利）：以腳為軸往後倒
      ctx.translate(g.x, footY)
      ctx.rotate(-Math.PI / 2.1)
      ctx.translate(-g.x, -footY)
    }

    // 腿（粗壯）
    ctx.strokeStyle = '#3f4a36'
    ctx.lineWidth = 20
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(g.x - 14, hipY); ctx.lineTo(g.x - 16, footY - 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(g.x + 14, hipY); ctx.lineTo(g.x + 16, footY - 6); ctx.stroke()
    // 腳
    ctx.fillStyle = '#2f3a28'
    ctx.fillRect(g.x - 30, footY - 9, 28, 9)
    ctx.fillRect(g.x + 4, footY - 9, 28, 9)
    // 矛（亞蘭兵持矛）——槍頭加大、完整在畫面內(不被裁)、由持矛手握住
    {
      const spx = g.x + 54
      ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = 5; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(spx, headY - 28); ctx.lineTo(spx, footY); ctx.stroke() // 槍桿
      ctx.fillStyle = '#b8bcc2' // 葉形槍頭(加大;尖頂 headY-56 仍安全在框內)
      ctx.beginPath()
      ctx.moveTo(spx, headY - 56)
      ctx.lineTo(spx - 9, headY - 30)
      ctx.lineTo(spx, headY - 24)
      ctx.lineTo(spx + 9, headY - 30)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#7d8085'; ctx.lineWidth = 1.5; ctx.stroke()
    }
    // 鎧甲身體
    ctx.fillStyle = armor
    ctx.beginPath()
    ctx.moveTo(g.x - 35, shoulderY)
    ctx.lineTo(g.x + 35, shoulderY)
    ctx.lineTo(g.x + 30, hipY + 8)
    ctx.lineTo(g.x - 30, hipY + 8)
    ctx.closePath(); ctx.fill()
    // 鱗甲線
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 2
    for (let yy = shoulderY + 16; yy < hipY; yy += 20) {
      ctx.beginPath(); ctx.moveTo(g.x - 33, yy); ctx.lineTo(g.x + 33, yy); ctx.stroke()
    }
    // 手臂（加長、末端有手掌——近手握盾、遠手握矛,別太短）
    ctx.strokeStyle = skin
    ctx.lineWidth = 13
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(g.x - 30, shoulderY + 8); ctx.lineTo(g.x - 42, shoulderY + 52); ctx.stroke() // 近手→盾(加長)
    ctx.beginPath(); ctx.moveTo(g.x + 30, shoulderY + 8); ctx.lineTo(g.x + 54, shoulderY + 4); ctx.stroke()   // 遠手→矛(加長)
    ctx.fillStyle = skin
    ctx.beginPath(); ctx.arc(g.x + 54, shoulderY + 4, 6.5, 0, Math.PI * 2); ctx.fill() // 握矛手掌(看得見握住)
    // 圓盾（近東步兵圓盾,擋在身前近側）——加大,亞蘭兵的招牌
    ctx.fillStyle = '#8a5a2a'
    ctx.beginPath(); ctx.arc(g.x - 38, shoulderY + 48, 30, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#5f3c1a'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(g.x - 38, shoulderY + 48, 30, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x - 38, shoulderY + 48, 19, 0, Math.PI * 2); ctx.stroke() // 盾飾圈
    ctx.fillStyle = '#c0962f'; ctx.beginPath(); ctx.arc(g.x - 38, shoulderY + 48, 6.5, 0, Math.PI * 2); ctx.fill() // 盾心凸飾
    // 脖子
    ctx.fillStyle = skin
    ctx.fillRect(g.x - 11, headY + headR - 6, 22, 20)
    // 頭
    ctx.beginPath(); ctx.arc(g.x, headY, headR, 0, Math.PI * 2); ctx.fill()
    // 鬍子
    ctx.fillStyle = '#4a3a28'
    ctx.beginPath(); ctx.arc(g.x, headY + 11, 19, 0.12 * Math.PI, 0.88 * Math.PI); ctx.fill()
    // 亞蘭兵尖頂盔（近東錐形盔 + 護額帶 + 頂珠）——與歌利亞的圓銅盔明顯不同
    ctx.fillStyle = '#9a6b34'
    ctx.beginPath()
    ctx.moveTo(g.x - headR - 1, headY - 4)
    ctx.lineTo(g.x, headY - headR - 22) // 尖頂
    ctx.lineTo(g.x + headR + 1, headY - 4)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#7d5526'
    ctx.fillRect(g.x - headR - 1, headY - 8, (headR + 1) * 2, 7) // 護額帶
    ctx.fillStyle = '#c0962f'
    ctx.beginPath(); ctx.arc(g.x, headY - headR - 22, 2.5, 0, Math.PI * 2); ctx.fill() // 頂珠
    // 臉部表情
    if (!fallen) {
      // 怒眉（更陡、更粗——兇）
      ctx.strokeStyle = '#3a2a18'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(g.x - 17, headY - 6); ctx.lineTo(g.x - 3, headY + 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(g.x + 17, headY - 6); ctx.lineTo(g.x + 3, headY + 4); ctx.stroke()
      // 怒目（紅光瞇眼）
      ctx.fillStyle = '#a11'
      ctx.beginPath(); ctx.arc(g.x - 9, headY + 5, 3.2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(g.x + 9, headY + 5, 3.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath(); ctx.arc(g.x - 9, headY + 5, 1.6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(g.x + 9, headY + 5, 1.6, 0, Math.PI * 2); ctx.fill()
      // 咆哮露齒嘴（張口 + 白牙）——更兇
      ctx.fillStyle = '#2a1410'
      ctx.beginPath(); ctx.ellipse(g.x, headY + 21, 9, 6, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(g.x - 7, headY + 16, 14, 3) // 上排牙
      ctx.strokeStyle = '#2a1410'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(g.x - 3, headY + 16); ctx.lineTo(g.x - 3, headY + 19); ctx.moveTo(g.x + 3, headY + 16); ctx.lineTo(g.x + 3, headY + 19); ctx.stroke()
    } else {
      // 暈眩：XX 眼 + 張嘴
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 2.5
      for (const ex of [-9, 9]) {
        ctx.beginPath()
        ctx.moveTo(g.x + ex - 3, headY + 1); ctx.lineTo(g.x + ex + 3, headY + 6)
        ctx.moveTo(g.x + ex + 3, headY + 1); ctx.lineTo(g.x + ex - 3, headY + 6)
        ctx.stroke()
      }
      ctx.fillStyle = '#3a2a18'
      ctx.beginPath(); ctx.arc(g.x, headY + 19, 5, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()

    // 額頭命中區提示（瞄準時微微發亮，幫小孩知道要打哪）。
    // ★ 直接畫「實際命中矩形 game.forehead」——它已含歌利亞動作位移(gx/gy)＋年齡檔大小(幼70×50/童28×18/青20×13)，
    //   所以紅框會跟著額頭一起移動/跳/蹲、大小也隨年齡變，與物理命中判定「同一個矩形」零誤差(看到哪打哪一致)。
    //   （畫在 ctx.restore() 之後、用絕對座標，不再吃 translate；故用 game.forehead 而非靜態 GOLIATH.forehead。）
    if (!fallen && (game.state === 'aim' || game.state === 'flying')) {
      const f = game.forehead || g.forehead
      ctx.strokeStyle = 'rgba(228,87,46,0.85)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 2
      ctx.strokeRect(f.x, f.y, f.w, f.h)
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(228,87,46,0.12)'
      ctx.fillRect(f.x, f.y, f.w, f.h)
      ctx.fillStyle = '#c0392b'
      ctx.font = 'bold 12px system-ui'
      ctx.fillText('弱點', f.x + f.w / 2, f.y - 8)
    }
    ctx.fillStyle = '#3a2c1a'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    if (!fallen) ctx.fillText('亞蘭人', g.x + (game.gx || 0), g.groundY + 16) // 名牌也跟著左右移動
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
      ctx.strokeStyle = 'rgba(120,90,40,0.22)'
      ctx.lineWidth = 2
      for (const p of game.trail) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    // 箭矢：沿飛行方向畫一支箭（箭桿 + 箭頭 + 尾羽），而不是石子圓點
    const s = game.stone
    const ang = Math.atan2(s.vy || 0, s.vx || 1) // 速度方向＝箭指向
    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate(ang)
    ctx.strokeStyle = '#6b4a28' // 箭桿
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(7, 0); ctx.stroke()
    ctx.fillStyle = '#9aa0a6' // 箭頭（金屬）
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(6, -4); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#d8d2c4' // 尾羽
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-7, -3); ctx.moveTo(-11, 0); ctx.lineTo(-7, 3); ctx.stroke()
    ctx.restore()
  }

  _hud(ctx, game) {
    // 剩餘石子（🪨 滿 ◻ 空）
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = '20px system-ui'
    let s = '箭：'
    for (let i = 0; i < game.totalStones; i++) s += i < game.stonesLeft ? '🏹' : '·' // 用中點當「已射出」,避免 ◻ 在某些字型變豆腐框
    ctx.fillStyle = '#3a2c1a'
    ctx.fillText(s, 16, 24)
    // 年齡檔標籤（右上）
    if (game.age) {
      ctx.textAlign = 'right'
      ctx.font = 'bold 16px system-ui'
      ctx.fillStyle = '#5a4a2a'
      ctx.fillText(`${game.age.emoji} ${game.age.label}`, WORLD.w - 16, 22)
    }
    // 青少年計時挑戰：瞄準/飛行時顯示碼錶（純挑戰提示，不影響過關）
    if (game.timed && (game.state === 'aim' || game.state === 'flying')) {
      ctx.textAlign = 'right'
      ctx.font = 'bold 18px system-ui'
      ctx.fillStyle = '#c0392b'
      ctx.fillText(`⏱ ${game.clock.toFixed(1)}s`, WORLD.w - 16, 46)
    }
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
