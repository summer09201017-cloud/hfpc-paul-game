// 骰子:2D 點數骰(平面九宮格,標準佈局)。
// ⚠ 為什麼不用 3D 立方體:CSS 3D(perspective / transform-style:preserve-3d)在部分 Chrome + 顯卡驅動
//   會讓 GPU 行程崩潰、整個分頁變白——尤其在地圖縮放重繪時(那顆 3D 骰子是常駐的 3D 合成層)。
//   症狀:一放大(~130%)整頁全白、DOM 卻還在、只在某些 PC 的 Chrome 發生。改成 2D 骰子=零 3D 合成層,
//   任何裝置都不會白。轉動時點數快速跳動(useGame 每 80ms 換一次)就有擲骰感;滾動時加 2D 輕晃(非 3D,安全)。
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Die2D({ value, rolling }) {
  const on = new Set(PIPS[value] || [])
  return (
    <div className={`die2d ${rolling ? 'die2d--rolling' : ''}`} aria-label={`骰子 ${value} 點`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`die2d__pip ${on.has(i) ? 'die2d__pip--on' : ''}`} />
      ))}
    </div>
  )
}

export default function DicePanel({ phase, diceFace, currentPlayer, onRoll }) {
  const canRoll = phase === 'idle'
  const rolling = phase === 'rolling'

  return (
    <div className="dice">
      <div className="dice__turn">
        輪到{' '}
        <strong style={{ color: currentPlayer?.color }}>{currentPlayer?.name}</strong>
      </div>
      <div className="dice__die">
        <Die2D value={diceFace} rolling={rolling} />
      </div>
      <button className="btn btn--primary dice__btn" disabled={!canRoll} onClick={onRoll}>
        {rolling ? '擲骰中…' : phase === 'idle' ? '🎲 擲骰子' : '前進中…'}
      </button>
    </div>
  )
}
