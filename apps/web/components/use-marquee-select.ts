"use client"

import * as React from "react"

type Rect = { x: number; y: number; w: number; h: number }

/** What a marquee may not start on. */
const NOT_EMPTY = "[data-select-item], button, a, input, th, [role=separator]"

/**
 * Classic Finder rubber-band selection. Attach `rootProps` to a background
 * layer; a drag that starts on empty space in it — the layer itself, or
 * anything inside it that is not an item or a control (a Finder grid's
 * padding and gaps) — begins a marquee; one on an icon, a row, a button or
 * a column header does not. At pointer-down it snapshots every element carrying
 * `data-select-item="<key>"` whose key starts with `keyPrefix` (position read
 * once, since the DOM doesn't move during the drag); each pointer-move then
 * intersects the live band against that snapshot and reports the hits via
 * `onSelect`. Returns the live band rect to render. `keyPrefix` scopes one
 * surface to its own items (e.g. "desktop:" for the desktop, "finder:" for a
 * Finder window) so the two never cross-select.
 */
export function useMarqueeSelect(
  onSelect: (keys: Set<string>) => void,
  enabled = true,
  keyPrefix = ""
) {
  const [band, setBand] = React.useState<Rect | null>(null)
  // Snapshot taken at pointer-down: the drag origin (root-local), the root, and
  // each selectable item's key + rect (root-local). The DOM doesn't move during
  // a marquee drag, so we read the layout once here rather than querying the
  // document and calling getBoundingClientRect on every pointermove.
  const start = React.useRef<{
    x: number
    y: number
    root: HTMLElement
    items: { key: string; x: number; y: number; w: number; h: number }[]
  } | null>(null)

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled || e.button !== 0) return
      // Only start from empty space: not an icon or a row, not a control.
      const target = e.target as Element
      if (!e.currentTarget.contains(target) || target.closest(NOT_EMPTY)) return
      const root = e.currentTarget
      const r = root.getBoundingClientRect()
      // Selectable items may live in sibling layers (the desktop icon nav) or
      // inside this surface (a Finder file grid) — query the whole document,
      // filter to this surface's keyPrefix, and store each rect in surface-local
      // coords so pointermove is pure arithmetic.
      const items: { key: string; x: number; y: number; w: number; h: number }[] = []
      document.querySelectorAll<HTMLElement>("[data-select-item]").forEach((el) => {
        const k = el.dataset.selectItem!
        if (keyPrefix && !k.startsWith(keyPrefix)) return
        const b = el.getBoundingClientRect()
        items.push({ key: k, x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height })
      })
      start.current = { x: e.clientX - r.left, y: e.clientY - r.top, root, items }
      root.setPointerCapture(e.pointerId)
      setBand({ x: start.current.x, y: start.current.y, w: 0, h: 0 })
      onSelect(new Set())
    },
    [enabled, onSelect, keyPrefix]
  )

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = start.current
      if (!s) return
      const r = s.root.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      const rect: Rect = {
        x: Math.min(s.x, cx),
        y: Math.min(s.y, cy),
        w: Math.abs(cx - s.x),
        h: Math.abs(cy - s.y),
      }
      setBand(rect)
      const hits = new Set<string>()
      for (const it of s.items) {
        const intersects =
          it.x < rect.x + rect.w && it.x + it.w > rect.x && it.y < rect.y + rect.h && it.y + it.h > rect.y
        if (intersects) hits.add(it.key)
      }
      onSelect(hits)
    },
    [onSelect]
  )

  const onPointerUp = React.useCallback((e: React.PointerEvent<HTMLElement>) => {
    start.current = null
    setBand(null)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return {
    band,
    rootProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
