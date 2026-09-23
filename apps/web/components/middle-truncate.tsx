"use client"

import * as React from "react"
import { cn } from "@patina/ui"

/**
 * A file name as the Finder shortens it: from the middle, so the start and
 * the extension both stay — "A Line Which…Volume.rtf". `lines` is how many
 * lines it may wrap to (2 under an icon, 1 in a column). CSS can only cut the
 * end, so the name is laid out off-screen at the width it has: the first
 * lines stay as they wrap, and the last keeps the most of the rest that
 * fits, half from each end.
 *
 * The box (`className`) takes the width the name may use; the label inside
 * (`labelClassName`) wraps to it, and carries any padding and selection.
 * Screen readers get the whole name.
 */
export function MiddleTruncate({
  text,
  lines,
  className,
  labelClassName,
}: {
  text: string
  lines: 1 | 2
  className?: string
  labelClassName?: string
}) {
  const box = React.useRef<HTMLSpanElement>(null)
  const label = React.useRef<HTMLSpanElement>(null)
  const [shown, setShown] = React.useState(text)

  React.useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => label.current && setShown(shorten(text, lines, el, label.current))
    // Called once on observe, before the first paint, then on every resize;
    // again when the web fonts arrive, as they change every width.
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    void document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [text, lines])

  return (
    <span ref={box} className={cn("block min-w-0", className)}>
      <span ref={label} title={shown === text ? undefined : text} className={cn("whitespace-pre-line [overflow-wrap:anywhere]", labelClassName)}>
        <span aria-hidden>{shown}</span>
        <span className="sr-only">{text}</span>
      </span>
    </span>
  )
}

let probe: HTMLSpanElement | null = null

/** The name as it sets at the box's width (less the label's own padding and
 *  border): whole if it fits in `lines`; otherwise the first lines as they
 *  wrap, and the rest cut from the middle into the last, as the Finder does
 *  — "A Line Which Runs" over "Past Tw…Volume.rtf". Lines are joined by
 *  newlines, which the label keeps. */
function shorten(text: string, lines: number, box: HTMLElement, label: HTMLElement) {
  const s = getComputedStyle(label)
  const inset = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce(
    (sum, k) => sum + parseFloat(s[k as "paddingLeft"]),
    0
  )
  const width = box.clientWidth - inset
  // No room at all (or not laid out yet): the ellipsis alone.
  if (width <= 0) return "…"

  if (!probe) {
    probe = document.createElement("span")
    probe.setAttribute("aria-hidden", "true")
    Object.assign(probe.style, { position: "absolute", left: "-10000px", top: "0", visibility: "hidden", display: "block", whiteSpace: "normal", overflowWrap: "anywhere" })
    document.body.append(probe)
  }
  const p = probe
  // Longhands: Firefox leaves the computed `font` shorthand empty.
  const { fontFamily, fontSize, fontWeight, fontStyle, fontStretch, letterSpacing, lineHeight, wordSpacing } = s
  Object.assign(p.style, { width: `${width}px`, fontFamily, fontSize, fontWeight, fontStyle, fontStretch, letterSpacing, lineHeight, wordSpacing })
  const height = (t: string) => {
    p.textContent = t
    return p.offsetHeight
  }
  const line = height("X")
  if (height(text) <= line * lines + 1) return text

  /** Where the second line starts, as `t` wraps: the first character set
   *  below the first, found by halving. */
  const wrapAt = (t: string) => {
    p.textContent = t
    const node = p.firstChild as Text
    const range = document.createRange()
    const top = (i: number) => {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      return range.getBoundingClientRect().top
    }
    const first = top(0)
    let [lo, hi] = [1, t.length]
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (top(mid) > first + 1) hi = mid
      else lo = mid + 1
    }
    return lo
  }
  /** The most of `t` that fits on one line, half from each end. */
  const oneLine = (t: string) => {
    const cut = (keep: number) => `${t.slice(0, Math.ceil(keep / 2)).trimEnd()}…${t.slice(t.length - Math.floor(keep / 2)).trimStart()}`
    if (height(t) <= line + 1) return t
    let [lo, hi] = [0, t.length - 1]
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      if (height(cut(mid)) <= line + 1) lo = mid
      else hi = mid - 1
    }
    return cut(lo)
  }

  const out: string[] = []
  let rest = text
  for (let n = 1; n < lines; n++) {
    const at = wrapAt(rest)
    out.push(rest.slice(0, at).trimEnd())
    rest = rest.slice(at).trimStart()
  }
  out.push(oneLine(rest))
  return out.join("\n")
}
