#!/usr/bin/env node
/**
 * Writes the measured Aqua materials into packages/ui/src/styles/y2k.css:
 *   measured:begin … measured:end — the neutral controls (white gel, segment,
 *     list header, check box, progress track …), one block in :root;
 *   tones:begin … tones:end — the five tone blocks (the gel, tab, segment,
 *     pop-up gem, check, radio, slider, stepper, progress, highlight …).
 *
 * Every profile is the original's own rows (see the table below). Aqua IS
 * the reference, so it takes them as they are. Every other tone keeps each
 * row's lightness offset and chroma ratio relative to the Aqua accent, in its
 * own hue — the same lighting, a different colour.
 *
 *   node scripts/tones.mjs          rewrite y2k.css
 *   node scripts/tones.mjs --print  print the blocks instead
 */

import fs from "node:fs"

const CSS = "packages/ui/src/styles/y2k.css"

/* ── Colour maths (sRGB ⇄ OKLCH) ─────────────────────────────────── */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (c) => "#" + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const delin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055)

function oklch([r, g, b]) {
  ;[r, g, b] = [r, g, b].map(lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI]
}
function rgb([L, C, H]) {
  const A = C * Math.cos((H * Math.PI) / 180), B = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(delin)
}
const mix = (c, t, to = [255, 255, 255]) => c.map((v, i) => v + (to[i] - v) * t)
const rgbStr = (c) => `rgb(${c.map((v) => Math.round(v)).join(", ")})`

/* ── Aqua 10.0 row profiles ──────────────────────────────────────── */
// One colour per 1px row, top to bottom, read off the controls as aqua-ui
// renders them (github.com/willmeyers/aqua-ui, MIT): its published gradient
// tokens where it has one, otherwise the centre column of the rendered
// control. They are drawn back as px-stop gradients, so a 20px button gets
// exactly the original's 20 rows — not a fit stretched to the box. The
// reference's embedded Apple bitmaps themselves are never copied.
const ACCENT = hex("#4d83d2") // aqua-ui's accent / selection blue
const ACCENT_LCH = oklch(ACCENT)

