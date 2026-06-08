export default function PlayerPanel({ players, currentPlayerId, scoreLabel }) {
  return (
    <div className="players">
      {players.map((p) => (
        <div
          key={p.id}
          className={`playercard ${p.id === currentPlayerId ? 'playercard--current' : ''}`}
          style={{ '--player-color': p.color }}
        >
          <div className="playercard__top">
            <span className="playercard__chip" style={{ background: p.color }}>
              {p.finished ? '👑' : p.name.slice(0, 1)}
            </span>
            <span className="playercard__name">{p.name}</span>
            {p.skipNext && <span className="playercard__tag">暫停一回合</span>}
          </div>
          <div className="playercard__score">
            <span className="playercard__score-num">{p.gospelPoints}</span>
            <span className="playercard__score-label">{scoreLabel}</span>
          </div>
          <div className="playercard__companions">
            <span className="playercard__companions-label">同工：</span>
            {p.companions.length > 0 ? (
              p.companions.map((c) => (
                <span key={c} className="playercard__companion">
                  {c}
                </span>
              ))
            ) : (
              <span className="playercard__companion playercard__companion--none">獨自一人</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
