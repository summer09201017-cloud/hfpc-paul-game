import { useState } from 'react'
import MiniGameModal from './MiniGameModal'
import ActionScripture from './ActionScripture'

// 戰爭闖關 · 動作版「摩西舉手之戰」(出 17:8-13):亞瑪力人來攻擊,約書亞在山下爭戰,
//   摩西在山頂舉手——手舉起以色列就得勝、手垂下亞瑪力就得勝;亞倫與戶珥來扶手,直到日落。
//   反向 RPG:沒有攻擊鍵——得勝不是「我多能打」,是「撐住倚靠、有同工扶持」。
//   重用約拿引擎的 level 7(戰爭原型,本就可被任何旅程嵌入);?demo=moses-action 直接玩。
//   ★「戰爭關永久家=保羅 repo」最後一批:摩西/巴蘭動作版搬進 paul(自動部署),
//     大廳戰爭合輯改指向這裡,正式擺脫手動部署的 war-games(B 站)。
//   朗讀:結束卡經文逐字沿用引擎已烤好的句子(manifest f55f79fe),直接命中曉臻 mp3、零新烤製。
export default function MosesActionDemo() {
  const [runKey, setRunKey] = useState(0) // 改 key = 重新掛載從頭玩
  const [result, setResult] = useState(null)

  const minigame = {
    level: 7,
    winPoints: 3,
    label: '🙌 戰爭闖關 · 摩西舉手之戰',
    how: '亞瑪力人來攻擊,約書亞在山下爭戰。按住畫面／方向鍵／空白鍵 = 撐住摩西高舉的雙手;手一垂下,亞瑪力就得勢。手發沉時,亞倫與戶珥會來扶手——撐到日落就得勝(出 17)。',
    hudLabels: { start: '日出', goal: '日落得勝 🌄' },
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
            <span className="minigame__kind">戰爭闖關 · 摩西舉手之戰</span>
            <span className="minigame__title">🙌 不是倚靠勢力,乃是倚靠耶和華</span>
          </div>
          <div className="minigame__stage">
            <div className="minigame__intro">
              <p className="carddemo__score">
                {result.won
                  ? '🎉 撐到日落——叫以色列得勝的,從來不是一雙永不痠痛的手,是神!'
                  : '再試一次——撐不住的時候,呼求亞倫與戶珥來扶手'}
                {typeof result.score === 'number' ? `（得分 ${result.score}）` : ''}
              </p>
              <ActionScripture
                verse="「摩西何時舉手,以色列人就得勝;何時垂手,亞瑪力人就得勝。但摩西的手發沉,他們就搬石頭來,放在他以下,他就坐在上面。亞倫與戶珥扶著他的手,一個在這邊,一個在那邊,他的手就穩住,直到日落的時候。」"
                refLabel="出埃及記 17:8–13"
                refSpoken="經文出自出埃及記第十七章第八到十三節"
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
