import { useRef, useState, useCallback, useEffect } from 'react'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// 地圖縮放 / 平移。回傳要掛到「裁切容器」的 ref 與指標事件處理器，
// 以及目前的 transform 數值與 +／－／重設 控制函式。
// 座標系：transform-origin 設為左上角 (0 0)，translate 用 px、scale 用倍率；
// 平移會被夾住，避免把地圖拖出畫面。支援：滑鼠拖曳、滾輪縮放（朝游標）、雙指 pinch。
export function useZoomPan({ min = 1, max = 4, step = 0.5 } = {}) {
  const ref = useRef(null)
  const [tf, setTf] = useState({ s: 1, x: 0, y: 0 })
  const drag = useRef(null) // { startX, startY, tx, ty }
  const pinch = useRef(null) // { dist, s }
  const pointers = useRef(new Map())

  const clampXY = (s, x, y) => {
    const el = ref.current
    if (!el) return { x, y }
    const w = el.clientWidth
    const h = el.clientHeight
    return { x: clamp(x, -(s - 1) * w, 0), y: clamp(y, -(s - 1) * h, 0) }
  }

  // 以容器內座標 (px, py) 為定點縮放到 ns（該點在縮放前後位置不變）。
  const zoomAt = useCallback(
    (px, py, ns) => {
      setTf((t) => {
        const s = clamp(ns, min, max)
        const k = s / t.s
        const { x, y } = clampXY(s, px - (px - t.x) * k, py - (py - t.y) * k)
        return { s, x, y }
      })
    },
    [min, max],
  )

  // 滾輪縮放（非被動監聽，才能 preventDefault 不讓整頁捲動）。
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      setTf((t) => {
        const s = clamp(t.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), min, max)
        const k = s / t.s
        const px = e.clientX - r.left
        const py = e.clientY - r.top
        const { x, y } = clampXY(s, px - (px - t.x) * k, py - (py - t.y) * k)
        return { s, x, y }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [min, max])

  const onPointerDown = useCallback((e) => {
    // 別把縮放控制按鈕的點擊吃掉：若點在控制鈕上，不啟動平移 / 不擷取指標，
    // 否則 setPointerCapture 會把 click 事件導到 .board，按鈕的 onClick 就不會觸發。
    if (e.target?.closest?.('.board__zoom')) return
    ref.current?.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      drag.current = null
      setTf((t) => {
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), s: t.s }
        return t
      })
    } else {
      setTf((t) => {
        drag.current = { startX: e.clientX, startY: e.clientY, tx: t.x, ty: t.y }
        return t
      })
    }
  }, [])

  const onPointerMove = useCallback(
    (e) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointers.current.size >= 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const r = ref.current.getBoundingClientRect()
        const cx = (a.x + b.x) / 2 - r.left
        const cy = (a.y + b.y) / 2 - r.top
        zoomAt(cx, cy, pinch.current.s * (dist / pinch.current.dist))
      } else if (drag.current) {
        const dx = e.clientX - drag.current.startX
        const dy = e.clientY - drag.current.startY
        setTf((t) => {
          const { x, y } = clampXY(t.s, drag.current.tx + dx, drag.current.ty + dy)
          return { ...t, x, y }
        })
      }
    },
    [zoomAt],
  )

  const onPointerUp = useCallback((e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) drag.current = null
  }, [])

  const zoomIn = useCallback(() => {
    const el = ref.current
    if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, tf.s + step)
  }, [zoomAt, tf.s, step])
  const zoomOut = useCallback(() => {
    const el = ref.current
    if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, tf.s - step)
  }, [zoomAt, tf.s, step])
  const reset = useCallback(() => setTf({ s: 1, x: 0, y: 0 }), [])

  return {
    ref,
    transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.s})`,
    scale: tf.s,
    canZoomOut: tf.s > min + 0.001,
    canZoomIn: tf.s < max - 0.001,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    zoomIn,
    zoomOut,
    reset,
  }
}
