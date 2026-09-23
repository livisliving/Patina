#!/usr/bin/env node
/**
 * Phase 1 of the Figma library: the controls, as component sets on the
 * "Components" page — Button, Round Button, Bevel Button, Checkbox, Radio,
 * Text Field, Slider, Stepper, Segment + Segmented Control, Pop-up Button,
 * Menu Item / Separator / Menu, Progress, Tab + Tabs, Group. Every fill is a
 * Phase 0 paint style or a variable; sizes follow packages/ui/src/registry/y2k.
 *
 *   node scripts/figma/controls.mjs [--tone pink] [--dry-run]
 */

import fs from "node:fs"
import { TONES, derive, parse, profile } from "../tones-data.mjs"
import { connect, runInFigma, readRootTokens, resolveVars, shadows } from "./lib.mjs"

const args = process.argv.slice(2)
const toneId = args.includes("--tone") ? args[args.indexOf("--tone") + 1] : "pink"
const tone = TONES.find((t) => t.id === toneId)
if (!tone) throw new Error(`no tone "${toneId}"`)
const tokens = readRootTokens()
const rows = profile(tone)

/* ── Little spec helpers ─────────────────────────────────────────── */
const S = (name) => ({ style: name })
const V = (name) => ({ var: name })
const INK = V("aqua/ink"), INK_DIS = V("aqua/ink-disabled"), BLACK = "#000000", WHITE = "#ffffff"
/** CSS box-shadow list → Figma effects (colour-mix already resolved). */
const fx = (css) => shadows(resolveVars(css, tokens))
/** `color-mix(in srgb, <row> 55%, transparent)` — a measured row at an alpha. */
const at = (css, alpha) => { const [c] = parse(css); return `rgba(${c.map(Math.round).join(", ")}, ${alpha})` }
const EDGE = { gel: rows.gel[0], tab: rows.tab[0], control: rows.segmentOn[0] }
// aqua-ui's focus ring: the light accent #6db3ff in the tone, at 55% (--y2k-tone-focus).
const FOCUS = at(derive(tone).one("#6db3ff"), 0.55)

