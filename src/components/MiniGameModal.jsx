import { useEffect, useRef, useState } from 'react'
import { Game } from '../minigames/jonah/game'
import { Game as SlingGame } from '../minigames/sling/game'
import { Game as PaulSilasGame } from '../minigames/paulsilas/game'
import { Game as PeterSeaGame } from '../minigames/petersea/game'
import { Game as ElijahGame } from '../minigames/elijah/game'
import { Game as ArkPairsGame } from '../minigames/arkpairs/game'
import { Game as ArkBuildGame } from '../minigames/arkbuild/game'
import { Game as LoavesGame } from '../minigames/loaves/game'
import { Game as GethsemaneGame } from '../minigames/gethsemane/game'
import { Game as ShepherdGame } from '../minigames/shepherd/game'
import { Game as SamuelGame } from '../minigames/samuel/game'
import { Game as JosephGame } from '../minigames/joseph/game'
import { Game as WallguardGame } from '../minigames/wallguard/game'
import { Game as EzraGame } from '../minigames/ezra/game'
import CardGame from '../minigames/cards/CardGame'
import { CARD_GAMES } from '../minigames/cards/specs'
import { sound } from '../audio/sound'

// 各關的標題與玩法說明（顯示在開始前的提示卡）。
const LEVELS = {
  1: {
    title: '🏃 上岸趕路',
    how: '空白鍵 / ↑ / 點畫面 = 跳，躲過障礙，跑到終點就過關！',
  },
  2: {
    title: '🌊 海上遇風暴',
    how: '船在風浪中搖晃！用 ← → 方向鍵（或點畫面左右兩側）把船扶正，撐過風暴就過關！',
  },
  3: {
    title: '🐋 大魚肚中的禱告',
    how: '黑暗魚腹中：按住 →（或畫面右半）往前走、↑/空白跳、↓/畫面左半 蹲下鑽過骨頭；跳起碰到禱告蠟燭，答對點亮五盞禱告之光就過關（這一關不會失敗）。',
  },
  4: {
    title: '🏜️ 曠野趕路 → 尼尼微',
    how: '空白鍵 / ↑ / 點畫面 = 跳，穿過曠野、躲過障礙，跑到尼尼微城門就過關！',
  },
  5: {
    title: '📣 尼尼微傳道',
    how: '按住 →（或畫面右半）在大城往前走，走到居民面前停下對話、宣告神的話；五位（含王）都悔改就過關（這一關不會失敗）。',
  },
  6: {
    title: '🌿 蓖麻樹的功課',
    how: '看五幕「神的安排」：蓖麻、蟲子、東風……每幕結束回答一個反思題（輕點可跳過動畫；這一關不會失敗）。',
  },
  // —— 戰爭闖關原型（出 17 / 出 14 / 代下 20 / 民 22），由 sync:jonah 自約拿引擎帶入 ——
  7: {
    title: '🙌 摩西舉手之戰',
    how: '摩西在山頂舉手，以色列就得勝。手會痠而下垂——按住畫面／方向鍵把手撐住；後段自己撐不住時，亞倫、戶珥會來扶手。撐到底就得勝（出 17）。',
  },
  8: {
    title: '🌊 紅海奔逃',
    how: '法老戰車在後追趕！先站住等候神把海完全分開，海路一開就快跑過乾海床、跳過礁石衝到對岸；海水合攏淹沒追兵就得勝（出 14）。空白鍵／↑／點畫面 = 跳；按住 →／D／畫面右側 = 加速衝刺。',
  },
  9: {
    title: '🎵 聖歌奇兵 · 約沙法',
    how: '沒有刀劍，只有讚美。按住畫面／方向鍵／空白鍵 = 帶領詩班持續讚美；讚美夠高詩班就前進、敵軍自亂。撐住讚美到底就得勝（代下 20）。',
  },
  10: {
    title: '🫏 反轉奇兵 · 巴蘭的驢',
    how: '用 ↑ ↓（或點畫面）上下移動驢，避開站在路上拔刀的使者（巴蘭看不見，只有驢看見）。走到底、神開巴蘭的眼就得勝（民 22）。',
  },
}

// 卡片流程關（3/5/6）：引擎的 ui.showXxx 由下面的 EmbedUI 接手畫成 React 卡片。
const CARD_LEVELS = new Set([3, 5, 6])

