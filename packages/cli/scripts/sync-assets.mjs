#!/usr/bin/env node
/**
 * Copies the pack's shipped files into packages/cli/assets/ so `npm pack`
 * carries them: npm only packs what is inside the package directory, and the
 * originals (DESIGN.md, the scanner, the skills) live at the repo root where
 * they belong. Runs on `prepack`, so publishing can never ship a stale copy.
 *
 * assets/ is generated and git-ignored — the repo keeps one copy of each file.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.join(HERE, "..")
const REPO = path.join(PKG, "..", "..")
const OUT = path.join(PKG, "assets")

/** Optional entries are the ones a Day-2 step has not written yet. */
const FILES = [
  { from: "DESIGN.md" },
  { from: "scripts/check-y2k.mjs" },
  { from: ".claude/skills/check-y2k/SKILL.md" },
  { from: ".claude/skills/y2k-ify/SKILL.md", optional: true },
]

fs.rmSync(OUT, { recursive: true, force: true })

let copied = 0
const missing = []
for (const { from, optional } of FILES) {
  const source = path.join(REPO, from)
  if (!fs.existsSync(source)) {
    if (optional) {
      missing.push(from)
      continue
    }
    console.error(`sync-assets: missing ${from} — the CLI cannot ship without it.`)
    process.exit(1)
  }
  const target = path.join(OUT, from)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(source, target)
  copied++
}

console.log(`sync-assets: ${copied} file(s) → packages/cli/assets/`)
if (missing.length) console.log(`sync-assets: not written yet, skipped — ${missing.join(", ")}`)
