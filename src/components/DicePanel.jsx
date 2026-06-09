// 骰子：標準六面骰，用點數（pip）呈現。轉動時點數快速跳動，停下即為前進步數。
// PIPS：3×3 格中哪幾格要亮點（標準骰子佈局）。
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Die({ value, rolling }) {
  const on = new Set(PIPS[value] || [])
  return (
    <div className={`die ${rolling ? 'die--rolling' : ''}`} aria-label={`骰子 ${value} 點`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`die__pip ${on.has(i) ? 'die__pip--on' : ''}`} />
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
        <Die value={diceFace} rolling={rolling} />
      </div>
      <button className="btn btn--primary dice__btn" disabled={!canRoll} onClick={onRoll}>
        {rolling ? '擲骰中…' : phase === 'idle' ? '🎲 擲骰子' : '前進中…'}
      </button>
    </div>
  )
}
