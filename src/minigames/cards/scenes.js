// 卡片關的 Canvas 場景繪圖（2026-06-14,兒童營投影用）。
//
// 兩層,呼應使用者需求:
//  1) drawBackdrop —— 通用輕量背景動畫(漸層 + 呼吸光暈 + 上飄微粒),所有卡片關共用、一次受惠。
//  2) CORNELIUS —— 福音奇兵專屬的「逐幕手繪動畫」(像約拿第 6 關蓖麻樹),不只 emoji。
//
// 全部零美術檔、純 Canvas 圖形、可離線。每個 drawer 簽名 = (ctx, w, h, t)，t 為秒。
// 座標一律以 k = h/240 等比縮放,任何畫布大小都好看。

const lerp = (a, b, t) => a + (b - a) * t
const TAU = Math.PI * 2

// 把十六進位色調亮/調暗(amt: -100..100)
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  r = Math.max(0, Math.min(255, r + amt))
  g = Math.max(0, Math.min(255, g + amt))
  b = Math.max(0, Math.min(255, b + amt))
  return `rgb(${r},${g},${b})`
}

// ---- 通用背景:漸層 + 呼吸光暈 + 上飄微粒(給所有卡片關當底,比純 emoji 高級很多)----
export function drawBackdrop(ctx, w, h, t, accent = [58, 141, 141]) {
  const [ar, ag, ab] = accent
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, `rgb(${(ar + 255) >> 1},${(ag + 255) >> 1},${(ab + 255) >> 1})`)
  g.addColorStop(1, `rgb(${(ar + 255 * 3) >> 2},${(ag + 255 * 3) >> 2},${(ab + 255 * 3) >> 2})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // 呼吸的中央光暈
  const glow = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, h * (0.7 + Math.sin(t * 0.8) * 0.06))
  glow.addColorStop(0, `rgba(255,255,255,${0.28 + Math.sin(t * 0.8) * 0.06})`)
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
  // 上飄微粒
  for (let i = 0; i < 16; i++) {
    const sp = 0.6 + (i % 5) * 0.12
    const y = h - (((t * sp * 26 + i * 53) % (h + 30)))
    const x = (i * 67 % w) + Math.sin(t * 0.7 + i) * 14
    const r = (1.2 + (i % 3)) * (h / 240)
    ctx.fillStyle = `rgba(255,255,255,${0.10 + (i % 4) * 0.04})`
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
  }
}

// ---- 角色小人(可換袍色/頭飾/手勢/表情),福音奇兵各幕共用 ----
function person(ctx, x, gy, k, o = {}) {
  const robe = o.robe || '#6a8caf', skin = '#e8bb8d'
  const kneel = o.pose === 'kneel' || o.pose === 'bow'
  const H = (kneel ? 78 : 108) * k
  const headR = 12 * k
  const hy = gy - H + headR
  const bodyTop = hy + headR * 0.7
  const bodyBot = gy - 2 * k
  // 腿(跪/站)
  ctx.strokeStyle = shade(robe, -40); ctx.lineWidth = 5 * k; ctx.lineCap = 'round'
  if (kneel) {
    ctx.beginPath(); ctx.moveTo(x - 6 * k, bodyBot - 6 * k); ctx.lineTo(x - 12 * k, gy); ctx.lineTo(x - 2 * k, gy); ctx.stroke()
  } else {
    const stride = o.walk ? Math.sin(o.walk) * 7 * k : 0
    ctx.beginPath()
    ctx.moveTo(x - 6 * k, bodyBot - 4 * k); ctx.lineTo(x - 6 * k - stride, gy)
    ctx.moveTo(x + 6 * k, bodyBot - 4 * k); ctx.lineTo(x + 6 * k + stride, gy); ctx.stroke()
  }
  // 袍(梯形)
  ctx.fillStyle = robe
  ctx.beginPath()
  ctx.moveTo(x - 17 * k, bodyBot); ctx.lineTo(x + 17 * k, bodyBot)
  ctx.lineTo(x + 10 * k, bodyTop); ctx.lineTo(x - 10 * k, bodyTop); ctx.closePath(); ctx.fill()
  // 腰帶
  ctx.fillStyle = shade(robe, -50); ctx.fillRect(x - 14 * k, bodyBot - 22 * k, 28 * k, 4 * k)
  // 手臂(依手勢)
  ctx.strokeStyle = robe; ctx.lineWidth = 6 * k; ctx.lineCap = 'round'
  const sh = bodyTop + 6 * k // 肩
  ctx.beginPath()
  if (o.arms === 'up') { ctx.moveTo(x - 9 * k, sh); ctx.lineTo(x - 16 * k, sh - 20 * k); ctx.moveTo(x + 9 * k, sh); ctx.lineTo(x + 16 * k, sh - 20 * k) }
  else if (o.arms === 'pray') { ctx.moveTo(x - 9 * k, sh); ctx.lineTo(x - 1 * k, sh + 8 * k); ctx.moveTo(x + 9 * k, sh); ctx.lineTo(x + 1 * k, sh + 8 * k) }
  else if (o.arms === 'reach') { ctx.moveTo(x - 9 * k, sh); ctx.lineTo(x - 13 * k, sh + 14 * k); ctx.moveTo(x + 9 * k, sh); ctx.lineTo(x + (o.reach || 22) * k, sh - (o.reachUp || 6) * k) }
  else if (o.arms === 'speak') { ctx.moveTo(x - 9 * k, sh); ctx.lineTo(x - 14 * k, sh + 10 * k); ctx.moveTo(x + 9 * k, sh); ctx.lineTo(x + 17 * k, sh - 12 * k) }
  else { ctx.moveTo(x - 9 * k, sh); ctx.lineTo(x - 12 * k, sh + 18 * k); ctx.moveTo(x + 9 * k, sh); ctx.lineTo(x + 12 * k, sh + 18 * k) }
  ctx.stroke()
  if (o.arms === 'reach') { // 伸手(拉人起來)畫出手掌端點
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x + (o.reach || 22) * k, sh - (o.reachUp || 6) * k, 3.5 * k, 0, TAU); ctx.fill()
  }
  // 頭
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, hy, headR, 0, TAU); ctx.fill()
  // 頭飾
  if (o.head === 'helmet') { // 羅馬軍官盔
    ctx.fillStyle = '#b9482e'; ctx.beginPath(); ctx.arc(x, hy - 2 * k, headR + 1 * k, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#d96a3a'; ctx.fillRect(x - 2 * k, hy - headR - 8 * k, 4 * k, 8 * k) // 盔冠
  } else if (o.head === 'crown') {
    ctx.fillStyle = '#e8b53a'; ctx.fillRect(x - headR, hy - headR - 4 * k, headR * 2, 5 * k)
  } else { // 頭巾
    ctx.fillStyle = o.headColor || shade(robe, 60); ctx.beginPath(); ctx.arc(x, hy - 1 * k, headR, Math.PI, 0); ctx.fill()
    ctx.fillStyle = shade(o.headColor || shade(robe, 60), -30); ctx.fillRect(x - headR, hy - 2 * k, headR * 2, 3 * k)
  }
  // 鬍子(o.beard)
  if (o.beard) { ctx.fillStyle = '#cfcabf'; ctx.beginPath(); ctx.moveTo(x - 5 * k, hy + 4 * k); ctx.lineTo(x + 5 * k, hy + 4 * k); ctx.lineTo(x, hy + 12 * k); ctx.closePath(); ctx.fill() }
  // 臉:眼 + 表情
  ctx.fillStyle = '#3a2c22'
  ctx.beginPath(); ctx.arc(x - 3.4 * k, hy + 0.5 * k, 1.4 * k, 0, TAU); ctx.arc(x + 3.4 * k, hy + 0.5 * k, 1.4 * k, 0, TAU); ctx.fill()
  ctx.strokeStyle = '#7a3b30'; ctx.lineWidth = 1.6 * k; ctx.lineCap = 'round'; ctx.beginPath()
  if (o.face === 'joy') ctx.arc(x, hy + 3 * k, 3 * k, 0.15 * Math.PI, 0.85 * Math.PI)
  else if (o.face === 'awe') { ctx.fillStyle = '#7a3b30'; ctx.ellipse(x, hy + 5 * k, 2 * k, 2.6 * k, 0, 0, TAU); ctx.fill(); ctx.beginPath() }
  else if (o.face === 'worry') ctx.arc(x, hy + 7 * k, 2.4 * k, Math.PI * 1.15, Math.PI * 1.85)
  else { ctx.moveTo(x - 2.4 * k, hy + 4 * k); ctx.lineTo(x + 2.4 * k, hy + 4 * k) }
  ctx.stroke()
}

// 房子(右側,門口戲用)
function house(ctx, x, gy, k) {
  ctx.fillStyle = '#cdaa78'; ctx.fillRect(x - 46 * k, gy - 92 * k, 92 * k, 92 * k)
  ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.moveTo(x - 56 * k, gy - 88 * k); ctx.lineTo(x + 56 * k, gy - 88 * k); ctx.lineTo(x, gy - 124 * k); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#5a4026'; ctx.fillRect(x - 14 * k, gy - 56 * k, 28 * k, 56 * k) // 門洞
  ctx.fillStyle = '#caa05a'; ctx.fillRect(x + 10 * k, gy - 30 * k, 3 * k, 6 * k)
}

// 火舌(聖靈降臨)
function flame(ctx, x, y, k, t, i) {
  const fl = 1 + Math.sin(t * 9 + i) * 0.18
  const g = ctx.createLinearGradient(x, y, x, y - 22 * k * fl)
  g.addColorStop(0, '#ffd34d'); g.addColorStop(1, '#e8542a')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x - 6 * k, y)
  ctx.quadraticCurveTo(x - 7 * k, y - 12 * k * fl, x, y - 22 * k * fl)
  ctx.quadraticCurveTo(x + 7 * k, y - 12 * k * fl, x + 6 * k, y)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle = 'rgba(255,245,200,0.85)'
  ctx.beginPath(); ctx.ellipse(x, y - 7 * k, 2.4 * k, 5 * k * fl, 0, 0, TAU); ctx.fill()
}

// 鴿子(聖靈)
function dove(ctx, x, y, k, t) {
  const flap = Math.sin(t * 4) * 0.5
  ctx.fillStyle = '#fbfbff'
  ctx.beginPath(); ctx.ellipse(x, y, 9 * k, 5 * k, 0, 0, TAU); ctx.fill() // 身
  ctx.beginPath(); ctx.arc(x + 7 * k, y - 4 * k, 3.5 * k, 0, TAU); ctx.fill() // 頭
  ctx.save(); ctx.translate(x, y)
  ctx.rotate(flap)
  ctx.beginPath(); ctx.ellipse(-2 * k, -2 * k, 11 * k, 4 * k, -0.5, 0, TAU); ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#e8a13a'; ctx.beginPath(); ctx.moveTo(x + 10 * k, y - 4 * k); ctx.lineTo(x + 15 * k, y - 3 * k); ctx.lineTo(x + 10 * k, y - 2 * k); ctx.closePath(); ctx.fill()
}

// 從天而降的光束(禱告/聖靈)
function rays(ctx, w, h, t, cx, alpha) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = -3; i <= 3; i++) {
    const a = alpha * (0.5 + 0.5 * Math.abs(Math.sin(t * 1.5 + i)))
    ctx.fillStyle = `rgba(255,244,200,${a * 0.5})`
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx + i * 16 - 10, h)
    ctx.lineTo(cx + i * 16 + 10, h)
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

// ===================== 福音奇兵 · 逐幕手繪動畫 =====================

// 1) 哥尼流禱告(徒 10:1-4)——軍官跪著禱告,天上的光臨到他
function pray(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#3b2f63'); sky.addColorStop(0.6, '#7a5a8c'); sky.addColorStop(1, '#e8b98c')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  rays(ctx, w, h, t, w * 0.5, 0.9)
  // 天使榮光
  const ang = ctx.createRadialGradient(w * 0.5, h * 0.16, 0, w * 0.5, h * 0.16, 60 * k)
  ang.addColorStop(0, `rgba(255,250,220,${0.7 + Math.sin(t * 2) * 0.2})`); ang.addColorStop(1, 'rgba(255,250,220,0)')
  ctx.fillStyle = ang; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.16, 60 * k, 0, TAU); ctx.fill()
  // 地
  ctx.fillStyle = '#6a5640'; ctx.fillRect(0, gy, w, h - gy)
  // 哥尼流(羅馬軍官)跪禱
  person(ctx, w * 0.5, gy, k * 1.15, { robe: '#9c3b3b', head: 'helmet', pose: 'kneel', arms: 'pray', face: 'awe', beard: true })
  // 上飄的禱告微光
  for (let i = 0; i < 8; i++) {
    const y = gy - ((t * 30 + i * 40) % (gy - h * 0.22))
    ctx.fillStyle = `rgba(255,240,190,${0.5 - (gy - y) / (gy) * 0.5})`
    ctx.beginPath(); ctx.arc(w * 0.5 + Math.sin(t * 2 + i) * 18 * k, y, 2.4 * k, 0, TAU); ctx.fill()
  }
}

// 2) 屋頂的異象(徒 10:11-16)——一塊大布從天降下,裡面有各樣走獸,降下又收上三次
function vision(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#a9d3ea'); sky.addColorStop(1, '#f1e6c6')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  // 屋頂(彼得站的平台)
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(0, gy, w, h - gy)
  ctx.fillStyle = '#b98a52'; ctx.fillRect(w * 0.08, gy - 10 * k, w * 0.30, 10 * k)
  // 大布:降下又收上(三次)
  const cyc = (Math.sin(t * 1.6) * 0.5 + 0.5) // 0..1
  const sheetY = lerp(h * 0.06, h * 0.4, cyc)
  const cx = w * 0.62, sw = 150 * k
  ctx.strokeStyle = 'rgba(120,120,140,0.7)'; ctx.lineWidth = 2 * k
  for (const dx of [-sw / 2, sw / 2]) { ctx.beginPath(); ctx.moveTo(cx + dx, sheetY); ctx.lineTo(cx + dx * 0.4, 0); ctx.stroke() }
  // 布面
  ctx.fillStyle = 'rgba(250,248,240,0.95)'
  ctx.beginPath()
  ctx.moveTo(cx - sw / 2, sheetY)
  ctx.quadraticCurveTo(cx, sheetY + 26 * k, cx + sw / 2, sheetY)
  ctx.quadraticCurveTo(cx, sheetY - 12 * k, cx - sw / 2, sheetY)
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#c9c2b0'; ctx.lineWidth = 1.5 * k; ctx.stroke()
  // 布裡的走獸剪影(牛 / 鳥 / 蛇)
  ctx.fillStyle = '#6a5a44'
  const oxX = cx - 38 * k, oy = sheetY + 6 * k
  ctx.fillRect(oxX - 8 * k, oy - 8 * k, 16 * k, 9 * k); ctx.beginPath(); ctx.arc(oxX + 9 * k, oy - 6 * k, 4 * k, 0, TAU); ctx.fill() // 牛
  ctx.beginPath(); ctx.moveTo(cx + 6 * k, oy); ctx.lineTo(cx + 18 * k, oy - 8 * k); ctx.lineTo(cx + 14 * k, oy); ctx.closePath(); ctx.fill() // 鳥
  ctx.strokeStyle = '#6a5a44'; ctx.lineWidth = 2.4 * k; ctx.beginPath()
  for (let i = 0; i <= 12; i++) { const sx = cx + 28 * k + i * 2.6 * k; const sy = oy + Math.sin(i * 0.9 + t * 3) * 3 * k; i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy) } ctx.stroke() // 蛇
  // 彼得(仰望)
  person(ctx, w * 0.2, gy, k * 1.1, { robe: '#3a6a9c', head: 'turban', headColor: '#d8c39a', arms: 'up', face: 'awe', beard: true })
}

// 3) 彼得順服的腳步(徒 10:20-23)——彼得一行人往該撒利亞走向哥尼流的家
function walk(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#bfe0ee'); sky.addColorStop(1, '#eef0dc')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  // 遠山
  ctx.fillStyle = '#a9b48a'; ctx.beginPath(); ctx.moveTo(0, gy)
  for (let x = 0; x <= w; x += 30) ctx.lineTo(x, gy - 30 * k - Math.sin(x * 0.012) * 18 * k); ctx.lineTo(w, gy); ctx.closePath(); ctx.fill()
  // 路
  ctx.fillStyle = '#caa775'; ctx.fillRect(0, gy, w, h - gy)
  ctx.fillStyle = 'rgba(120,96,58,0.4)'
  const scroll = (t * 80) % (40 * k)
  for (let x = -40 * k - scroll; x < w; x += 40 * k) { ctx.beginPath(); ctx.ellipse(x, gy + 16 * k, 9 * k, 3 * k, 0, 0, TAU); ctx.fill() }
  house(ctx, w * 0.86, gy, k)
  // 一行人(彼得領頭 + 三位同行),邊走邊前進
  const drift = (Math.sin(t * 0.8) * 0.5 + 0.5) * w * 0.12
  const base = w * 0.16 + drift
  person(ctx, base + 70 * k, gy, k, { robe: '#7a8a52', head: 'turban', walk: t * 7 + 2 })
  person(ctx, base + 44 * k, gy, k, { robe: '#8a6a9c', head: 'turban', walk: t * 7 + 1 })
  person(ctx, base + 20 * k, gy, k, { robe: '#9c7a4a', head: 'turban', walk: t * 7 })
  person(ctx, base, gy, k * 1.12, { robe: '#3a6a9c', head: 'turban', headColor: '#d8c39a', beard: true, walk: t * 7, face: 'calm' }) // 彼得
}

// 4) 在哥尼流家門口(徒 10:25-26)——哥尼流俯伏拜,彼得拉他起來:「你起來,我也是人」
function door(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#cfe4ee'); sky.addColorStop(1, '#efe7d2')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  house(ctx, w * 0.8, gy, k * 1.2)
  ctx.fillStyle = '#c2a878'; ctx.fillRect(0, gy, w, h - gy)
  // 哥尼流俯伏(隨彼得的手起伏=被扶起)
  const rise = (Math.sin(t * 1.5) * 0.5 + 0.5) * 10 * k
  person(ctx, w * 0.6, gy - rise, k * 1.0, { robe: '#9c3b3b', head: 'helmet', pose: 'bow', arms: 'down', face: 'awe', beard: true })
  // 彼得伸手拉他起來
  person(ctx, w * 0.38, gy, k * 1.15, { robe: '#3a6a9c', head: 'turban', headColor: '#d8c39a', beard: true, arms: 'reach', reach: 26, reachUp: 10, face: 'calm' })
  // 對白
  speechBubble(ctx, w * 0.5, gy - 96 * k, k, '你起來,我也是人')
}

// 5) 神是不偏待人(徒 10:34-35)——彼得在滿屋外邦人面前宣講
function speak(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const wall = ctx.createLinearGradient(0, 0, 0, h)
  wall.addColorStop(0, '#e7d8b8'); wall.addColorStop(1, '#d3bd95')
  ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#b79b6e'; ctx.fillRect(0, gy, w, h - gy) // 地板
  // 彼得(左)講道
  person(ctx, w * 0.2, gy, k * 1.2, { robe: '#3a6a9c', head: 'turban', headColor: '#d8c39a', beard: true, arms: 'speak', face: 'joy' })
  // 話語波
  ctx.strokeStyle = 'rgba(60,106,156,0.5)'; ctx.lineWidth = 2.5 * k
  for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(w * 0.2 + 18 * k, gy - 60 * k, 14 * k + ph * 80 * k, -0.6, 0.6); ctx.stroke() }
  ctx.globalAlpha = 1
  // 滿屋外邦人(不同袍色 = 各國的人),點頭聆聽
  const colors = ['#a8553a', '#6a8a52', '#8a6a9c', '#c2873a', '#4a7a8a']
  for (let i = 0; i < 5; i++) {
    const nod = Math.sin(t * 3 + i) * 2 * k
    person(ctx, w * 0.52 + i * 42 * k, gy + nod, k * 0.92, { robe: colors[i], head: 'turban', face: 'calm' })
  }
}

// 6) 聖靈降臨(徒 10:44-46)——彼得還說話,聖靈就降在眾人身上,外邦人也說方言稱讚神
function spirit(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#f7e9b0'); sky.addColorStop(1, '#f0d59a')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  rays(ctx, w, h, t, w * 0.5, 1)
  ctx.fillStyle = '#bda072'; ctx.fillRect(0, gy, w, h - gy)
  dove(ctx, w * 0.5, h * 0.16, k * 1.3, t)
  // 一群人,頭上落下火舌、舉手讚美
  const colors = ['#3a6a9c', '#a8553a', '#6a8a52', '#8a6a9c', '#c2873a']
  for (let i = 0; i < 5; i++) {
    const x = w * 0.24 + i * 36 * k
    person(ctx, x, gy, k * 0.96, { robe: colors[i], head: 'turban', arms: 'up', face: 'joy' })
    flame(ctx, x, gy - 104 * k * 0.96, k, t, i)
  }
  // 上升的讚美光點
  for (let i = 0; i < 10; i++) {
    const y = gy - ((t * 40 + i * 30) % (gy - h * 0.2))
    ctx.fillStyle = `rgba(255,240,180,${0.6 - (gy - y) / gy * 0.6})`
    ctx.beginPath(); ctx.arc(w * 0.2 + i * 30 * k, y, 2 * k, 0, TAU); ctx.fill()
  }
}

// 7) 福音給萬人(徒 10:34)——各國的人同站在光中,一同敬拜
function allnations(ctx, w, h, t) {
  const k = h / 240, gy = h * 0.86
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#bfe7ea'); sky.addColorStop(1, '#fdf3d4')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(w / 2, h * 0.2, 0, w / 2, h * 0.2, 90 * k)
  glow.addColorStop(0, `rgba(255,250,210,${0.7 + Math.sin(t * 2) * 0.15})`); glow.addColorStop(1, 'rgba(255,250,210,0)')
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(w / 2, h * 0.2, 90 * k, 0, TAU); ctx.fill()
  dove(ctx, w * 0.5, h * 0.18, k, t)
  ctx.fillStyle = '#bda072'; ctx.fillRect(0, gy, w, h - gy)
  const colors = ['#3a6a9c', '#a8553a', '#6a8a52', '#8a6a9c', '#c2873a', '#4a7a8a']
  const n = 6, spread = (w * 0.72) / (n - 1)
  for (let i = 0; i < n; i++) {
    const sway = Math.sin(t * 2 + i) * 3 * k
    person(ctx, w * 0.14 + i * spread, gy + sway, k * 0.92, { robe: colors[i], head: 'turban', arms: 'up', face: 'joy' })
  }
  // 慶祝光點
  for (let i = 0; i < 14; i++) {
    const y = gy - ((t * 50 + i * 24) % (gy))
    ctx.fillStyle = `rgba(255,235,150,${0.7 - (gy - y) / gy * 0.7})`
    ctx.beginPath(); ctx.arc((i * 71) % w, y, 2.2 * k, 0, TAU); ctx.fill()
  }
}

// 對白泡泡
function speechBubble(ctx, cx, cy, k, text) {
  ctx.font = `${700} ${16 * k}px "Noto Sans TC","Microsoft JhengHei",sans-serif`
  const tw = ctx.measureText(text).width + 22 * k, bh = 30 * k
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  const x = cx - tw / 2
  ctx.beginPath(); ctx.roundRect(x, cy, tw, bh, 8 * k); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx - 6 * k, cy + bh); ctx.lineTo(cx + 6 * k, cy + bh); ctx.lineTo(cx, cy + bh + 9 * k); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#7a3b30'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy + bh / 2)
}

export const CORNELIUS = { pray, vision, walk, door, speak, spirit, allnations }
