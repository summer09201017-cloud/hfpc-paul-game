// ===========================================================================
// 地圖產生器 (real-geography map generator)
// ---------------------------------------------------------------------------
// 把 Natural Earth 50m 的真實國界海岸線，投影成棋盤用的 SVG 路徑，並依「真實
// 經緯度」重新計算每一站的座標，寫回 src/data/journey1.json。
//
//   輸入：scripts/_geodata/ne50m_countries.geojson  (下載自 Natural Earth)
//   輸出：1) src/data/region-map.json   ← 海岸線 SVG 路徑 + 投影資訊 + 城市標記
//         2) 就地更新 src/data/journey1.json 每站的 x / y (並補上 lat / lon)
//
// 投影：等距圓柱投影 (equirectangular)，經度乘上 cos(中央緯度) 修正寬窄，
//       再各自正規化到 0~100。棋盤容器的長寬比設為 ASPECT 即可避免變形。
// 執行：node scripts/gen-map.mjs
// ===========================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEO = join(__dirname, '_geodata', 'ne50m_countries.geojson')
const OUT_MAP = join(__dirname, '..', 'src', 'data', 'region-map.json')
const JOURNEY = join(__dirname, '..', 'src', 'data', 'journey1.json')

// 來源：Natural Earth 50m 國界（公有領域）。第一次執行會自動下載並快取到
// scripts/_geodata/，之後就能離線重跑。
const GEO_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'

