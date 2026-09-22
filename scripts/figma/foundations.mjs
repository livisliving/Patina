#!/usr/bin/env node
/**
 * Phase 0 of the Figma library: the variable collections (Tone, Aqua, Size),
 * the paint / effect / text styles, and the Cover, Colours, Type and Effects
 * sheets — all from DESIGN.md, y2k.css and scripts/tones-data.mjs, into the
 * open "Patina design system" file. Re-running updates in place.
 *
 *   node scripts/figma/foundations.mjs [--tone aqua] [--dry-run]
 */

import fs from "node:fs"
import { TONES } from "../tones-data.mjs"
import { connect, runInFigma, readDesign, readRootTokens, resolveVars, rgba, bandStops, shadows, stripeRows, pngTile, styleName } from "./lib.mjs"
import { toneCollection, tonePaints, aquaCollection, aquaPaints, sizeCollection, colourGroups, fontOf } from "./spec.mjs"

const args = process.argv.slice(2)
const toneId = args.includes("--tone") ? args[args.indexOf("--tone") + 1] : "pink"
const tone = TONES.find((t) => t.id === toneId)
if (!tone) throw new Error(`no tone "${toneId}" — one of ${TONES.map((t) => t.id).join(", ")}`)

const design = readDesign()
const tokens = readRootTokens()

/* ── Text styles ─────────────────────────────────────────────────── */
const textStyles = Object.entries(design.typography).map(([key, t]) => ({
  name: styleName(key),
  font: fontOf(t.fontFamily, +t.fontWeight),
  size: parseFloat(t.fontSize),
  lineHeight: { unit: "PERCENT", value: Math.round(parseFloat(t.lineHeight) * 100) },
  letterSpacing: parseFloat(t.letterSpacing) * 100 || 0,
  description: `DESIGN.md typography.${key}`,
}))

/* ── Effect styles: every shadow token in :root ──────────────────── */
const effectStyles = Object.entries(tokens)
  .filter(([n]) => /shadow|drop|rim|inset|lift/.test(n) && !/-h$|stops/.test(n))
  .map(([n, v]) => {
    try { return { name: `Effect/${n.replace("--y2k-", "")}`, effects: shadows(resolveVars(v, tokens)) } } catch { return null }
  })
  .filter(Boolean)

/* ── Paint styles ────────────────────────────────────────────────── */
const stripes = Object.entries(tokens)
  .filter(([, v]) => v.startsWith("repeating-linear-gradient(to bottom"))
  .map(([n, v]) => {
    const rows = stripeRows(v)
    // "--y2k-pinstripe" → "Pinstripe Regular", "--y2k-placard-inactive" → "Placard Inactive"
    const words = n.replace("--y2k-", "").replace(/^pinstripe$/, "pinstripe-regular").split("-").map((w) => w[0].toUpperCase() + w.slice(1))
    return { name: `Aqua/Stripe/${words.join(" ")}`, kind: "stripe", rows, width: 4, png: pngTile(rows, 4), description: n }
  })
const metalB64 = tokens["--y2k-metal"].match(/base64,([^"]+)"/)[1]
const paintStyles = [
  ...aquaPaints(),
  ...tonePaints(tone),
  ...stripes,
  { name: "Aqua/Metal/Texture", kind: "image", base64: metalB64, scale: 1, description: "--y2k-metal, the brushed-metal tile" },
]

/* ── Payload ─────────────────────────────────────────────────────── */
const payload = {
  fonts: [
    { family: "Lucida Grande", style: "Regular" }, { family: "Lucida Grande", style: "Bold" },
    { family: "EB Garamond", style: "Regular" }, { family: "Monaco", style: "Regular" },
  ],
  collections: [toneCollection(tone), aquaCollection(design, tokens), sizeCollection(design, tokens)],
  paintStyles,
  effectStyles,
  textStyles,
  cover: [
    `Tone: ${tone.id} — the file shows one tone at a time; \`npm run figma:tone -- <tone>\` swaps the whole Tone collection.`,
    `Generated ${new Date().toISOString().slice(0, 10)} by scripts/figma/foundations.mjs from DESIGN.md, y2k.css and scripts/tones-data.mjs.`,
    "github.com/livisliving/Patina",
  ],
  sheet: {
    labelStyle: "Body/SM",
    headingStyle: "Heading",
    sample: "Colours, minimise, dialogue — the future as it was imagined in 2000. 0123456789",
    colourGroups: colourGroups(tone),
  },
}

const scratch = process.env.PATINA_SCRATCH
if (scratch) fs.writeFileSync(`${scratch}/foundations-payload.json`, JSON.stringify(payload, null, 1))
console.log(`foundations: ${payload.collections.map((c) => `${c.name} ${c.variables.length}`).join(" · ")} · ${paintStyles.length} paint · ${effectStyles.length} effect · ${textStyles.length} text styles`)
if (args.includes("--dry-run")) process.exit(0)

const client = await connect()
let code = 0
try {
  const result = await runInFigma(client, payload)
  console.log(JSON.stringify(result, null, 2))
} catch (e) {
  console.error(`foundations: Figma said — ${e.message}`)
  code = 1
} finally {
  client.close?.()
  process.exit(code)
}
