#!/usr/bin/env node
/**
 * Writes the measured Aqua materials into packages/ui/src/styles/y2k.css:
 *   measured:begin … measured:end — the neutral controls (white gel, segment,
 *     list header, check box, progress track …), one block in :root;
 *   tones:begin … tones:end — the five tone blocks (the gel, tab, segment,
 *     pop-up gem, check, radio, slider, stepper, progress, highlight …).
 *
 * The rows themselves, the tones and the colour maths live in
 * scripts/tones-data.mjs, shared with the Figma library's generator; this
 * script only draws them as CSS.
 *
 *   node scripts/tones.mjs          rewrite y2k.css
 *   node scripts/tones.mjs --print  print the blocks instead
 */

import fs from "node:fs"
import { BARBER, BARBER_SHADE, NEUTRAL, RIBS, TONED, TONES, derive, fmt, hex, mix, parse, rgbStr, tint, toHex } from "./tones-data.mjs"

const CSS = "packages/ui/src/styles/y2k.css"

/** A nine-sliced face: the rows above `mid` hang from the top, the rows below
 *  it from the bottom, and row `mid` stretches between — so the face fits any
 *  height, and at the original's own height it is the original. */
function nine(list, mid) {
  const n = list.length
  const at = (i) => (i <= mid ? `${i}px` : `calc(100% - ${n - i}px)`)
  return `linear-gradient(to bottom, ${list.map((c, i) => `${c} ${at(i)} ${at(i + 1)}`).join(", ")})`
}

/** A row profile's stops, equal neighbouring rows merged. `unit: "%"`
 *  spreads the rows over the box instead of 1px each (for art the original
 *  itself draws stretched, like the 10-row toolbar oval in a 12px box). */
function stops(list, map = (c) => c, unit = "px") {
  const runs = []
  list.forEach((c, i) => {
    const v = map(c)
    const last = runs.at(-1)
    if (last && last[0] === v) last[2] = i + 1
    else runs.push([v, i, i + 1])
  })
  const at = (i) => (unit === "%" ? `${+((i / list.length) * 100).toFixed(2)}%` : `${i}px`)
  return runs.map(([v, a, b]) => `${v} ${at(a)} ${at(b)}`).join(", ")
}
const rows = (list, { map, dir = "to bottom", unit } = {}) => `linear-gradient(${dir}, ${stops(list, map, unit)})`
/** One stop list, drawn both ways: `name` runs across (a vertical bar's
 *  columns), `name-h` runs down (the same bar lying along the foot). */
const bothWays = (name, list, map) => [
  `${name}-stops: ${stops(list, map)};`,
  `${name}: linear-gradient(to right, var(${name}-stops));`,
  `${name}-h: linear-gradient(to bottom, var(${name}-stops));`,
]

function block(t) {
  const { b, x, selection, light, dark, listBase, highlight, one } = derive(t)
  const tone = (list, opts) => rows(list, { map: one, ...opts })
  const barber = `repeating-linear-gradient(45deg, ${BARBER.map(([c, p]) => `${one(c)} ${p}px`).join(", ")})`
  const lines = [
    `--y2k-tone: ${rgbStr(b)};`,
    `--y2k-tone-button: ${tone(TONED.gel)};`,
    `--y2k-tone-button-edge: ${one(TONED.gel[0])};`,
    // The same rows spread over any height, for gel larger than a button.
    `--y2k-tone-button-fluid: ${tone(TONED.gel, { unit: "%" })};`,
    `--y2k-tone-tab: ${tone(TONED.tab)};`,
    `--y2k-tone-tab-edge: ${one(TONED.tab[0])};`,
    `--y2k-tone-control: ${tone(TONED.segmentOn)};`,
    `--y2k-tone-control-edge: ${one(TONED.segmentOn[0])};`,
    `--y2k-tone-popup: ${tone(TONED.popupGem)};`,
    `--y2k-tone-check: ${tone(TONED.checkOn)};`,
    `--y2k-tone-radio: ${tone(TONED.radioOn)};`,
    `--y2k-tone-slider: ${tone(TONED.sliderRound)};`,
    `--y2k-tone-pointer: ${tone(TONED.sliderPointer)};`,
    `--y2k-tone-stepper-up: ${tone(TONED.stepperUp)};`,
    `--y2k-tone-stepper-down: ${tone(TONED.stepperDown)};`,
    `--y2k-tone-progress: ${tone(TONED.progress)};`,
    `--y2k-tone-barber: ${barber};`,
    ...bothWays("--y2k-tone-scroll", TONED.scrollThumb, one),
    // Every other list row: the original's pale #edf3fe, in the tone — at
    // its own lightness, so a dark tone still gets a near-white stripe.
    `--y2k-tone-zebra: ${x ? "#edf3fe" : toHex(tint(hex("#edf3fe"), b))};`,
    `--y2k-tone-listheader-sorted: ${tone(TONED.listheaderSorted)};`,
    `--y2k-tone-highlight: ${rows(highlight)};`,
    `--y2k-tone-highlight-text: #ffffff;`,
    `--y2k-tone-selection: ${t.selection ?? fmt([selection, 0.88])};`,
    `--y2k-tone-selection-text: ${t.ink};`,
    `--y2k-tone-glow: ${fmt([b, 0.5])};`,
    // aqua-ui's focus ring: the light accent #6db3ff at 55%.
    `--y2k-tone-focus: ${fmt([parse(one("#6db3ff"))[0], 0.55])};`,
    `--y2k-tone-list: ${t.list ?? `linear-gradient(180deg, ${rgbStr(mix(listBase, light))} 0%, ${rgbStr(mix(listBase, dark))} 50%, ${rgbStr(listBase)} 100%)`};`,
    `--y2k-wall-hi: ${rgbStr(mix(b, 0.45))};`,
    `--y2k-wall-mid: ${rgbStr(b)};`,
    `--y2k-wall-lo: ${rgbStr(b.map((v) => v * 0.45))};`,
    `--y2k-face-filter: ${t.face};`,
    `--y2k-star-filter: ${t.star};`,
  ]
  const sel = t.root ? `:root,\n[data-tone="${t.id}"]` : `[data-tone="${t.id}"]`
  return `${sel} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`
}

