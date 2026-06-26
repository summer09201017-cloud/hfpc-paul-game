# 青少年深題草稿 — 但以理書(待 /cuv-check + 牧者審)

> 依 `/quiz` / [[quiz-authoring]] 流程產的**草稿**:這是把但以理問答站從「兒童事實題」補上一層**青少年深題**(神的主權、永遠的國、信心的代價、以神為中心)。
> 消費端:`src/data/journey-daniel.json` 的 `quizzes[]`(格式 `{ question, options[4], answerIndex, explanation, reward }`)。
>
> ⚠️ **上線前一定要做**:
> 1. ✅ **經文出處已核對(2026-06-26)**:全部 `scripture` ref 已對照和合本 `unv.json`(= cuv-scripture-mcp 預設版本)逐題核對,出處正確(3:18「即或不然」、5:26-28 數算/稱/分裂、7:13-14 人子得國度、6:10 一日三次禱告…皆相符)。`explanation` 是教導文案、非經文原文。
> 2. **仍需牧者審**(cuv 只是第一道閘):標 🔴 的題涉及教義/基督論/信心本質,用 [[pastor-review]] 打包送審,**審過才 merge main**(paul repo 鐵則:牧者通過前不 merge)。
> 3. 過 `npm run validate`(`answerIndex` 不越界、選項 4 個、id/欄位齊全)再併入 `journey-daniel.json`。

## 教導重點(先有重點,再回填題目)
1. **神掌管歷史**:神改變時候日期、廢王立王(但 2:21)——列國興衰不是偶然。
2. **永遠的國**:非人手鑿出的石頭打碎大像 = 神必立永不敗壞的國,指向基督(但 2:44-45;7:13-14)。
3. **信心的代價**:三友「即或不然」的信心——不以「神是否照我意施救」為條件(但 3:17-18)。
4. **敬虔不隨環境改變**:明知禁令仍照常向神禱告感謝(但 6:10)。
5. **神阻擋驕傲**:自高的王被降卑,直到承認至高者掌權(但 4;5)。
6. **倚靠神的憐憫**:但以理為百姓認罪代求,不靠自己的義(但 9)。

## 題目草稿(青少年級;sensitivity 🔴教義/🟡史實應用)

