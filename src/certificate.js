// 通關獎狀（2026-06-18）——純 Canvas 產生一張「○○完成○○之旅」的獎狀，可下載 PNG／列印。
// 零美術檔、可離線；給兒童營儀式感（過關截圖一張可存可印，家長愛）。
// 純 view 工具，與遊戲引擎無關。

const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'
const TC = '"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif'

// 畫一枚金色玫瑰花結印章（向量，不用美術檔）
function seal(ctx, cx, cy, r) {
  ctx.save()
  for (let i = 0; i < 16; i++) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 0.5) / 16) * Math.PI * 2
    ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r)
    ctx.lineTo(cx + Math.cos(a1) * r * 0.82, cy + Math.sin(a1) * r * 0.82)
    ctx.closePath()
    ctx.fillStyle = i % 2 ? '#d8b24a' : '#c79a36'
    ctx.fill()
  }
  ctx.fillStyle = '#b9863f'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#fdf6e3'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#a8324a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(r * 0.42)}px ${TC}`; ctx.fillText('得勝', cx, cy - r * 0.12)
  ctx.font = `${Math.round(r * 0.26)}px ${TC}`; ctx.fillText('在主裡', cx, cy + r * 0.28)
  // 緞帶
  ctx.fillStyle = '#a8324a'
  ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy + r * 0.7); ctx.lineTo(cx - r * 0.2, cy + r * 0.6); ctx.lineTo(cx - r * 0.28, cy + r * 1.5); ctx.lineTo(cx - r * 0.5, cy + r * 1.25); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx + r * 0.5, cy + r * 0.7); ctx.lineTo(cx + r * 0.2, cy + r * 0.6); ctx.lineTo(cx + r * 0.28, cy + r * 1.5); ctx.lineTo(cx + r * 0.5, cy + r * 1.25); ctx.closePath(); ctx.fill()
  ctx.restore()
}

// 產生獎狀 canvas（1000×720，橫式；列印/存圖都好看）。
export function makeCertificateCanvas({ name, journeyTitle, subtitle, score, scoreLabel, titleName, dateStr }) {
  const W = 1000, H = 720
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')
  // 羊皮紙底
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fdf6e3'); g.addColorStop(1, '#f1e3bf')
  x.fillStyle = g; x.fillRect(0, 0, W, H)
  // 金色雙邊框 + 角落小點
  x.strokeStyle = '#b9863f'; x.lineWidth = 10; x.strokeRect(30, 30, W - 60, H - 60)
  x.lineWidth = 3; x.strokeRect(48, 48, W - 96, H - 96)
  x.fillStyle = '#b9863f'
  for (const [cx, cy] of [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]]) { x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI * 2); x.fill() }
  // 標題
  x.textAlign = 'center'
  x.fillStyle = '#a8324a'; x.font = `bold 62px ${EMOJI}`; x.fillText('🏆', W / 2, 138)
  x.font = `bold 58px ${TC}`; x.fillText('通 關 獎 狀', W / 2, 210)
  // 內文
  x.fillStyle = '#6d5a3c'; x.font = `28px ${TC}`; x.fillText('茲證明', W / 2, 290)
  x.fillStyle = '#2e2016'; x.font = `bold 60px ${TC}`; x.fillText(name || '小勇士', W / 2, 360)
  x.fillStyle = '#3a2c1a'; x.font = `30px ${TC}`
  x.fillText(`完成了《${journeyTitle || '聖經闖關'}》`, W / 2, 422)
  if (subtitle) { x.fillStyle = '#8a7654'; x.font = `20px ${TC}`; x.fillText(subtitle, W / 2, 456) }
  // 頭銜 + 分數
  x.fillStyle = '#2e86ab'; x.font = `bold 30px ${TC}`
  const line = `${titleName ? `榮獲「${titleName}」　` : ''}${scoreLabel || '分數'} ${score} 分`
  x.fillText(line, W / 2, 510)
  // 印章
  seal(x, W / 2, 588, 46)
  // 落款
  x.fillStyle = '#6d5a3c'; x.font = `22px ${TC}`
  x.fillText('和平福音堂 ・ 暑假兒童營', W / 2, H - 78)
  x.font = `18px ${TC}`; x.fillStyle = '#8a7654'; x.fillText(dateStr || '', W / 2, H - 50)
  return c
}

function today() {
  try { return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return '' }
}

// 下載成 PNG（檔名含姓名與旅程）。
export function downloadCertificate(opts) {
  const c = makeCertificateCanvas({ dateStr: today(), ...opts })
  try {
    const a = document.createElement('a')
    a.download = `${(opts.name || '小勇士')}-${(opts.journeyTitle || '通關')}-獎狀.png`
    a.href = c.toDataURL('image/png')
    document.body.appendChild(a); a.click(); a.remove()
  } catch {}
}
