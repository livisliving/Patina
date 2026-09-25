/**
 * What the Figma library holds, as data: the Tone, Aqua and Size collections
 * and the paint styles drawn from them. The rows come from
 * scripts/tones-data.mjs — the same lists y2k.css is generated from.
 */

import { BARBER, BARBER_SHADE, NEUTRAL, RIBS, TONED, derive, fmt, hex, mix, parse, profile, rgbStr, tint, toHex } from "../tones-data.mjs"
import { bandStops, nn, rgba } from "./lib.mjs"

const V = (name, value, type = "COLOR", description) => ({ name, type, value, description })
const colour = (name, css, description) => V(name, rgba(css), "COLOR", description)
const rowVars = (prefix, rows, description) => rows.map((c, i) => colour(`${prefix}/${nn(i)}`, c, description))
const rowNames = (prefix, rows) => rows.map((_, i) => `${prefix}/${nn(i)}`)
const ref = (collection, name) => ({ collection, name })

/** Human names for the measured profiles, shared by variables and styles. */
export const TONE_PROFILES = {
  gel: "Gel", tab: "Tab", segmentOn: "Control", popupGem: "Pop-up Gem", checkOn: "Check", radioOn: "Radio",
  sliderRound: "Slider", sliderPointer: "Pointer", stepperUp: "Stepper Up", stepperDown: "Stepper Down",
  progress: "Progress", scrollThumb: "Scroll Thumb", listheaderSorted: "List Header Sorted", highlight: "Highlight",
}
export const AQUA_PROFILES = {
  white: "Gel White", pressed: "Gel Pressed", segment: "Segment White", segmentPress: "Segment Pressed", segmentDiv: "Segment Divider",
  listheader: "List Header", checkOff: "Check Off", radioOff: "Radio Off", popup: "Pop-up White", stepper: "Stepper",
  progressTrack: "Progress Track", sliderTrack: "Slider Track", titlebar: "Title Bar", titlebarOff: "Title Bar Inactive",
  roundbtn: "Round Button", bevel: "Bevel", bevelOff: "Bevel Disabled", toolbarToggle: "Toolbar Toggle",
  gemClose: "Light Red", gemMin: "Light Yellow", gemZoom: "Light Green", gemOff: "Light Off",
  metalButton: "Metal Button", metalGroove: "Metal Groove", metalKnob: "Metal Knob",
  scrollTrack: "Scroll Track", scrollArrow: "Scroll Arrow",
}
// Profiles that run across the control (columns), not down it.
const ACROSS = new Set(["scrollThumb", "scrollTrack", "scrollArrow"])
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")

/* ── Tone ────────────────────────────────────────────────────────── */

/** The Tone collection's values for one tone — what `figma:tone` rewrites. */
export function toneValues(t) {
  const d = derive(t)
  const rows = profile(t)
  const vars = [
    V("tone/name", t.id, "STRING", "The tone this file currently shows"),
    colour("tone/base", rgbStr(d.b), "--y2k-tone"),
    colour("tone/ink", t.ink, "--y2k-tone-selection-text"),
    colour("tone/highlight-text", "#ffffff", "--y2k-tone-highlight-text"),
    colour("tone/selection", t.selection ?? fmt([d.selection, 0.88]), "--y2k-tone-selection"),
    colour("tone/glow", fmt([d.b, 0.5]), "--y2k-tone-glow"),
    colour("tone/focus", fmt([parse(d.one("#6db3ff"))[0], 0.55]), "--y2k-tone-focus"),
    colour("tone/zebra", d.x ? "#edf3fe" : toHex(tint(hex("#edf3fe"), d.b)), "--y2k-tone-zebra"),
    colour("tone/wall/hi", rgbStr(mix(d.b, 0.45)), "--y2k-wall-hi"),
    colour("tone/wall/mid", rgbStr(d.b), "--y2k-wall-mid"),
    colour("tone/wall/lo", rgbStr(d.b.map((v) => v * 0.45)), "--y2k-wall-lo"),
  ]
  const list = t.list ? t.list.match(/rgb\([^)]*\)/g) : [rgbStr(mix(d.listBase, d.light)), rgbStr(mix(d.listBase, d.dark)), rgbStr(d.listBase)]
  vars.push(...rowVars("tone/list", list, "--y2k-tone-list, top / middle / foot"))
  for (const [k, name] of Object.entries(TONE_PROFILES)) vars.push(...rowVars(`tone/${slug(name)}`, rows[k], `The ${name} rows, top to bottom (--y2k-tone-${slug(name)})`))
  vars.push(...rowVars("tone/barber", BARBER.map(([c]) => d.one(c)), "--y2k-tone-barber, one 22.63px period at 45°"))
  return vars
}
export const toneCollection = (t) => ({ name: "Tone", mode: "Tone", variables: toneValues(t) })

