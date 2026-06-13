import { useMemo, useState } from 'react'

// 卡片流程闖關播放器（純 React，不用 Canvas 引擎；內容規格見 specs.js）。
// 與約拿 3/5/6 卡片關同精神：不會失敗——答錯溫柔重試，走完全部 step 即過關。
// 結束時呼叫 onComplete({ won:true, score })；score = 第一次就答對／排對的步數（被動加成由引擎結算）。
//
// 動畫（2026-06-14，兒童營投影用）：每進一步卡片淡入上移；step/intro/done 可選填 `scene`
// ——emoji 小劇場（走路 walk / 閃光 flash / 仆倒 fall / 上升 rise / 輪替 cycle / 呼吸 pulse），
// 例：彼得順服腳步 → 一行人 emoji 走向 🏠。答對有 ✨ 跳出。全用 CSS+emoji（零美術檔、可離線），
// 並尊重 prefers-reduced-motion。`scene` 是可選欄位——沒填的關卡行為完全不變（向後相容，桌遊嵌入版也不受影響）。

// Fisher–Yates 洗牌（UI 顯示用，與引擎無關，可用 Math.random）。
function shuffled(arr) {
  const a = arr.map((item, i) => ({ item, i }))
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[a[k], a[j]] = [a[j], a[k]]
  }
  return a
}

// emoji 小劇場：motion 決定怎麼動，cast 是演員 emoji，target 是終點（如 🏠）。純裝飾。
function Scene({ scene }) {
  if (!scene || !scene.motion) return null
  const cast = Array.isArray(scene.cast) ? scene.cast : []
  return (
    <div className={`scene scene--${scene.motion}`} aria-hidden="true">
      <div className="scene__cast">
        {cast.map((e, i) => (
          <span key={i} className="scene__actor" style={{ '--i': i }}>
            {e}
          </span>
        ))}
      </div>
      {scene.target && <span className="scene__target">{scene.target}</span>}
    </div>
  )
}

// 答對時的 ✨ 慶祝（純裝飾，全場看得到「對了！」）。
function Sparkles() {
  return (
    <div className="scene__sparkles" aria-hidden="true">
      {['✨', '🎉', '⭐', '✨', '🎊'].map((e, i) => (
        <span key={i} style={{ '--i': i }}>
          {e}
        </span>
      ))}
    </div>
  )
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
        <Scene scene={c.scene} />
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
        <Scene scene={c.scene || { motion: 'rise', cast: ['✨', '🎉', '✨'] }} />
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
        <Sparkles />
        <Scene scene={step.scene} />
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
        <Scene scene={step.scene} />
        <OrderStep step={step} onDone={orderDone} />
      </>
    )
  } else if (step.kind === 'info') {
    body = (
      <>
        <div className="mgcard__kicker mgcard__kicker--intro">
          {step.kicker}　{progress}
        </div>
        <Scene scene={step.scene} />
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
        <Scene scene={step.scene} />
        <h3 className="mgcard__q">{step.q}</h3>
        <div className="mgcard__choices">
          {step.choices.map((c, i) => (
            <button
              key={i}
              className="btn mgcard__choice"
              style={{ '--i': i }}
              onClick={() => answer(i)}
            >
              {c}
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="minigame__card minigame__card--pure" data-kind="cardgame">
      <div className="mgcard mgcard--anim" key={String(stage) + '-' + sub}>
        {body}
      </div>
    </div>
  )
}
