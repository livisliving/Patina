/**
 * Shared by the Figma library's generators: the connection to Figma Desktop
 * (through figma-cli's CDP client), the readers for DESIGN.md and y2k.css,
 * and the colour / shadow / tile helpers that turn CSS into Plugin-API data.
 *
 *   FIGMA_CLI   where figma-cli lives   (default ~/figma-cli)
 *   FIGMA_FILE  the open file's title   (default "Patina design system")
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import zlib from "node:zlib"

const ROOT = new URL("../../", import.meta.url)
export const read = (rel) => fs.readFileSync(new URL(rel, ROOT), "utf8")

/* ── Figma Desktop ───────────────────────────────────────────────── */

export async function connect() {
  const cli = process.env.FIGMA_CLI ?? path.join(os.homedir(), "figma-cli")
  const { FigmaClient } = await import(path.join(cli, "src/figma-client.js"))
  const c = new FigmaClient()
  await c.connect(process.env.FIGMA_FILE ?? "Patina design system")
  return c
}

/** Run `main(P)` inside Figma with the payload and the Figma-side helpers. */
export async function runInFigma(client, payload) {
  const side = read("scripts/figma/figma-side.js")
  const code = `(async () => {\n${side}\nconst P = ${JSON.stringify(payload)};\nreturn await main(P);\n})()`
  return client.eval(code)
}

/* ── Colours ─────────────────────────────────────────────────────── */

/** "#rrggbb" | "rgb(a)(r, g, b[, a])" | "rgb(r g b / a)" | "transparent" → Figma {r,g,b,a} in 0..1 */
export function rgba(s) {
  s = s.trim()
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 }
  if (s.startsWith("#")) {
    const h = s.length === 4 ? [...s.slice(1)].map((c) => c + c).join("") : s.slice(1)
    const [r, g, b, a = 255] = [0, 2, 4, 6].map((i) => (h.length > i ? parseInt(h.slice(i, i + 2), 16) : undefined))
    return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 }
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`not a colour: ${s}`)
  const n = m[1].match(/[\d.]+%?/g).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v)))
  const [r, g, b, a = 1] = n
  return { r: r / 255, g: g / 255, b: b / 255, a }
}

/** Equal neighbouring rows merged: [[colour, from, to], …] with from/to in rows. */
export function runs(rows) {
  const out = []
  rows.forEach((c, i) => {
    const last = out.at(-1)
    if (last && last[0] === c) last[2] = i + 1
    else out.push([c, i, i + 1])
  })
  return out
}

/** A row profile as gradient stops over 0..1: hard bands, one per run. */
export function bandStops(rows, varNames = null) {
  const n = rows.length
  const stops = []
  for (const [c, a, b] of runs(rows)) {
    const v = varNames ? varNames[a] : undefined
    stops.push({ position: a / n, color: rgba(c), variable: v })
    stops.push({ position: b / n, color: rgba(c), variable: v })
  }
  return stops
}

/* ── DESIGN.md and y2k.css ───────────────────────────────────────── */

/** The front matter's colours, typography, rounded and spacing blocks. */
export function readDesign() {
  const fm = read("DESIGN.md").split(/^---$/m)[1]
  const out = { colors: {}, typography: {}, rounded: {}, spacing: {} }
  let section = null, sub = null
  for (const raw of fm.split("\n")) {
    const line = raw.replace(/\s+#.*$/, "").trimEnd()
    if (!line.trim() || line.trim().startsWith("#")) continue
    const top = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (top) { section = out[top[1]] ? top[1] : null; sub = null; continue }
    if (!section) continue
    const two = line.match(/^  ([\w-]+):\s*(.*)$/)
    if (two) {
      if (two[2] === "") { sub = two[1]; out[section][sub] = {} } else { sub = null; out[section][two[1]] = unquote(two[2]) }
      continue
    }
    const four = line.match(/^    ([\w-]+):\s*(.*)$/)
    if (four && sub) out[section][sub][four[1]] = unquote(four[2])
  }
  return out
}
const unquote = (v) => v.replace(/^"(.*)"$/, "$1")

/** Every `--y2k-*` token declared in y2k.css's first :root block, name → value. */
export function readRootTokens() {
  const css = read("packages/ui/src/styles/y2k.css")
  const root = css.slice(css.indexOf(":root {"), css.indexOf("/* measured:begin"))
  const out = {}
  // A value runs to the `;` that ends its line (a data: URL carries one of its own).
  for (const m of root.matchAll(/^\s*(--y2k-[\w-]+):\s*(.+?);(?:\s*\/\*.*?\*\/)?\s*$/gm)) out[m[1]] = m[2].trim()
  return out
}

/** `var(--y2k-x)` references replaced by their values (one level is all the file uses). */
export const resolveVars = (value, tokens) => value.replace(/var\((--y2k-[\w-]+)\)/g, (_, n) => tokens[n] ?? _)

/** A CSS box-shadow list → Figma effects. `x y blur [spread] colour [inset]`. */
export function shadows(value) {
  const out = []
  for (const part of splitTop(value)) {
    const inset = /\binset\b/.test(part)
    const colourM = part.match(/(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})/)
    if (!colourM) throw new Error(`shadow without a colour: ${part}`)
    const nums = part.replace(colourM[0], "").replace(/\binset\b/, "").trim().split(/\s+/).map((v) => parseFloat(v) || 0)
    const [x = 0, y = 0, blur = 0, spread = 0] = nums
    out.push({ type: inset ? "INNER_SHADOW" : "DROP_SHADOW", color: rgba(colourM[0]), offset: { x, y }, radius: blur, spread, visible: true, blendMode: "NORMAL" })
  }
  return out
}
function splitTop(s) {
  const parts = []; let depth = 0, cur = ""
  for (const ch of s) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = "" } else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

/** A pinstripe: `repeating-linear-gradient(to bottom, c 0 1px, c 1px 2px, …)` → its row colours. */
export function stripeRows(value) {
  const inner = value.replace(/^repeating-linear-gradient\(\s*to bottom\s*,/, "").replace(/\)\s*$/, "")
  return splitTop(inner).map((p) => p.match(/^(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})/)[1])
}

/* ── PNG tiles (the fallback when the file has no pattern fills) ─── */

/** A `w`×rows.length RGBA PNG, one colour per row, as base64. */
export function pngTile(rows, w = 4) {
  const h = rows.length
  const raw = Buffer.alloc((w * 4 + 1) * h)
  rows.forEach((c, y) => {
    const { r, g, b, a } = rgba(c)
    const o = y * (w * 4 + 1)
    raw[o] = 0
    for (let x = 0; x < w; x++) raw.set([r * 255, g * 255, b * 255, a * 255].map(Math.round), o + 1 + x * 4)
  })
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]).toString("base64")
}
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0 }

/* ── Names ───────────────────────────────────────────────────────── */

export const nn = (i) => String(i + 1).padStart(2, "0")
/** "body-md" → "Body/MD"; "display-wordmark" → "Display/Wordmark"; "heading" → "Heading". */
export function styleName(key) {
  const [head, ...rest] = key.split("-")
  const cap = (s) => (s.length <= 2 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1))
  return rest.length ? `${cap(head)}/${rest.map(cap).join(" ")}` : cap(head)
}
