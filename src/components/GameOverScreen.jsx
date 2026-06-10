const MEDALS = ['🥇', '🥈', '🥉']

export default function GameOverScreen({ status, scoreLabel, journey, nextJourney, onRestart, onContinue }) {
  const ranking = status.ranking || []
  const winner = ranking[0]

  return (
    <div className="modal__overlay">
      <div className="gameover">
        <h2 className="gameover__title">🎉 旅程結束！</h2>
        {winner && (
          <p className="gameover__winner">
            <strong style={{ color: winner.color }}>{winner.name}</strong> 的{scoreLabel}最高，
            宣教成果最豐盛，得勝啦！
          </p>
        )}

        <div className="gameover__ranking">
          {ranking.map((p, i) => (
            <div key={p.id} className="rankrow" style={{ '--player-color': p.color }}>
              <span className="rankrow__medal">{MEDALS[i] || `${i + 1}.`}</span>
              <span className="rankrow__chip" style={{ background: p.color }}>
                {p.name.slice(0, 1)}
              </span>
              <span className="rankrow__name">
                {p.name}
                {p.finished && <span className="rankrow__finished"> ✔ 抵達終點</span>}
              </span>
              <span className="rankrow__score">
                {p.gospelPoints} {scoreLabel}
              </span>
            </div>
          ))}
        </div>

        {nextJourney && (
          <button className="btn btn--primary gameover__btn" onClick={onContinue}>
            ⛵ 接續下一段：{nextJourney.title}
            <span className="gameover__carry">（帶著{scoreLabel}與裝備繼續宣教！）</span>
          </button>
        )}
        <button
          className={`btn ${nextJourney ? '' : 'btn--primary'} gameover__btn`}
          onClick={onRestart}
        >
          🔄 再玩一次
        </button>
      </div>
    </div>
  )
}
