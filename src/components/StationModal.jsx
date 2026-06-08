import { useState } from 'react'

const TYPE_LABEL = {
  start: '起點',
  story: '劇情',
  event: '事件卡',
  quiz: '聖經問答',
  rest: '休息',
  end: '終點',
}

export default function StationModal({
  station,
  phase,
  result,
  scoreLabel,
  currentPlayer,
  onResolve,
  onFinish,
}) {
  const [selected, setSelected] = useState(null)
  const isResult = phase === 'result'
  // 每座城市都可能附一題問答（不再只有 quiz 類型的格子）。
  const hasQuiz = !!station.quiz

  const pickAnswer = (i) => {
    if (isResult) return
    setSelected(i)
    onResolve({ answerIndex: i })
  }

  return (
    <div className="modal__overlay">
      <div className={`modal modal--${station.type}`}>
        <div className="modal__head">
          <span className="modal__kind">{TYPE_LABEL[station.type] || '城市'}</span>
          <h2 className="modal__name">{station.name}</h2>
          <span className="modal__scripture">{station.scripture}</span>
        </div>

        <div className="modal__body">
          <p className="modal__text">{station.text}</p>

          {station.history && (
            <div className="history">
              <div className="history__title">📜 歷史小檔案</div>
              <dl className="history__grid">
                <dt>🗓️ 年代</dt>
                <dd>{station.history.year}</dd>
                <dt>📖 使徒行傳</dt>
                <dd>{station.scripture}（全程記在 13–14 章）</dd>
                <dt>👥 同行的人</dt>
                <dd>{station.history.companions}</dd>
                <dt>✨ 在這裡會遇見</dt>
                <dd>{station.history.willMeet}</dd>
                {station.history.notYetWritten && (
                  <>
                    <dt>✍️ 這時還沒寫的聖經</dt>
                    <dd>{station.history.notYetWritten}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {hasQuiz && (
            <div className="quiz">
              <p className="quiz__q">{station.quiz.question}</p>
              <div className="quiz__options">
                {station.quiz.options.map((opt, i) => {
                  let cls = 'quiz__opt'
                  if (isResult) {
                    if (i === station.quiz.answerIndex) cls += ' quiz__opt--correct'
                    else if (i === selected) cls += ' quiz__opt--wrong'
                    else cls += ' quiz__opt--dim'
                  }
                  return (
                    <button
                      key={i}
                      className={cls}
                      disabled={isResult}
                      onClick={() => pickAnswer(i)}
                    >
                      <span className="quiz__opt-letter">{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {isResult && result && (
            <div className={`result ${result.correct === false ? 'result--miss' : 'result--ok'}`}>
              {result.lines.map((line, i) => (
                <p key={i} className="result__line">
                  {line}
                </p>
              ))}
              {result.explanation && (
                <p className="result__explain">💡 {result.explanation}</p>
              )}
            </div>
          )}
        </div>

        <div className="modal__foot">
          {!isResult && !hasQuiz && (
            <button className="btn btn--primary" onClick={() => onResolve({})}>
              {station.type === 'event' ? '翻開事件卡 →' : '繼續 →'}
            </button>
          )}
          {!isResult && hasQuiz && <span className="modal__tip">選一個答案來賺取點數</span>}
          {isResult && (
            <button className="btn btn--primary" onClick={onFinish}>
              結束回合 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
