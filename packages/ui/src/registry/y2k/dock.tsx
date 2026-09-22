"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Subscribe to a media query; false on the server and the first render. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [query])
  return matches
}

type DockItem = {
  id: string
  label: string
  icon: React.ReactNode
  running?: boolean
  onClick?: () => void
  /** Draw the Aqua Dock divider (a hairline) to the left of this item. */
  dividerBefore?: boolean
  /** Minimized-window tile: parked look (nudged into the shelf, slightly
   *  dimmed) so it reads as "docked". Still shows the running triangle. */
  minimized?: boolean
}

export type { DockItem }

const BASE = 64 // px, must match --y2k-dock-icon
const MAX_SCALE = 2.0
const RANGE = 140 // px of influence on either side of the cursor

/** How far the Dock fades where it runs off the screen on a phone. */
const FADE = 48

/**
 * Patina Dock — DESIGN.md › Layout › Dock.
 *
 * The Aqua Dock, as 10.1 draws it: the pinstripe at 55% so the desktop shows
 * through, a 1px white rim along the top and ends, icons edge to edge; they
 * magnify with the cursor (falloff over 140px, spring-ish via CSS
 * transitions). The hovered icon's name floats above it in bold white with a
 * dark shadow; a black triangle marks running apps; minimized windows and
 * Trash sit after white hairline dividers on the right. On a phone the shelf
 * scrolls sideways, and an edge with more icons past it fades out — the cue
 * that there is more to swipe to.
 */
function Dock({ items, className }: { items: DockItem[]; className?: string }) {
  const listRef = React.useRef<HTMLUListElement>(null)
  const [sizes, setSizes] = React.useState<number[]>(() => items.map(() => BASE))
  const canMagnify = useMediaQuery("(hover: hover) and (pointer: fine)")
  const phone = useMediaQuery("(max-width: 767px)")

  // Which ends have icons past them: set on scroll, and when the shelf or
  // its icons change size.
  const [more, setMore] = React.useState({ left: false, right: false })
  const measure = React.useCallback(() => {
    const el = listRef.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }))
  }, [])
  React.useEffect(() => {
    const el = listRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => ro.disconnect()
  }, [measure, items.length])
  const fade =
    phone && (more.left || more.right)
      ? `linear-gradient(to right, ${more.left ? `transparent, #000 ${FADE}px` : "#000"}, ${more.right ? `#000 calc(100% - ${FADE}px), transparent` : "#000"})`
      : undefined

  const reset = React.useCallback(() => setSizes(items.map(() => BASE)), [items])

  const onMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!canMagnify || !listRef.current) return
      const buttons = listRef.current.querySelectorAll<HTMLElement>("[data-dock-icon]")
      const next: number[] = []
      buttons.forEach((el) => {
        const r = el.getBoundingClientRect()
        const d = Math.abs(e.clientX - (r.left + r.width / 2))
        const t = d > RANGE ? 0 : 1 - d / RANGE
        next.push(BASE + t * (BASE * MAX_SCALE - BASE))
      })
      setSizes(next)
    },
    [canMagnify]
  )

  return (
    <nav
      aria-label="Dock"
      className={cn("pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex items-end justify-center", className)}
    >
      {/* The shelf. The rim lies straight on the desktop, so the stripe stops
          inside it; the icons scroll inside the shelf, which stays put. */}
      <div
        data-slot="dock"
        className={cn(
          "pointer-events-auto flex h-(--y2k-dock-h) max-w-[min(92vw,980px)] min-w-0",
          "border-x border-t border-white/77 bg-(image:--y2k-pinstripe-dock) bg-clip-padding shadow-(--y2k-shadow-dock)"
        )}
      >
        <ul
          ref={listRef}
          onPointerMove={onMove}
          onPointerLeave={reset}
          onScroll={measure}
          className="flex h-full min-w-0 items-end overflow-x-auto px-1 pb-[3px] md:overflow-visible"
          style={{ scrollbarWidth: "none", maskImage: fade, WebkitMaskImage: fade }}
        >
          {items.map((item, i) => {
            const size = sizes[i] ?? BASE
            return (
              <li key={item.id} className="group relative flex shrink-0 items-end">
                {/* The divider: a white hairline the shelf's full height. */}
                {item.dividerBefore && (
                  <span aria-hidden className="mx-3 -mb-[3px] h-[calc(var(--y2k-dock-h)-1px)] w-px shrink-0 bg-white/78" />
                )}
                <div className="relative flex flex-col items-center">
                  <button
                    type="button"
                    data-dock-icon
                    aria-label={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "relative flex cursor-default items-end justify-center outline-none",
                      "transition-[width,height] duration-[80ms] ease-out",
                      "active:brightness-75 focus-visible:[&>span>svg]:drop-shadow-[0_0_4px_var(--y2k-tone)]"
                    )}
                    style={{ width: size, height: size }}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block size-full select-none [&_svg]:size-full [&_svg]:drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]",
                        // Minimized-window tiles read as "parked": nudged down into
                        // the shelf and dimmed a touch, distinct from a live app.
                        item.minimized && "translate-y-0.5 opacity-90 [&_svg]:drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
                      )}
                    >
                      {item.icon}
                    </span>
                    {/* The name above the icon: 14px bold white on a dark shadow. */}
                    <span
                      role="tooltip"
                      className={cn(
                        "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap",
                        "font-(family-name:--y2k-font-ui) text-[14px] leading-none font-bold text-white opacity-0 transition-opacity",
                        "[text-shadow:0_1px_2px_#000,0_0_1px_#000]",
                        "group-hover:opacity-100 group-focus-within:opacity-100"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-[3px] size-0 border-x-[4px] border-b-[4px] border-x-transparent border-b-black",
                      item.running ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export { Dock }
