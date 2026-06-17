import { getTitle } from '../core/engine'
import { downloadCertificate } from '../certificate'

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
          {ranking.map((p, i) => {
            // 最終頭銜（依分數門檻，journey.titles；沒設定就不顯示）——讓累積的點數看得到回報。
            const title = journey ? getTitle(journey, p.gospelPoints) : null
            return (
              <div key={p.id} className="rankrow" style={{ '--player-color': p.color }}>
                <span className="rankrow__medal">{MEDALS[i] || `${i + 1}.`}</span>
                <span className="rankrow__chip" style={{ background: p.color }}>
                  {p.name.slice(0, 1)}
                </span>
                <span className="rankrow__name">
                  {p.name}
                  {title && <span className="playercard__title rankrow__title">{title.name}</span>}
                  {p.finished && <span className="rankrow__finished"> ✔ 抵達終點</span>}
                </span>
                <span className="rankrow__score">
                  {p.gospelPoints} {scoreLabel}
                </span>
                {/* 通關獎狀：每位玩家可下載一張「○○完成○○之旅」的 PNG（兒童營儀式感、可列印） */}
                <button
                  className="rankrow__cert"
                  title="領取通關獎狀（下載圖片）"
                  aria-label={`領取 ${p.name} 的通關獎狀`}
                  onClick={() =>
                    downloadCertificate({
                      name: p.name,
                      journeyTitle: journey ? journey.title : '聖經闖關',
                      subtitle: journey ? journey.subtitle : '',
                      score: p.gospelPoints,
                      scoreLabel,
                      titleName: title ? title.name : '',
                    })
                  }
                >
                  🏆 獎狀
                </button>
              </div>
            )
          })}
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
