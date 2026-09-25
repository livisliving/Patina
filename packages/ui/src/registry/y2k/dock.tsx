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
 * the Bin sit after white hairline dividers on the right. On a phone the shelf
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
  // No magnification for a visitor who asked for reduced motion (DESIGN.md
  // › Do's), just as there is no bounce and no genie.
  const canMagnify = useMediaQuery("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
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
  // Only a phone's shelf scrolls, so only there is it worth watching.
  React.useEffect(() => {
    const el = listRef.current
    if (!el || !phone) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => ro.disconnect()
  }, [measure, items.length, phone])
  const fade =
    phone && (more.left || more.right)
      ? `linear-gradient(to right, ${more.left ? `transparent, #000 ${FADE}px` : "#000"}, ${more.right ? `#000 calc(100% - ${FADE}px), transparent` : "#000"})`
      : undefined

  const reset = React.useCallback(() => setSizes(items.map(() => BASE)), [items])

  // Apps starting up: their icons bounce until the animation ends. With
  // reduced motion there is no animation to end, so there is nothing to mark.
  const [bouncing, setBouncing] = React.useState<ReadonlySet<string>>(() => new Set())
  const launch = (item: DockItem) => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!still && !item.running && !item.minimized) setBouncing((b) => new Set(b).add(item.id))
    item.onClick?.()
  }
  const landed = (id: string) =>
    setBouncing((b) => {
      const next = new Set(b)
      next.delete(id)
      return next
    })

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
                        bouncing.has(item.id) && "animate-[y2k-dock-bounce_600ms_2] motion-reduce:animate-none"
                      )}
                      onAnimationEnd={(e) => e.target === e.currentTarget && landed(item.id)}
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

/** An element, a rect, or a selector the genie looks up two frames later,
 *  once the caller has changed the page. */
type GenieTarget = Element | DOMRect | string

/** Marks the copies, so hiding the window being restored leaves them alone. */
const COPY = "y2k-genie-copy"
/** Safari, and every browser on iOS (all WebKit underneath). */
const WEBKIT = typeof navigator !== "undefined" && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium/.test(navigator.userAgent)

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (v: number) => v * v * (3 - 2 * v)

/** The genie playing on each window: a new one on the same window stops it. */
const playing = new WeakMap<Element, () => void>()

/**
 * The matrix3d that lays a w × h box, its corner at the origin, on the
 * trapezoid whose top edge runs from lt to rt at height top and whose foot
 * runs from lb to rb at height foot. A skew can't do this — it moves both
 * sides of a strip the same way — but a projective map can: every row stays
 * straight and spans exactly from side to side, so one strip's foot is the
 * next one's top and the window's sides run on unbroken.
 */
function trapezoid(w: number, h: number, top: number, lt: number, rt: number, foot: number, lb: number, rb: number) {
  const k = Math.max(1e-3, rt - lt) / Math.max(1e-3, rb - lb) - 1
  return `matrix3d(${(rt - lt) / w},0,0,0,${(lb * (1 + k) - lt) / h},${(foot * (1 + k) - top) / h},0,${k / h},0,0,1,0,${lt},${top},0,1)`
}

/** A child's place under an ancestor, as child indices: found again in a copy. */
function pathTo(el: Element, root: Element) {
  const path: number[] = []
  for (let e = el; e !== root && e.parentElement; e = e.parentElement) path.unshift(Array.prototype.indexOf.call(e.parentElement.children, e))
  return path
}

/**
 * Mac OS X's genie: a window pours into its Dock tile as it is minimised, or
 * out of it (`reverse`) as it comes back. It plays over a copy of the window
 * cut into horizontal strips, each laid on its piece of a funnel whose sides
 * curve from the window down to the tile: first the window's foot stretches
 * down into the tile, then the whole window slides down the funnel and into
 * it. The page itself is not touched.
 *
 * Minimising: pass the window element (it is copied at once, before the
 * caller takes it away) and a selector for its new tile. Restoring: pass the
 * tile's rect, measured before the tile goes, and a selector for the window;
 * the window stays hidden until the genie has poured it out. Resolves when
 * the copy is gone; does nothing when the visitor asks for reduced motion.
 */
