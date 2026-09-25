#!/usr/bin/env node
/**
 * One version, three places: the installer's (packages/cli/package.json),
 * the one every desktop built with the pack shows (PATINA.version in the
 * desktop item's patina.ts) and the demo's (VERSION in its desktop.tsx).
 * Run with the registry build, so a release that bumps one and forgets
 * another stops there instead of shipping About boxes that disagree.
 */

import fs from "node:fs"

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
const cli = JSON.parse(read("packages/cli/package.json")).version
const found = {
  "packages/ui/src/registry/y2k/desktop/patina.ts (PATINA.version)": read("packages/ui/src/registry/y2k/desktop/patina.ts").match(/version: "([^"]+)"/)?.[1],
  "apps/web/components/desktop.tsx (VERSION)": read("apps/web/components/desktop.tsx").match(/const VERSION = "([^"]+)"/)?.[1],
}
const off = Object.entries(found).filter(([, v]) => v !== cli)
if (off.length) {
  console.error(`check-version: packages/cli/package.json is ${cli}, but\n${off.map(([where, v]) => `  ${where} is ${v ?? "missing"}`).join("\n")}`)
  process.exit(1)
}
