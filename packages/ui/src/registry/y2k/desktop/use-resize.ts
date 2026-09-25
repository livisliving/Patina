/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

/**
 * Resize a window by dragging its bottom-right grip. Returns the current size
 * (null until first resized — the window uses its natural/`md:w-*` size) and
 * the pointer handlers to spread onto the grip. Only meaningful on desktop,
 * where the window is absolutely positioned.
 */
export function useResize(
  min: { w: number; h: number } = { w: 240, h: 160 },
  onStart?: () => void
) {
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null)
  const drag = React.useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      onStart?.()
      const frame = e.currentTarget.closest("[data-slot=window]") as HTMLElement | null
      const rect = frame?.getBoundingClientRect()
      drag.current = { x: e.clientX, y: e.clientY, w: rect?.width ?? min.w, h: rect?.height ?? min.h }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [min.w, min.h, onStart]
  )

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!drag.current) return
      setSize({
        w: Math.max(min.w, drag.current.w + (e.clientX - drag.current.x)),
        h: Math.max(min.h, drag.current.h + (e.clientY - drag.current.y)),
      })
    },
    [min.w, min.h]
  )

  const onPointerUp = React.useCallback((e: React.PointerEvent<HTMLElement>) => {
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return {
    size,
    gripProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