async function ensureGeoData() {
  if (existsSync(GEO)) return
  console.log('⬇️  找不到地理資料，正在下載 Natural Earth 50m 國界（約 3MB，僅第一次）...')
  mkdirSync(dirname(GEO), { recursive: true })
  const res = await fetch(GEO_URL)
  if (!res.ok) throw new Error(`下載失敗 (HTTP ${res.status})：${GEO_URL}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(GEO, buf)
  console.log(`   已存到 ${GEO}（${(buf.length / 1024 / 1024).toFixed(2)} MB）`)
}
await ensureGeoData()

// --- 投影範圍（涵蓋第一次宣教旅程的東地中海一帶，含適度留白）---
// 右側（敘利亞安提阿一帶）多留一點空間，避免地名標籤被切到。
const LON_MIN = 29.0, LON_MAX = 38.2, LAT_MIN = 33.6, LAT_MAX = 39.2
const MID_LAT = (LAT_MIN + LAT_MAX) / 2
const K = Math.cos((MID_LAT * Math.PI) / 180) // 經度壓縮係數
const ASPECT = ((LON_MAX - LON_MIN) * K) / (LAT_MAX - LAT_MIN) // 棋盤寬/高

const r1 = (n) => Math.round(n * 10) / 10

function project(lon, lat) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100
  return [x, y]
}

// --- 城市真實經緯度（每站對應 journey1.json 的 id）---
// lat = 緯度(°N)，lon = 經度(°E)。學術上公認的遺址位置（取近似）。
const CITIES = {
  antioch_start:    { lat: 36.20, lon: 36.16 }, // 敘利亞安提阿（差派出發）
  seleucia:         { lat: 36.12, lon: 35.93 }, // 西流基（安提阿的港口）
  salamis:          { lat: 35.18, lon: 33.91 }, // 撒拉米（居比路東端）
  paphos:           { lat: 34.77, lon: 32.41 }, // 帕弗（居比路西端）
  perga:            { lat: 36.96, lon: 30.85 }, // 別加（旁非利亞）
  pisidian_antioch: { lat: 38.31, lon: 31.19 }, // 彼西底的安提阿（西北內陸）
  iconium:          { lat: 37.87, lon: 32.49 }, // 以哥念（今 Konya）
  lystra:           { lat: 37.58, lon: 32.45 }, // 路司得
  derbe:            { lat: 37.35, lon: 33.28 }, // 特庇（最遠的折返點）
  return_strengthen:{ lat: 37.70, lon: 31.95 }, // 回程堅固門徒（加拉太諸城，示意位置）
  attalia:          { lat: 36.88, lon: 30.70 }, // 亞大利（今 Antalya，搭船返程）
  antioch_end:      { lat: 36.42, lon: 36.40 }, // 回到安提阿述職（與出發同城，略偏移以免重疊）
  // --- 機會 / 命運卡站：擺在相鄰兩城的航線／路段「中點」，是旅途途中的事件點，不是真城市 ---
  seacard_1:        { lat: 35.65, lon: 34.92 }, // 西流基↔撒拉米（海上）
  seacard_2:        { lat: 35.87, lon: 31.63 }, // 帕弗↔別加（渡海）
  landcard_1:       { lat: 38.09, lon: 31.84 }, // 彼西底安提阿↔以哥念（陸路）
  landcard_2:       { lat: 37.47, lon: 32.87 }, // 路司得↔特庇（陸路）
  landcard_3:       { lat: 37.29, lon: 31.33 }, // 回程堅固門徒↔亞大利（陸路）
  seacard_3:        { lat: 36.65, lon: 33.55 }, // 亞大利↔安提阿述職（海上）
}

// --- Sutherland–Hodgman：把多邊形裁切到 [0,100]×[0,100] 方框 ---
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
function clipEdge(pts, inside, isect) {
  const out = []
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i]
    const prev = pts[(i + pts.length - 1) % pts.length]
    const cIn = inside(cur), pIn = inside(prev)
    if (cIn) {
      if (!pIn) out.push(isect(prev, cur))
      out.push(cur)
    } else if (pIn) {
      out.push(isect(prev, cur))
    }
  }
  return out
}
function clipToBox(pts) {
  pts = clipEdge(pts, (p) => p[0] >= 0,   (a, b) => lerp(a, b, (0 - a[0]) / (b[0] - a[0])))
  if (!pts.length) return pts
  pts = clipEdge(pts, (p) => p[0] <= 100, (a, b) => lerp(a, b, (100 - a[0]) / (b[0] - a[0])))
  if (!pts.length) return pts
  pts = clipEdge(pts, (p) => p[1] >= 0,   (a, b) => lerp(a, b, (0 - a[1]) / (b[1] - a[1])))
  if (!pts.length) return pts
  pts = clipEdge(pts, (p) => p[1] <= 100, (a, b) => lerp(a, b, (100 - a[1]) / (b[1] - a[1])))
  return pts
}

// 點距離過近就略過，縮小檔案（投影後 0~100 空間，0.25 約等於地圖寬的 0.25%）。
function decimate(pts, eps = 0.25) {
  const out = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= eps) out.push(p)
  }
  return out
}

function ringToPath(ring) {
  const proj = ring.map(([lon, lat]) => project(lon, lat))
  let clipped = clipToBox(proj)
  if (clipped.length < 3) return null
  clipped = decimate(clipped)
  if (clipped.length < 3) return null
  const d =
    'M' +
    clipped.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' L') +
    ' Z'
  return d
}

// --- 載入並挑出目標國家 ---
const fc = JSON.parse(readFileSync(GEO, 'utf-8'))
const ISO = new Set(['TUR', 'SYR', 'LBN', 'CYP', 'CYN']) // 含北賽普勒斯，讓整座島完整
function wanted(props) {
  const codes = [props.ISO_A3, props.ADM0_A3, props.ISO_A3_EH, props.SOV_A3]
  if (codes.some((c) => ISO.has(c))) return true
  const name = (props.NAME || props.ADMIN || '') + ''
  return /cyprus/i.test(name) // 涵蓋緩衝區等命名
}

const lands = []
for (const f of fc.features) {
  if (!wanted(f.properties)) continue
  const g = f.geometry
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
  for (const poly of polys) {
    const outer = poly[0] // 只取外環（湖泊等內環忽略，對遊戲地圖無妨）
    const d = ringToPath(outer)
    if (d) lands.push(d)
  }
}

// --- 城市投影座標（給 region-map.json 當標記用）---
const cityMarks = Object.fromEntries(
  Object.entries(CITIES).map(([id, { lat, lon }]) => {
    const [x, y] = project(lon, lat)
    return [id, { x: r1(x), y: r1(y), lat, lon }]
  }),
)

writeFileSync(
  OUT_MAP,
  JSON.stringify(
    {
      _comment: 'Auto-generated by scripts/gen-map.mjs — do not edit by hand. Run: node scripts/gen-map.mjs',
      projection: { lonMin: LON_MIN, lonMax: LON_MAX, latMin: LAT_MIN, latMax: LAT_MAX, midLat: MID_LAT },
      aspect: Math.round(ASPECT * 1000) / 1000,
      lands,
      cities: cityMarks,
    },
    null,
    2,
  ),
)

// --- 就地更新 journey1.json 的每站座標 ---
const journey = JSON.parse(readFileSync(JOURNEY, 'utf-8'))
let patched = 0
for (const st of journey.stations) {
  const c = CITIES[st.id]
  if (!c) {
    console.warn(`⚠️  journey1.json 有一站沒對應到城市座標：${st.id}`)
    continue
  }
  const [x, y] = project(c.lon, c.lat)
  st.x = r1(x)
  st.y = r1(y)
  st.lat = c.lat
  st.lon = c.lon
  patched++
}
writeFileSync(JOURNEY, JSON.stringify(journey, null, 2) + '\n')

console.log('✅ 地圖產生完成')
console.log(`   國界路徑：${lands.length} 條`)
console.log(`   棋盤長寬比 ASPECT = ${Math.round(ASPECT * 1000) / 1000}（請設為 .board 的 aspect-ratio）`)
console.log(`   已更新 ${patched} / ${journey.stations.length} 站的座標`)
console.log('   城市投影座標：')
for (const [id, m] of Object.entries(cityMarks)) {
  console.log(`     ${id.padEnd(18)} x=${String(m.x).padStart(5)}  y=${String(m.y).padStart(5)}`)
}
