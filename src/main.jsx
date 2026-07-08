import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SlingDemo from './components/SlingDemo.jsx'
import JoashDemo from './components/JoashDemo.jsx'
import SaulSpearDemo from './components/SaulSpearDemo.jsx'
import NehemiahDemo from './components/NehemiahDemo.jsx'
import SlingshotDemo from './components/SlingshotDemo.jsx'
import JerichoDemo from './components/JerichoDemo.jsx'
import FishingDemo from './components/FishingDemo.jsx'
import Psalm100Demo from './components/Psalm100Demo.jsx'
import DavidHarpDemo from './components/DavidHarpDemo.jsx'
import MiriamDemo from './components/MiriamDemo.jsx'
import LoavesDemo from './components/LoavesDemo.jsx'
import GethsemaneDemo from './components/GethsemaneDemo.jsx'
import ShepherdDemo from './components/ShepherdDemo.jsx'
import SamuelDemo from './components/SamuelDemo.jsx'
import JosephDemo from './components/JosephDemo.jsx'
import WallguardDemo from './components/WallguardDemo.jsx'
import EzraDemo from './components/EzraDemo.jsx'
import SowerDemo from './components/SowerDemo.jsx'
import FoxesDemo from './components/FoxesDemo.jsx'
import SparksDemo from './components/SparksDemo.jsx'
import ArmorDemo from './components/ArmorDemo.jsx'
import BasketDemo from './components/BasketDemo.jsx'
import TempleDemo from './components/TempleDemo.jsx'
import GideonDemo from './components/GideonDemo.jsx'
import StewardDemo from './components/StewardDemo.jsx'
import LostCoinDemo from './components/LostCoinDemo.jsx'
import LotRunDemo from './components/LotRunDemo.jsx'
import ArkMatchDemo from './components/ArkMatchDemo.jsx'
import GoalKickDemo from './components/GoalKickDemo.jsx'
import HerdDemo from './components/HerdDemo.jsx'
import FragmentsDemo from './components/FragmentsDemo.jsx'
import FruitsDemo from './components/FruitsDemo.jsx'
import GemsDemo from './components/GemsDemo.jsx'
import MannaDemo from './components/MannaDemo.jsx'
import FlockDemo from './components/FlockDemo.jsx'
import HarpToyDemo from './components/HarpToyDemo.jsx'
import ShoreDemo from './components/ShoreDemo.jsx'
import ElijahDemo from './components/ElijahDemo.jsx'
import RedSeaDemo from './components/RedSeaDemo.jsx'
import CardDemo from './components/CardDemo.jsx'
import CorneliusActionDemo from './components/CorneliusActionDemo.jsx'
import SaulActionDemo from './components/SaulActionDemo.jsx'
import JehoshaphatActionDemo from './components/JehoshaphatActionDemo.jsx'
import MosesActionDemo from './components/MosesActionDemo.jsx'
import BalaamActionDemo from './components/BalaamActionDemo.jsx'
import ArkPairsDemo from './components/ArkPairsDemo.jsx'
import ArkBuildDemo from './components/ArkBuildDemo.jsx'
import PaulSilasDemo from './components/PaulSilasDemo.jsx'
import PeterSeaDemo from './components/PeterSeaDemo.jsx'
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
//   ?demo=jericho           → 耶利哥城牆（忿怒鳥式，書 6；繞城七次、蓄力吹角吶喊震塌城牆）
//   ?demo=fishing           → 下網得魚（收集，路 5；點水面下網收魚，整夜勞力→依你的話開到水深之處豐收）
//   ?demo=psalm100          → 讚美琴鍵（4K 下落式節奏，詩 100；琴鍵掉進「聖殿的門」按對=稱謝進門，歌照唱不會輸）
//   ?demo=davidharp         → 大衛彈琴（Guitar Hero 型節奏，撒上 16；琴弦由遠而近，彈得穩=掃羅的愁煩散開）
//   ?demo=harptoy           → 大衛彈琴・自由演奏（音樂玩具，撒上 16；五聲音階沒有錯的音，幼稚園版；與 davidharp 同故事兩玩法）
//   ?demo=loaves            → 五餅二魚・分餅（耶穌生平闖關③，約 6；分出去的不減反增，走完必過）
//   ?demo=petersea          → 彼得走海（FNF 節奏,太 14 定睛看耶穌;耶穌生平闖關④,嵌入自 hfpc-peter-sea-game）
//   ?demo=gethsemane        → 客西馬尼・警醒（耶穌生平闖關⑥，太 26；撐住不睡——結局不變、撐不住=溫柔敘事不會輸）
//   ?demo=shepherd          → 好牧人尋羊（迷宮尋路,路 15:3-7;循「咩~」找迷失的羊、扛回羊圈;永不會輸）
//   ?demo=moses-action      → 摩西舉手之戰（約拿引擎 L7,出 17:8-13;撐住舉手、亞倫戶珥扶手,撐到日落得勝）
//   ?demo=balaam-action     → 反轉奇兵・巴蘭的驢（約拿引擎 L10,民 22;上下閃避拔刀的使者,驢比先知先看見）
//   ?demo=miriam            → 米利暗擊鼓（太鼓達人型節奏，出 15:20-21；紅拍鼓/藍搖鈴，過紅海的得勝慶祝、不會輸）
//   ?demo=shore             → 海邊的復興（約 21；三次「你愛我嗎?」→ 餵養我的羊；炭火旁三次託付、跟從主）
//   ?demo=elijah-action     → 盼望·以利亞重得力（收集/恢復動作關，王上 19）
//   ?demo=redsea            → 紅海奔逃（約拿引擎 level 8 動作關，出 14；不併保羅旅程）
//   ?demo=cornelius-action  → 福音·出發傳福音（跑酷，約帕→該撒利亞，徒 10）
//   ?demo=saul-action       → 大光·順服奔跑（曠野跑酷，大馬士革路→直街，徒 9）
//   ?demo=jehoshaphat-action→ 聖歌·約沙法唱詩得勝（約拿引擎 level 9，代下 20；戰爭關搬進 paul）
//   ?demo=arkpairs          → 挪亞·一公一母進方舟（翻牌記憶配對，創 6–7）
//   ?demo=arkbuild          → 挪亞·一步一步蓋方舟（依序放木板，創 6:14-22）
//   ?demo=temple            → 活石蓋聖殿（落石砌合，王上 6:7＋彼前 2:5；砌合發光非爆炸、堆頂歇口氣不會輸）
//   ?demo=gideon            → 基甸拆祭壇（打磚塊，士 6:25-27；夜裡奉命拆巴力壇、球掉出僕人撿回不扣命）
//   ?demo=steward           → 好管家（經營管理②，太 25；銀袋分市集/坑，星等按忠心不按金額、永不會輸）
//   ?demo=lostcoin          → 失錢找物（找物/找碴，路 15:8-10；油燈照暗屋細細地找，直到找著、不會輸）
//   ?demo=lotrun            → 羅得紅綠燈（忍住誘惑向前跑，創 19；「回頭看一眼」鈕千萬別按，按了天使拉住不算輸）
//   ?demo=arkmatch          → 各從其類・動物歸艙（彈珠配對，創 7:14-16；配對=一起進方舟非爆破、耶和華關門、不會輸）
//   ?demo=goalkick          → 射門練習（憫安製作休閒關，無經文；拖球蓄力射門、守門員撲救時機窗，踢 10 球看進幾球）
//   ?demo=herd              → 趕羊入圈（撞球物理，約 10:16＋詩 23；拖曳牧羊犬撞羊入圈=歸聚、犬進門跑回不扣桿、不會輸）
//   ?demo=fragments         → 五餅二魚・收拾零碎（彈珠配對換皮，約 6:11-13；收進十二個籃子、免得有糟蹋的）
//   ?demo=fruits            → 聖靈果子・結果子（彈珠配對換皮，加 5:22-23；果子帶字、結到樹上、果子是聖靈結的）
//   ?demo=gems              → 大祭司胸牌・寶石歸位（歸位配對，出 28:17-21；十二寶石按支派歸位、名字帶在胸前）
//   ?demo=manna             → 嗎哪收取（交換配對/消消樂反向化，出 16:14-18；3 連=收進俄梅珥罐非爆裂、補位天降、不會輸）
//   ?demo=flock             → 雅各的斑點羊（撞球雙欄分類，創 30-31；純白進拉班欄、斑點進雅各欄、走錯欄牧人帶回、不會輸）
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
  if (demo === 'fishing') return <FishingDemo />
  if (demo === 'psalm100') return <Psalm100Demo />
  if (demo === 'davidharp') return <DavidHarpDemo />
  if (demo === 'miriam') return <MiriamDemo />
  if (demo === 'loaves') return <LoavesDemo />
  if (demo === 'gethsemane') return <GethsemaneDemo />
  if (demo === 'shepherd') return <ShepherdDemo />
  if (demo === 'samuel') return <SamuelDemo />
  if (demo === 'joseph') return <JosephDemo />
  if (demo === 'wallguard') return <WallguardDemo />
  if (demo === 'ezra') return <EzraDemo />
  if (demo === 'sower') return <SowerDemo />
  if (demo === 'foxes') return <FoxesDemo />
  if (demo === 'sparks') return <SparksDemo />
  if (demo === 'armor') return <ArmorDemo />
  if (demo === 'basket') return <BasketDemo />
  if (demo === 'temple') return <TempleDemo />
  if (demo === 'gideon') return <GideonDemo />
  if (demo === 'steward') return <StewardDemo />
  if (demo === 'lostcoin') return <LostCoinDemo />
  if (demo === 'lotrun') return <LotRunDemo />
  if (demo === 'arkmatch') return <ArkMatchDemo />
  if (demo === 'goalkick') return <GoalKickDemo />
  if (demo === 'herd') return <HerdDemo />
  if (demo === 'fragments') return <FragmentsDemo />
  if (demo === 'fruits') return <FruitsDemo />
  if (demo === 'gems') return <GemsDemo />
  if (demo === 'manna') return <MannaDemo />
  if (demo === 'flock') return <FlockDemo />
  if (demo === 'petersea') return <PeterSeaDemo />
  if (demo === 'harptoy') return <HarpToyDemo />
  if (demo === 'shore') return <ShoreDemo />
  if (demo === 'elijah-action') return <ElijahDemo />
  if (demo === 'redsea') return <RedSeaDemo />
  if (demo && CARD_GAMES[demo]) return <CardDemo specKey={demo} />
  if (demo === 'cornelius-action') return <CorneliusActionDemo />
  if (demo === 'saul-action') return <SaulActionDemo />
  if (demo === 'jehoshaphat-action') return <JehoshaphatActionDemo />
  if (demo === 'moses-action') return <MosesActionDemo />
  if (demo === 'balaam-action') return <BalaamActionDemo />
  if (demo === 'arkpairs') return <ArkPairsDemo />
  if (demo === 'arkbuild') return <ArkBuildDemo />
  if (demo === 'paulsilas') return <PaulSilasDemo />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{pickRoot()}</React.StrictMode>,
)