export function tonePaints(t) {
  const rows = profile(t)
  const d = derive(t)
  const out = []
  for (const [k, name] of Object.entries(TONE_PROFILES)) {
    const prefix = `tone/${slug(name)}`
    out.push({ name: `Tone/${name}`, kind: "gradient", dir: ACROSS.has(k) ? "right" : "down", stops: bandStops(rows[k], rowNames(prefix, rows[k]).map((n) => ref("Tone", n))), description: `--y2k-tone-${slug(name)} · ${rows[k].length} rows` })
  }
  const list = t.list ? t.list.match(/rgb\([^)]*\)/g) : [rgbStr(mix(d.listBase, d.light)), rgbStr(mix(d.listBase, d.dark)), rgbStr(d.listBase)]
  out.push({ name: "Tone/List", kind: "gradient", dir: "down", stops: list.map((c, i) => ({ position: i / 2, color: rgba(c), variable: ref("Tone", `tone/list/${nn(i)}`) })), description: "--y2k-tone-list, the sidebar's selected row" })
  out.push({ name: "Tone/Wallpaper", kind: "gradient", dir: "down", stops: ["hi", "mid", "lo"].map((k, i) => ({ position: i / 2, color: rgba(k === "hi" ? rgbStr(mix(d.b, 0.45)) : k === "mid" ? rgbStr(d.b) : rgbStr(d.b.map((v) => v * 0.45))), variable: ref("Tone", `tone/wall/${k}`) })), description: "--y2k-wall-hi / -mid / -lo" })
  // The barber pole: one 45° period is 22.63px, so a 32px square holds two, corner to corner.
  const barber = BARBER.map(([c, p]) => [d.one(c), p])
  const period = 22.63
  const stops = []
  for (let k = 0; k < 2; k++) barber.forEach(([c, p], i) => stops.push({ position: (p + k * period) / (2 * period), color: rgba(c), variable: ref("Tone", `tone/barber/${nn(i)}`) }))
  out.push({ name: "Tone/Barber", kind: "gradient", dir: "diag", stops, description: "--y2k-tone-barber: two 45° periods; apply to a 32px square and tile" })
  for (const [name, css, v] of [["Base", rgbStr(d.b), "tone/base"], ["Selection", t.selection ?? fmt([d.selection, 0.88]), "tone/selection"], ["Glow", fmt([d.b, 0.5]), "tone/glow"], ["Focus", fmt([parse(d.one("#6db3ff"))[0], 0.55]), "tone/focus"], ["Zebra", d.x ? "#edf3fe" : toHex(tint(hex("#edf3fe"), d.b)), "tone/zebra"], ["Ink", t.ink, "tone/ink"], ["Highlight Text", "#ffffff", "tone/highlight-text"]])
    out.push({ name: `Tone/${name}`, kind: "solid", color: css, variable: ref("Tone", v) })
  return out
}

/* ── Aqua ────────────────────────────────────────────────────────── */

