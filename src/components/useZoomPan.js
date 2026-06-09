import { useRef, useState, useCallback, useEffect } from 'react'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// 連續縮放：100%~250%（上限 250% 是為了避免放太大後出現算繪空白）。
// 滑桿／輸入框可設任意百分比；＋／－與滾輪則以固定級距變動。
const MIN = 1
const MAX = 2.5
const STEP = 0.25 // ＋／－、滾輪每次變動 25%

// 地圖縮放 / 平移。回傳要掛到「裁切容器」的 ref、指標事件處理器、目前 transform，
// 以及 +／－／重設 與目前百分比。座標系：transform-origin 0 0；平移會被夾住。
// 所有數值都會做有限值檢查與夾限，避免 NaN／越界導致整塊地圖跑出畫面而空白。
export function useZoomPan() {
  const ref = useRef(null)
  const [tf, setTf] = useState({ s: 1, x: 0, y: 0 })
  const drag = useRef(null)
  const pinch = useRef(null)
  const pointers = useRef(new Map())

  const dims = () => {
    const el = ref.current
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 0, h: 0 }
  }

  // 正規化：scale 夾在 [MIN,MAX]、平移夾在可視範圍內，且全部保證是有限數。
  const norm = (s, x, y) => {
    s = clamp(Number.isFinite(s) ? s : 1, MIN, MAX)
    const { w, h } = dims()
    x = clamp(Number.isFinite(x) ? x : 0, -(s - 1) * w, 0)
    y = clamp(Number.isFinite(y) ? y : 0, -(s - 1) * h, 0)
    return { s: Math.round(s * 1000) / 1000, x: Math.round(x), y: Math.round(y) }
  }

  // 以容器內座標 (px,py) 為定點，縮放到 ns（該點縮放前後位置不變）。
  const zoomAt = useCallback((px, py, ns) => {
    setTf((t) => {
      const s = clamp(Number.isFinite(ns) ? ns : t.s, MIN, MAX)
      const k = s / t.s
      return norm(s, px - (px - t.x) * k, py - (py - t.y) * k)
    })
  }, [])

  // ＋／－／滾輪：以固定級距連續縮放（dir>0 放大）；可指定定點，否則以中心。
  const step = useCallback((dir, px, py) => {
    setTf((t) => {
      const s = clamp(t.s + dir * STEP, MIN, MAX)
      const { w, h } = dims()
      const cx = px ?? w / 2
      const cy = py ?? h / 2
      const k = s / t.s
      return norm(s, cx - (cx - t.x) * k, cy - (cy - t.y) * k)
    })
  }, [])

  // 滾輪：一格跳一個級距，朝游標縮放（非被動才能 preventDefault）。
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      step(e.deltaY < 0 ? 1 : -1, e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [step])

  const onPointerDown = useCallback((e) => {
    // 點在縮放控制鈕上時，不啟動平移／不擷取指標（否則按鈕 onClick 會被吃掉）。
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

      if (pointers.current.size >= 2 && pinch.current && pinch.current.dist > 0) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = (a.x + b.x) / 2 - r.left
        const cy = (a.y + b.y) / 2 - r.top
        zoomAt(cx, cy, pinch.current.s * (dist / pinch.current.dist))
      } else if (drag.current) {
        const dx = e.clientX - drag.current.startX
        const dy = e.clientY - drag.current.startY
        setTf((t) => norm(t.s, drag.current.tx + dx, drag.current.ty + dy))
      }
    },
    [zoomAt],
  )

  const onPointerUp = useCallback((e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) drag.current = null
  }, [])

  const zoomIn = useCallback(() => step(1), [step])
  const zoomOut = useCallback(() => step(-1), [step])
  const reset = useCallback(() => setTf({ s: 1, x: 0, y: 0 }), [])

  // 滑桿／輸入框：直接設定百分比（朝畫面中心縮放）；非法值忽略。
  const setPercent = useCallback(
    (pct) => {
      if (!Number.isFinite(pct) || pct <= 0) return
      const { w, h } = dims()
      zoomAt(w / 2, h / 2, pct / 100)
    },
    [zoomAt],
  )

  // transform 數值一律保證有限，避免 "translate(NaNpx…)" 整塊地圖消失。
  const safe = Number.isFinite(tf.s) && Number.isFinite(tf.x) && Number.isFinite(tf.y)
  const t = safe ? tf : { s: 1, x: 0, y: 0 }

  return {
    ref,
    transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
    scale: t.s,
    percent: Math.round(t.s * 100),
    minPercent: Math.round(MIN * 100),
    maxPercent: Math.round(MAX * 100),
    canZoomOut: t.s > MIN + 0.001,
    canZoomIn: t.s < MAX - 0.001,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    zoomIn,
    zoomOut,
    reset,
    setPercent,
  }
}
