/**
 * Colour parsing for token values read back out of the stylesheet.
 *
 * Browsers hand computed custom properties back in whatever form they please —
 * `rgb(232, 68, 154)` as authored, a normalised `#e8449a`, the `#0006` alpha
 * shorthand, or the space-separated `rgb(0 0 0 / 40%)` form — so anything that
 * reads a `--y2k-*` colour has to understand all of them. Parsing this in one
 * place keeps the shaders and the Design System palette from drifting apart
 * when a new syntax shows up.
 */

/** Channels are 0–255; alpha is 0–1. */
export type Rgba = { r: number; g: number; b: number; a: number }

/** Parses a CSS hex or rgb()/rgba() colour. Returns null for anything else
 *  (a gradient, a keyword, an empty custom property) — callers decide what to
 *  fall back to. */
export function parseColor(raw: string): Rgba | null {
  const v = raw.trim()

  const hex = v.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
    if (h.length !== 6 && h.length !== 8) return null
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    }
  }

  const fn = v.match(/^rgba?\(([^)]+)\)$/i)
  if (!fn) return null
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  // A percentage means 0–100 of the channel's own range: 255 for r/g/b, 1 for α.
  const num = (p: string, full: number) =>
    p.endsWith("%") ? (Number(p.slice(0, -1)) / 100) * full : Number(p)
  const [r, g, b] = parts.slice(0, 3).map((p) => num(p, 255))
  if ([r, g, b].some(Number.isNaN)) return null
  const a = parts.length > 3 ? num(parts[3], 1) : 1
  return { r, g, b, a: Number.isNaN(a) ? 1 : a }
}
