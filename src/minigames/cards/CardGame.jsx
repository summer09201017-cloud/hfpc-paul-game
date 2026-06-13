import { useMemo, useState } from 'react'

// 卡片流程闖關播放器（純 React，不用 Canvas 引擎；內容規格見 specs.js）。
// 與約拿 3/5/6 卡片關同精神：不會失敗——答錯溫柔重試，走完全部 step 即過關。
// 結束時呼叫 onComplete({ won:true, score })；score = 第一次就答對／排對的步數（被動加成由引擎結算）。

// Fisher–Yates 洗牌（UI 顯示用，與引擎無關，可用 Math.random）。
function shuffled(arr) {
  const a = arr.map((item, i) => ({ item, i }))
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[a[k], a[j]] = [a[j], a[k]]
  }
  return a
}

// 依序點選題：items 洗牌顯示，照原始順序逐一點對；點錯搖一下再試。
function OrderStep({ step, onDone }) {
  const pool = useMemo(() => shuffled(step.items), [step])
  const [picked, setPicked] = useState([]) // 已點對的原始索引（依序）
  const [shakeKey, setShakeKey] = useState(0) // 觸發搖晃動畫
  const [missed, setMissed] = useState(false) // 有沒有點錯過（計分用）

  const pick = (origIdx) => {
    if (origIdx === picked.length) {
      const next = [...picked, origIdx]
      setPicked(next)
      if (next.length === step.items.length) onDone(!missed)
    } else {
      setMissed(true)
      setShakeKey((k) => k + 1)
    }
  }

  return (
    <>
      <h3 className="mgcard__q">{step.prompt}</h3>
      {picked.length > 0 && (
        <ol className="mgorder__done">
          {picked.map((i) => (
            <li key={i}>{step.items[i]}</li>
          ))}
        </ol>
      )}
      <div className="mgcard__choices mgorder__pool" key={shakeKey}>
        {pool
          .filter(({ i }) => !picked.includes(i))
          .map(({ item, i }) => (
            <button key={i} className="btn mgcard__choice" onClick={() => pick(i)}>
              {item}
            </button>
          ))}
      </div>
      <p className="mgorder__hint">
        {picked.length === 0 ? '想想哪一個排最前面？' : `已排好 ${picked.length} / ${step.items.length}——下一個是？`}
      </p>
    </>
  )
}

export default function CardGame({ spec, onComplete }) {
  // stage：'intro' → 0..steps.length-1 → 'done'
  const [stage, setStage] = useState('intro')
  // 題目子狀態：'ask'（作答中）/ 'wrong'（答錯提示）/ 'reveal'（看解答）
  const [sub, setSub] = useState('ask')
  const [score, setScore] = useState(0)
  const [firstTry, setFirstTry] = useState(true)

  const stepIdx = typeof stage === 'number' ? stage : -1
  const step = stepIdx >= 0 ? spec.steps[stepIdx] : null
  const progress = stepIdx >= 0 ? `${stepIdx + 1} / ${spec.steps.length}` : ''

  const nextStep = () => {
    setSub('ask')
    setFirstTry(true)
    if (stepIdx + 1 < spec.steps.length) setStage(stepIdx + 1)
    else setStage('done')
  }

  const answer = (i) => {
    if (i === step.answer) {
      if (firstTry) setScore((s) => s + 1)
      setSub('reveal')
    } else {
      setFirstTry(false)
      setSub('wrong')
    }
  }

  const orderDone = (clean) => {
    if (clean) setScore((s) => s + 1)
    setSub('reveal')
  }

  let body = null
  if (stage === 'intro') {
    const c = spec.intro
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--intro">{c.kicker}</div>
        {c.ref && c.line && (
          <div className="mgcard__verse">
            <span className="mgcard__ref">{c.ref}</span>
            {c.line}
          </div>
        )}
        <p className="mgcard__body">{c.body}</p>
        <button className="btn btn--primary mgcard__btn" onClick={() => setStage(0)}>
          {c.btn}
        </button>
      </>
    )
  } else if (stage === 'done') {
    const c = spec.done
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--reveal">{c.kicker}</div>
        <p className="mgcard__body">{c.body}</p>
        <button
          className="btn btn--primary mgcard__btn"
          onClick={() => onComplete({ won: true, score, level: 'cards' })}
        >
          {c.btn}
        </button>
      </>
    )
  } else if (sub === 'wrong') {
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--tryagain">再想想～</div>
        <p className="mgcard__body">還差一點點！再讀一次題目，想想經文怎麼說，然後再選一次。</p>
        <button className="btn btn--primary mgcard__btn" onClick={() => setSub('ask')}>
          再試一次
        </button>
      </>
    )
  } else if (sub === 'reveal') {
    const r = step.reveal
    const last = stepIdx + 1 >= spec.steps.length
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--reveal">✓ {step.kicker}</div>
        {r.ref && r.line && (
          <div className="mgcard__verse">
            <span className="mgcard__ref">{r.ref}</span>
            {r.line}
          </div>
        )}
        {r.explain && <p className="mgcard__body">{r.explain}</p>}
        <button className="btn btn--primary mgcard__btn" onClick={nextStep}>
          {last ? '看結局 →' : '下一步 →'}
        </button>
      </>
    )
  } else if (step.kind === 'order') {
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--question">
          {step.kicker}　{progress}
        </div>
        <OrderStep step={step} onDone={orderDone} />
      </>
    )
  } else if (step.kind === 'info') {
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--intro">
          {step.kicker}　{progress}
        </div>
        {step.ref && step.line && (
          <div className="mgcard__verse">
            <span className="mgcard__ref">{step.ref}</span>
            {step.line}
          </div>
        )}
        <p className="mgcard__body">{step.body}</p>
        <button className="btn btn--primary mgcard__btn" onClick={nextStep}>
          {step.btn || '繼續 →'}
        </button>
      </>
    )
  } else {
    // question
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--question">
          {step.kicker}　{progress}
        </div>
        <h3 className="mgcard__q">{step.q}</h3>
        <div className="mgcard__choices">
          {step.choices.map((c, i) => (
            <button key={i} className="btn mgcard__choice" onClick={() => answer(i)}>
              {c}
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="minigame__card minigame__card--pure" data-kind="cardgame">
      <div className="mgcard">{body}</div>
    </div>
  )
}
