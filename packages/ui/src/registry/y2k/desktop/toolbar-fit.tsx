"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** The search field at its narrowest, before it goes. */
const SEARCH_MIN = 96

/**
 * What of the Finder's toolbar fits its window: every place and the search
 * field, or every place, or the first few (the rest in the » menu).
 * Measured, not set at a breakpoint: the places are the site's own folders,
 * as many and as long as it has.
 *
 * `barRef` goes on the toolbar, whose fixed items (Back, the view control,
 * the separator) carry `data-fixed`; `rulerRef` on an out-of-sight row of a
 * Chevron then every place at its own width. Both are callback refs, so a
 * toolbar hidden and shown again is measured afresh, and a place renamed
 * resizes the ruler, which is watched too.
 */
export function useToolbarFit() {
  const [bar, barRef] = React.useState<HTMLDivElement | null>(null)
  const [ruler, rulerRef] = React.useState<HTMLDivElement | null>(null)
  const [fit, setFit] = React.useState({ places: Infinity, search: true })
  React.useLayoutEffect(() => {
    if (!bar || !ruler) return
    const measure = () => {
      const css = getComputedStyle(bar)
      const gap = parseFloat(css.columnGap) || 0
      const room = bar.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight)
      // Each at its width with its margins (the separator's 4px either side),
      // to the fraction of a pixel.
      const outer = (el: Element) => {
        const m = getComputedStyle(el)
        return el.getBoundingClientRect().width + parseFloat(m.marginLeft) + parseFloat(m.marginRight)
      }
      const fixed = [...bar.querySelectorAll(":scope > [data-fixed]")].map(outer)
      const [chevron, ...places] = [...ruler.children].map(outer)
      const width = (n: number, search: boolean) => {
        const row = [...fixed, ...places.slice(0, n), ...(search ? [SEARCH_MIN] : []), ...(n < places.length ? [chevron] : [])]
        return row.reduce((a, b) => a + b, 0) + gap * (row.length - 1)
      }
      let n = places.length
      const search = width(n, true) <= room
      if (!search) while (n > 0 && width(n, false) > room) n--
      setFit((f) => (f.places === n && f.search === search ? f : { places: n, search }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    observer.observe(ruler)
    return () => observer.disconnect()
  }, [bar, ruler])
  return { fit, barRef, rulerRef }
}

/** The 10.1 toolbar's overflow: a » at the far end, which lists the places
 *  the window is too narrow for. */
export function Chevron({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="More places"
      className={cn(
        "mt-[2px] flex h-8 w-4 shrink-0 items-center justify-center rounded-[4px] text-[#1e1e1e] outline-none",
        "focus-visible:shadow-(--y2k-focus-ring) data-[state=open]:bg-black/10",
        className
      )}
      {...props}
    >
      {/* The chevron is drawn, as 10.1 drew it: two 4 × 7 carets 2px
          apart, black. */}
      <svg viewBox="0 0 10 7" width="10" height="7" shapeRendering="crispEdges" aria-hidden>
        <path d="M0 0h1v1h1v1h1v1h1v1H3v1H2v1H1v1H0zM6 0h1v1h1v1h1v1h1v1H9v1H8v1H7v1H6z" fill="currentColor" />
      </svg>
    </button>
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
