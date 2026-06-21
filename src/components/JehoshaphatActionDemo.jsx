import { useState } from 'react'
import MiniGameModal from './MiniGameModal'
import ActionScripture from './ActionScripture'

// 聖歌奇兵 · 動作版「約沙法唱詩得勝」(代下 20):面對摩押/亞捫/西珥三國聯軍，
//   約沙法不靠刀劍，設立詩班走在軍隊前面讚美——神就設伏兵、敵軍自相擊殺。
//   反向 RPG:沒有攻擊鍵——得勝不是「我多強」，是帶領詩班「持續讚美、倚靠神」。
//   重用約拿引擎的 level 9(戰爭原型，本就可被任何旅程嵌入)；?demo=jehoshaphat-action 直接玩。
//   ★ 這是「戰爭關永久家=保羅 repo」的落地：聖歌動作版搬進 paul(自動部署)，
//     大廳的聖歌(動作版)改指向這裡，不再依賴手動部署的 war-games。
export default function JehoshaphatActionDemo() {
  const [runKey, setRunKey] = useState(0) // 改 key = 重新掛載從頭玩
  const [result, setResult] = useState(null)

  const minigame = {
    level: 9,
    winPoints: 3,
    label: '🎵 聖歌奇兵 · 約沙法唱詩得勝',
    how: '面對三國聯軍，約沙法沒有刀劍，只有讚美。按住畫面／方向鍵／空白鍵 = 帶領詩班持續讚美；讚美夠高，詩班就走向望樓、敵軍自相擊殺。撐住讚美到底就得勝（代下 20）。',
    hudLabels: { start: '隱基底', goal: '望樓得勝 🏔️' },
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
            <span className="minigame__kind">逆轉奇兵 · 聖歌奇兵</span>
            <span className="minigame__title">🎵 約沙法唱詩得勝</span>
          </div>
          <div className="minigame__stage">
            <div className="minigame__intro">
              <p className="carddemo__score">
                {result.won
                  ? '🎉 一唱歌讚美，耶和華就設伏兵——猶大不戰而勝！'
                  : '再試一次——不要懼怕，因為勝敗在乎神（代下 20:15）'}
                {typeof result.score === 'number' ? `（得分 ${result.score}）` : ''}
              </p>
              <ActionScripture verse="眾人方唱歌讚美的時候，耶和華就派伏兵擊殺那來攻擊猶大人的，他們就被打敗了。" refLabel="歷代志下 20:22" refSpoken="經文出自歷代志下第二十章第二十二節" />
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