const NEUTRAL = {
  scrollArrow: ["#bbbbbb", "#d3d3d3", "#f2f2f2", "#f8f8f8", "#f9f9f9", "#f8f8f8", "#ebebeb", "#e1e1e1", "#e8e8e8", "#efefef", "#f6f6f6", "#fbfbfb", "#fdfdfd", "#fafafa", "#efefef"],
  gemClose: ["#050505", "#d6cccc", "#f3e6e6", "#da9e9c", "#c4554a", "#d0574b", "#e47264", "#f8877c", "#fe9b8e", "#ffa89c", "#ffb8ab", "#fdbcaf", "#e9836f"],
  gemMin: ["#290505", "#e1cccc", "#f6ebe6", "#e9c79c", "#e1a034", "#f0aa34", "#f8bf4d", "#fbd365", "#fee975", "#fffa82", "#ffff92", "#fdfd95", "#e9e94d"],
  gemZoom: ["#050505", "#cccdcc", "#e6eee6", "#adce9c", "#6fae3a", "#74b838", "#8dcd52", "#a3e069", "#b8f67b", "#c7ff89", "#d6ff97", "#d8fd9b", "#aae955"],
  gemOff: ["#050505", "#cccccc", "#eaebec", "#c0c4c7", "#939aa3", "#98a0aa", "#afb9c0", "#c4ccd5", "#d8dfeb", "#ebf3fd", "#faffff", "#fbfdfd", "#e0e9e9"],
  toolbarToggle: ["#555555", "#f7f7f7", "#f4f4f4", "#d8d8d8", "#cacaca", "#e0e0e0", "#f9f9f9", "#ffffff", "#ffffff", "#ffffff"],
  white: ["#7c7c7c", "#b4b4b4", "#d2d2d2", "#dcdcdc", "#e1e1e1", "#e5e5e5", "#e3e3e3", "#dbdbdb", "#d6d6d6", "#d9d9d9", "#dddddd", "#e5e5e5", "#eeeeee", "#f7f7f7", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#f8f8f8"],
  pressed: ["rgba(60,60,60,0.490)", "rgba(88,88,88,0.490)", "rgba(102,102,102,0.490)", "rgba(107,107,107,0.490)", "rgba(110,110,110,0.490)", "rgba(112,112,112,0.490)", "rgba(111,111,111,0.490)", "rgba(107,107,107,0.490)", "rgba(104,104,104,0.490)", "rgba(106,106,106,0.490)", "rgba(108,108,108,0.490)", "rgba(112,112,112,0.490)", "rgba(116,116,116,0.490)", "rgba(121,121,121,0.490)", "rgba(125,125,125,0.490)", "rgba(125,125,125,0.490)", "rgba(125,125,125,0.490)", "rgba(125,125,125,0.490)", "rgba(125,125,125,0.490)", "rgba(121,121,121,0.490)"],
  segment: ["#a3a3a3", "#dedede", "#e7e7e7", "#ebebeb", "#e9e9e9", "#e6e6e6", "#e5e5e5", "#e5e5e5", "#eaeaea", "#efefef", "#f1f1f1", "#f3f3f3", "#f6f6f6", "#f9f9f9", "#fdfdfd", "#fdfdfd", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
  segmentPress: ["#646464", "#b8b8b8", "#c5c5c5", "#cbcbcb", "#c8c8c8", "#c3c3c3", "#c2c2c2", "#c2c2c2", "#c9c9c9", "#d0d0d0", "#d3d3d3", "#d6d6d6", "#dadada", "#dedede", "#e4e4e4", "#e4e4e4", "#e7e7e7", "#e7e7e7", "#e7e7e7", "#e7e7e7"],
  segmentDiv: ["#747474", "#b9b9b9", "#cccccc", "#c7c7c7", "#bbbbbb", "#a4a4a4", "#9a9a9a", "#9a9a9a", "#a0a0a0", "#a8a8a8", "#b1b1b1", "#bababa", "#c4c4c4", "#cacaca", "#cfcfcf", "#dadada", "#dfdfdf", "#dfdfdf", "#dfdfdf", "#dfdfdf"],
  listheader: ["#959595", "#bebebe", "#d3d3d3", "#dbdbdb", "#dddddd", "#dadada", "#d3d3d3", "#d9d9d9", "#e0e0e0", "#e9e9e9", "#f3f3f3", "#f9f9f9", "#fefefe", "#ffffff", "#ffffff", "#ffffff", "#999999"],
  checkOff: ["#cacaca", "#d6d6d6", "#c0c0c0", "#b9b9b9", "#c5c5c5", "#d1d1d1", "#dcdcdc", "#e6e6e6", "#f2f2f2", "#fbfbfb", "#ffffff", "rgba(170,170,170,0.941)"],
  radioOff: ["rgba(54,54,54,0.937)", "#999999", "#d1d1d1", "#d1d1d1", "#c0c0c0", "#c3c3c3", "#d5d5d5", "#e4e4e4", "#f2f2f2", "#ffffff", "#fefefe", "#ffffff", "rgba(166,166,166,0.922)"],
  popup: ["#a3a3a3", "#dedede", "#e9e9e9", "#eaeaea", "#eaeaea", "#e6e6e6", "#e7e7e7", "#ebebec", "#efefef", "#f1f1f1", "#f3f3f3", "#f3f3f3", "#f5f5f5", "#f8f8f9", "#fefefb", "#fefefe", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
  stepper: ["#646464", "#d0d0d0", "#e3e3e3", "#e0e0e0", "#d4d4d4", "#c1c1c1", "#b8b8b8", "#bfbfbf", "#c8c8c8", "#d0d0d0", "#d6d6d6", "#dedede", "#e3e3e3", "#eeeeee", "#f2f2f2", "#fbfbfb", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ececec"],
  progressTrack: ["#a3a3a3", "#d2d2d2", "#e3e3e3", "#e7e7e7", "#e7e7e7", "#dedede", "#d9d9d9", "#dedede", "#e3e3e3", "#e9e9e9", "#f0f0f0", "#f4f4f4", "#f6f6f6", "#f7f7f7", "#f8f8f8", "#cecece", "rgba(0,0,0,0.259)", "rgba(0,0,0,0.196)", "rgba(0,0,0,0.098)", "rgba(0,0,0,0.031)"],
  sliderTrack: ["#535353", "#737373", "#939393", "#a8a8a8", "#b6b6b6", "#c3c3c3", "#cacaca"],
  titlebar: ["#ffffff", "#ffffff", "#f1f1f1", "#eaeaea", "#f1f1f1", "#fefefe", "#f0f0f0", "#e9e9e9", "#efefef", "#fdfdfd", "#eeeeee", "#e6e6e6", "#ececec", "#f8f8f8", "#e8e8e8", "#e0e0e0", "#e4e4e4", "#efefef", "#e1e1e1", "#d9d9d9", "#dedede", "#efefef", "#e1e1e1", "#d9d9d9", "#dedede", "#7f7f7f"],
  titlebarOff: ["rgba(191,191,191,0.749)", "rgba(191,191,191,0.749)", "rgba(180,180,180,0.749)", "rgba(175,175,175,0.749)", "rgba(180,180,180,0.749)", "rgba(190,190,190,0.749)", "rgba(179,179,179,0.749)", "rgba(174,174,174,0.749)", "rgba(179,179,179,0.749)", "rgba(189,189,189,0.749)", "rgba(178,178,178,0.749)", "rgba(172,172,172,0.749)", "rgba(176,176,176,0.749)", "rgba(185,185,185,0.749)", "rgba(173,173,173,0.749)", "rgba(167,167,167,0.749)", "rgba(170,170,170,0.749)", "rgba(179,179,179,0.749)", "rgba(168,168,168,0.749)", "rgba(162,162,162,0.749)", "rgba(166,166,166,0.749)", "rgba(179,179,179,0.749)", "rgba(168,168,168,0.749)", "rgba(162,162,162,0.749)", "rgba(166,166,166,0.749)", "#7f7f7f"],
  roundbtn: ["rgba(80,80,80,0.953)", "#919191", "#cccccc", "#e3e3e3", "#e9e9e9", "#e6e6e6", "#dfdfdf", "#dddddd", "#dddddd", "#e4e4e4", "#ebebeb", "#f6f6f6", "#fefefe", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#f5f5f5"],
  bevel: ["#bfbfbf", "#f4f4f4", "#f7f7f7", "#f7f7f7", "#f5f5f5", "#ececec", "#ebebeb", "#ececec", "#ebebeb", "#efefef", "#f3f3f3", "#fafafa", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "rgba(0,0,0,0.686)"],
  bevelOff: ["#8f8f8f", "#b7b7b7", "#b9b9b9", "#b9b9b9", "#b8b8b8", "#b1b1b1", "#b0b0b0", "#b1b1b1", "#b0b0b0", "#b3b3b3", "#b6b6b6", "#bbbbbb", "#bfbfbf", "#bfbfbf", "#bfbfbf", "#bfbfbf", "rgba(0,0,0,0.686)"],
  // iTunes 2's brushed-metal controls (the iPod), read off Olivia's 1×
  // screenshot (a 16-bit capture). The transport's white disc down the play
  // button's centre column — a white cap, a dip, white to a dark foot — with
  // the rows behind the glyph read beside it; the volume groove; its ball.
  metalButton: ["#adadad", "#ffffff", "#ffffff", "#ffffff", "#e7e7e7", "#dedede", "#efefef", "#efefef", "#efefef", "#efefef", "#f7f7f7", "#f7f7f7", "#f7f7f7", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#7b7b7b"],
  metalGroove: ["#636363", "#737373", "#949494", "#b5b5b5", "#d6d6d6", "#e7e7e7"],
  metalKnob: ["#7b7b7b", "#cecece", "#efefef", "#f7f7f7", "#e7e7e7", "#dedede", "#efefef", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#f7f7f7", "#7b7b7b"],
  scrollTrack: ["#b8b8b8", "#c0c0c0", "#c8c8c8", "#d3d3d3", "#dbdbdb", "#e4e4e4", "#ebebeb", "#f1f1f1", "#f6f6f6", "#fafafa", "#fbfbfb", "#fcfcfc", "#f9f9f9", "#f4f4f4", "#efefef"],
}
const TONED = {
  gel: ["#253674", "#697cae", "#96a8cc", "#a2b9d9", "#a5c1df", "#a8c4e2", "#a0bfe1", "#85afda", "#6e9fd3", "#76a4d8", "#7eaddf", "#89b6e6", "#92c0f0", "#9ccbf8", "#a5d4fd", "#acdcff", "#ade0ff", "#a9ddff", "#a2d6ff", "#94c8f8"],
  tab: ["#002d91", "#9dbdde", "#acc8e4", "#afc9e4", "#91b4db", "#709dcd", "#7aa4d2", "#7ea8d3", "#83abd8", "#88afda", "#8cb3db", "#90b6de", "#94bbe1", "#9bc0e7", "#a0c4eb", "#a3c8ef", "#aacdf4", "#b2d8ff", "#b5dbff", "#bce3ff", "#c1e7ff", "#c6f0ff", "#cffaff", "#d3ffff"],
  segmentOn: ["#1256a8", "#9fc0e0", "#b9d0ea", "#b3cee9", "#a2c2e5", "#83b1e0", "#77abe3", "#77abe3", "#7cb1e9", "#87bbf4", "#8dc1f8", "#96caff", "#9ed3ff", "#a5d9ff", "#aadfff", "#b1e5ff", "#b5ebff", "#baf1ff", "#bcf5ff", "#bbf4ff"],
  popupGem: ["#1256a8", "#8babd0", "#a6c1dc", "#9ebcda", "#89add4", "#5f91c3", "#4e83c0", "#538ac6", "#5b92cf", "#649cd6", "#6da5df", "#77afdf", "#7eb5df", "#7eb5df", "#81badf", "#8ac3df", "#91ccdf", "#92cedf", "#9bdadf", "#96d4df"],
  checkOn: ["#b0b9e2", "#aac6ef", "#4b8fda", "#4489d3", "#609bdc", "#81b9f6", "#93c7fe", "#a3d3ff", "#b3e0ff", "#c6f3fe", "#dafefd", "rgba(147,180,183,0.933)"],
  radioOn: ["rgba(41,41,43,0.937)", "#9596a6", "#d2ceee", "#a8c5f8", "#4384ce", "#5e9ae1", "#7db5f1", "#91c3fb", "#9dcefd", "#95bad6", "#b4def3", "#daffff", "rgba(141,172,177,0.922)"],
  sliderRound: ["#000065", "#969dcd", "#a7b9db", "#a4c1e0", "#9cbbde", "#7aa5d4", "#70a0d4", "#7caadb", "#90bbea", "#9ec7f5", "#acd5ff", "#b9e3ff", "#c6f1ff", "#d0feff", "#d9fbfb", "rgba(0,0,0,0.651)"],
  sliderPointer: ["rgba(0,0,59,0.808)", "#9397cc", "#abb5d9", "#9cb4da", "#82a9d3", "#6596c8", "#6394cb", "#76a4d7", "#88b4e1", "#98c0ec", "#a7cffb", "#b2d9ff", "#bde6ff", "#cdf9ff", "#d8ffff", "#defbfb", "#ebfefe", "#ebf5f5", "rgba(41,43,43,0.584)"],
  stepperUp: ["#1256a8", "#9fc0e0", "#bad2ea", "#b4cfea", "#a2c3e6", "#7dacde", "#6fa6df", "#73abe6", "#7fb5ee", "#88bdf5", "#7fbbfd", "#dedede", "#e3e3e3", "#eeeeee", "#f2f2f2", "#fbfbfb", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ececec"],
  stepperDown: ["#646464", "#d0d0d0", "#e3e3e3", "#e0e0e0", "#d4d4d4", "#c1c1c1", "#b8b8b8", "#bfbfbf", "#c8c8c8", "#d0d0d0", "#d6d6d6", "#7fbbfd", "#8cc9fe", "#8eccfe", "#92d0fe", "#97d6fe", "#9edefe", "#a6e6fe", "#a9ebfe", "#b1f7fe", "#acf1fe"],
  progress: ["#2151b7", "#527fca", "#79a1da", "#8bb2e2", "#8eb7e4", "#87b4e4", "#79ace2", "#629ee0", "#4a90df", "#428de4", "#4896ec", "#54a1f7", "#5eacfd", "#67b7ff", "#70c1ff", "#77c9ff", "#7bc9ff", "#79bfff"],
  scrollThumb: ["rgba(0,0,0,0.071)", "#0039b3", "#76a5de", "#97bfe9", "#93bcea", "#8bb8ea", "#5093e3", "#63a5ef", "#75b5fe", "#88c8ff", "#96d9ff", "#a2e4ff", "#9adaff", "rgba(0,0,0,0.620)", "rgba(0,0,0,0.282)"],
  // The sorted column's header: iTunes 2 on 10.1 (Olivia's 1× screenshot, a
  // 16-bit capture), the centre column above the triangle. Its last row is
  // the list header's own foot, which every column shares.
  listheaderSorted: ["#294a9c", "#6b8cc6", "#8bb5d6", "#9bbdde", "#9bbde7", "#8bb5e7", "#6ba5de", "#73ade7", "#83b5ef", "#8cbdf7", "#9bceff", "#a5d6ff", "#addeff", "#b5e6ff", "#b5e6ff", "#bdeeff", "#999999"],
  highlight: ["#285cb7", "#346cbe", "#3973c1", "#336abd", "#285cb7", "#336abd", "#3871c0", "#336abd", "#285cb7", "#336abd", "#3973c1", "#336abd", "#285cb7", "#336abd", "#3973c1", "#336abd", "#285cb7", "#336abd", "#3973c1", "#336abd", "#2557b4", "#1642ab"],
}
const BARBER = [["#feffff", 0.0], ["#feffff", 0.71], ["#fdfeff", 1.41], ["#fbfdff", 2.12], ["#f5faff", 2.83], ["#ebf5ff", 3.54], ["#dcedff", 4.24], ["#c7e1ff", 4.95], ["#add4ff", 5.66], ["#8fc4fe", 6.36], ["#75b7fe", 7.07], ["#60abfe", 7.78], ["#51a3fe", 8.49], ["#479efe", 9.19], ["#419bfe", 9.9], ["#3f9afe", 10.61], ["#3e99fe", 11.31], ["#3e99fe", 12.02], ["#3f9afe", 12.73], ["#419bfe", 13.44], ["#479efe", 14.14], ["#51a3fe", 14.85], ["#60abfe", 15.56], ["#75b7fe", 16.26], ["#8fc4fe", 16.97], ["#add4ff", 17.68], ["#c7e1ff", 18.38], ["#dcedff", 19.09], ["#ebf5ff", 19.8], ["#f5faff", 20.51], ["#fbfdff", 21.21], ["#fdfeff", 21.92], ["#feffff", 22.63]]

// Progress ribs, one 16px period (white above the static fill, black below).
const RIBS = [["rgba(255,255,255,0.095)", 0], ["rgba(255,255,255,0.026)", 3], ["rgba(0,0,0,0)", 4], ["rgba(0,0,0,0.035)", 6], ["rgba(0,0,0,0.057)", 8], ["rgba(0,0,0,0.03)", 10], ["rgba(0,0,0,0)", 12.5], ["rgba(255,255,255,0.043)", 14], ["rgba(255,255,255,0.095)", 16]]
// Barber-pole lighting per row, as black over the unshaded stripes (row 14 = 0).
const BARBER_SHADE = [0.548, 0.297, 0.11, 0.028, 0.015, 0.046, 0.105, 0.173, 0.226, 0.234, 0.195, 0.138, 0.076, 0.029, 0, 0, 0, 0.031].map((a) => `rgba(0,0,0,${a})`)
/** A nine-sliced face: the rows above `mid` hang from the top, the rows below
 *  it from the bottom, and row `mid` stretches between — so the face fits any
 *  height, and at the original's own height it is the original. */
function nine(list, mid) {
  const n = list.length
  const at = (i) => (i <= mid ? `${i}px` : `calc(100% - ${n - i}px)`)
  return `linear-gradient(to bottom, ${list.map((c, i) => `${c} ${at(i)} ${at(i + 1)}`).join(", ")})`
}

/** "#rrggbb" or "rgba(r,g,b,a)" → [[r, g, b], a] */
function parse(s) {
  if (s.startsWith("#")) return [hex(s), 1]
  const [r, g, b, a] = s.match(/[\d.]+/g).map(Number)
  return [[r, g, b], a]
}
const fmt = ([c, a]) => (a >= 1 ? toHex(c) : `rgba(${c.map((v) => Math.round(Math.min(255, Math.max(0, v)))).join(", ")}, ${a})`)

/** Re-express a measured Aqua colour against another tone's base: keep its
 *  lightness offset and chroma ratio to the Aqua accent, take the tone's hue.
 *  Near-transparent rows are shadow, not gel, and stay as they are. */
function retone(colour, base) {
  const [La, Ca] = ACCENT_LCH
  const [Lb, Cb, Hb] = oklch(base)
  const [L, C] = oklch(colour)
  return rgb([Math.min(0.99, Math.max(0.02, Lb + (L - La))), Cb * (C / Ca), Hb])
}
/** A pale tint keeps its own lightness; only its hue and relative chroma move. */
function tint(colour, base) {
  const [, Ca] = ACCENT_LCH
  const [, Cb, Hb] = oklch(base)
  const [L, C] = oklch(colour)
  return rgb([L, Cb * (C / Ca), Hb])
}
/** One measured row in another tone. Shadow rows (mostly transparent) and
 *  neutral greys are not gel and stay as they are; near-white glints fade
 *  from the relative retone to the absolute tint, so a dark tone's glints
 *  stay white rather than turning grey. */
const toned = (s, base, exact) => {
  if (exact) return s
  const [c, a] = parse(s)
  const [L, C] = oklch(c)
  if (a < 0.35 || C < 0.015) return s
  const r = retone(c, base)
  const w = Math.min(1, Math.max(0, (L - 0.85) / 0.15))
  const t = tint(c, base)
  return fmt([r.map((v, i) => v * (1 - w) + t[i] * w), a])
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


/** WCAG contrast of an ink against the worst row of a profile. */
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
/** White or black — whichever reads on EVERY row of the highlight. */
function inkFor(list, base, exact) {
  const cs = list.map((s) => parse(toned(s, base, exact))[0])
  const worst = (ink) => Math.min(...cs.map((c) => contrast(ink, c)))
  return worst([255, 255, 255]) >= worst([0, 0, 0]) ? "#ffffff" : "#000000"
}

/* ── The five tones ──────────────────────────────────────────────── */

/** A tone base, read from DESIGN.md's front matter — declared there once. */
const DESIGN = fs.readFileSync("DESIGN.md", "utf8")
function base(token) {
  const m = DESIGN.match(new RegExp(`^  ${token}: "(#[0-9A-Fa-f]{6})"`, "m"))
  if (!m) throw new Error(`DESIGN.md: no colour "${token}" in the front matter`)
  return m[1].toLowerCase()
}

const TONES = [
  { id: "pink", base: base("primary"), ink: "#ffffff",
    face: "hue-rotate(110deg) saturate(1.15)", star: "none", root: true },
  { id: "aqua", base: base("tone-aqua"), ink: "#ffffff", exact: true,
    // White ink needs the deeper highlight blue; the lighter #4d83d2 row
    // selection of the original is 3.8:1 and fails AA.
    selection: "#336abd", list: "linear-gradient(180deg, rgb(58, 110, 190) 0%, rgb(51, 102, 185) 50%, rgb(42, 94, 176) 100%)",
    face: "none", star: "hue-rotate(-111deg) saturate(0.95)" },
  { id: "lime", base: base("tone-lime"), ink: "#000000",
    face: "hue-rotate(-130deg) saturate(1.05)", star: "hue-rotate(116deg) saturate(1.1) brightness(1.05)" },
  { id: "tangerine", base: base("tone-tangerine"), ink: "#000000",
    face: "hue-rotate(-170deg) saturate(1.2)", star: "hue-rotate(64deg) saturate(1.05)" },
  // Grape: darkened to #7a3aba and a shallower list gradient (20/5) so white
  // ink passes AA on the selection and the sidebar — measured, not assumed.
  { id: "grape", base: base("tone-grape"), ink: "#ffffff", listMix: [0.2, 0.05],
    face: "hue-rotate(55deg) saturate(1.05)", star: "hue-rotate(-59deg) saturate(0.82)" },
]

function block(t) {
  const b = hex(t.base)
  const x = !!t.exact
  const one = (s) => toned(s, b, x)
  const tone = (list, opts) => rows(list, { map: one, ...opts })
  const [light, dark] = t.listMix ?? [0.4, 0.15]
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
    `--y2k-tone-highlight: ${tone(TONED.highlight)};`,
    `--y2k-tone-highlight-text: ${inkFor(TONED.highlight, b, x)};`,
    `--y2k-tone-selection: ${t.selection ?? fmt([b, 0.88])};`,
    `--y2k-tone-selection-text: ${t.ink};`,
    `--y2k-tone-glow: ${fmt([b, 0.5])};`,
    // aqua-ui's focus ring: the light accent #6db3ff at 55%.
    `--y2k-tone-focus: ${fmt([parse(one("#6db3ff"))[0], 0.55])};`,
    `--y2k-tone-list: ${t.list ?? `linear-gradient(180deg, ${rgbStr(mix(b, light))} 0%, ${rgbStr(mix(b, dark))} 50%, ${rgbStr(b)} 100%)`};`,
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
