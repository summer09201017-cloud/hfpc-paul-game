import map from '../data/region-map.json'

// 教學用地名標籤（座標為棋盤 0~100 的百分比，與城市站點同一套座標系）。
// 用 HTML 疊在地圖上而非畫進 SVG —— SVG 被拉伸成真實長寬比後，文字會跟著被拉寬。
const LABELS = [
  { t: '小亞細亞（今土耳其）', x: 52, y: 4, kind: 'region' },
  { t: '敘利亞', x: 95, y: 70, kind: 'region' },
  { t: '賽普勒斯', x: 47, y: 78, kind: 'island' },
  { t: '居比路', x: 47, y: 82, kind: 'island-sub' },
  { t: '地　中　海', x: 54, y: 94, kind: 'sea' },
]

export default function MapBackground() {
  return (
    <>
      <svg className="board__map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width="100" height="100" className="board__sea" />
        {map.lands.map((d, i) => (
          <path key={i} d={d} className="board__land" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <div className="board__labels" aria-hidden="true">
        {LABELS.map((l, i) => (
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
