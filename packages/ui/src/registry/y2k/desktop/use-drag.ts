"use client"

import * as React from "react"

/**
 * Drag a window by its title bar. Returns the current position and the
 * pointer handlers to spread onto the handle. Positions are only meaningful
 * when the window is absolutely positioned (md+); on mobile they're ignored.
 */
export function useDrag(initial: { x: number; y: number } | (() => { x: number; y: number }), onStart?: () => void) {
  const [pos, setPos] = React.useState(initial)
  const drag = React.useRef<{ dx: number; dy: number } | null>(null)

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      // Don't start a drag from the traffic lights.
      if ((e.target as HTMLElement).closest("[data-slot=window-light]")) return
      onStart?.()
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    },
    [pos.x, pos.y, onStart]
  )

  const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current) return
    setPos({
      x: Math.max(-200, e.clientX - drag.current.dx),
      y: Math.max(25, e.clientY - drag.current.dy),
    })
  }, [])

  const onPointerUp = React.useCallback((e: React.PointerEvent<HTMLElement>) => {
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return {
    pos,
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, style: { cursor: "default" as const, touchAction: "none" as const } },
  }
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
