// agePrefs.js —— 跨關共用的「年齡偏好」（幼稚園 / 兒童 / 青少年）。
// 回應兒主老師回饋:孩子/老師選一次年齡,全系列每一關都記得(用 localStorage),不必每關重選。
// 零相依、離線可用;讀不到/壞掉/隱私模式 → 安靜回預設 'kids'(絕不報錯)。
// 各動作關 boot/開場時用 getAgePref() 當預設年齡;使用者在那關改了就 setAgePref() 寫回,下一關沿用。
// 年齡檔的「實際效果」(命中區/擺速/移動/語音…)由各關自己的 config 決定(如 sling 的 AGE);
// 這個模組只負責「記住選了哪一檔」,是放大到全系列時的共用接點。
const KEY = 'hfpc-age-pref'
export const AGES = ['kinder', 'kids', 'teen']

// 給 UI 用的顯示資料(跨關一致的標籤/emoji;各關難度細節仍由各自 config 定義)。
export const AGE_META = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '不識字也能玩｜大目標、慢、會語音講解' },
  kids: { id: 'kids', label: '兒童', emoji: '🙂', sub: '一般玩法（7–12 歲）' },
  teen: { id: 'teen', label: '青少年', emoji: '🧑', sub: '挑戰：更快更難、計時搶快' },
}

export function getAgePref() {
  try {
    const v = localStorage.getItem(KEY)
    return AGES.includes(v) ? v : 'kids'
  } catch {
    return 'kids'
  }
}

export function setAgePref(id) {
  try {
    if (AGES.includes(id)) localStorage.setItem(KEY, id)
  } catch {
    /* 隱私模式/不可寫 → 安靜略過,本關仍能用記憶體中的選擇 */
  }
}