```jsonc
// 貼進 journey-daniel.json 對應站的 quizzes[](或新增問答站)。reward 4–5 = 深題給分高一點。
[
  {
    "scripture": "但以理書 2:44-45", "level": "青少年", "sensitivity": "🔴",
    "question": "尼布甲尼撒夢中,一塊「非人手鑿出」的石頭打碎大像,但以理說這預表什麼?",
    "options": ["巴比倫會永遠強盛", "天上的神要立一個永不敗壞的國", "波斯將取代巴比倫", "但以理會作王"],
    "answerIndex": 1,
    "explanation": "石頭非人手鑿出 → 不是靠人的勢力,而是神親自設立、永不敗壞的國;新約啟示這國的王就是基督(但 2:44)。",
    "reward": 5
  },
  {
    "scripture": "但以理書 3:17-18", "level": "青少年", "sensitivity": "🔴",
    "question": "面對火窯,三個朋友的話裡哪一句最能表現「真信心」?",
    "options": ["神一定會救我們脫離火窯", "『即或不然』,我們也絕不事奉你的神、不拜金像", "我們先拜一下再說", "讓但以理替我們求情"],
    "answerIndex": 1,
    "explanation": "信心不是『神一定照我意救我』,而是『就算神不照我所求的救,我仍只敬拜祂』——以神為神,不講條件(但 3:18)。",
    "reward": 5
  },
  {
    "scripture": "但以理書 2:21", "level": "青少年", "sensitivity": "🟡",
    "question": "但以理稱頌神時說,除了賜智慧聰明,神還掌管什麼?",
    "options": ["天氣與收成", "改變時候日期、廢王立王", "人的壽數長短", "戰爭的兵器"],
    "answerIndex": 1,
    "explanation": "神掌管歷史的進程與政權更替——列國興衰在祂手中,不是偶然(但 2:21)。",
    "reward": 4
  },
  {
    "scripture": "但以理書 6:10", "level": "青少年", "sensitivity": "🟡",
    "question": "明知「禁止向神禱告」的命令已蓋印,但以理怎麼做?",
    "options": ["暫停禱告以保命", "改成偷偷在心裡禱告", "照素常一日三次開窗向耶路撒冷禱告感謝", "逃離巴比倫"],
    "answerIndex": 2,
    "explanation": "他的敬虔不因環境或威脅改變——照素常公開禱告、且仍『感謝』神(但 6:10)。",
    "reward": 5
  },
  {
    "scripture": "但以理書 4:25", "level": "青少年", "sensitivity": "🟡",
    "question": "尼布甲尼撒被降為與野獸同食草,直到他承認什麼,國才歸還他?",
    "options": ["但以理比他聰明", "至高者在人的國中掌權,要將國賜給誰就賜給誰", "巴比倫的神最大", "他自己的功勞"],
    "answerIndex": 1,
    "explanation": "神阻擋驕傲;最強的王也必須承認『至高者掌權』,人不過是受託管理(但 4:25)。",
    "reward": 4
  },
  {
    "scripture": "但以理書 5:25-28", "level": "青少年", "sensitivity": "🟡",
    "question": "伯沙撒用聖殿器皿飲酒讚美偶像,牆上「彌尼、提客勒、毘勒斯」主要宣告什麼?",
    "options": ["巴比倫將更強大", "神已數算他國的年日使它終止、他被稱在天平裡顯出虧欠", "他會長壽", "但以理將作王"],
    "answerIndex": 1,
    "explanation": "褻瀆神、自高的結局是被神審判:國的年日被數算終止,生命被『稱』出虧欠(但 5:26-27)。",
    "reward": 5
  },
  {
    "scripture": "但以理書 7:13-14", "level": "青少年", "sensitivity": "🔴",
    "question": "但以理異象中「一位像人子的」駕雲而來,得了什麼?",
    "options": ["一座城", "權柄、榮耀、國度,萬民都事奉他,國度永不敗壞", "巴比倫的王位", "七十年的平安"],
    "answerIndex": 1,
    "explanation": "『人子』得永遠的國度與萬民的事奉——新約中耶穌正是以『人子』自稱,這異象指向祂(但 7:14)。",
    "reward": 5
  },
  {
    "scripture": "但以理書 9:3-5", "level": "青少年", "sensitivity": "🟡",
    "question": "但以理從耶利米書知道荒涼七十年將滿,他的回應是?",
    "options": ["慶祝即將歸回", "禁食披麻蒙灰,為百姓向神認罪代求", "責備耶利米", "立刻動身回耶路撒冷"],
    "answerIndex": 1,
    "explanation": "他不靠自己的義,而是為全民認罪、懇求神的憐憫——真敬虔包含為別人代求(但 9:3-5)。",
    "reward": 4
  }
]
```

## 接進去的步驟
1. 逐題 `/cuv-check` 核對 `scripture` 出處(可在有 cuv 的機器跑;或用 `cuv-scripture-mcp` lookup)。
2. 把要用的題塞進 `journey-daniel.json` 對應站的 `quizzes[]`(刪掉 `scripture`/`level`/`sensitivity` 這些草稿欄位,或保留——引擎只讀 `question/options/answerIndex/explanation/reward`)。
3. `npm run validate` → agent `bible-content-reviewer` 預審 → [[pastor-review]] 打包 🔴/🟡 送牧者 → 審過 merge main。
4. 想要也能放進大廳「金句小測」的延伸(答對收進 [[verse-collection]])。

> 相關:`/quiz`、[[quiz-authoring]]、[[game-content-validator]]、[[cuv-scripture-mcp]] / `/cuv-check`、[[pastor-review]]、agent `bible-content-reviewer`。