/** The neutral controls — never toned. */
function measured() {
  const n = NEUTRAL
  const lines = [
    // Traffic lights: the 13 rows of each gem (rim, glint, the colour, the
    // glow at the foot); the unfocused window's graphite gem.
    `--y2k-light-red: ${rows(n.gemClose)};`,
    `--y2k-light-yellow: ${rows(n.gemMin)};`,
    `--y2k-light-green: ${rows(n.gemZoom)};`,
    `--y2k-light-off: ${rows(n.gemOff)};`,
    `--y2k-toolbar-toggle: ${rows(n.toolbarToggle, { unit: "%" })};`,
    `--y2k-gel-white: ${rows(n.white)};`,
    `--y2k-gel-pressed: ${rows(n.pressed)};`,
    `--y2k-segment-white: ${rows(n.segment)};`,
    `--y2k-segment-pressed: ${rows(n.segmentPress)};`,
    `--y2k-segment-divider: ${rows(n.segmentDiv)};`,
    `--y2k-listheader: ${rows(n.listheader)};`,
    `--y2k-check-off: ${rows(n.checkOff)};`,
    `--y2k-radio-off: ${rows(n.radioOff)};`,
    `--y2k-popup-white: ${rows(n.popup)};`,
    `--y2k-stepper: ${rows(n.stepper)};`,
    `--y2k-progress-track: ${rows(n.progressTrack)};`,
    `--y2k-slider-track: ${rows(n.sliderTrack)};`,
    `--y2k-titlebar: ${rows(n.titlebar)};`,
    `--y2k-titlebar-inactive: ${rows(n.titlebarOff)};`,
    // Spread over the box: the round button comes in any diameter (the 20px
    // icon button, a player's 28px and 32px transport).
    `--y2k-round-button: ${rows(n.roundbtn, { unit: "%" })};`,
    // Brushed-metal controls: the transport disc spread over any diameter
    // (28px, 32px), the 6px volume groove and its ball.
    `--y2k-metal-button: ${rows(n.metalButton, { unit: "%" })};`,
    `--y2k-metal-groove: ${rows(n.metalGroove)};`,
    `--y2k-metal-knob: ${rows(n.metalKnob, { unit: "%" })};`,
    // Nine-sliced, as the original is: at 18px its middle row doubles.
    `--y2k-bevel: ${nine(n.bevel, 8)};`,
    `--y2k-bevel-disabled: ${nine(n.bevelOff, 8)};`,
    // The determinate bar's ribs: a 16px light–dark–light wave that slides
    // right one pixel a frame (±5% — measured against the static fill).
    `--y2k-progress-ribs: repeating-linear-gradient(to right, ${RIBS.map(([c, p]) => `${c} ${p}px`).join(", ")});`,
    // The barber pole's gel lighting, laid over its stripes.
    `--y2k-barber-shade: ${rows(BARBER_SHADE)};`,
    ...bothWays("--y2k-scroll-track", n.scrollTrack),
    // The arrow button's face, its crease left of centre.
    ...bothWays("--y2k-scroll-arrow", n.scrollArrow),
    // A progress track's last 2px at each end, a shade darker.
    `--y2k-progress-ends: linear-gradient(to right, rgba(0,0,0,0.035) 0 1px, rgba(0,0,0,0.11) 1px 2px, transparent 2px calc(100% - 2px), rgba(0,0,0,0.11) calc(100% - 2px) calc(100% - 1px), rgba(0,0,0,0.035) calc(100% - 1px));`,
  ]
  return `:root {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`
}

const toneOut = `/* tones:begin — generated by scripts/tones.mjs; edit the script, not this block. */\n${TONES.map(block).join("\n")}\n/* tones:end */`
const measuredOut = `/* measured:begin — generated by scripts/tones.mjs; edit the script, not this block. */\n${measured()}\n/* measured:end */`

if (process.argv.includes("--print")) {
  console.log(`${measuredOut}\n\n${toneOut}`)
} else {
  let css = fs.readFileSync(CSS, "utf8")
  const tonesRe = /\/\* tones:begin[\s\S]*?\/\* tones:end \*\//
  const measuredRe = /\/\* measured:begin[\s\S]*?\/\* measured:end \*\//
  if (!tonesRe.test(css)) throw new Error(`${CSS}: no tones:begin / tones:end markers`)
  if (!measuredRe.test(css)) throw new Error(`${CSS}: no measured:begin / measured:end markers`)
  css = css.replace(measuredRe, () => measuredOut).replace(tonesRe, () => toneOut)
  fs.writeFileSync(CSS, css)
  console.log(`tones: wrote the measured block and ${TONES.length} tone blocks to ${CSS}`)
}