async function genie(windowTarget: GenieTarget, tileTarget: GenieTarget, { reverse = false, duration = 520 } = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const rectOf = (t: GenieTarget) => {
    const el = typeof t === "string" ? document.querySelector(t) : t
    return el instanceof Element ? el.getBoundingClientRect() : el
  }

  const hider = reverse && typeof windowTarget === "string" ? document.createElement("style") : null
  if (hider) {
    // Everything the selector matches EXCEPT the copies below, which carry
    // the window's own attributes and would otherwise be hidden with it.
    hider.textContent = `${windowTarget}:not(.${COPY}) { visibility: hidden !important; }`
    document.head.append(hider)
  }
  const layer = document.createElement("div")
  layer.setAttribute("aria-hidden", "true")
  layer.inert = true
  layer.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden"
  // The funnel ends at the tile's mouth: whatever has poured past it is in.
  const funnel = document.createElement("div")
  funnel.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden"
  layer.append(funnel)

  let source: Element | null = null
  let stopped = false
  const stop = () => {
    stopped = true
    layer.remove()
    hider?.remove()
    if (source && playing.get(source) === stop) playing.delete(source)
  }

  /** Lay a copy of the window over it, cut into strips, before anything
   *  moves. Each strip holds its own copy, clipped to its band. */
  const lay = (el: Element) => {
    playing.get(el)?.()
    playing.set((source = el), stop)
    // A window shown again replays its opening; the genie is its opening,
    // so play that to the end, or it is measured (and copied) mid-zoom.
    for (const a of el.getAnimations()) if (Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish()
    const rect = el.getBoundingClientRect()
    // Safari takes longer to lay out forty strips than the genie lasts, and
    // starts it late; sixteen draw the same funnel there without the wait.
    const n = Math.max(16, Math.min(WEBKIT ? 16 : 40, Math.round(rect.height / 12)))
    const strip = rect.height / n

    // What a copy doesn't carry over: where the window is scrolled, and the
    // picture in a canvas or a movie. A movie would load again in every
    // strip, so the copies get its current frame, or its poster.
    const scrollers = [...el.querySelectorAll("*")]
      .filter((e) => (e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth) && /auto|scroll/.test(getComputedStyle(e).overflow))
      .map((e) => ({ path: pathTo(e, el), top: e.scrollTop, left: e.scrollLeft, gutter: e instanceof HTMLElement && e.offsetWidth - e.clientWidth > e.clientLeft * 2 }))
    const stills = [...el.querySelectorAll("canvas, video")]
    const frames = [...el.querySelectorAll("iframe")].map((f) => ({ w: f.offsetWidth, h: f.offsetHeight, display: getComputedStyle(f).display }))
    const model = el.cloneNode(true) as HTMLElement
    model.classList.add(COPY)
    for (const e of [model, ...model.querySelectorAll("[id]")]) e.removeAttribute("id")
    // A copy is a picture: its scrollers only need to show the right place.
    // Clipped, not scrolling, each is part of its strip's one layer — a
    // scrolling layer in every strip would cost a frame in three.
    for (const s of scrollers) {
      const e = s.path.reduce<Element | undefined>((at, i) => at?.children[i], model)
      if (e instanceof HTMLElement) Object.assign(e.style, { overflow: "hidden", scrollbarGutter: s.gutter ? "stable" : "" })
    }
    // The window's pictures are loaded and decoded: a copy should paint them
    // at once, not wait to be scrolled near (and lay out short until then).
    for (const img of model.querySelectorAll("img")) Object.assign(img, { loading: "eager", decoding: "sync" })
    model.querySelectorAll("canvas, video").forEach((e, i) => {
      if (!(e instanceof HTMLVideoElement)) return
      const movie = stills[i] as HTMLVideoElement
      e.preload = "none"
      e.autoplay = false
      if (movie.readyState < 2 || (movie.paused && movie.currentTime === 0)) return
      const still = Object.assign(document.createElement("canvas"), { width: movie.videoWidth, height: movie.videoHeight, className: e.className })
      still.style.cssText = e.style.cssText
      e.replaceWith(still)
    })
    // A frame (an embedded board) would load its page again in every strip:
    // forty requests, and Safari stalls for seconds. The copies get a white
    // box its size.
    model.querySelectorAll("iframe").forEach((f, i) => {
      const box = document.createElement("div")
      box.className = f.className
      box.style.cssText = f.style.cssText
      Object.assign(box.style, { display: frames[i].display, width: `${frames[i].w}px`, height: `${frames[i].h}px`, background: "#fff" })
      f.replaceWith(box)
    })
    Object.assign(model.style, {
      position: "absolute", left: "0", right: "auto", bottom: "auto",
      width: `${rect.width}px`, height: `${rect.height}px`, margin: "0",
      transform: "none", translate: "none", scale: "none", rotate: "none",
      animation: "none", transition: "none", visibility: "inherit",
    })

    const bands = Array.from({ length: n }, (_, i) => {
      const top = i * strip
      // Two pixels deeper than its share, tucked under the next strip, so
      // their antialiased edges never meet over the desktop. The 0.999 keeps
      // Chrome blending each strip: drawn as opaque, a strip's top edge is
      // mixed with white, and a pale line runs across every join.
      const h = Math.min(rect.height - top, strip + 2)
      const band = document.createElement("div")
      band.style.cssText = `position:absolute;left:0;top:0;width:${rect.width}px;height:${h}px;overflow:hidden;opacity:0.999;transform-origin:0 0;will-change:transform;transform:translate(${rect.left}px,${rect.top + top}px)`
      const copy = model.cloneNode(true) as HTMLElement
      copy.style.top = `${-top}px`
      band.append(copy)
      funnel.append(band)
      return { band, copy, top, h }
    })
    document.body.append(layer)
    // In the page now, so the copies can scroll and draw.
    for (const { copy } of bands) {
      for (const s of scrollers) {
        if (!s.top && !s.left) continue
        s.path.reduce<Element | undefined>((at, i) => at?.children[i], copy)?.scrollTo({ left: s.left, top: s.top, behavior: "instant" })
      }
      copy.querySelectorAll("canvas, video").forEach((e, i) => {
        if (!(e instanceof HTMLCanvasElement)) return
        try {
          e.getContext("2d")?.drawImage(stills[i] as CanvasImageSource, 0, 0, e.width, e.height)
        } catch {
          // A canvas that can't be read (another origin's picture) stays blank.
        }
      })
    }
    return { rect, bands }
  }

  try {
    // Minimising: the window is here now and gone next frame, so copy it now.
    let laid = windowTarget instanceof Element ? lay(windowTarget) : null
    let tile = typeof tileTarget === "string" ? null : rectOf(tileTarget)
    await frame()
    await frame()
    if (stopped) return
    if (!laid && typeof windowTarget === "string") {
      const el = document.querySelector(`${windowTarget}:not(.${COPY})`)
      if (el) laid = lay(el)
    }
    tile ??= rectOf(tileTarget)
    if (!laid || !tile || laid.rect.width === 0) return

    const { rect, bands } = laid
    const { left: x0, top: y0, width: W, height: H } = rect
    // The mouth of the funnel: the middle of the tile, a little in from its sides.
    const mouthL = tile.left + tile.width * 0.15
    const mouthR = tile.right - tile.width * 0.15
    const mouthY = tile.top + tile.height * 0.3
    const drop = Math.max(1, mouthY - y0)
    funnel.style.height = `${mouthY}px`

    const draw = (p: number) => {
      const bend = smooth(clamp01(p / 0.45)) // the foot reaching down into the tile
      const slide = clamp01((p - 0.25) / 0.75)
      const fall = slide * slide * drop // speeding up into the Dock
      // Where a row of the window is: drawn out down to the mouth as the foot
      // reaches for it — the title bar keeps its height, the tail stretches
      // (a window taller than the drop is squeezed evenly) — then sliding
      // down after it.
      const reach = (drop - H) * bend
      const at = (y: number) => y0 + fall + y + reach * (reach > 0 ? (y / H) ** 2 : y / H)
      // The funnel's sides at a height on the screen: straight down from the
      // window's sides at its top, curving in to the mouth's.
      const sides = (y: number) => {
        const k = smooth(clamp01((y - y0) / drop)) * bend
        return [x0 + (mouthL - x0) * k, x0 + W + (mouthR - x0 - W) * k] as const
      }
      for (const { band, top, h } of bands) {
        const yt = at(top)
        const yb = at(top + h)
        const [lt, rt] = sides(yt)
        const [lb, rb] = sides(yb)
        band.style.transform = trapezoid(W, h, yt, lt, rt, yb, lb, rb)
      }
    }
    const start = performance.now()
    for (;;) {
      const p = clamp01((performance.now() - start) / duration)
      draw(reverse ? 1 - p : p)
      if (p >= 1) break
      await frame()
      if (stopped) return
    }
  } finally {
    stop()
  }
}

export { Dock, genie, type DockItem }

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
