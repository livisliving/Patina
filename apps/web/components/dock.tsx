"use client"

import * as React from "react"
import { cn } from "@patina/ui"

import { useMediaQuery } from "./use-media-query"

export type DockItem = {
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

const BASE = 64 // px, must match --y2k-dock-icon
const MAX_SCALE = 2.0
const RANGE = 140 // px of influence on either side of the cursor

/**
 * The Aqua Dock: a pinstriped translucent shelf; icons magnify with the
 * cursor (falloff over 140px, spring-ish via CSS transitions), a label pill
 * above the hovered icon, a black triangle under running apps, Trash after a
 * divider on the right.
 */
export function Dock({ items, className }: { items: DockItem[]; className?: string }) {
  const listRef = React.useRef<HTMLUListElement>(null)
  const [sizes, setSizes] = React.useState<number[]>(() => items.map(() => BASE))
  const canMagnify = useMediaQuery("(hover: hover) and (pointer: fine)")

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
      <ul
        ref={listRef}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className={cn(
          "pointer-events-auto flex h-(--y2k-dock-h) max-w-[min(92vw,980px)] items-end gap-1 overflow-x-auto px-2 pt-1 pb-[3px] md:overflow-visible",
          "bg-(--y2k-dock-surface) bg-(image:--y2k-pinstripe-menubar) shadow-(--y2k-shadow-dock)"
        )}
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => {
          const size = sizes[i] ?? BASE
          return (
            <li key={item.id} className="group relative flex shrink-0 items-end" style={{ margin: "0 2px" }}>
              {item.dividerBefore && (
                <span aria-hidden className="mr-3 mb-1 h-10 w-px self-end bg-black/30 shadow-[1px_0_0_rgba(255,255,255,0.5)]" />
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
                  {/* Label pill above the icon */}
                  <span
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-800 px-3 py-1",
                      "font-(family-name:--y2k-font-ui) text-[13px] font-medium text-white/90 opacity-0 shadow-xl transition-opacity",
                      "group-hover:opacity-100 group-focus-within:opacity-100"
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-neutral-800"
                    />
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
    </nav>
  )
}
