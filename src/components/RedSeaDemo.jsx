import { useState } from 'react'
import MiniGameModal from './MiniGameModal'

// 紅海奔逃的「單獨玩」入口（不綁桌遊）：開 ?demo=redsea 直接玩約拿引擎的 level 8（出 14）。
//   決策①(A)：動作版獨立存在、不併入保羅旅程；大廳「戰爭闖關合輯」的紅海卡指向這裡。
//   重用 MiniGameModal 的嵌入路徑（與桌遊挑戰站完全相同的 boot/onComplete 契約），engine 由 sync:jonah 帶入。
export default function RedSeaDemo() {
  const [runKey, setRunKey] = useState(0) // 改 key = 重新掛載 MiniGameModal 從頭玩
  const [result, setResult] = useState(null)

  const minigame = {
    level: 8,
    winPoints: 3,
    label: '🌊 紅海奔逃',
    how: '法老戰車在後追趕！先站住等候神把海完全分開，海路一開就快跑過乾海床、跳過礁石衝到對岸；海水合攏淹沒追兵就得勝（出 14）。空白鍵／↑／點畫面 = 跳。',
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
            <span className="minigame__kind">逆轉奇兵 · 戰爭闖關</span>
            <span className="minigame__title">🌊 紅海奔逃</span>
          </div>
          <div className="minigame__stage">
            <div className="minigame__intro">
              <p className="carddemo__score">
                {result.won ? '🎉 過了紅海！神為你開了一條路' : '追兵追上了——得勝不靠自己，再倚靠神試一次'}
                {typeof result.score === 'number' ? `（得分 ${result.score}）` : ''}
              </p>
              <button className="btn btn--primary" onClick={replay}>
                再玩一次 ↻
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <MiniGameModal key={runKey} minigame={minigame} onComplete={setResult} />
}