// 建立「會畫卡片的嵌入 UI」：把引擎的 showFish*/showPreach*/showGourd* 轉成 setCard(規格)，
// 其餘 ui 方法（標題/暫停鈕/過關選單…）一律無動作（Proxy 兜底）。
function makeEmbedUI(setCard) {
  const intro = (prefix, btn) => (L) =>
    setCard({
      kind: 'intro',
      prefix,
      kicker: L.title,
      sub: L.subtitle,
      ref: L.ref,
      verse: L.verse,
      body: L.intro,
      btn,
      act: `${prefix}-begin`,
    })
  const tryAgain = (prefix, body, btn) => () =>
    setCard({ kind: 'tryagain', prefix, body, btn, act: `${prefix}-retry` })

  const impl = {
    hide: () => setCard(null),
    // ---- 第三關 大魚肚 ----
    showFishIntro: intro('fish', '🚶 進入魚腹'),
    showFishQuestion: (st, idx, total) =>
      setCard({
        kind: 'question',
        prefix: 'fish',
        kicker: `🐋 魚腹中的禱告　${idx + 1} / ${total}`,
        q: st.q,
        choices: st.choices,
      }),
    showFishReveal: (st, last) =>
      setCard({
        kind: 'reveal',
        prefix: 'fish',
        kicker: '✓ 一同禱告',
        ref: st.ref,
        line: st.line,
        explain: st.explain,
        btn: last ? '🌅 浮上水面' : '繼續前行 →',
        act: 'fish-continue',
      }),
    showFishTryAgain: tryAgain(
      'fish',
      '這一段禱告還沒答對。再讀一次題目，想想約拿的心，然後再選一次。',
      '再試一次',
    ),
    // ---- 第五關 尼尼微傳道 ----
    showPreachIntro: intro('preach', '📣 進城傳道'),
    showPreachDialog: (st, idx, total) =>
      setCard({
        kind: 'question',
        prefix: 'preach',
        kicker: `📣 尼尼微傳道　${idx + 1} / ${total}`,
        name: `${st.emoji} ${st.name}`,
        say: st.say,
        q: st.q,
        choices: st.choices,
      }),
    showPreachReveal: (st, last) =>
      setCard({
        kind: 'reveal',
        prefix: 'preach',
        kicker: `🙇 ${st.name} 悔改了`,
        ref: st.ref,
        line: st.line,
        explain: st.explain,
        btn: last ? '🕊️ 看神的回應' : '繼續前行 →',
        act: 'preach-continue',
      }),
    showPreachTryAgain: tryAgain(
      'preach',
      '他還沒被說服。再讀一次他的話，想想經文怎麼說，然後再宣告一次。',
      '再說一次',
    ),
    // ---- 第六關 蓖麻樹 ----
    showGourdIntro: intro('gourd', '🌿 坐到棚下'),
    showGourdQuestion: (st, idx, total) =>
      setCard({
        kind: 'question',
        prefix: 'gourd',
        kicker: `🌿 蓖麻樹下　第 ${idx + 1} / ${total} 幕 · ${st.name}`,
        q: st.q,
        choices: st.choices,
      }),
    showGourdReveal: (st, last) =>
      setCard({
        kind: 'reveal',
        prefix: 'gourd',
        kicker: `✓ ${st.name}`,
        ref: st.ref,
        line: st.line,
        explain: st.explain,
        btn: last ? '📖 全書終' : '下一幕 →',
        act: 'gourd-continue',
      }),
    showGourdTryAgain: tryAgain(
      'gourd',
      '回想剛才那一幕發生了什麼，經文怎麼說，然後再選一次。',
      '再試一次',
    ),
  }
  return new Proxy(impl, { get: (t, k) => (k in t ? t[k] : () => {}) })
}

