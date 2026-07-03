// 預設地名標籤（保羅旅程用;座標為棋盤 0~100 的百分比，與城市站點同一套座標系）。
// 用 HTML 疊在地圖上而非畫進 SVG —— SVG 被拉伸成真實長寬比後，文字會跟著被拉寬。
// 各條旅程可在自己的 region-map JSON 帶 labels 覆寫(例如約拿用 region-map-jonah.json)。
const DEFAULT_LABELS = [
  { t: '小亞細亞（今土耳其）', x: 52, y: 4, kind: 'region' },
  { t: '敘利亞', x: 95, y: 70, kind: 'region' },
  { t: '賽普勒斯', x: 47, y: 78, kind: 'island' },
  { t: '居比路', x: 47, y: 82, kind: 'island-sub' },
  { t: '地　中　海', x: 54, y: 94, kind: 'sea' },
]

export default function MapBackground({ map }) {
  const lands = (map && map.lands) || []
  const labels = (map && map.labels) || DEFAULT_LABELS
  // 裝飾剪影層（手繪棋盤用，例如但以理的巴比倫城景）：每筆 { d, fill?, stroke?, sw?, opacity? }。
  // gen-map 產生的地理棋盤沒有這個欄位，行為不變。
  const decor = (map && map.decor) || []
  return (
    <>
      {/* 海(藍底)改由 .board 的 CSS background-color 提供,不再用「被拉伸成超大的 SVG <rect>」——
          那個大 rect 在拖曳/縮放時每幀重新點陣化,會超過 GPU 紋理上限 → 整片變海藍(2026-06-23 修)。
          純色背景在任何尺寸都幾乎零成本,且即使合成層出問題,看到的也只是正常海色,不會「全頁變藍」。 */}
      {/* ★ 不用 vectorEffect="non-scaling-stroke":它在「被縮放/拖曳的大 SVG」上是已知的 Chrome
          GPU 合成崩潰觸發點(整頁變單色)。改用一般 stroke(以 viewBox 使用者單位計,會隨地圖縮放,
          視覺差異極小但不再觸發崩潰)。stroke 寬度移到 CSS / 下面 decor 直接給使用者單位值。 */}
      <svg className="board__map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {/* 陸地漸層:上淺下深的羊皮紙暖色(gradient 跟著每塊陸地的 bounding box,各島嶼各自漸層) */}
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2e8ca" />
            <stop offset="1" stopColor="#e2cfa0" />
          </linearGradient>
        </defs>
        {/* 美化三層(2026-07-03)——都是輕量向量 path,不是當年出事的「被拉伸的大 rect」:
            ① 淺水帶:陸地輪廓的寬描邊光暈(海岸淺灘) ② 海岸陰影:同輪廓右下偏移(陸地浮在海上的立體感)
            ③ 陸地本體:漸層填色+細海岸線。拖曳/縮放機制(left/top+只點陣化可視區)完全未動。 */}
        {lands.map((d, i) => (
          <path key={`w${i}`} d={d} className="board__shore" />
        ))}
        <g className="board__coast-shadow" transform="translate(0.35 0.45)">
          {lands.map((d, i) => (
            <path key={`s${i}`} d={d} />
          ))}
        </g>
        {lands.map((d, i) => (
          <path key={i} d={d} className="board__land" />
        ))}
        {decor.map((p, i) => (
          <path
            key={`d${i}`}
            d={p.d}
            fill={p.fill || 'none'}
            stroke={p.stroke || 'none'}
            strokeWidth={p.sw || 0.4}
            opacity={p.opacity == null ? 1 : p.opacity}
          />
        ))}
      </svg>

      <div className="board__labels" aria-hidden="true">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`board__label board__label--${l.kind}`}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
          >
            {l.t}
          </span>
        ))}
        <span className="board__compass" style={{ left: '5%', top: '6%' }}>
          ⬆<small>北 N</small>
        </span>
      </div>
    </>
  )
}
