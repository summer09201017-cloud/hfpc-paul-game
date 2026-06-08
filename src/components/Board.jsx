import MapBackground from './MapBackground'
import map from '../data/region-map.json'
import { useZoomPan } from './useZoomPan'

const TYPE_ICON = {
  start: '🚩',
  story: '📜',
  event: '✨',
  quiz: '❓',
  rest: '⛺',
  end: '🏁',
}

// 多個棋子停在同一格時，依玩家序號做小幅位移，避免完全重疊。
function tokenOffset(indexAtStation) {
  const offsets = [
    { dx: -1.6, dy: -1.6 },
    { dx: 1.6, dy: -1.6 },
    { dx: -1.6, dy: 1.6 },
    { dx: 1.6, dy: 1.6 },
  ]
  return offsets[indexAtStation % offsets.length]
}

export default function Board({ stations, players, currentPlayerId, pendingStationId }) {
  // 路線分段：每一段標記是陸路或海路（依「抵達站」的 arriveBy），分別上色。
  const legs = stations.slice(1).map((s, i) => ({
    from: stations[i],
    to: s,
    sea: s.arriveBy === 'sea',
  }))

  // 算出每個玩家在自己那一格裡是第幾個（用來錯開棋子）。
  const seatAtStation = {}

  const zp = useZoomPan({ min: 1, max: 4 })

  return (
    <div
      className="board"
      ref={zp.ref}
      style={{ aspectRatio: map.aspect, touchAction: 'none' }}
      {...zp.handlers}
    >
      {/* 可縮放 / 平移的整個地圖場景（地圖、路線、城市、棋子一起縮放）。 */}
      <div
        className="board__scene"
        style={{ transform: zp.transform, transformOrigin: '0 0', cursor: zp.scale > 1 ? 'grab' : 'default' }}
      >
        <MapBackground />

        <svg className="board__route" viewBox="0 0 100 100" preserveAspectRatio="none">
          {legs.map((leg, i) => (
            <line
              key={i}
              x1={leg.from.x}
              y1={leg.from.y}
              x2={leg.to.x}
              y2={leg.to.y}
              className={leg.sea ? 'route route--sea' : 'route route--land'}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {stations.map((s, i) => {
          const isPending = s.id === pendingStationId
          return (
            <div
              key={s.id}
              className={`station station--${s.type} ${isPending ? 'station--active' : ''}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              title={`${s.name}（${s.scripture}）`}
            >
              <div className="station__dot">
                <span className="station__icon">{TYPE_ICON[s.type] || '•'}</span>
                <span className="station__num">{i + 1}</span>
              </div>
              <span className="station__name">{s.name}</span>
            </div>
          )
        })}

        {players.map((p) => {
          const seat = seatAtStation[p.position] || 0
          seatAtStation[p.position] = seat + 1
          const station = stations[p.position]
          const off = tokenOffset(seat)
          return (
            <div
              key={p.id}
              className={`token ${p.id === currentPlayerId ? 'token--current' : ''}`}
              style={{
                left: `calc(${station.x}% + ${off.dx}rem)`,
                top: `calc(${station.y}% + ${off.dy}rem)`,
                background: p.color,
              }}
              title={p.name}
            >
              {p.finished ? '👑' : p.name.slice(0, 1)}
            </div>
          )
        })}
      </div>

      {/* 縮放控制（固定在角落，不跟著縮放） */}
      <div className="board__zoom">
        <button onClick={zp.zoomIn} disabled={!zp.canZoomIn} aria-label="放大" title="放大">＋</button>
        <button onClick={zp.zoomOut} disabled={!zp.canZoomOut} aria-label="縮小" title="縮小">－</button>
        <button onClick={zp.reset} disabled={zp.scale === 1} aria-label="重設" title="重設">⟳</button>
      </div>
    </div>
  )
}
