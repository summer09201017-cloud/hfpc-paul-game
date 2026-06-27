import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SlingDemo from './components/SlingDemo.jsx'
import JoashDemo from './components/JoashDemo.jsx'
import SaulSpearDemo from './components/SaulSpearDemo.jsx'
import NehemiahDemo from './components/NehemiahDemo.jsx'
import SlingshotDemo from './components/SlingshotDemo.jsx'
import JerichoDemo from './components/JerichoDemo.jsx'
import ElijahDemo from './components/ElijahDemo.jsx'
import RedSeaDemo from './components/RedSeaDemo.jsx'
import CardDemo from './components/CardDemo.jsx'
import CorneliusActionDemo from './components/CorneliusActionDemo.jsx'
import SaulActionDemo from './components/SaulActionDemo.jsx'
import JehoshaphatActionDemo from './components/JehoshaphatActionDemo.jsx'
import ArkPairsDemo from './components/ArkPairsDemo.jsx'
import ArkBuildDemo from './components/ArkBuildDemo.jsx'
import PaulSilasDemo from './components/PaulSilasDemo.jsx'
import { CARD_GAMES } from './minigames/cards/specs'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

// 註冊 Service Worker：安裝後可離線遊玩，並在有新版時自動更新。
registerSW({ immediate: true })

// 單獨玩 / 開發預覽 / 大廳深連結（不影響正式桌遊流程）：
//   ?demo=sling             → 大衛甩石（拋射動作關）
//   ?demo=joash             → 約阿施射得勝箭（拋射，王下 13；多箭、命中越多次=得勝越完全）
//   ?demo=saul-spear        → 掃羅擲槍·大衛閃避（閃避，撒上 18–19；反向 RPG，大衛不還手）
//   ?demo=nehemiah          → 尼希米修牆·躲敵人攻擊（閃避+築牆進度，尼 4、6；神為我們爭戰）
//   ?demo=slingshot         → 忿怒鳥式技術原型（拖曳彈弓 + 會倒的疊磚物理；之後做大衛甩石拖曳版/耶利哥城牆）
//   ?demo=elijah-action     → 盼望·以利亞重得力（收集/恢復動作關，王上 19）
//   ?demo=redsea            → 紅海奔逃（約拿引擎 level 8 動作關，出 14；不併保羅旅程）
//   ?demo=cornelius-action  → 福音·出發傳福音（跑酷，約帕→該撒利亞，徒 10）
//   ?demo=saul-action       → 大光·順服奔跑（曠野跑酷，大馬士革路→直街，徒 9）
//   ?demo=jehoshaphat-action→ 聖歌·約沙法唱詩得勝（約拿引擎 level 9，代下 20；戰爭關搬進 paul）
//   ?demo=arkpairs          → 挪亞·一公一母進方舟（翻牌記憶配對，創 6–7）
//   ?demo=arkbuild          → 挪亞·一步一步蓋方舟（依序放木板，創 6:14-22）
//   ?demo=<卡片關 key>      → 任一卡片關單獨玩，例 ?demo=cornelius（福音奇兵）
const demo = (() => {
  try {
    return new URLSearchParams(window.location.search).get('demo')
  } catch {
    return null
  }
})()

function pickRoot() {
  if (demo === 'sling') return <SlingDemo />
  if (demo === 'joash') return <JoashDemo />
  if (demo === 'saul-spear') return <SaulSpearDemo />
  if (demo === 'nehemiah') return <NehemiahDemo />
  if (demo === 'slingshot') return <SlingshotDemo />
  if (demo === 'jericho') return <JerichoDemo />
  if (demo === 'elijah-action') return <ElijahDemo />
  if (demo === 'redsea') return <RedSeaDemo />
  if (demo && CARD_GAMES[demo]) return <CardDemo specKey={demo} />
  if (demo === 'cornelius-action') return <CorneliusActionDemo />
  if (demo === 'saul-action') return <SaulActionDemo />
  if (demo === 'jehoshaphat-action') return <JehoshaphatActionDemo />
  if (demo === 'arkpairs') return <ArkPairsDemo />
  if (demo === 'arkbuild') return <ArkBuildDemo />
  if (demo === 'paulsilas') return <PaulSilasDemo />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{pickRoot()}</React.StrictMode>,
)
