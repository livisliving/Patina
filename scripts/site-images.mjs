#!/usr/bin/env node
/**
 * The pictures the demo draws, at the size it draws them, from Olivia's
 * artwork in apps/web/public/. The artwork stays full size beside them, for
 * the scripts that inline it and for anything drawn bigger later.
 *
 *   node scripts/site-images.mjs
 *
 * Icons → icons/webp/, near-lossless WebP (no visible pixel moves by more
 * than 1 of 255). The biggest an icon is drawn is 128px (the column
 * inspector, the Dock's magnified tile), 384 pixels on a 3× phone; the About
 * box's logo is drawn about 154px wide (461 pixels); the star 36px at most
 * (the iPod's mask).
 *
 * Phone wallpapers → wallpapers/<tone>-mobile-small.avif, 860 pixels wide:
 * all a phone up to 430px wide at 2× needs, where the full one is made for
 * 3×. AVIF at 65 is as close to the full picture, drawn that size, as WebP
 * at 92, at half the bytes.
 *
 * Uses sharp, which Next installs.
 */

import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const root = new URL("..", import.meta.url).pathname
const pub = path.join(root, "apps/web/public")

/** Source file in icons/ → the longer side it is scaled down to. */
const ICONS = {
  "bin.png": 384,
  "disk.png": 384,
  "doc.png": 384,
  "finder.png": 384,
  "ipod-icon.png": 384,
  "note.png": 384,
  "terminal.png": 384,
  "logo.png": 512,
  "star.webp": 128,
  ...Object.fromEntries(
    ["blue", "green", "orange", "pink", "purple"].map((c) => [`folder-${c}.png`, 384])
  ),
  ...Object.fromEntries(
    ["aqua", "green", "orange", "pink", "red"].map((c) => [`heart-${c}.png`, 384])
  ),
}
const TONES = ["pink", "aqua", "lime", "tangerine", "grape"]

let before = 0
let after = 0
const tally = (from, { size }) => {
  before += fs.statSync(from).size
  after += size
}

fs.mkdirSync(path.join(pub, "icons/webp"), { recursive: true })
for (const [file, side] of Object.entries(ICONS)) {
  const from = path.join(pub, "icons", file)
  const to = path.join(pub, "icons/webp", file.replace(/\.\w+$/, ".webp"))
  tally(from, await sharp(from)
    .resize(side, side, { fit: "inside", withoutEnlargement: true })
    .webp({ nearLossless: true, quality: 80, effort: 6 })
    .toFile(to))
}
for (const tone of TONES) {
  const from = path.join(pub, `wallpapers/${tone}-mobile.webp`)
  const to = path.join(pub, `wallpapers/${tone}-mobile-small.avif`)
  tally(from, await sharp(from).resize(860).avif({ quality: 65, effort: 6 }).toFile(to))
}
console.log(`site-images: ${Object.keys(ICONS).length} icons and ${TONES.length} phone wallpapers, ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`)
