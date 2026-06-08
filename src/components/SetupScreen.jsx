import { useState } from 'react'

const MAX_PLAYERS = 4

export default function SetupScreen({ journey, onStart }) {
  const [count, setCount] = useState(2)
  const [names, setNames] = useState(['', '', '', ''])

  const setName = (i, v) => {
    setNames((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }

  const start = () => {
    const configs = Array.from({ length: count }, (_, i) => ({ name: names[i] }))
    onStart(configs)
  }

  return (
    <div className="setup">
      <div className="setup__card">
        <h1 className="setup__title">📖 {journey.title}</h1>
        <p className="setup__subtitle">{journey.subtitle}</p>

        <div className="setup__section">
          <label className="setup__label">幾個人一起玩？</label>
          <div className="setup__count">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                className={`pill ${count === n ? 'pill--active' : ''}`}
                onClick={() => setCount(n)}
              >
                {n} 人
              </button>
            ))}
          </div>
          <p className="setup__hint">1 人＝單機練習；2～4 人＝教室 / 小組投影對戰。</p>
        </div>

        <div className="setup__section">
          <label className="setup__label">玩家名字（可留空）</label>
          <div className="setup__names">
            {Array.from({ length: count }, (_, i) => (
              <input
                key={i}
                className="setup__input"
                placeholder={`玩家 ${i + 1}`}
                value={names[i]}
                maxLength={8}
                onChange={(e) => setName(i, e.target.value)}
              />
            ))}
          </div>
        </div>

        <div className="setup__how">
          <strong>怎麼玩：</strong>
          擲骰 → 沿著保羅的旅程前進 → 停在城市觸發「劇情 / 事件 / 聖經問答」→ 答對得「
          {journey.scoreLabel}」。最先回到安提阿述職的人獲勝！
        </div>

        <button className="btn btn--primary setup__start" onClick={start}>
          開始旅程 🚢
        </button>
      </div>
    </div>
  )
}