// 把約拿的即時小遊戲嵌進保羅彈窗：掛一個 canvas，啟動引擎（嵌入模式），
// 過關 / 失敗時呼叫 onComplete({ won, score, level })，由外層換算成福音點數。
export default function MiniGameModal({ minigame, onComplete, fill = false }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false) // fill 動作關的暫停鈕狀態
  const [card, setCard] = useState(null) // 3/5/6 卡片流程關目前顯示的卡（null=遊戲畫面）

  // 純 React 卡片流程關（in-repo，src/minigames/cards/）：站點用 minigame.cards 指定規格，
  // 不啟動 Canvas 引擎（與約拿 fork 無關，sync:jonah 不會碰到）。
  const cardSpec = minigame.cards ? CARD_GAMES[minigame.cards] : null
  // in-repo 拋射引擎（src/minigames/sling/）：站點用 minigame.engine:'sling' 指定，Canvas 即時關，
  // 同樣在約拿 fork 之外。未來其他投擲關（擲矛/射箭）也走這條。
  const isSling = minigame.engine === 'sling'
  // in-repo 恢復/收集引擎（src/minigames/elijah/）：站點用 minigame.engine:'elijah' 指定，Canvas 即時關，
  // 同樣在約拿 fork 之外（sync:jonah 不會碰）。撿餅水恢復體力、走到何烈山過關（王上 19）。
  const isElijah = minigame.engine === 'elijah'
  // in-repo 挪亞方舟關（src/minigames/arkpairs|arkbuild/）：站點用 minigame.engine:'arkpairs'/'arkbuild'。
  // arkpairs＝翻牌記憶「一公一母配對」（創 6–7）；arkbuild＝依序放木板蓋方舟（創 6:14-22）。都不會失敗。
  const isArkPairs = minigame.engine === 'arkpairs'
  const isArkBuild = minigame.engine === 'arkbuild'
  // in-repo 節拍音樂關（src/minigames/paulsilas/，保羅西拉半夜監牢唱詩讚美 徒16）：minigame.engine:'paulsilas'。
  const isPaulSilas = minigame.engine === 'paulsilas'
  // in-repo 節拍音樂關(彼得走海,太14 定睛看耶穌;耶穌生平之旅闖關④):minigame.engine:'petersea'。
  const isPeterSea = minigame.engine === 'petersea'
  // in-repo 分餅關（src/minigames/loaves/，五餅二魚 約6；耶穌生平之旅闖關③）：minigame.engine:'loaves'。
  // 收集反轉——分出去的不減反增(規則即講道);走完必過、不會輸。
  const isLoaves = minigame.engine === 'loaves'
  // in-repo 客西馬尼關（src/minigames/gethsemane/，太 26:36-46；耶穌生平之旅闖關⑥）：minigame.engine:'gethsemane'。
  // 撐住不睡——無論撐得多好,經文結局不變;撐不住=溫柔敘事,永遠 won:true(神學守法見引擎頂註)。
  const isGethsemane = minigame.engine === 'gethsemane'
  // in-repo 迷宮尋路關(src/minigames/shepherd/,好牧人尋羊 路 15:3-7):minigame.engine:'shepherd'。
  // 系列第一個迷宮機制——找迷失的羊、扛回羊圈;永不會輸(牧人必找到底,15:4)。
  const isShepherd = minigame.engine === 'shepherd'
  // in-repo 記憶序列關(src/minigames/samuel/,撒母耳聽呼喚 撒上 3):minigame.engine:'samuel'。
  // 新類型②記憶序列(Simon 型)——油燈依序亮、照順序點回(聽與順服);聽錯溫柔重聽、永不會輸。
  const isSamuel = minigame.engine === 'samuel'
  // in-repo 滑塊拼圖關(src/minigames/joseph/,約瑟的彩衣 創 37→50):minigame.engine:'joseph'。
  // 新類型③滑塊拼圖——點空格旁碎塊拼回彩衣;永不會輸,卡住有提示;神把破碎拼回(創 50:20)。
  const isJoseph = minigame.engine === 'joseph'
  // in-repo 塔防關(src/minigames/wallguard/,尼希米守望 尼 3-6):minigame.engine:'wallguard'。新類型⑤佈置守望——吹角退敵不殺敵。
  const isWallguard = minigame.engine === 'wallguard'
  // in-repo 護送關(src/minigames/ezra/,以斯拉護送 拉 8):minigame.engine:'ezra'。新類型⑥——沒有武器,唯一動作是禱告。
  const isEzra = minigame.engine === 'ezra'
  const level = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(minigame.level) ? minigame.level : 2 // 引擎嵌入白名單（見約拿 CLAUDE.md 嵌入契約）；7-10 = 戰爭原型 摩西/紅海/約沙法/巴蘭
  // 站點可在 minigame 裡覆寫 label / how（沒寫就用該關卡 / 卡片規格 / 引擎的預設）。
  const info = {
    title:
      minigame.label ||
      (cardSpec
        ? cardSpec.title
        : isSling
          ? '🪨 大衛戰歌利亞'
          : isElijah
            ? '🌅 盼望 · 以利亞重得力'
            : isArkPairs
              ? '🐘 一公一母進方舟'
              : isArkBuild
                ? '🔨 一步一步蓋方舟'
                : isPaulSilas
                  ? '🎶 半夜監牢唱詩讚美'
                  : LEVELS[level].title),
    how:
      minigame.how ||
      (cardSpec
        ? cardSpec.how
        : isSling
          ? '瞄準線會上下擺動，看準歌利亞的「額頭」，按空白鍵／點畫面放手甩石！五顆石子內擊中就得勝。'
          : isElijah
            ? '灰心的以利亞在曠野趕路。空白鍵／↑／點畫面 = 跳起來撿天使預備的餅🍞和水💧把體力補回來；體力歸零也沒關係，神會再扶你起來。走到何烈山就過關。'
            : isArkPairs
              ? '神叫動物自己成對來。翻開兩張牌，找出同一種的一公♂一母♀，牠們就住進方舟的房間。把所有動物都送進方舟就過關！'
              : isArkBuild
                ? '神把方舟的造法都吩咐了挪亞。點畫面，一塊一塊把木板放上去；方舟會一段一段長起來，把整艘方舟蓋完就過關！'
                : isPaulSilas
                  ? '保羅和西拉被下在監裡，約在半夜唱詩讚美神。用 ← ↓ ↑ → 或 D F J K 踩準每一拍，在患難中持續讚美——唱到底，神就震動監牢、開了監門！'
                  : LEVELS[level].how),
  }

  // 卡片按鈕 → 依前綴分派給引擎對應的 handler（嵌入模式下 boot 不註冊 ui 回呼，直接呼叫公開方法）。
  const dispatch = (act, ds = {}) => {
    const g = gameRef.current
    if (!g) return
    if (act.startsWith('fish-')) g.handleFishAction(act, ds)
    else if (act.startsWith('preach-')) g.handlePreachAction(act, ds)
    else if (act.startsWith('gourd-')) g.handleGourdAction(act, ds)
  }

  // 進裝置全螢幕並鎖橫向（fill 模式的單獨玩動作關用）：在使用者手勢中呼叫才有效。
  //   手機 App 內建瀏覽器可能擋 Fullscreen API（呼叫失敗就靜默忽略，CSS 仍會盡量滿版）。
  const enterFullscreenLandscape = () => {
    try {
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) {
        const p = el.requestFullscreen()
        if (p && p.then) p.then(() => { try { screen.orientation?.lock?.('landscape') } catch {} }).catch(() => {})
        else { try { screen.orientation?.lock?.('landscape') } catch {} }
      }
    } catch {}
  }
  const toggleFullscreen = () => {
    try { document.fullscreenElement ? document.exitFullscreen() : enterFullscreenLandscape() } catch {}
  }
  // 暫停/繼續（fill 動作關用；引擎的 pause/resume 在嵌入下 ui 呼叫是空殼、安全）。
  const togglePause = () => {
    const g = gameRef.current
    if (!g || !g.pause) return
    if (paused) { g.resume(); setPaused(false) }
    else { g.pause(); setPaused(true) }
  }

  // 在使用者點「開始挑戰」的手勢中啟動：此時 canvas 已排版好（renderer 量得到尺寸），
  // 音訊也能在手勢中解鎖。
  const begin = () => {
    if (started || gameRef.current) return
    if (fill) enterFullscreenLandscape() // 單獨玩動作關：開始就進全螢幕鎖橫向（手勢中最易成功）
    setStarted(true)
    sound.stopBgm() // 暫停保羅背景音樂，避免和小遊戲音效打架
    if (cardSpec) return // 卡片流程關：純 React，不啟動引擎
    if (isSling) {
      // 拋射關：自帶 renderer/input/audio，介面與約拿引擎相同（embed/onComplete/boot/destroy）。
      const game = new SlingGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isElijah) {
      // 恢復/收集關：自帶 renderer/input/audio，介面與約拿引擎相同（embed/onComplete/boot/destroy）。
      const game = new ElijahGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isLoaves) {
      // 分餅關(五餅二魚,約 6):同一套嵌入契約;分出去不減反增、走完必過。
      const game = new LoavesGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isShepherd) {
      // 好牧人尋羊(路 15):同一套嵌入契約;迷宮尋路,永不會輸。
      const game = new ShepherdGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 3,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isWallguard) {
      const game = new WallguardGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 3,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isEzra) {
      const game = new EzraGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 3,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isJoseph) {
      // 約瑟的彩衣(創 37→50):同一套嵌入契約;滑塊拼圖,永不會輸。
      const game = new JosephGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 3,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isSamuel) {
      // 撒母耳聽呼喚(撒上 3):同一套嵌入契約;記憶序列,聽錯溫柔重聽、永不會輸。
      const game = new SamuelGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 3,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isGethsemane) {
      // 客西馬尼關(太 26):同一套嵌入契約;撐住或睡著都溫柔走到同一個聖經結局、永遠過關。
      const game = new GethsemaneGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isArkPairs) {
      // 翻牌記憶配對關：自帶 renderer/input/audio，同一套嵌入契約。pairs 可由站點覆寫動物數。
      const game = new ArkPairsGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 5,
        pairs: minigame.pairs,
        difficulty: minigame.difficulty, // 站點可設難度旋鈕（easy/normal/hard，預設 normal）
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isArkBuild) {
      // 依序放木板蓋方舟關：同一套嵌入契約。
      const game = new ArkBuildGame(canvasRef.current, {
        embed: true,
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isPeterSea) {
      // 節拍音樂關(彼得走海):同一套嵌入契約(embed/onComplete/boot/destroy);mode 可由站點覆寫(walk/run)。
      const game = new PeterSeaGame(canvasRef.current, {
        embed: true,
        mode: minigame.mode || 'run',
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    if (isPaulSilas) {
      // 節拍音樂關（保羅西拉）：自帶 renderer/input/audio，同一套嵌入契約（embed/onComplete/boot/destroy）。
      const game = new PaulSilasGame(canvasRef.current, {
        embed: true,
        mode: minigame.mode || 'run',
        winPoints: minigame.winPoints || 5,
        onComplete: (result) => onComplete(result),
      })
      gameRef.current = game
      game.boot()
      return
    }
    // 1/2/4 純 Canvas 關用空殼 UI；3/5/6 卡片流程關用會畫卡片的 EmbedUI（嵌入契約）。
    const ui = CARD_LEVELS.has(level)
      ? makeEmbedUI(setCard)
      : new Proxy({}, { get: () => () => {} })
    const game = new Game(canvasRef.current, {
      ui,
      embed: true,
      level,
      mode: minigame.mode === 'walk' ? 'walk' : 'run',
      // 進度條地名:站點可在 minigame.hudLabels 覆寫(如約拿路線傳 { start:'約帕', goal:'往他施的船 ⛵' })。
      // 沒覆寫時:第 1 關用通用「起點 → 終點 ⛵」(同一跑酷引擎被任何旅程重用);
      // 其他關(如 4=曠野→尼尼微)傳 undefined,讓引擎用該關自己的預設(LEVELx.hud,嵌入契約)。
      hudLabels: minigame.hudLabels || (level === 1 ? { start: '起點', goal: '終點 ⛵' } : undefined),
      // 第二關結尾「拋約拿入海」只屬於約拿的故事：站點設 cast:false（保羅的海路闖關站）
      // 則撐過風暴即直接過關；約拿之旅的暴風雨站不設，維持拋約拿結尾。
      stormCast: minigame.cast,
      onComplete: (result) => onComplete(result),
    })
    gameRef.current = game
    game.boot()
  }

  // 卸載（小遊戲結束、彈窗關閉）時清理引擎並還原保羅背景音樂。
  useEffect(() => {
    return () => {
      if (gameRef.current) gameRef.current.destroy()
      sound.startBgm() // startBgm 內部會檢查靜音設定
    }
  }, [])

  // 全螢幕 / 轉向後重新置中（fill 動作關）：進全螢幕＋鎖橫向是非同步的，
  //   旋轉/版面定案前引擎就量了畫布尺寸 → 遊戲偏左上、要按第二次全螢幕才正。
  //   ★ 最強做法：用 ResizeObserver 盯「遊戲容器(.minigame__stage)」的實際尺寸——
  //     它一變(不管旋轉/轉場多慢)就補送 window 'resize'(引擎都監聽 → renderer.resize() 重量測置中)，
  //     不靠猜時間（之前用定時器在慢裝置上太早）。再加 fullscreenchange/orientationchange + 幾個延遲當保險。
  //     refit 只改 canvas 不改 stage，不會觸發 ResizeObserver 迴圈。對逐幀量測的引擎(arkpairs)無害。
  useEffect(() => {
    if (!fill) return
    const refit = () => { try { window.dispatchEvent(new Event('resize')) } catch {} }
    const onChange = () => { requestAnimationFrame(refit); setTimeout(refit, 120); setTimeout(refit, 350); setTimeout(refit, 700) }
    document.addEventListener('fullscreenchange', onChange)
    window.addEventListener('orientationchange', onChange)
    let ro = null
    const stage = canvasRef.current?.parentElement
    if (stage && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(refit) // 容器尺寸一變(全螢幕/旋轉安定的那一刻)就重新置中
      ro.observe(stage)
    }
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      window.removeEventListener('orientationchange', onChange)
      if (ro) ro.disconnect()
    }
  }, [fill])

  return (
    // fill=true（單獨玩的動作關 ?demo=，如福音/大光奇兵）：用 .carddemo 滿版外框，
    //   不要 .modal__overlay 那種置中小彈窗（手機橫向會只剩 880px 框 + 兩側留白 + 開場文字被切）。
    //   Canvas 引擎關再加 carddemo--game：舞台維持遊戲 16:9（引擎是 contain-fit，舞台若被拉成
    //   寬而矮，就會在內部留一大圈邊）；卡片關不加（它要可捲動的高卡片）。
    //   ★ 卡片關（cardSpec）一律走 .carddemo 滿版（不管 fill）：純 React 內容滿版才好讀——
    //     桌遊內以前 fill=false 走 .modal__overlay 置中小框，手機上每列字太少（窄而擠）；
    //     現在跟 ?demo= 單獨玩、跟聖歌/反轉動作版一樣「一顆開始鈕 → 大畫面」，每列字數一致。
    //     桌遊內的 Canvas 關（配對/蓋舟等，非 cardSpec）維持原本置中彈窗。
    <div
      className={
        cardSpec
          ? 'carddemo'
          : fill
            ? `carddemo carddemo--game${started ? ' carddemo--playing' : ''}` // 開始後隱藏標題列，遊戲放到最大
            : 'modal__overlay'
      }
    >
      {fill && started && !cardSpec && (
        <button className="carddemo__pause" onClick={togglePause} aria-label={paused ? '繼續' : '暫停'} title={paused ? '繼續' : '暫停'}>
          {paused ? '▶' : '⏸'}
        </button>
      )}
      {(fill || cardSpec) && (
        <button className="carddemo__fs" onClick={toggleFullscreen} aria-label="全螢幕" title="全螢幕">
          ⛶
        </button>
      )}
      <div className="minigame">
        <div className="minigame__head">
          <span className="minigame__kind">闖關挑戰</span>
          <span className="minigame__title">{info.title}</span>
        </div>
        <div className="minigame__stage">
          {!cardSpec && <canvas ref={canvasRef} className="minigame__canvas" />}
          {started && cardSpec && <CardGame spec={cardSpec} onComplete={onComplete} />}
          {!started && (
            <div className="minigame__intro">
              <p className="minigame__how">{info.how}</p>
              <button className="btn btn--primary" onClick={begin}>
                開始挑戰 →
              </button>
            </div>
          )}
          {card && (
            <div className="minigame__card" data-kind={card.kind}>
              <div className="mgcard">
                <div className={`mgcard__kicker mgcard__kicker--${card.kind}`}>{card.kicker || (card.kind === 'tryagain' ? '再想想～' : '')}</div>
                {card.sub && <p className="mgcard__sub">{card.sub}</p>}
                {card.name && <p className="mgcard__sub">{card.name}</p>}
                {card.say && <div className="mgcard__verse">「{card.say}」</div>}
                {card.ref && card.verse && (
                  <div className="mgcard__verse">
                    <span className="mgcard__ref">{card.ref}</span>
                    {card.verse}
                  </div>
                )}
                {card.ref && card.line && (
                  <div className="mgcard__verse">
                    <span className="mgcard__ref">{card.ref}</span>
                    {card.line}
                  </div>
                )}
                {card.body && <p className="mgcard__body">{card.body}</p>}
                {card.q && <h3 className="mgcard__q">{card.q}</h3>}
                {card.explain && <p className="mgcard__body">{card.explain}</p>}
                {card.choices && (
                  <div className="mgcard__choices">
                    {card.choices.map((c, i) => (
                      <button
                        key={i}
                        className="btn mgcard__choice"
                        onClick={() => dispatch(`${card.prefix}-choice`, { choice: String(i) })}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                {card.btn && card.act && (
                  <button className="btn btn--primary mgcard__btn" onClick={() => dispatch(card.act)}>
                    {card.btn}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
