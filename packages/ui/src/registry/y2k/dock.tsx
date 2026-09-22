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

/** Two bounces of y2k-dock-bounce. */
const BOUNCE_MS = 1200

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
 *
 * Click an app that isn't running and its icon bounces twice while it
 * starts. `genie` pours a window into its Dock tile when it is minimised, and
 * back out when it is restored; each tile carries `data-dock-id` to aim at.
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

  // Apps starting up: their icons bounce until the timer clears them.
  const [bouncing, setBouncing] = React.useState<ReadonlySet<string>>(() => new Set())
  const launch = (item: DockItem) => {
    if (!item.running && !item.minimized && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBouncing((b) => new Set(b).add(item.id))
      window.setTimeout(() => setBouncing((b) => {
        const next = new Set(b)
        next.delete(item.id)
        return next
      }), BOUNCE_MS)
    }
    item.onClick?.()
  }

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
                    data-dock-id={item.id}
                    aria-label={item.label}
                    onClick={() => launch(item)}
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
                        item.minimized && "translate-y-0.5 opacity-90 [&_svg]:drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]",
                        bouncing.has(item.id) && "animate-[y2k-dock-bounce_600ms_2]"
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

/* ── The genie ─────────────────────────────────────────────────────── */

type GenieTarget = Element | DOMRect | (() => Element | null | undefined)

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (v: number) => v * v * (3 - 2 * v)

/**
 * Mac OS X's genie: a window pours into its Dock tile as it is minimised, or
 * out of it (`reverse`) as it comes back. It plays over a copy of the window
 * cut into horizontal strips: first the lower edge bends toward the tile,
 * then the whole window slides down the funnel and into it. The page itself
 * is not touched.
 *
 * Each target is an element, a rect, or a function the genie calls two
 * frames later, once the caller has changed the page. Minimising: pass the
 * window itself (it is copied at once) and a function for its new tile.
 * Restoring: measure the tile first, then pass a function for the window and
 * `hide`, a selector for the window, so it stays hidden until the genie
 * has poured it out. Resolves when the copy is gone; does nothing when the
 * visitor asks for reduced motion.
 */
async function genie(
  windowTarget: GenieTarget,
  tileTarget: GenieTarget,
  { reverse = false, duration = 520, hide }: { reverse?: boolean; duration?: number; hide?: string } = {}
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const now = (t: GenieTarget) => (t instanceof Element ? t.getBoundingClientRect() : t instanceof DOMRect ? t : null)
  const later = (t: GenieTarget) => {
    const el = typeof t === "function" ? t() : null
    return el ? { el, rect: el.getBoundingClientRect() } : null
  }

  const hider = hide ? document.createElement("style") : null
  if (hider) {
    hider.textContent = `${hide} { visibility: hidden !important; }`
    document.head.append(hider)
  }
  const layer = document.createElement("div")
  layer.setAttribute("aria-hidden", "true")
  layer.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden"
  let bands: HTMLElement[] = []
  let box: DOMRect | null = null

  /** Lay the copy over the window, cut into strips, before anything moves. */
  const lay = (source: Element, rect: DOMRect) => {
    box = rect
    const n = Math.max(16, Math.min(72, Math.round(rect.height / 6)))
    const bandH = rect.height / n
    bands = Array.from({ length: n }, (_, i) => {
      const band = document.createElement("div")
      band.style.cssText = `position:absolute;left:${rect.left}px;top:${rect.top + i * bandH}px;width:${rect.width}px;height:${bandH + 1}px;overflow:hidden;transform-origin:0 0;will-change:transform`
      if (reverse) band.style.visibility = "hidden"
      const c = source.cloneNode(true) as HTMLElement
      c.removeAttribute("id")
      Object.assign(c.style, {
        position: "absolute", left: "0", top: `${-i * bandH}px`, right: "auto", bottom: "auto",
        width: `${rect.width}px`, height: `${rect.height}px`, margin: "0",
        transform: "none", translate: "none", scale: "none", animation: "none", visibility: "visible",
      })
      band.append(c)
      layer.append(band)
      return band
    })
    document.body.append(layer)
  }

  try {
    // Minimising: the window is here now and gone next frame, so copy it now.
    if (windowTarget instanceof Element) lay(windowTarget, windowTarget.getBoundingClientRect())
    let tile = now(tileTarget)
    await frame()
    await frame()
    if (!box) {
      const w = later(windowTarget)
      if (w) lay(w.el, w.rect)
    }
    tile ??= later(tileTarget)?.rect ?? null
    if (!box || !tile || (box as DOMRect).width === 0) return

    const { left: x0, top: y0, width: W, height: H } = box as DOMRect
    const bandH = H / bands.length
    // The mouth of the funnel: the middle of the tile, a little in from its sides.
    const mouthL = tile.left + tile.width * 0.15
    const mouthR = tile.right - tile.width * 0.15
    const mouthY = tile.top + tile.height * 0.3
    const drop = Math.max(1, mouthY - y0)

    const draw = (p: number) => {
      const bend = smooth(clamp01(p / 0.4)) // the lower edge reaching for the tile
      const slide = clamp01((p - 0.22) / 0.78)
      const fall = slide * slide * drop // speeding up into the Dock
      // The funnel's sides at a height on the screen.
      const sides = (y: number) => {
        const k = smooth(clamp01((y - y0) / drop)) * bend
        return [x0 + (mouthL - x0) * k, x0 + W + (mouthR - x0 - W) * k] as const
      }
      bands.forEach((band, i) => {
        const top = y0 + i * bandH + fall
        if (top >= mouthY && p > 0.02) {
          band.style.visibility = "hidden"
          return
        }
        band.style.visibility = "visible"
        // Each strip is slanted to meet the funnel at its top and its foot,
        // so its edges run on into the next strip's instead of stepping.
        const [lt, rt] = sides(top)
        const [lb, rb] = sides(top + bandH)
        const width = (rt - lt + (rb - lb)) / 2
        const midTop = (lt + rt) / 2
        const slant = ((lb + rb) / 2 - midTop) / bandH
        band.style.transform = `matrix(${Math.max(0.001, width / W)}, 0, ${slant}, 1, ${midTop - width / 2 - x0}, ${fall})`
      })
    }
    const start = performance.now()
    for (;;) {
      const p = clamp01((performance.now() - start) / duration)
      draw(reverse ? 1 - p : p)
      if (p >= 1) break
      await frame()
    }
  } finally {
    layer.remove()
    hider?.remove()
  }
}

export { Dock, genie }