const text = (chars, style, fill = INK, extra = {}) => ({ type: "text", name: "Label", text: { chars, style, fill, ...extra } })
const frame = (name, props) => ({ type: "frame", name, ...props })
const row = (name, gap, pad, { layout, ...props } = {}) => frame(name, { ...props, layout: { dir: "row", gap, pad, align: "center", ...layout } })
const svg = (name, w, h, markup, extra = {}) => ({ type: "svg", name, w, h, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${markup}</svg>`, ...extra })
const pressed = (face) => [face, S("Aqua/Gel Pressed")]

/* ── Button ──────────────────────────────────────────────────────── */
const RIM = { white: fx(tokens["--y2k-button-rim-white"]), tone: fx(`inset 6px 0 7px -4px ${at(EDGE.gel, 0.7)}, inset -6px 0 7px -4px ${at(EDGE.gel, 0.7)}`), metal: fx(tokens["--y2k-button-rim-metal"]) }
const DROP = { md: S("Effect/shadow-button"), sm: S("Effect/shadow-button-small"), active: S("Effect/shadow-button-active"), metal: fx(tokens["--y2k-shadow-button-metal"]), metalActive: fx(tokens["--y2k-shadow-button-metal-active"]) }
const FACE = { White: S("Aqua/Gel White"), Tone: S("Tone/Gel"), Metal: S("Aqua/Metal Button") }

function button(variant, size, state, label) {
  const sm = size === "Small"
  if (variant === "Link") {
    return row("Button", 0, 0, { fills: [], children: [text(label, sm ? "Label/Small" : "Label/Button", state === "Disabled" ? INK_DIS : V("aqua/link"), { decoration: "UNDERLINE" })] })
  }
  const rim = RIM[variant.toLowerCase()]
  // Metal's drop is a list of its own, pressed to its ring; the others are one effect style each.
  const drop = variant === "Metal" ? (state === "Pressed" ? DROP.metalActive : DROP.metal) : [state === "Pressed" ? DROP.active : sm ? DROP.sm : DROP.md]
  const ink = variant === "Metal" ? (state === "Disabled" ? "#9c9c9c" : "#393939") : state === "Disabled" ? INK_DIS : INK
  return row("Button", 6, [0, sm ? 12 : 14], {
    h: sm ? 17 : 20, minW: sm ? 56 : 68, radius: 9999,
    bind: sm ? { height: "spacing/button-h-small" } : { height: "metric/button-h" },
    fills: state === "Pressed" ? pressed(FACE[variant]) : [FACE[variant]],
    effects: state === "Disabled" && variant !== "Metal" ? [...rim] : [...rim, ...drop],
    opacity: state === "Disabled" && variant !== "Metal" ? 0.55 : 1,
    layout: { justify: "center" },
    children: [text(label, sm ? "Label/Small" : "Label/Button", ink)],
  })
}
const buttonSet = {
  name: "Button", props: ["Variant", "Size", "State"],
  description: "The Aqua 10.0 push button: 20px (Small 17px), full round ends, the measured rows. White is the default; Tone is the window's default action; Metal is iTunes' transport disc; Link is a text link in OS blue.",
  variants: [],
}
for (const variant of ["White", "Tone", "Metal"]) for (const size of variant === "Metal" ? ["Regular"] : ["Regular", "Small"]) for (const state of ["Default", "Pressed", "Disabled"])
  buttonSet.variants.push({ props: { Variant: variant, Size: size, State: state }, node: button(variant, size, state, variant === "White" ? "Cancel" : variant === "Tone" ? "Save" : "Play") })
for (const state of ["Default", "Disabled"]) buttonSet.variants.push({ props: { Variant: "Link", Size: "Regular", State: state }, node: button("Link", "Regular", state, "Learn more") })

const chevron = (dir) => svg("Glyph", 13, 8, dir === "left" ? `<path d="M8.5 0.8 5 4l3.5 3.2" stroke="#262626" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="M4.5 0.8 8 4 4.5 7.2" stroke="#262626" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
const roundSet = {
  name: "Round Button", props: ["Variant", "Size", "State"],
  description: "The Aqua round button: a 20px grey sphere (Small 17px) with an 11px glyph; Tone wears the gel.",
  variants: [],
}
for (const variant of ["White", "Tone"]) for (const size of ["Regular", "Small"]) for (const state of ["Default", "Pressed"]) {
  const d = size === "Small" ? 17 : 20
  const face = variant === "Tone" ? S("Tone/Gel") : size === "Small" ? S("Aqua/Gel White") : S("Aqua/Round Button")
  roundSet.variants.push({ props: { Variant: variant, Size: size, State: state }, node: row("Round Button", 0, 0, {
    w: d, h: d, radius: 9999, layout: { justify: "center" },
    fills: state === "Pressed" ? pressed(face) : [face],
    effects: [...RIM[variant.toLowerCase()], ...(state === "Pressed" ? [DROP.active] : size === "Small" ? [DROP.sm] : fx(tokens["--y2k-shadow-button-icon"]))],
    children: [chevron(variant === "Tone" ? "right" : "left")],
  }) })
}

const bevelSet = {
  name: "Bevel Button", props: ["State"],
  description: "Aqua's bevel button (\"Choose…\"): 18px, 11px black text, the measured rows, square shoulders, a 1px drop.",
  variants: ["Default", "Pressed", "Disabled"].map((state) => ({ props: { State: state }, node: row("Bevel Button", 0, [0, 10], {
    h: 18, radius: 2, bind: { height: "metric/bevel-h" }, layout: { justify: "center" },
    fills: state === "Disabled" ? [S("Aqua/Bevel Disabled")] : state === "Pressed" ? pressed(S("Aqua/Bevel")) : [S("Aqua/Bevel")],
    effects: state === "Disabled" ? [] : fx(tokens["--y2k-shadow-bevel"]),
    children: [text("Choose…", "Label/Small", state === "Disabled" ? INK_DIS : BLACK)],
  }) })),
}

/* ── Checkbox and Radio ──────────────────────────────────────────── */
const choiceDrop = fx("0 1px 1px rgba(0,0,0,0.34)")
const disabledWash = { type: "rect", name: "Disabled", w: 12, h: 12, x: 0, y: 0, fills: [{ gradient: { dir: "down", stops: [{ position: 0, color: "rgba(53,53,53,0.49)" }, { position: 0.2, color: "rgba(95,95,95,0.49)" }, { position: 1, color: "rgba(124,124,124,0.49)" }] } }] }
const checkboxSet = {
  name: "Checkbox", props: ["State", "Disabled"],
  description: "A 15×16 cell holding the 12px box 3px down; On is the tone check gel with the black tick that overshoots the corner; Mixed is a 6×2 bar. Label 24px from the edge.",
  variants: [],
}
for (const state of ["Off", "On", "Mixed"]) for (const disabled of ["False", "True"]) {
  const on = state !== "Off", dis = disabled === "True"
  const side = on ? at(EDGE.control, 0.55) : "rgba(0,0,0,0.16)"
  const box = { type: "rect", name: "Box", w: 12, h: 12, x: 1, y: 3, fills: [on ? S("Tone/Check") : S("Aqua/Check Off")], effects: fx(`inset 1px 0 0 ${side}, inset -1px 0 0 ${side}`) }
  const cell = frame("Cell", { w: 15, h: 16, fills: [], effects: dis ? [] : choiceDrop, children: [
    box,
    ...(dis ? [{ ...disabledWash, x: 1, y: 3 }] : []),
    ...(state === "On" ? [svg("Tick", 15, 16, `<path d="M3.4 6.3L6.6 12.3L13.7 1.1" stroke="#000" stroke-width="1.9" fill="none" stroke-linejoin="round"/>`, { x: 0, y: 0 })] : []),
    ...(state === "Mixed" ? [svg("Bar", 15, 16, `<rect x="4" y="8" width="6" height="2" fill="#000"/><rect x="4" y="10" width="6" height="1" fill="rgba(0,0,0,0.3)"/>`, { x: 0, y: 0 })] : []),
  ] })
  checkboxSet.variants.push({ props: { State: state, Disabled: disabled }, node: row("Checkbox", 6, [0, 0, 0, 1], { fills: [], children: [cell, { type: "frame", name: "Gap", w: 2, h: 1, fills: [] }, text(state === "Mixed" ? "Mixed state" : dis ? "Disabled" : "Show disks", "Label/Button", dis ? INK_DIS : INK)] }) })
}

const radioSet = {
  name: "Radio", props: ["State", "Disabled"],
  description: "A 14×15 cell holding the 12px ball; On is the tone ball with a 4px black dot. Label 24px in.",
  variants: [],
}
for (const state of ["Off", "On"]) for (const disabled of ["False", "True"]) {
  const on = state === "On", dis = disabled === "True"
  const side = on ? at(EDGE.control, 0.55) : "rgba(0,0,0,0.3)"
  const ball = { type: "ellipse", name: "Ball", w: 12, h: 12, x: 1, y: 1, fills: [on ? S("Tone/Radio") : S("Aqua/Radio Off")], effects: fx(`inset 0 0 0 1px ${side}, inset 0 0 3px rgba(0,0,0,0.2)`) }
  const cell = frame("Cell", { w: 14, h: 15, fills: [], effects: dis ? [] : choiceDrop, children: [
    ball,
    ...(on ? [{ type: "ellipse", name: "Dot", w: 4, h: 4, x: 5, y: 5, fills: [BLACK], effects: fx("0 0 0.5px #000000") }] : []),
    ...(dis ? [{ type: "ellipse", name: "Disabled", w: 12, h: 12, x: 1, y: 1, fills: ["rgba(95,95,95,0.49)"] }] : []),
  ] })
  radioSet.variants.push({ props: { State: state, Disabled: disabled }, node: row("Radio", 6, [0, 0, 0, 2], { fills: [], children: [cell, { type: "frame", name: "Gap", w: 2, h: 1, fills: [] }, text(dis ? "Huge" : on ? "Small" : "Large", "Label/Button", dis ? INK_DIS : INK)] }) })
}

/* ── Text field ──────────────────────────────────────────────────── */
const fieldSet = {
  name: "Text Field", props: ["Kind", "State"],
  description: "24px, 13px text 6px in, white, a #a9a9a9 rim darker on top, 2px corners, a short inner shadow. Search has 10px corners and 10px in. Focus is the tone rim and ring.",
  variants: [],
}
for (const kind of ["Text", "Search"]) for (const state of ["Default", "Focus", "Disabled", "Read-only"]) {
  const search = kind === "Search"
  const bg = state === "Disabled" ? "#f0f0f0" : state === "Read-only" ? "#f6f6f6" : WHITE
  const ink = state === "Disabled" ? INK_DIS : state === "Read-only" ? "#4a4a4a" : search && state === "Default" ? INK_DIS : INK
  const chars = search ? "Search" : state === "Read-only" ? "Read-only" : "Untitled"
  fieldSet.variants.push({ props: { Kind: kind, State: state }, node: row("Text Field", 0, [0, search ? 10 : 6], {
    w: search ? 144 : 240, h: 24, radius: search ? 10 : 2, clip: true, bind: { height: "metric/field-h" },
    fills: [bg],
    strokes: { color: state === "Focus" ? V("tone/base") : V("aqua/field-border"), weight: 1, align: "INSIDE" },
    effects: state === "Focus" ? [...fx("inset 0 1px 2px rgba(0,0,0,0.12)"), ...fx(`0 0 0 3px ${FOCUS}`)] : [S("Effect/field-shadow")],
    children: [
      ...(state === "Focus" ? [] : [{ type: "rect", name: "Top edge", w: search ? 144 : 240, h: 1, x: 0, y: 0, fills: [V("aqua/field-border-top")], absolute: true }]),
      text(chars, "Input", ink),
    ],
  }) })
}

/* ── Slider and stepper ──────────────────────────────────────────── */
const sliderSet = {
  name: "Slider", props: ["Thumb"],
  description: "A 7px grooved track; a 15px ball, a 15×19 pointer over 5px ticks, or brushed metal's 12px knob in its 6px groove.",
  variants: [],
}
{
  const W = 160
  const track = (h, r, style) => ({ type: "rect", name: "Track", w: W, h, x: 0, y: Math.round((22 - h) / 2), radius: r, fills: [S(style)] })
  const ballX = Math.round(0.6 * (W - 15))
  sliderSet.variants.push({ props: { Thumb: "Round" }, node: frame("Slider", { w: W, h: 22, fills: [], children: [
    track(7, 4, "Aqua/Slider Track"),
    { type: "ellipse", name: "Thumb", w: 15, h: 15, x: ballX, y: 3, fills: [S("Tone/Slider")], effects: fx(`inset 0 0 0 1px ${at(EDGE.control, 0.8)}, inset 0 0 4px 1px ${at(EDGE.control, 0.45)}, 0 1px 0.5px rgba(0,0,0,0.55)`) },
  ] }) })
  const pointerX = Math.round(0.4 * (W - 15))
  sliderSet.variants.push({ props: { Thumb: "Pointer" }, node: frame("Slider", { w: W, h: 28, fills: [], children: [
    track(7, 4, "Aqua/Slider Track"),
    svg("Thumb", 15, 19, `<polygon points="1,0 14,0 15,1 15,11.5 7.5,19 0,11.5 0,1"/>`, { x: pointerX, y: 1, svgFill: S("Tone/Pointer"), svgOverlay: { gradient: { dir: "right", stops: [{ position: 0, color: "rgba(0,0,40,0.35)" }, { position: 1 / 15, color: "rgba(0,0,40,0.35)" }, { position: 1 / 15, color: "rgba(0,0,0,0)" }, { position: 14 / 15, color: "rgba(0,0,0,0)" }, { position: 14 / 15, color: "rgba(0,0,40,0.35)" }, { position: 1, color: "rgba(0,0,40,0.35)" }] } } }),
    row("Ticks", 0, [0, 7], { w: W, h: 5, x: 0, y: 23, fills: [], layout: { justify: "between" }, children: Array.from({ length: 7 }, (_, i) => ({ type: "rect", name: `Tick ${i + 1}`, w: 1, h: 5, fills: ["#8a8a8a"] })) }),
  ] }) })
  sliderSet.variants.push({ props: { Thumb: "Metal" }, node: frame("Slider", { w: W, h: 22, fills: [], children: [
    track(6, 2, "Aqua/Metal Groove"),
    { type: "ellipse", name: "Thumb", w: 12, h: 12, x: Math.round(0.6 * (W - 12)), y: 5, fills: [S("Aqua/Metal Knob")], effects: fx("inset 1px 0 1px rgba(0,0,0,0.25), inset -1px 0 1px rgba(0,0,0,0.25), 0 1px 1px rgba(0,0,0,0.3)") },
  ] }) })
}

const stepperSet = {
  name: "Stepper", props: ["State", "Field"],
  description: "The 13×21 pill with its two arrows, 6px after a 52px number field; a pressed half floods with the tone.",
  variants: [],
}
for (const state of ["Default", "Up", "Down"]) for (const field of ["True", "False"]) {
  const pill = frame("Pill", { w: 13, h: 21, radius: 9999, clip: true, fills: [S(state === "Up" ? "Tone/Stepper Up" : state === "Down" ? "Tone/Stepper Down" : "Aqua/Stepper")], effects: fx("inset 1px 0 1px rgba(0,0,0,0.3), inset -1px 0 1px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.3)"), children: [
    svg("Arrows", 7, 12, `<path d="M3.5 0.3L6.7 4.8H0.3zM3.5 11.7L6.7 7.2H0.3z" fill="#000"/>`, { x: 3, y: 5 }),
  ] })
  const children = field === "True" ? [{ type: "instance", of: "Text Field", props: { Kind: "Text", State: "Default" }, w: 52, text: { Label: "12" } }, pill] : [pill]
  stepperSet.variants.push({ props: { State: state, Field: field }, node: row("Stepper", 6, 0, { fills: [], children }) })
}

/* ── Segmented control ───────────────────────────────────────────── */
const segmentSet = {
  name: "Segment", props: ["State", "Position"],
  description: "One segment: 20px, 9px either side of 11px text, at least 25px; Off is the white rows, On the tone control rows with black ink. First/Last carry the rim; all but Last carry the divider.",
  variants: [],
}
for (const state of ["Off", "On", "Pressed"]) for (const position of ["First", "Middle", "Last"]) {
  const on = state === "On"
  const rim = on ? at(EDGE.control, 0.7) : "rgba(0,0,0,0.16)"
  const fills = state === "Pressed" ? [S("Aqua/Segment Pressed")] : on ? [S("Tone/Control")] : [S("Aqua/Segment White")]
  const effects = position === "First" ? fx(`inset 1px 0 0 ${rim}`) : position === "Last" ? fx(`inset -1px 0 0 ${rim}`) : []
  segmentSet.variants.push({ props: { State: state, Position: position }, node: row("Segment", 4, [0, 9], {
    h: 20, minW: 25, bind: { height: "metric/segment-h", minWidth: "metric/segment-w" }, fills, effects, layout: { justify: "center" },
    children: [text(position === "First" ? "Icon" : position === "Middle" ? "List" : "Column", "Label/Small", BLACK), ...(position !== "Last" ? [{ type: "rect", name: "Divider", w: 1, h: 20, x: 0, y: 0, fills: [S("Aqua/Segment Divider")], absolute: true, right: 0 }] : [])],
  }) })
}
const segmentedControl = {
  name: "Segmented Control",
  description: "Finder's View control: three segments in a 4px-cornered clip with the soft shadow hanging 4px below.",
  node: row("Segmented Control", 0, 0, { h: 20, radius: 4, clip: true, fills: [], effects: fx("0 1px 0.5px rgba(0,0,0,0.5), 0 2px 1.5px rgba(0,0,0,0.2), 0 -1px 1px rgba(0,0,0,0.05)"), children: [
    { type: "instance", of: "Segment", props: { State: "On", Position: "First" } },
    { type: "instance", of: "Segment", props: { State: "Off", Position: "Middle" } },
    { type: "instance", of: "Segment", props: { State: "Off", Position: "Last" } },
  ] }),
}

/* ── Pop-up button and menu ──────────────────────────────────────── */
const popup = {
  name: "Pop-up Button",
  description: "20px, the white rows with a 4px round left end and 13px text 10px in, ending in the 21px gem — the tone control rows behind a darker 1px line — with two white arrows.",
  node: row("Pop-up Button", 0, [0, 23, 0, 10], { w: 140, h: 20, radius: 4, clip: true, bind: { height: "metric/popup-h" }, fills: [S("Aqua/Pop-up White")], effects: fx("inset 1px 0 0 rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.14)"), children: [
    text("Documents", "Label/Button", BLACK),
    frame("Gem", { w: 21, h: 20, absolute: true, right: 0, y: 0, radius: [0, 4, 4, 0], clip: true, fills: [S("Tone/Control")], effects: fx(`inset -3px 0 3px -1px ${at(EDGE.control, 0.45)}`), children: [
      { type: "rect", name: "Line", w: 1, h: 20, x: 0, y: 0, fills: [S("Tone/Pop-up Gem")] },
      svg("Arrows", 21, 20, `<path d="M10.5 4.6L13 9H8zM8 11h5l-2.5 4.4z" fill="#fff"/>`, { x: 0, y: 0 }),
    ] }),
  ] }),
}
const menuItemSet = {
  name: "Menu Item", props: ["State", "Tick"],
  description: "A 19px menu row, 13px text 22px in; Highlighted takes the tone highlight with its ink; a tick sits in the margin.",
  variants: [],
}
for (const state of ["Default", "Highlighted", "Disabled"]) for (const tick of ["False", "True"]) {
  const ink = state === "Highlighted" ? V("tone/highlight-text") : state === "Disabled" ? INK_DIS : INK
  menuItemSet.variants.push({ props: { State: state, Tick: tick }, node: row("Menu Item", 18, [1, 22], { w: 180, h: 19, sizing: { w: "fill" }, fills: state === "Highlighted" ? [S("Tone/Highlight")] : [], layout: { justify: "between" }, children: [
    text(tick === "True" ? "Documents" : state === "Disabled" ? "Applications" : "Desktop", "Menu", ink),
    ...(tick === "True" ? [{ type: "text", name: "Tick", absolute: true, x: 8, y: 3, text: { chars: "✓", style: "Label/Small", fill: ink } }] : []),
  ] }) })
}
const menuSeparator = { name: "Menu Separator", description: "A 1px #c8c8c8 line with a white line under it, 4px above and below.", node: frame("Menu Separator", { w: 180, layout: { dir: "col", gap: 0, pad: [4, 0] }, fills: [], children: [{ type: "rect", name: "Line", w: 180, h: 1, fills: ["#c8c8c8"], sizing: { w: "fill" } }, { type: "rect", name: "Light", w: 180, h: 1, fills: [WHITE], sizing: { w: "fill" } }] }) }
const menu = {
  name: "Menu",
  description: "The Aqua 10.0 menu: the menu pinstripe at 90% so the screen shows through, a 1px #8a8a8a rim, 5px bottom corners, 4px inset.",
  node: frame("Menu", { w: 180, radius: [0, 0, 5, 5], layout: { dir: "col", gap: 0, pad: [4, 0] }, sizing: { h: "hug" }, fills: [S("Aqua/Stripe/Pinstripe Menu")], strokes: { color: "#8a8a8a", weight: 1, align: "INSIDE" }, effects: [S("Effect/shadow-menu")], children: [
    { type: "instance", of: "Menu Item", props: { State: "Default", Tick: "True" }, sizing: { w: "fill" } },
    { type: "instance", of: "Menu Item", props: { State: "Highlighted", Tick: "False" }, sizing: { w: "fill" } },
    { type: "instance", of: "Menu Item", props: { State: "Default", Tick: "False" }, sizing: { w: "fill" }, text: { Label: "Home" } },
    { type: "instance", of: "Menu Separator", sizing: { w: "fill" } },
    { type: "instance", of: "Menu Item", props: { State: "Disabled", Tick: "False" }, sizing: { w: "fill" } },
  ] }),
}

/* ── Progress ────────────────────────────────────────────────────── */
const progressSet = {
  name: "Progress", props: ["Kind"],
  description: "The Aqua bar: a 16px grooved track with its 4px shadow under an 18px fill — the tone rows with the original's ribs, or the barber pole under its gel lighting.",
  variants: [],
}
{
  const W = 240
  const ends = { gradient: { dir: "right", stops: [[0, "rgba(0,0,0,0.035)"], [1 / W, "rgba(0,0,0,0.035)"], [1 / W, "rgba(0,0,0,0.11)"], [2 / W, "rgba(0,0,0,0.11)"], [2 / W, "rgba(0,0,0,0)"], [(W - 2) / W, "rgba(0,0,0,0)"], [(W - 2) / W, "rgba(0,0,0,0.11)"], [(W - 1) / W, "rgba(0,0,0,0.11)"], [(W - 1) / W, "rgba(0,0,0,0.035)"], [1, "rgba(0,0,0,0.035)"]].map(([position, color]) => ({ position, color })) } }
  const track = { type: "rect", name: "Track", w: W, h: 20, x: 0, y: 0, fills: [S("Aqua/Progress Track"), ends] }
  const ribs = (w) => row("Ribs", 0, 0, { w, h: 18, x: 0, y: 0, clip: true, fills: [], children: Array.from({ length: Math.ceil(w / 16) }, (_, i) => ({ type: "rect", name: `Rib ${i + 1}`, w: 16, h: 18, fills: [S("Aqua/Progress Ribs")] })) })
  const bar = (w, kids) => frame("Indicator", { w, h: 18, x: 0, y: 0, clip: true, fills: [S("Tone/Progress")], children: kids })
  progressSet.variants.push({ props: { Kind: "Determinate" }, node: frame("Progress", { w: W, h: 20, clip: true, fills: [], children: [track, bar(Math.round(W * 0.55), [ribs(Math.round(W * 0.55))])] }) })
  progressSet.variants.push({ props: { Kind: "Done" }, node: frame("Progress", { w: W, h: 20, clip: true, fills: [], children: [track, bar(W, [])] }) })
  progressSet.variants.push({ props: { Kind: "Indeterminate" }, node: frame("Progress", { w: W, h: 20, clip: true, fills: [], children: [track, frame("Indicator", { w: W, h: 18, x: 0, y: 0, clip: true, fills: [], children: [
    ...Array.from({ length: Math.ceil(W / 32) }, (_, i) => ({ type: "rect", name: `Stripe ${i + 1}`, w: 32, h: 32, x: i * 32, y: 0, fills: [S("Tone/Barber")] })),
    { type: "rect", name: "Shade", w: W, h: 18, x: 0, y: 0, fills: [S("Aqua/Barber Shade")] },
  ] })] }) })
}

/* ── Tabs ────────────────────────────────────────────────────────── */
const tabSet = {
  name: "Tab", props: ["State"],
  description: "A 24px folder tab with 7px top corners: the white push-button fill with a #8a8a8a rim, or the light tone tab gel with its dark rim — and black ink.",
  variants: ["Inactive", "Active", "Pressed"].map((state) => ({ props: { State: state }, node: row("Tab", 0, [0, 16], {
    h: 24, radius: [7, 7, 0, 0], bind: { height: "metric/tab-h" }, layout: { justify: "center" },
    fills: state === "Active" ? [S("Tone/Tab")] : state === "Pressed" ? pressed(S("Aqua/Gel White")) : [S("Aqua/Gel White")],
    effects: fx(`inset 0 0 0 1px ${state === "Active" ? EDGE.tab : "#8a8a8a"}`),
    children: [text(state === "Active" ? "General" : state === "Pressed" ? "Advanced" : "Appearance", "Label/Button", INK)],
  }) })),
}
const tabs = {
  name: "Tabs",
  description: "Folder tabs standing on a pinstriped panel (1px #9a9a9a rim, 5px corners, 12px padding).",
  node: frame("Tabs", { w: 320, layout: { dir: "col", gap: -1, align: "start" }, sizing: { h: "hug" }, fills: [], children: [
    row("Tabs List", 0, [0, 0, 0, 10], { fills: [], layout: { align: "end" }, children: [
      { type: "instance", of: "Tab", props: { State: "Active" } },
      { type: "instance", of: "Tab", props: { State: "Inactive" } },
      { type: "instance", of: "Tab", props: { State: "Inactive" }, text: { Label: "Advanced" } },
    ] }),
    frame("Panel", { w: 320, sizing: { w: "fill" }, radius: 5, layout: { dir: "col", gap: 0, pad: 12 }, fills: [S("Aqua/Stripe/Pinstripe Regular")], strokes: { color: "#9a9a9a", weight: 1, align: "INSIDE" }, children: [
      { type: "text", name: "Body", sizing: { w: "fill" }, text: { chars: "Folder tabs on a pinstriped panel. The selected tab is light tone gel with black text.", style: "Body/MD", fill: INK, autoHeight: true } },
    ] }),
  ] }),
}

/* ── Group ───────────────────────────────────────────────────────── */
const group = {
  name: "Group",
  description: "The Aqua group box: a faint grey well in a #b6b6b6 rim with 5px corners, its bold 12px caption set into the top border 20px in. Patina's answer to a card.",
  node: frame("Group", { w: 320, h: 112, fills: [], children: [
    frame("Well", { w: 320, h: 104, x: 0, y: 8, radius: 5, fills: ["rgba(129,129,129,0.1)"], strokes: { color: "#b6b6b6", weight: 1, align: "INSIDE" } }),
    row("Legend", 0, [0, 5], { x: 20, y: 0, fills: [S("Aqua/Stripe/Pinstripe Regular")], children: [text("Appearance", "Legend", INK)] }),
  ] }),
}

/* ── Payload ─────────────────────────────────────────────────────── */
const payload = {
  task: "controls",
  fonts: [{ family: "Lucida Grande", style: "Regular" }, { family: "Lucida Grande", style: "Bold" }, { family: "Monaco", style: "Regular" }, { family: "EB Garamond", style: "Regular" }],
  page: "Components",
  sets: [buttonSet, roundSet, bevelSet, checkboxSet, radioSet, fieldSet, sliderSet, stepperSet, segmentSet, menuItemSet, progressSet, tabSet],
  components: [menuSeparator, segmentedControl, popup, menu, tabs, group],
}
const scratch = process.env.PATINA_SCRATCH
if (scratch) fs.writeFileSync(`${scratch}/controls-payload.json`, JSON.stringify(payload, null, 1))
console.log(`controls: ${payload.sets.length} sets (${payload.sets.reduce((n, s) => n + s.variants.length, 0)} variants) · ${payload.components.length} components`)
if (args.includes("--dry-run")) process.exit(0)

const client = await connect()
let code = 0
try {
  console.log(JSON.stringify(await runInFigma(client, payload), null, 2))
} catch (e) {
  console.error(`controls: Figma said — ${e.message}`)
  code = 1
} finally {
  client.close?.()
  process.exit(code)
}
