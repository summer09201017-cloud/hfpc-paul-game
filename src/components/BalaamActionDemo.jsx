import { useState } from 'react'
import MiniGameModal from './MiniGameModal'
import ActionScripture from './ActionScripture'

// 戰爭闖關 · 動作版「反轉奇兵 · 巴蘭的驢」(民 22:21-35):巴蘭騎驢趕路,
//   看不見攔路拔刀的使者——先看見神的,竟是一頭驢。玩家操作的是驢(反轉視角):
//   用 ↑↓ 幫驢避開使者,走到底、耶和華開巴蘭的眼,他就看見了。
//   反向 RPG:不打仗、不鞭打——「看見神的攔阻就避開」才是得勝。
//   重用約拿引擎的 level 10(戰爭原型);?demo=balaam-action 直接玩。
//   ⚠ 與 ?demo=balaam(卡片版,cards spec)是同故事的 two-forms 雙版本,鍵名刻意分開。
//   朗讀:結束卡經文逐字沿用引擎已烤好的句子(manifest 6521fc6f),直接命中曉臻 mp3、零新烤製。
export default function BalaamActionDemo() {
  const [runKey, setRunKey] = useState(0) // 改 key = 重新掛載從頭玩
  const [result, setResult] = useState(null)

  const minigame = {
    level: 10,
    winPoints: 3,
    label: '🫏 反轉奇兵 · 巴蘭的驢',
    how: '巴蘭騎驢趕路,看不見攔路拔刀的使者。用 ↑ ↓（或點畫面上下）幫驢避開使者;走到底,耶和華開巴蘭的眼、使者顯現就過關(民 22)。',
    hudLabels: { start: '出發', goal: '巴蘭眼開 👁️' },
  }

  const replay = () => {
    setResult(null)
    setRunKey((k) => k + 1)
  }

  if (result) {
    return (
      <div className="carddemo">
        <div className="minigame minigame--demo">
          <div className="minigame__head">
            <span className="minigame__kind">戰爭闖關 · 反轉奇兵</span>
            <span className="minigame__title">🫏 驢比先知先看見神的使者</span>
          </div>
          <div className="minigame__stage">
            <div className="minigame__intro">
              <p className="carddemo__score">
                {result.won
                  ? '🎉 耶和華開了巴蘭的眼——先看見神的,竟是一頭驢!'
                  : '再試一次——看見神的攔阻,就避開'}
                {typeof result.score === 'number' ? `（得分 ${result.score}）` : ''}
              </p>
              <ActionScripture
                verse="「驢看見耶和華的使者站在路上,手裡有拔出來的刀,驢就從路上跨進田間……耶和華叫驢開口,對巴蘭說:我向你行了什麼,你竟打我這三次呢?……耶和華使巴蘭的眼目明亮,他就看見耶和華的使者站在路上,手裡有拔出來的刀。」"
                refLabel="民數記 22:21–35"
                refSpoken="經文出自民數記第二十二章第二十一到三十五節"
              />
              <button className="btn btn--primary" onClick={replay}>
                再玩一次 ↻
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <MiniGameModal key={runKey} minigame={minigame} onComplete={setResult} fill />
}