const TONED_KEYS = /^(primary|surface|tone-)/
export function aquaCollection(design, tokens) {
  const vars = []
  for (const [k, v] of Object.entries(design.colors)) if (!TONED_KEYS.test(k)) vars.push(colour(`aqua/${k}`, v, `DESIGN.md colors.${k}`))
  for (const [n, v] of Object.entries(tokens)) if (/^(#|rgba?\()/.test(v)) vars.push(colour(`aqua/${n.replace("--y2k-", "")}`, v, n))
  for (const [k, name] of Object.entries(AQUA_PROFILES)) vars.push(...rowVars(`aqua/${slug(name)}`, NEUTRAL[k], `The ${name} rows, top to bottom`))
  vars.push(...rowVars("aqua/progress-ribs", RIBS.map(([c]) => c), "--y2k-progress-ribs, one 16px period"))
  vars.push(...rowVars("aqua/barber-shade", BARBER_SHADE, "--y2k-barber-shade"))
  return { name: "Aqua", mode: "Aqua", variables: vars }
}

export function aquaPaints() {
  const out = []
  for (const [k, name] of Object.entries(AQUA_PROFILES)) {
    const prefix = `aqua/${slug(name)}`
    out.push({ name: `Aqua/${name}`, kind: "gradient", dir: ACROSS.has(k) ? "right" : "down", stops: bandStops(NEUTRAL[k], rowNames(prefix, NEUTRAL[k]).map((n) => ref("Aqua", n))), description: `${NEUTRAL[k].length} measured rows` })
  }
  out.push({ name: "Aqua/Barber Shade", kind: "gradient", dir: "down", stops: bandStops(BARBER_SHADE, rowNames("aqua/barber-shade", BARBER_SHADE).map((n) => ref("Aqua", n))), description: "--y2k-barber-shade, laid over the barber stripes" })
  out.push({ name: "Aqua/Progress Ribs", kind: "gradient", dir: "right", stops: RIBS.map(([c, p], i) => ({ position: p / 16, color: rgba(c), variable: ref("Aqua", `aqua/progress-ribs/${nn(i)}`) })), description: "--y2k-progress-ribs: one 16px period; apply to a 16px-wide element and tile" })
  return out
}

/* ── Size ────────────────────────────────────────────────────────── */

export function sizeCollection(design, tokens) {
  const vars = []
  for (const [k, v] of Object.entries(design.spacing)) vars.push(V(`spacing/${k}`, parseFloat(v), "FLOAT", `DESIGN.md spacing.${k}`))
  for (const [k, v] of Object.entries(design.rounded)) vars.push(V(`radius/${k}`, parseFloat(v), "FLOAT", `DESIGN.md rounded.${k}`))
  for (const [n, v] of Object.entries(tokens)) if (/^\d+(\.\d+)?px$/.test(v)) vars.push(V(`metric/${n.replace("--y2k-", "")}`, parseFloat(v), "FLOAT", n))
  return { name: "Size", mode: "Size", variables: vars }
}

/* ── The Colours sheet ───────────────────────────────────────────── */

export function colourGroups(t) {
  const rows = profile(t)
  const solid = (collection, names) => names.map((name) => ({ collection, name }))
  return [
    { title: "Tone", items: solid("Tone", ["tone/base", "tone/selection", "tone/glow", "tone/focus", "tone/zebra", "tone/ink", "tone/highlight-text", "tone/wall/hi", "tone/wall/mid", "tone/wall/lo", "tone/list/01", "tone/list/02", "tone/list/03"]) },
    { title: "Tone materials", items: [...Object.entries(TONE_PROFILES).map(([k, name]) => ({ style: `Tone/${name}`, rows: rows[k].length })), { style: "Tone/List", rows: 12 }, { style: "Tone/Wallpaper", rows: 24 }, { style: "Tone/Barber", rows: 16, wide: true }] },
    { title: "Aqua", items: solid("Aqua", ["aqua/ink", "aqua/ink-secondary", "aqua/ink-disabled", "aqua/link", "aqua/title-ink", "aqua/title-ink-inactive", "aqua/window-border", "aqua/separator", "aqua/field-border", "aqua/field-border-top", "aqua/menubar-border", "aqua/neutral", "aqua/neutral-bright", "aqua/neutral-dim", "aqua/neutral-tint", "aqua/neutral-variant", "aqua/neutral-glass", "aqua/neutral-veil", "aqua/outline", "aqua/error", "aqua/traffic-yellow", "aqua/traffic-green", "aqua/light-red-glyph", "aqua/light-yellow-glyph", "aqua/light-green-glyph"]) },
    { title: "Aqua materials", items: [...Object.entries(AQUA_PROFILES).map(([k, name]) => ({ style: `Aqua/${name}`, rows: NEUTRAL[k].length })), { style: "Aqua/Barber Shade", rows: BARBER_SHADE.length }, { style: "Aqua/Progress Ribs", rows: 8, wide: true }] },
    { title: "Stripes and metal", items: ["Pinstripe Regular", "Pinstripe Light", "Pinstripe Menu", "Pinstripe Dock", "Pinstripe Dark", "Placard", "Placard Inactive"].map((n) => ({ style: `Aqua/Stripe/${n}`, rows: 16 })).concat([{ style: "Aqua/Metal/Texture", rows: 24, wide: true }]) },
  ]
}

/* ── Fonts ───────────────────────────────────────────────────────── */

/** DESIGN.md's family + weight → the Figma font. Lucida Grande has Regular and Bold only. */
export function fontOf(family, weight) {
  const style = weight >= 700 ? "Bold" : weight >= 500 ? "Medium" : "Regular"
  if (family === "Lucida Grande" || family === "Monaco") return { family, style: weight >= 700 && family === "Lucida Grande" ? "Bold" : "Regular" }
  return { family, style }
}
