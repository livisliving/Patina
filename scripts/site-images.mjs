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

import { TONES } from "./tones-data.mjs"

const root = new URL("..", import.meta.url).pathname
const pub = path.join(root, "apps/web/public")

/** The icons in icons/, each scaled down to 384 on its longer side but the
 *  logo (512) and the star (128). */
const ICONS = [
  "bin.png", "disk.png", "doc.png", "finder.png", "ipod-icon.png", "note.png", "terminal.png", "logo.png", "star.webp",
  ...["blue", "green", "orange", "pink", "purple"].map((c) => `folder-${c}.png`),
  ...["aqua", "green", "orange", "pink", "red"].map((c) => `heart-${c}.png`),
]
const SIDE = { "logo.png": 512, "star.webp": 128 }

fs.mkdirSync(path.join(pub, "icons/webp"), { recursive: true })
const made = await Promise.all([
  ...ICONS.map((file) => {
    const side = SIDE[file] ?? 384
    return [path.join(pub, "icons", file), sharp(path.join(pub, "icons", file))
      .resize(side, side, { fit: "inside", withoutEnlargement: true })
      .webp({ nearLossless: true, quality: 80, effort: 6 })
      .toFile(path.join(pub, "icons/webp", file.replace(/\.\w+$/, ".webp")))]
  }),
  ...TONES.map(({ id }) => {
    const from = path.join(pub, `wallpapers/${id}-mobile.webp`)
    return [from, sharp(from).resize(860).avif({ quality: 65, effort: 6 }).toFile(path.join(pub, `wallpapers/${id}-mobile-small.avif`))]
  }),
].map(async ([from, out]) => [fs.statSync(from).size, (await out).size]))
const kb = (i) => Math.round(made.reduce((sum, m) => sum + m[i], 0) / 1024)
console.log(`site-images: ${ICONS.length} icons and ${TONES.length} phone wallpapers, ${kb(0)} KB → ${kb(1)} KB`)
