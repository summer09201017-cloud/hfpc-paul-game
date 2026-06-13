import { useState } from 'react'
import InstallButton from './InstallButton'

// 從網址 ?journey=<key> 預選旅程(給「聖經遊戲總入口」大廳的卡片直接跳這條旅程用)。
// 沒帶參數、或參數不認得 → 退回第一條,行為與以前完全一樣(向後相容)。
function initialJourneyKey(journeys) {
  try {
    const k = new URLSearchParams(window.location.search).get('journey')
    if (k && journeys.some((j) => j.key === k)) return k
  } catch {}
  return journeys[0].key
}

export default function SetupScreen({ journeys, onStart }) {
  const [journeyKey, setJourneyKey] = useState(() => initialJourneyKey(journeys))
  const [count, setCount] = useState(2)
  const [names, setNames] = useState(['', '', '', ''])

  const sel = journeys.find((j) => j.key === journeyKey) || journeys[0]

  // 依 group 把旅程分區（保留原始順序）；沒給 group 的歸到「其他」。
  const groups = []
  for (const j of journeys) {
    const name = j.group || '其他'
    let g = groups.find((x) => x.name === name)
    if (!g) groups.push((g = { name, items: [] }))
    g.items.push(j)
  }

  const setName = (i, v) => {
    setNames((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }

  const start = () => {
    const configs = Array.from({ length: count }, (_, i) => ({ name: names[i] }))
    onStart(configs, journeyKey)
  }

  return (
    <div className="setup">
      <div className="setup__card">
        <h1 className="setup__title">📖 {sel.title}</h1>
        <p className="setup__subtitle">{sel.subtitle}</p>

        {journeys.length > 1 && (
          <div className="setup__section">
            <label className="setup__label">選一條旅程</label>
            {/* 分類卡片：依 group 分區，每區一排卡片。未來新增旅程只要在 useGame 的
                JOURNEYS 掛上 group/icon，這裡自動長出新卡片，不必改畫面。 */}
            {groups.map((g) => (
              <div key={g.name} className="jgroup">
                <div className="jgroup__title">{g.name}</div>
                <div className="jgroup__cards">
                  {g.items.map((j) => (
                    <button
                      key={j.key}
                      className={`jcard ${journeyKey === j.key ? 'jcard--active' : ''}`}
                      onClick={() => setJourneyKey(j.key)}
                      aria-pressed={journeyKey === j.key}
                    >
                      <span className="jcard__icon" aria-hidden="true">{j.icon || '📖'}</span>
                      <span className="jcard__text">
                        <span className="jcard__title">{j.title}</span>
                        {j.subtitle && <span className="jcard__sub">{j.subtitle}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
          擲骰 → 沿著旅程前進 → 停在站點觸發「劇情 / 事件 / 聖經問答 / 闖關小遊戲」→ 答對、過關得「
          {sel.scoreLabel}」。大家都走完旅程後，「{sel.scoreLabel}」最高的人獲勝（答對問答、把握事件才是關鍵，不是比誰先到）！
        </div>

        <button className="btn btn--primary setup__start" onClick={start}>
          開始旅程 🚢
        </button>

        <InstallButton />
      </div>
    </div>
  )
}
