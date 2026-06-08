// 跑馬燈：顯示一個大大的數字（1~3）。轉動時數字快速跳動，停下即為前進步數。
function Marquee({ value, rolling }) {
  return (
    <div className={`marquee ${rolling ? 'marquee--rolling' : ''}`}>
      <span className="marquee__num">{value}</span>
      <span className="marquee__unit">步</span>
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
        <Marquee value={diceFace} rolling={rolling} />
      </div>
      <button className="btn btn--primary dice__btn" disabled={!canRoll} onClick={onRoll}>
        {rolling ? '跑馬燈轉動中…' : phase === 'idle' ? '🎯 開始跑馬燈' : '前進中…'}
      </button>
    </div>
  )
}
