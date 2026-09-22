#!/usr/bin/env node
/**
 * Swap the tone the Figma file shows: rewrites every value in the Tone
 * collection (the paint styles' stops are bound to those variables, so the
 * gels, highlights and wallpaper follow) and the Cover's tone line.
 *
 *   npm run figma:tone -- aqua        one of pink · aqua · lime · tangerine · grape
 */

import { TONES } from "../tones-data.mjs"
import { connect, runInFigma } from "./lib.mjs"
import { toneCollection } from "./spec.mjs"

const id = process.argv.slice(2).find((a) => !a.startsWith("--"))
const tone = TONES.find((t) => t.id === id)
if (!tone) {
  console.error(`figma:tone — which tone? one of ${TONES.map((t) => t.id).join(", ")}`)
  process.exit(2)
}

const payload = {
  task: "tone",
  tone: tone.id,
  fonts: [{ family: "Lucida Grande", style: "Regular" }],
  collections: [toneCollection(tone)],
  coverLine: `Tone: ${tone.id} — the file shows one tone at a time; \`npm run figma:tone -- <tone>\` swaps the whole Tone collection.`,
}

const client = await connect()
let code = 0
try {
  console.log(JSON.stringify(await runInFigma(client, payload), null, 2))
} catch (e) {
  console.error(`figma:tone: Figma said — ${e.message}`)
  code = 1
} finally {
  client.close?.()
  process.exit(code)
}
